import os
import asyncio
import json
import uuid
import time
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
from app.email_service import send_invite_email, send_scorecard_email
from app.code_runner import run_code_against_tests
from app.scorecard import generate_scorecard

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="SynthInterview API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase init
firebase_cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
storage_bucket = os.getenv("GCS_BUCKET_NAME")

db = None
if firebase_cred_json:
    try:
        cred_dict = json.loads(firebase_cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {"storageBucket": storage_bucket})
        db = firestore.client()
    except Exception as e:
        print(f"Firebase init error: {e}")
else:
    try:
        firebase_admin.initialize_app(options={"storageBucket": storage_bucket})
        db = firestore.client()
    except Exception as e:
        print(f"Firebase init (ADC) error: {e} — running without Firestore")

if db is None:
    print("WARNING: Firestore unavailable. Session data will not be persisted.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025")

# Phases that require screen frame visibility
SCREEN_REQUIRED_STATES = {
    AgentState.PROBLEM_DELIVERY,
    AgentState.THINK_TIME,
    AgentState.APPROACH_LISTEN,
    AgentState.CODING,
    AgentState.HINT_DELIVERY,
    AgentState.TESTING,
    AgentState.OPTIMIZATION,
    AgentState.FLAGGED,
}

# ── Tools ─────────────────────────────────────────────────────────────────

AGENT_TOOLS = {
    "function_declarations": [
        {
            "name": "warn_candidate",
            "description": "Issues a verbal warning to the candidate about a detected violation.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "reason": {
                        "type": "STRING",
                        "description": "The reason for the warning (e.g., 'Spotify is open').",
                    }
                },
                "required": ["reason"],
            },
        },
        {
            "name": "advance_phase",
            "description": (
                "Advances the interview to the next phase when the current phase is complete. "
                "Call this tool instead of saying trigger phrases. The allowed target_state values "
                "depend on the current phase: PROBLEM_DELIVERY->THINK_TIME, THINK_TIME->APPROACH_LISTEN, "
                "APPROACH_LISTEN->CODING, CODING->TESTING, TESTING->OPTIMIZATION, OPTIMIZATION->COMPLETED, "
                "CODING->HINT_DELIVERY (for hints), HINT_DELIVERY->CODING (after hint given)."
            ),
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "target_state": {
                        "type": "STRING",
                        "description": "The state to transition to (e.g. 'APPROACH_LISTEN', 'CODING', 'TESTING').",
                    },
                    "reason": {
                        "type": "STRING",
                        "description": "Brief reason for the transition (e.g. 'candidate confirmed understanding').",
                    },
                },
                "required": ["target_state"],
            },
        },
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


class SendInviteRequest(BaseModel):
    appUrl: Optional[str] = None  # override APP_URL from env if provided


