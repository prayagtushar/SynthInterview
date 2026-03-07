import os
import asyncio
import json
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

from app.agent import InterviewAgent, AgentState
from app.gemini_client import GeminiLiveClient
from app.questions import get_question, select_question_for_session

load_dotenv()

app = FastAPI(title="SynthInterview API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase
firebase_cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if firebase_cred_json:
    try:
        cred_dict = json.loads(firebase_cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Firebase init: {e}")
else:
    try:
        firebase_admin.initialize_app()
    except Exception:
        pass

db = firestore.client()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-native-audio-latest")


# ── Models ─────────────────────────────────────────────────────────────────

class SessionConfig(BaseModel):
    candidateEmail: str
    difficulty: str = "Easy"
    topics: List[str] = []
    questionId: Optional[str] = None
    timeLimit: int = 45

class SessionResponse(BaseModel):
    sessionId: str
    candidateEmail: str
    difficulty: str
    topics: List[str]
    questionId: str
    startTime: Optional[str] = None
    status: Optional[str] = "IDLE"


# ── REST ───────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "SynthInterview API", "version": "0.2.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/sessions", response_model=SessionResponse)
async def create_session(config: SessionConfig):
    session_id = str(uuid.uuid4())
    question = get_question(config.questionId) if config.questionId else select_question_for_session(config.difficulty, config.topics)
    session_data = {
        "sessionId": session_id, "candidateEmail": config.candidateEmail,
        "difficulty": config.difficulty, "topics": config.topics,
        "questionId": question["id"], "timeLimit": config.timeLimit,
        "createdAt": datetime.utcnow().isoformat(), "status": "IDLE",
    }
    db.collection("sessions").document(session_id).set(session_data)
    return session_data

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc.to_dict()

@app.get("/questions")
async def list_questions():
    from app.questions import QUESTIONS
    return list(QUESTIONS.values())


# ── WebSocket Live Interview ───────────────────────────────────────────────

@app.websocket("/ws/live/{session_id}")
async def live_socket(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()

    gemini: Optional[GeminiLiveClient] = None

    try:
        # ── Load / create session ──────────────────────────────────────
        doc = db.collection("sessions").document(session_id).get()
        if not doc.exists:
            question = get_question("two-sum")
            session_info = {
                "candidateEmail": "guest@demo.com", "difficulty": "Easy",
                "topics": ["Arrays", "HashMaps"], "questionId": question["id"],
            }
            db.collection("sessions").document(session_id).set({
                **session_info, "sessionId": session_id,
                "createdAt": datetime.utcnow().isoformat(), "status": "IDLE",
            })
        else:
            session_info = doc.to_dict()

        question_id = session_info.get("questionId", "two-sum")
        question = get_question(question_id)

        agent = InterviewAgent(session_id=session_id, db=db, question=question)
        agent.metadata.update({
            "difficulty": session_info.get("difficulty", "Medium"),
            "questionId": question["id"],
            "topics": session_info.get("topics", []),
            "candidateEmail": session_info.get("candidateEmail", "anonymous"),
        })

        # ── Connect to Gemini ──────────────────────────────────────────
        system_instr = _build_system_instruction(session_info, question)
        gemini = GeminiLiveClient(GEMINI_API_KEY, MODEL_ID)
        await gemini.connect(system_instruction=system_instr)

        # ── GREETING ───────────────────────────────────────────────────
        greeting_msg = await agent.update_state(AgentState.GREETING)
        await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})
        if greeting_msg:
            # This queues and waits for turn_complete internally
            await gemini.send_text(f"[PHASE: GREETING]\n{greeting_msg}")

        # ── Auto-advance ENV_CHECK ─────────────────────────────────────
        env_timer_task: Optional[asyncio.Task] = None

        async def env_check_auto_advance():
            await asyncio.sleep(10)
            if agent.current_state == AgentState.ENV_CHECK:
                print(f"Auto-advancing ENV_CHECK -> PROBLEM_DELIVERY")
                scripted = await agent.handle_event("workspace_clean", None)
                await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})
                if scripted:
                    await gemini.send_text(f"[PHASE: PROBLEM_DELIVERY]\n{scripted}")

        # ── 1) RECEIVER: Gemini → browser ─────────────────────────────
        async def receive_from_gemini():
            nonlocal env_timer_task
            try:
                async for message in gemini.listen():
                    if message["type"] == "turn_complete":
                        # Already handled inside gemini client
                        continue

                    await websocket.send_json(message)

                    # Detect state-change keywords
                    if message["type"] == "text":
                        text_lower = message["payload"].lower()
                        scripted = await _detect_state_transitions(
                            text_lower, agent, websocket
                        )
                        if scripted:
                            phase = agent.current_state.value
                            # Queued — won't send until current turn finishes
                            await gemini.send_text(f"[PHASE: {phase}]\n{scripted}")

            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Receive loop error: {e}")

        # ── 2) FORWARDER: browser → Gemini ─────────────────────────────
        async def forward_client_to_gemini():
            nonlocal env_timer_task
            try:
                while True:
                    raw = await websocket.receive_text()
                    data = json.loads(raw)
                    msg_type = data.get("type")

                    if msg_type == "event":
                        event_type = data.get("payload")
                        scripted = await agent.handle_event(event_type, data.get("data"))
                        await websocket.send_json({
                            "type": "state_update",
                            "payload": agent.current_state.value,
                        })
                        if scripted:
                            phase = agent.current_state.value
                            await gemini.send_text(f"[PHASE: {phase}]\n{scripted}")

                        if agent.current_state == AgentState.ENV_CHECK and not env_timer_task:
                            env_timer_task = asyncio.create_task(env_check_auto_advance())

                    elif msg_type == "audio":
                        await gemini.send_audio(data["payload"])

                    elif msg_type == "frame":
                        await gemini.send_frame(data["payload"])

                    elif msg_type == "text":
                        await gemini.send_text(data["payload"])

            except WebSocketDisconnect:
                print(f"Client disconnected: {session_id}")
            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Forward loop error: {e}")

        # ── Run both ───────────────────────────────────────────────────
        tasks = [
            asyncio.create_task(receive_from_gemini()),
            asyncio.create_task(forward_client_to_gemini()),
        ]
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()
        if env_timer_task:
            env_timer_task.cancel()

    except Exception as e:
        print(f"Live session error [{session_id}]: {e}")
        try:
            await websocket.send_json({"type": "error", "payload": str(e)})
        except Exception:
            pass
    finally:
        if gemini:
            await gemini.close()
        try:
            if websocket.client_state.name != "DISCONNECTED":
                await websocket.close()
        except Exception:
            pass


