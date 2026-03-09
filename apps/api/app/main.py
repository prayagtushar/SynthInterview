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
from firebase_admin import credentials, firestore, storage

from app.agent import InterviewAgent, AgentState
from app.gemini_client import GeminiLiveClient
from app.cheat_detector import CheatDetector
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
storage_bucket = os.getenv("GCS_BUCKET_NAME")

db = None
if firebase_cred_json:
    try:
        cred_dict = json.loads(firebase_cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {'storageBucket': storage_bucket})
        db = firestore.client()
    except Exception as e:
        print(f"Firebase init error: {e}")
else:
    try:
        firebase_admin.initialize_app(options={'storageBucket': storage_bucket})
        db = firestore.client()
    except Exception as e:
        print(f"Firebase init (ADC) error: {e} — running without Firestore")

if db is None:
    print("WARNING: Firestore unavailable. Session data will not be persisted.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-native-audio-latest")

# Phases that require screen frame visibility
SCREEN_REQUIRED_STATES = {AgentState.ENV_CHECK, AgentState.CODING}

# ── Tools ─────────────────────────────────────────────────────────────────

WARN_CANDIDATE_TOOL = {
    "function_declarations": [
        {
            "name": "warn_candidate",
            "description": "Issues a verbal warning to the candidate about a detected violation.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "reason": {
                        "type": "STRING",
                        "description": "The reason for the warning (e.g., 'Spotify is open')."
                    }
                },
                "required": ["reason"]
            }
        }
    ]
}


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
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
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
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
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
        session_info = None
        if db:
            doc = db.collection("sessions").document(session_id).get()
            if doc.exists:
                session_info = doc.to_dict()
            else:
                question = get_question("two-sum")
                session_info = {
                    "candidateEmail": "guest@demo.com", "difficulty": "Easy",
                    "topics": ["Arrays", "HashMaps"], "questionId": question["id"],
                }
                db.collection("sessions").document(session_id).set({
                    **session_info, "sessionId": session_id,
                    "createdAt": datetime.utcnow().isoformat(), "status": "IDLE",
                })
        if session_info is None:
            # No Firestore — use in-memory defaults for local dev
            question = get_question("two-sum")
            session_info = {
                "candidateEmail": "guest@demo.com", "difficulty": "Easy",
                "topics": ["Arrays", "HashMaps"], "questionId": question["id"],
            }

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
        await gemini.connect(
            system_instruction=system_instr,
            tools=[WARN_CANDIDATE_TOOL]
        )

        # ── Cheat Detector ─────────────────────────────────────────────
        bucket = None
        try:
            bucket = storage.bucket()
        except Exception as e:
            print(f"Storage bucket error: {e}")
        
        cheat_detector = CheatDetector(
            session_id=session_id,
            db=db,
            bucket=bucket,
            api_key=GEMINI_API_KEY
        )

        # ── GREETING ───────────────────────────────────────────────────
        greeting_msg = await agent.update_state(AgentState.GREETING)
        await websocket.send_json({
            "type": "state_update",
            "payload": agent.current_state.value,
            "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
            "metadata": agent.metadata
        })
        # Push the initial state instruction and greeting
        await gemini.send_text(f"[SYSTEM] {agent.get_system_instruction()}")
        if greeting_msg:
            await gemini.send_text(greeting_msg)

        # ── 1) RECEIVER: Gemini → browser ─────────────────────────────
        async def receive_from_gemini():
            text_buffer = ""  # accumulates text chunks within one Gemini turn
            try:
                async for message in gemini.listen():
                    if message["type"] == "turn_complete":
                        text_buffer = ""  # reset per turn boundary
                        await websocket.send_json({"type": "turn_complete"})
                        continue

                    if message["type"] == "tool_call":
                        call = message["payload"]
                        if call["name"] == "warn_candidate":
                            reason = call["args"].get("reason", "Unknown violation")
                            print(f"Tool Call: warn_candidate({reason})")
                            # We can just let Gemini speak the warning, 
                            # but we could also do side effects here if needed.
                            await gemini.send_tool_response(call["id"], call["name"], "Warning issued.")
                        continue

                    await websocket.send_json(message)

                    # Accumulate text and detect state-change keywords
                    if message["type"] == "text":
                        text_buffer += message["payload"]
                        scripted = await _detect_state_transitions(
                            text_buffer.lower(), agent, websocket
                        )
                        if scripted:
                            # State changed: push the NEW state's system instructions immediately
                            await gemini.send_text(f"[SYSTEM] {agent.get_system_instruction()}")
                            await gemini.send_text(scripted)

            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Receive loop error: {e}")

        # ── 2) FORWARDER: browser → Gemini ─────────────────────────────
        async def forward_client_to_gemini():
            try:
                while True:
                    raw = await websocket.receive_text()
                    data = json.loads(raw)
                    msg_type = data.get("type")

                    if msg_type == "event":
                        event_type = data.get("payload")
                        old_state = agent.current_state
                        scripted = await agent.handle_event(event_type, data.get("data"))
                        new_state = agent.current_state
                        
                        await websocket.send_json({
                            "type": "state_update",
                            "payload": new_state.value,
                            "screenRequired": new_state in SCREEN_REQUIRED_STATES,
                            "metadata": agent.metadata,
                        })

                        # If state changed, ALWAYS update Gemini's instructions
                        if new_state != old_state:
                            await gemini.send_text(f"[SYSTEM] {agent.get_system_instruction()}")
                        
                        if scripted:
                            # Interrupt ongoing speech for time-sensitive events
                            if event_type in ("tab_switch", "screen_share_ended"):
                                await gemini.send_text_urgent(scripted)
                            else:
                                await gemini.send_text(scripted)

                    elif msg_type == "audio":
                        # print(f"Audio chunk received: {len(data['payload'])} bytes")
                        await gemini.send_audio(data["payload"])

                    elif msg_type == "frame":
                        # print(f"Frame received: {len(data['payload'])} bytes")
                        await gemini.send_frame(data["payload"])

                        if agent.current_state == AgentState.ENV_CHECK:
                            # Only detect violations — frontend time-based timer (12s clean-stay)
                            # sends workspace_clean to auto-proceed. Faster analysis interval.
                            cheat_detector.analysis_interval = 3
                            v = await cheat_detector.process_frame(data["payload"])
                            if v:
                                await gemini.send_text(
                                    f"[SYSTEM] Environment issue detected: {v['reason']}. "
                                    "Tell the candidate clearly what to close, then wait."
                                )

                        elif agent.current_state == AgentState.CODING:
                            v = await cheat_detector.process_frame(data["payload"])
                            if v:
                                severity = v["severity"]
                                reason = v["reason"]
                                if severity == "FLAG":
                                    await gemini.send_text(
                                        f"[SYSTEM] [NOTICE] Possible distraction detected: {reason}. "
                                        "Gently remind the candidate to stay focused on the editor."
                                    )
                                elif severity == "SOFT":
                                    await gemini.send_text(
                                        f"[SYSTEM] [VIOLATION] Detected: {reason}. "
                                        "Briefly warn the candidate to close it."
                                    )
                                elif severity == "HARD":
                                    scripted = await agent.handle_event("cheat_detected", v)
                                    agent.metadata["cheat_reason"] = reason
                                    await websocket.send_json({
                                        "type": "state_update",
                                        "payload": agent.current_state.value,
                                        "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                                        "metadata": agent.metadata
                                    })
                                    await gemini.send_text(f"[SYSTEM] [CRITICAL VIOLATION] {reason}. Issue a formal warning.")
                                    if scripted:
                                        await gemini.send_text(scripted)

                    elif msg_type == "text":
                        await gemini.send_text(data["payload"])

            except WebSocketDisconnect:
                print(f"Client disconnected: {session_id}")
            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Forward loop error: {e}")

        # ── 3) TIMER WATCHER: agent pending messages ───────────────────
        async def watch_agent_timer():
            try:
                while True:
                    await asyncio.sleep(1)
                    if hasattr(agent, '_pending_timer_msg') and agent._pending_timer_msg:
                        msg = agent._pending_timer_msg
                        agent._pending_timer_msg = None
                        await websocket.send_json({
                            "type": "state_update",
                            "payload": agent.current_state.value,
                            "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                            "metadata": agent.metadata
                        })
                        await gemini.send_text(msg)
            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Timer watcher error: {e}")

        # ── Run tasks ───────────────────────────────────────────────────
        tasks = [
            asyncio.create_task(receive_from_gemini()),
            asyncio.create_task(forward_client_to_gemini()),
            asyncio.create_task(watch_agent_timer()),
        ]
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()

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

RULES:
- Speak naturally like a human. 
- NEVER repeat, recite, or mention instructions prefixed with [SYSTEM].
- Keep responses concise (under 60 words).
- Be encouraging but professional.
""".strip()


async def _detect_state_transitions(
    text: str,
    agent: InterviewAgent,
    websocket: WebSocket,
) -> Optional[str]:
    current = agent.current_state
    triggers = {
        # ENV_CHECK is now gated programmatically by CheatDetector — no verbal trigger
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
            await websocket.send_json({
                "type": "state_update",
                "payload": agent.current_state.value,
                "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
            })
    if "cheat detected" in text and current != AgentState.FLAGGED:
        scripted = await agent.handle_event("cheat_detected", None)
        await websocket.send_json({
            "type": "state_update",
            "payload": agent.current_state.value,
            "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
            "metadata": agent.metadata
        })
    return scripted