class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"


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
    question = (
        get_question(config.questionId)
        if config.questionId
        else select_question_for_session(config.difficulty, config.topics)
    )
    session_data = {
        "sessionId": session_id,
        "candidateEmail": config.candidateEmail,
        "difficulty": config.difficulty,
        "topics": config.topics,
        "questionId": question["id"],
        "timeLimit": config.timeLimit,
        "createdAt": datetime.utcnow().isoformat(),
        "status": "IDLE",
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


@app.post("/sessions/{session_id}/send-invite")
async def send_invite(session_id: str, body: SendInviteRequest):
    """Sends interview invite email."""
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    data = doc.to_dict()

    import os as _os
    app_url = body.appUrl or _os.getenv("APP_URL", "http://localhost:3000")
    # Temporarily override APP_URL for this call
    original = _os.environ.get("APP_URL")
    _os.environ["APP_URL"] = app_url

    sent = await send_invite_email(
        to_email=data.get("candidateEmail", ""),
        session_id=session_id,
        difficulty=data.get("difficulty", "Medium"),
        topics=data.get("topics", []),
    )

    if original is not None:
        _os.environ["APP_URL"] = original
    else:
        _os.environ.pop("APP_URL", None)

    if not sent:
        return {"success": False, "message": "Email not sent — SMTP not configured or send failed. Copy the link manually."}
    return {"success": True, "message": f"Invite sent to {data.get('candidateEmail')}"}


@app.post("/sessions/{session_id}/run-code")
async def run_code(session_id: str, body: RunCodeRequest):
    """Execute candidate code against structured test cases."""
    # Try to look up the question from Firestore; fall back gracefully if unavailable
    question_id = "two-sum"
    if db:
        try:
            doc = db.collection("sessions").document(session_id).get()
            if doc.exists:
                sdata = doc.to_dict()
                # Check top-level first, then metadata
                question_id = (
                    sdata.get("questionId")
                    or sdata.get("metadata", {}).get("questionId")
                    or question_id
                )
        except Exception as e:
            print(f"[RunCode] Firestore lookup error: {e}")

    question = get_question(question_id)
    print(f"[RunCode] Session={session_id}, question={question_id}, has_tests={question.get('structured_tests') is not None}")
    
    result = await run_code_against_tests(
        code=body.code,
        language=body.language,
        question=question,
    )

    # Store last test results in Firestore for scorecard (best-effort)
    if db:
        try:
            db.collection("sessions").document(session_id).update({
                "lastTestResults": result,
                "lastTestLanguage": body.language,
            })
        except Exception:
            pass

    return result


@app.post("/sessions/{session_id}/scorecard")
async def create_scorecard(session_id: str):
    """Generate scorecard for a completed session and email it to the candidate."""
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    data = doc.to_dict()
    question = get_question(data.get("questionId", "two-sum"))
    meta = data.get("metadata", {})
    test_results = data.get("lastTestResults")
    language = data.get("lastTestLanguage", "python")

    scorecard = await generate_scorecard(
        session_data=data,
        question=question,
        final_code=meta.get("final_code", ""),
        hint_index=meta.get("hint_index", 0),
        test_results=test_results,
        phase_durations=meta.get("phase_durations", {}),
        tab_switch_count=meta.get("tab_switch_count", 0),
        conversation_summary=meta.get("conversation_summary", ""),
    )

    # Persist scorecard
    try:
        db.collection("sessions").document(session_id).update({"scorecard": scorecard})
    except Exception:
        pass

    # Email it
    email_sent = await send_scorecard_email(
        to_email=data.get("candidateEmail", ""),
        scorecard=scorecard,
        question_title=question.get("title", "Coding Problem"),
        final_code=meta.get("final_code", ""),
        language=language,
    )

    return {**scorecard, "email_sent": email_sent}


# ── WebSocket Live Interview ───────────────────────────────────────────────


@app.websocket("/ws/live/{session_id}")
async def live_socket(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()

    gemini: Optional[GeminiLiveClient] = None
    agent: Optional["InterviewAgent"] = None

    try:
        # ── Check if session is terminated or stale ────────────────────
        if db:
            doc = db.collection("sessions").document(session_id).get()
            if doc.exists:
                sdata = doc.to_dict()
                stored_status = sdata.get("status", "IDLE")
                stored_meta = sdata.get("metadata", {})
                
                # Block terminated sessions completely (cheating / privacy violation)
                if stored_status == "COMPLETED" and (
                    stored_meta.get("terminated_for_cheating")
                    or stored_meta.get("terminated_screen_loss")
                ):
                    print(f"Session {session_id}: BLOCKED (terminated for violation)")
                    await websocket.send_json({
                        "type": "session_blocked",
                        "payload": "terminated",
                        "reason": "This interview was terminated due to a privacy violation. This link can no longer be used."
                    })
                    await websocket.close()
                    return
                
                # Check if disconnected too long (> 60s) → reset session to fresh start
                disconnected_at = sdata.get("disconnectedAt")
                if (
                    stored_status not in ("IDLE", "COMPLETED")
                    and disconnected_at
                    and sdata.get("endReason") == "disconnected_resumable"
                ):
                    try:
                        disc_time = datetime.fromisoformat(disconnected_at)
                        elapsed = (datetime.utcnow() - disc_time).total_seconds()
                        if elapsed > 60:
                            print(f"Session {session_id}: Candidate away for {elapsed:.0f}s (>60s). RESETTING session.")
                            db.collection("sessions").document(session_id).update({
                                "status": "IDLE",
                                "metadata": {},
                                "endReason": "reset_timeout",
                                "disconnectedAt": None,
                                "lastUpdated": datetime.utcnow().isoformat(),
                            })
                        else:
                            print(f"Session {session_id}: Candidate returned after {elapsed:.0f}s (<60s). RESUMING.")
                    except Exception as e:
                        print(f"Session {session_id}: Error parsing disconnectedAt: {e}")

        # ── Load / create session ──────────────────────────────────────
        session_info = None
        if db:
            doc = db.collection("sessions").document(session_id).get()
            if doc.exists:
                session_info = doc.to_dict()
            else:
                question = get_question("two-sum")
                session_info = {
                    "candidateEmail": "guest@demo.com",
                    "difficulty": "Easy",
                    "topics": ["Arrays", "HashMaps"],
                    "questionId": question["id"],
                }
                db.collection("sessions").document(session_id).set(
                    {
                        **session_info,
                        "sessionId": session_id,
                        "createdAt": datetime.utcnow().isoformat(),
                        "status": "IDLE",
                    }
                )
        if session_info is None:
            # No Firestore — use in-memory defaults for local dev
            question = get_question("two-sum")
            session_info = {
                "candidateEmail": "guest@demo.com",
                "difficulty": "Easy",
                "topics": ["Arrays", "HashMaps"],
                "questionId": question["id"],
            }

        question_id = session_info.get("questionId", "two-sum")
        question = get_question(question_id)

        agent = InterviewAgent(session_id=session_id, db=db, question=question)
        agent.metadata.update(
            {
                "difficulty": session_info.get("difficulty", "Medium"),
                "questionId": question["id"],
                "topics": session_info.get("topics", []),
                "candidateEmail": session_info.get("candidateEmail", "anonymous"),
            }
        )

        # ── Try to hydrate from Firestore for reconnection ─────────
        was_hydrated = agent.hydrate_from_firestore()

        # ── Connect to Gemini ──────────────────────────────────────────
        system_instr = _build_system_instruction(session_info, question)
        gemini = GeminiLiveClient(GEMINI_API_KEY, MODEL_ID)

        # ── Cheat Detector ─────────────────────────────────────────────
        bucket = None
        try:
            bucket = storage.bucket()
        except Exception as e:
            print(f"Storage bucket error: {e}")

        cheat_detector = CheatDetector(
            session_id=session_id, db=db, bucket=bucket, api_key=GEMINI_API_KEY,
            model_id="gemini-2.5-flash"
        )

        # Run Gemini connect in parallel with CheatDetector init
        await gemini.connect(system_instruction=system_instr)

        # ── GREETING or RESUME ─────────────────────────────────────────
        if was_hydrated:
            # Reconnection: resume from stored state
            print(f"Session {session_id}: RESUMING from {agent.current_state.value}")
            await websocket.send_json(
                {
                    "type": "state_update",
                    "payload": agent.current_state.value,
                    "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                    "metadata": agent.metadata,
                }
            )
            # Send saved code back to the editor
            if agent._candidate_code:
                await websocket.send_json({
                    "type": "restore_code",
                    "payload": agent._candidate_code,
                })
            await gemini.send_text(
                f"[SYSTEM] {agent.get_system_instruction()}\n"
                f"[SYSTEM] The candidate has reconnected after a network drop. Resume the interview from the {agent.current_state.value} phase. "
                "Briefly acknowledge the reconnection (e.g., 'Welcome back! Let's continue where we left off.') and continue naturally."
            )
        else:
            greeting_msg = await agent.update_state(AgentState.GREETING)
            await websocket.send_json(
                {
                    "type": "state_update",
                    "payload": agent.current_state.value,
                    "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                    "metadata": agent.metadata,
                }
            )
            # Single send — two separate turn_complete=True calls causes Gemini to greet twice
            combined_greeting = f"[SYSTEM] {agent.get_system_instruction()}"
            if greeting_msg:
                combined_greeting += f"\n\n{greeting_msg}"
            await gemini.send_text(combined_greeting)

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
                        result = await _handle_tool_call(call, agent, websocket, gemini)
                        await gemini.send_tool_response(call["id"], call["name"], result)
                        continue

                    await websocket.send_json(message)

            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Receive loop error: {e}")

        # ── 2) FORWARDER: browser → Gemini ─────────────────────────────
        analysis_task: Optional[asyncio.Task] = None
        last_frame_time = time.time()

        async def analyze_frame_bg(frame_data: str):
            """Background vision analysis for cheat detection during CODING."""
            try:
                # Add a timeout to prevent hanging analysis tasks
                v = await asyncio.wait_for(cheat_detector.process_frame(frame_data), timeout=10.0)
                if not v:
                    return

                severity = v.get("severity", "FLAG")
                reason = v.get("reason", "Suspicious activity")
                
                print(f"[Vision] Handling {severity}: {reason}")

                if severity == "HARD":
                    scripted = await agent.handle_event("cheat_detected", v)
                    agent.metadata["cheat_reason"] = reason
                    await websocket.send_json(
                        {
                            "type": "state_update",
                            "payload": agent.current_state.value,
                            "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                            "metadata": agent.metadata,
                            "violation": v # Send box/prob details
                        }
                    )
                    await gemini.send_text_urgent(
                        f"[SYSTEM] [CRITICAL VIOLATION] {reason}. Warn formally: This is the first and ONLY warning. Next violation will terminate the interview."
                    )
                    if scripted:
                        await gemini.send_text_urgent(scripted)
                elif severity == "TERMINATE":
                    print(f"[Vision] !!! TERMINATING interview due to persistent cheating violations !!!")
                    scripted = await agent.handle_event("end_interview", {"reason": "vision_cheat_limit"})
                    agent.metadata["cheat_reason"] = reason
                    await websocket.send_json(
                        {
                            "type": "state_update",
                            "payload": agent.current_state.value,
                            "screenRequired": False,
                            "metadata": agent.metadata,
                            "violation": v
                        }
                    )
                    if scripted:
                        await gemini.send_text_urgent(scripted)
            except Exception as e:
                print(f"Background analysis task failed: {e}")

        async def forward_client_to_gemini():
            nonlocal analysis_task, last_frame_time
            try:
                while True:
                    raw = await websocket.receive_text()
                    data = json.loads(raw)
                    msg_type = data.get("type")

                    if msg_type == "event":
                        event_type = data.get("payload")
                        event_data = data.get("data")

                        # ── Candidate signals: route to AI as a hint, NOT direct transition ──
                        _SIGNAL_EVENTS = {
                            "candidate_signal",
                            "approach_accepted",
                            "coding_finished",
                            "tests_passed",
                            "optimization_finished",
                            "timer_expired",
                        }

                        if event_type in _SIGNAL_EVENTS:
                            if event_type == "candidate_signal" and isinstance(event_data, dict):
                                signal_text = event_data.get(
                                    "signal", "The candidate pressed a button."
                                )
                            else:
                                signal_text = f"The candidate triggered '{event_type}'. Evaluate if ready to advance phase."
                            await gemini.send_text(
                                f"[SYSTEM] {signal_text} Output [ADVANCE: <STATE>] if appropriate."
                            )
                            continue

                        # ── Legitimate direct events ───
                        old_state = agent.current_state
                        scripted = await agent.handle_event(event_type, event_data)
                        new_state = agent.current_state

                        await websocket.send_json(
                            {
                                "type": "state_update",
                                "payload": new_state.value,
                                "screenRequired": new_state in SCREEN_REQUIRED_STATES,
                                "metadata": agent.metadata,
                            }
                        )

                        # Conversation states where the model may be mid-turn when
                        # a transition fires — use urgent send to interrupt immediately.
                        _CONVERSATION_STATES = {
                            AgentState.THINK_TIME, AgentState.APPROACH_LISTEN,
                            AgentState.CODING, AgentState.HINT_DELIVERY,
                            AgentState.TESTING, AgentState.OPTIMIZATION,
                        }
                        _URGENT_EVENTS = {"tab_switch", "screen_share_ended"}

                        if new_state != old_state:
                            sys_instr = f"[SYSTEM] {agent.get_system_instruction()}"
                            merged = f"{sys_instr}\n\n{scripted}" if scripted and event_type not in _URGENT_EVENTS else sys_instr
                            # Use urgent send for conversation-phase transitions so the
                            # new instruction interrupts without waiting for turn_complete
                            if old_state in _CONVERSATION_STATES or event_type in _URGENT_EVENTS:
                                await gemini.send_text_urgent(merged)
                                if scripted and event_type in _URGENT_EVENTS:
                                    await gemini.send_text_urgent(scripted)
                            else:
                                await gemini.send_text(merged)
                        elif scripted:
                            if event_type in _URGENT_EVENTS:
                                await gemini.send_text_urgent(scripted)
                            else:
                                await gemini.send_text(scripted)

                    elif msg_type == "audio":
                        await gemini.send_audio(data["payload"])

                    elif msg_type == "text":
                        await gemini.send_text(data["payload"])

                    elif msg_type == "code_update":
                        code_text = data.get("payload", "")
                        agent._candidate_code = code_text
                        if agent.current_state in (
                            AgentState.CODING,
                            AgentState.TESTING,
                            AgentState.OPTIMIZATION,
                            AgentState.HINT_DELIVERY,
                        ):
                            snippet = code_text[-3000:] if len(code_text) > 3000 else code_text
                            # Silent context update — does NOT interrupt the conversation
                            # or force Gemini to respond; it just keeps Gemini aware of
                            # the latest code so it can reference it if the candidate asks.
                            await gemini.send_context(
                                f"[SYSTEM: CANDIDATE CODE UPDATE]\n```\n{snippet}\n```"
                            )

                    elif msg_type == "frame":
                        msg_data = data["payload"]
                        latency = time.time() - last_frame_time
                        print(f"[Vision] Frame received. State: {agent.current_state}. Latency: {latency:.2f}s")
                        # Only analyze screen in certain states to save cost
                        if agent.current_state in SCREEN_REQUIRED_STATES:
                            if analysis_task is None or analysis_task.done():
                                print(f"[Vision] Starting background analysis task.")
                                analysis_task = asyncio.create_task(analyze_frame_bg(msg_data))
                            else:
                                print(f"[Vision] Analysis task already running, skipping frame.")
                        else:
                            print(f"[Vision] Not in screen-required state, skipping analysis.")
                        last_frame_time = time.time()

            except WebSocketDisconnect:
                print(f"Client disconnected: {session_id}")
            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Forwarder error: {e}")
            finally:
                if analysis_task:
                    analysis_task.cancel()

        # ── 3) TIMER WATCHER: agent pending messages ───────────────────
        async def watch_agent_timer():
            try:
                while True:
                    await asyncio.sleep(1)
                    if hasattr(agent, "_pending_timer_msg") and agent._pending_timer_msg:
                        msg = agent._pending_timer_msg
                        agent._pending_timer_msg = None
                        await websocket.send_json(
                            {
                                "type": "state_update",
                                "payload": agent.current_state.value,
                                "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                                "metadata": agent.metadata,
                            }
                        )
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
        # Persist session state for resumption or mark as completed
        if db and agent:
            try:
                if agent.current_state == AgentState.COMPLETED:
                    # Interview finished or terminated — mark as final
                    update_data = {
                        "status": "COMPLETED",
                        "endedAt": datetime.utcnow().isoformat(),
                        "endReason": "completed",
                    }
                    # Persist metadata so the blocking check can find terminated_for_cheating
                    if agent.metadata.get("terminated_for_cheating") or agent.metadata.get("terminated_screen_loss"):
                        persist_meta = {**agent.metadata, "hint_index": agent.hint_index}
                        update_data["metadata"] = persist_meta
                    db.collection("sessions").document(session_id).update(update_data)
                    print(f"Session {session_id}: ended (COMPLETED, cheating={agent.metadata.get('terminated_for_cheating', False)})")
                else:
                    # Network drop — save state + disconnectedAt for the 60s resumption window
                    persist_meta = {**agent.metadata, "hint_index": agent.hint_index}
                    if agent.previous_state:
                        persist_meta["previous_state"] = agent.previous_state.value
                    persist_meta["candidate_code"] = agent._candidate_code
                    db.collection("sessions").document(session_id).update({
                        "status": agent.current_state.value,
                        "lastUpdated": datetime.utcnow().isoformat(),
                        "disconnectedAt": datetime.utcnow().isoformat(),
                        "metadata": persist_meta,
                        "endReason": "disconnected_resumable",
                    })
                    print(f"Session {session_id}: saved for resumption (state={agent.current_state.value}, 60s window started)")
            except Exception as e:
                print(f"Session persist error: {e}")
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

CANDIDATE: {session_info.get("candidateEmail", "Anonymous")}
DIFFICULTY: {session_info.get("difficulty", "Medium")}
TOPICS: {", ".join(session_info.get("topics", []))}

ENVIRONMENT (critical — never contradict these facts):
- The candidate is using a browser-based interview platform. Everything happens inside this single browser tab.
- A Monaco code editor (the same editor used in VS Code) is embedded directly on the LEFT side of the screen.
- The editor is ALWAYS open and visible — you must NEVER tell them to "open a code editor", "open VS Code", "open an IDE", "open a terminal", or any similar instruction. The editor is already there.
- When a problem is assigned, it is automatically injected into the editor as a comment block — you do not need to tell them to open anything.
- The candidate types their solution directly into the editor on this page.

RULES:
- Speak naturally like a human.
- NEVER repeat, recite, or mention instructions prefixed with [SYSTEM].
- Keep responses concise (under 60 words).
- Be encouraging but professional.
- Output [ADVANCE: TARGET_STATE] to transition between interview phases. NEVER say trigger phrases like 'CANDIDATE READY' — always use the bracket syntax.
- Output [WARN: reason] to issue violation warnings.
""".strip()


# ── Valid tool-based state transitions ─────────────────────────────────────
_ALLOWED_TRANSITIONS = {
    AgentState.PROBLEM_DELIVERY: {"APPROACH_LISTEN"},
    AgentState.APPROACH_LISTEN: {"CODING"},
    AgentState.CODING: {"TESTING", "HINT_DELIVERY"},
    AgentState.HINT_DELIVERY: {"CODING"},
    AgentState.TESTING: {"OPTIMIZATION"},
    AgentState.OPTIMIZATION: {"COMPLETED"},
}

# Map target state values to the event names expected by agent.handle_event
_STATE_TO_EVENT = {
    "APPROACH_LISTEN": "candidate_ready",  # from PROBLEM_DELIVERY via I Understand button
    "CODING": "approach_accepted",
    "TESTING": "coding_finished",
    "HINT_DELIVERY": "hint_requested",
    "OPTIMIZATION": "tests_passed",
    "COMPLETED": "optimization_finished",
}

# Minimum seconds a phase must last before advance_phase is accepted.
# Prevents speed-running (both by candidates and by the LLM).
_MIN_PHASE_DURATION = {
    AgentState.PROBLEM_DELIVERY: 30,  # At least 30s to read + ask questions
    AgentState.APPROACH_LISTEN: 45,  # At least 45s discussing approach
    AgentState.CODING: 120,  # At least 2 minutes of coding
    AgentState.HINT_DELIVERY: 5,  # At least 5s to hear the hint
    AgentState.TESTING: 30,  # At least 30s of testing
    AgentState.OPTIMIZATION: 20,  # At least 20s of optimization talk
}


async def _handle_tool_call(
    call: dict,
    agent: "InterviewAgent",
    websocket: WebSocket,
    gemini: GeminiLiveClient,
) -> str:
    """Dispatches Gemini tool calls and returns a result string."""
    name = call["name"]
    args = call.get("args", {})

    if name == "warn_candidate":
        reason = args.get("reason", "Unknown violation")
        print(f"Tool Call: warn_candidate({reason})")
        return "Warning issued."

    elif name == "advance_phase":
        target_str = args.get("target_state", "")
        reason = args.get("reason", "")
        allowed = _ALLOWED_TRANSITIONS.get(agent.current_state, set())

        if target_str not in allowed:
            msg = f"Cannot transition from {agent.current_state.value} to {target_str}. Allowed: {allowed or 'none'}."
            print(f"advance_phase REJECTED: {msg}")
            return msg

        # ── Enforce minimum phase duration ───────────────────────────
        min_secs = _MIN_PHASE_DURATION.get(agent.current_state, 0)
        if min_secs > 0:
            from datetime import datetime

            elapsed = (datetime.utcnow() - agent.last_transition_time).total_seconds()
            if elapsed < min_secs:
                remaining = int(min_secs - elapsed)
                msg = (
                    f"Too early to advance from {agent.current_state.value}. "
                    f"Minimum {min_secs}s required, only {int(elapsed)}s elapsed. "
                    f"Wait {remaining}s more. Continue the current phase naturally."
                )
                print(f"advance_phase THROTTLED: {msg}")
                return msg

        event = _STATE_TO_EVENT.get(target_str)
        if not event:
            return f"No event mapping for target {target_str}."

        # Handle the hint_given special case: coming back from HINT_DELIVERY
        if agent.current_state == AgentState.HINT_DELIVERY and target_str == "CODING":
            event = "hint_given"

        scripted = await agent.handle_event(event, None)
        await websocket.send_json(
            {
                "type": "state_update",
                "payload": agent.current_state.value,
                "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                "metadata": agent.metadata,
            }
        )
        print(f"advance_phase OK: -> {agent.current_state.value} ({reason})")

        # When interview completes, persist final code and fire async scorecard + email
        if agent.current_state == AgentState.COMPLETED and not agent.metadata.get("terminated_for_cheating"):
            asyncio.create_task(
                _generate_and_email_scorecard(agent, websocket)
            )

        # Return system instruction + scripted message as the tool response.
        # send_tool_response (called by the caller) will carry this as the single
        # turn_complete=True trigger — no separate send_text needed.
        sys_instr = f"[SYSTEM] {agent.get_system_instruction()}"
        if scripted:
            return f"{sys_instr}\n\n{scripted}"
        return sys_instr

    return f"Unknown tool: {name}"


async def _generate_and_email_scorecard(agent: "InterviewAgent", websocket: WebSocket) -> None:
    """Async task: generate scorecard with Gemini and email it to the candidate."""
    try:
        if not db:
            return
        session_id = agent.session_id
        doc = db.collection("sessions").document(session_id).get()
        if not doc.exists:
            return
        data = doc.to_dict()
        question = get_question(data.get("questionId", "two-sum"))
        meta = agent.metadata
        test_results = data.get("lastTestResults")
        language = data.get("lastTestLanguage", "python")

        # Persist final code snapshot
        final_code = agent._candidate_code
        try:
            db.collection("sessions").document(session_id).update({
                "metadata": {**meta, "final_code": final_code}
            })
        except Exception:
            pass

        scorecard = await generate_scorecard(
            session_data=data,
            question=question,
            final_code=final_code,
            hint_index=agent.hint_index,
            test_results=test_results,
            phase_durations=meta.get("phase_durations", {}),
            tab_switch_count=meta.get("tab_switch_count", 0),
            conversation_summary=meta.get("conversation_summary", ""),
        )

        # Persist scorecard
        try:
            db.collection("sessions").document(session_id).update({"scorecard": scorecard})
        except Exception:
            pass

        # Notify frontend
        try:
            await websocket.send_json({"type": "scorecard", "payload": scorecard})
        except Exception:
            pass

        # Email candidate
        await send_scorecard_email(
            to_email=data.get("candidateEmail", ""),
            scorecard=scorecard,
            question_title=question.get("title", "Coding Problem"),
            final_code=final_code,
            language=language,
        )
        print(f"Scorecard generated and emailed for session {session_id}")
    except Exception as e:
        print(f"Scorecard generation error for {agent.session_id}: {e}")