# ── Helpers ────────────────────────────────────────────────────────────────

def _build_system_instruction(session_info: dict, question: dict) -> str:
    return f"""
You are SYNTH — a professional, warm, and encouraging AI technical interviewer for SynthInterview.

CANDIDATE: {session_info.get('candidateEmail', 'Anonymous')}
DIFFICULTY: {session_info.get('difficulty', 'Medium')}
TOPICS: {', '.join(session_info.get('topics', []))}
PROBLEM: {question.get('title', 'Coding Problem')}

PROBLEM DESCRIPTION:
{question.get('description', '')}

HINTS (use only when asked, one at a time):
{chr(10).join(f'Hint {i+1}: {h}' for i, h in enumerate(question.get('hints', [])))}

TEST CASES:
{chr(10).join(f'- Input: {tc["input"]} -> Expected: {tc["output"]}' for tc in question.get('testCases', []))}

INTERVIEW FLOW:
You will receive messages prefixed with [PHASE: X] telling you which phase you are in.
Respond according to the current phase:

1. GREETING: Introduce yourself warmly. Ask candidate to share screen and open their code editor.
2. ENV_CHECK: Analyze the screen. If ONLY a code editor is visible, say "ENVIRONMENT VERIFIED". If violations, describe them.
3. PROBLEM_DELIVERY: Read the problem clearly. When candidate says they understand, say "CANDIDATE READY".
4. THINK_TIME: Stay quiet. Let them think. Only respond if spoken to directly.
5. APPROACH_LISTEN: Listen to their approach. Ask about data structures and Big O. When satisfied, say "APPROACH ACCEPTED".
6. CODING: Watch silently. If cheating detected, say "CHEAT DETECTED". When code looks complete, say "CODING COMPLETE".
7. HINT_DELIVERY: Give one directional hint (never the answer). Then say "HINT DELIVERED".
8. TESTING: Walk through test cases. When all pass, say "TESTS PASSED".
9. OPTIMIZATION: Discuss complexity improvements. When done, say "OPTIMIZATION COMPLETE".
10. COMPLETED: Thank candidate warmly. Give brief feedback.

RULES:
- Speak naturally like a real human interviewer.
- Keep responses concise (under 60 words) unless reading the problem.
- ALWAYS include the exact trigger phrases when the condition is met.
- Be encouraging but never give away the answer.
""".strip()


async def _detect_state_transitions(
    text: str,
    agent: InterviewAgent,
    websocket: WebSocket,
) -> Optional[str]:
    current = agent.current_state
    triggers = {
        AgentState.ENV_CHECK:        ("environment verified",  "workspace_clean"),
        AgentState.PROBLEM_DELIVERY: ("candidate ready",       "candidate_ready"),
        AgentState.APPROACH_LISTEN:  ("approach accepted",     "approach_accepted"),
        AgentState.CODING:           ("coding complete",       "coding_finished"),
        AgentState.HINT_DELIVERY:    ("hint delivered",        "hint_given"),
        AgentState.TESTING:          ("tests passed",          "tests_passed"),
        AgentState.OPTIMIZATION:     ("optimization complete", "optimization_finished"),
    }
    scripted = None
    if current in triggers:
        phrase, event = triggers[current]
        if phrase in text:
            scripted = await agent.handle_event(event, None)
            await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})
    if "cheat detected" in text and current != AgentState.FLAGGED:
        scripted = await agent.handle_event("cheat_detected", None)
        await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})
    return scripted
