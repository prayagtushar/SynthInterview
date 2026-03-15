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
from app.questions import get_question, select_question_for_session, select_questions_for_session
from app.email_service import send_invite_email, send_scorecard_email
from app.code_runner import run_code_against_tests
from app.scorecard import generate_scorecard

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="SynthInterview API", version="0.2.0")

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
LIVE_MODEL_ID = os.getenv("GEMINI_LIVE_MODEL")
TEXT_MODEL_ID = os.getenv("GEMINI_TEXT_MODEL")

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
        {
            "name": "save_final_report",
            "description": "Generates and saves a final performance and integrity report for the recruiter. Call this once at the very end of the interview.",
            "parameters": {"type": "OBJECT", "properties": {}},
        },
    ]
}


class SessionConfig(BaseModel):
    candidateEmail: str
    difficulty: str = "Medium"
    topics: List[str] = []


class SessionResponse(BaseModel):
    sessionId: str
    candidateEmail: str
    difficulty: str
    topics: List[str]
    questionIds: List[str]
    timeLimit: int
    startTime: Optional[str] = None
    status: Optional[str] = "IDLE"


class SendInviteRequest(BaseModel):
    appUrl: Optional[str] = None  # override APP_URL from env if provided


class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"


@app.get("/")
async def root():
    return {"service": "SynthInterview API", "version": "0.2.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


class ProctoringEvent(BaseModel):
    type: str
    data: Optional[dict] = None
    timestamp: Optional[str] = None


@app.post("/sessions/{session_id}/proctoring-event")
async def record_proctoring_event(session_id: str, event: ProctoringEvent):
    """Records a proctoring violation or activity event."""
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    
    event_entry = {
        "type": event.type,
        "data": event.data or {},
        "timestamp": event.timestamp or datetime.utcnow().isoformat(),
        "clientIp": "rest-api",
    }

    try:
        doc_ref = db.collection("sessions").document(session_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Session not found")
        
        doc_ref.update({
            "cheatEvents": firestore.ArrayUnion([event_entry])
        })
        
        if event.type == "tab_switch":
            doc_data = doc.to_dict()
            metadata = doc_data.get("metadata", {})
            metadata["tab_switch_count"] = metadata.get("tab_switch_count", 0) + 1
            doc_ref.update({"metadata": metadata})

        return {"success": True}
    except Exception as e:
        print(f"Error recording proctoring event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions", response_model=SessionResponse)
async def create_session(config: SessionConfig):
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    session_id = str(uuid.uuid4())

    time_limit = {"Easy": 45, "Medium": 45, "Hard": 60}.get(config.difficulty, 45)

    questions = select_questions_for_session(config.difficulty, config.topics)
    question_ids = [q["id"] for q in questions]

    session_data = {
        "sessionId": session_id,
        "candidateEmail": config.candidateEmail,
        "difficulty": config.difficulty,
        "topics": config.topics,
        "questionIds": question_ids,
        "timeLimit": time_limit,
        "createdAt": datetime.utcnow().isoformat(),
        "status": "IDLE",
        "currentQuestionIndex": 0,
    }
    db.collection("sessions").document(session_id).set(session_data)
    return session_data


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    data = doc.to_dict()
    if "questionIds" not in data and "questionId" in data:
        data["questionIds"] = [data["questionId"]]
    if "timeLimit" not in data:
        data["timeLimit"] = 45
    return data


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
    """Executes candidate code against tests."""
    question_id = "two-sum"
    if db:
        try:
            doc = db.collection("sessions").document(session_id).get()
            if doc.exists:
                sdata = doc.to_dict()
                question_ids = sdata.get("questionIds")
                if question_ids:
                    idx = sdata.get("currentQuestionIndex", 0)
                    question_id = question_ids[min(idx, len(question_ids) - 1)]
                else:
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
    """Generates and emails scorecard."""
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    data = doc.to_dict()
    question_ids = data.get("questionIds")
    if question_ids:
        idx = data.get("currentQuestionIndex", len(question_ids) - 1)
        question = get_question(question_ids[min(idx, len(question_ids) - 1)])
    else:
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
        model_id=TEXT_MODEL_ID,
        cheat_events=data.get("cheatEvents", []),
    )

    try:
        db.collection("sessions").document(session_id).update({"scorecard": scorecard})
    except Exception:
        pass

    email_sent = await send_scorecard_email(
        to_email=data.get("candidateEmail", ""),
        scorecard=scorecard,
        question_title=question.get("title", "Coding Problem"),
        final_code=meta.get("final_code", ""),
        language=language,
    )

    return {**scorecard, "email_sent": email_sent}


class RequestReviewBody(BaseModel):
    notes: Optional[str] = None


@app.post("/sessions/{session_id}/request-review")
async def request_review(session_id: str, body: RequestReviewBody):
    """Marks session for human review and notifies recruiter."""
    if not db:
        raise HTTPException(status_code=503, detail="Firestore unavailable")
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    data = doc.to_dict()

    db.collection("sessions").document(session_id).update({
        "humanReviewRequested": True,
        "humanReviewRequestedAt": datetime.utcnow().isoformat(),
        "humanReviewNotes": body.notes or "",
    })

    try:
        recruiter_email = os.getenv("RECRUITER_EMAIL") or data.get("recruiterEmail", "")
        if recruiter_email:
            candidate = data.get("candidateEmail", "Unknown")
            await send_scorecard_email(
                to_email=recruiter_email,
                scorecard=data.get("scorecard", {}),
                question_title=f"[HUMAN REVIEW REQUESTED] Session {session_id} — {candidate}",
                final_code=data.get("metadata", {}).get("final_code", ""),
                language=data.get("lastTestLanguage", "python"),
            )
    except Exception as e:
        print(f"Request-review email error: {e}")

    return {"success": True, "message": "Human review requested. The recruiter has been notified."}


_ACTIVE_SESSIONS = {}

@app.websocket("/ws/live/{session_id}")
@app.websocket("/sessions/{session_id}/ws")
async def live_socket(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()

    client_ip = websocket.client.host if websocket.client else "unknown"
    
    if session_id in _ACTIVE_SESSIONS:
        existing_ws, existing_ip = _ACTIVE_SESSIONS[session_id]
        if existing_ip != client_ip and existing_ip != "127.0.0.1" and existing_ip != "::1":
            print(f"Session {session_id}: BLOCKED (another device/IP connected: {existing_ip} vs {client_ip})")
            await websocket.send_json({
                "type": "session_blocked",
                "payload": "terminated",
                "reason": "This session is currently active on another device. Multi-device access is prohibited."
            })
            await websocket.close()
            return
        
        pass 

    _ACTIVE_SESSIONS[session_id] = (websocket, client_ip)

    gemini: Optional[GeminiLiveClient] = None
    agent: Optional["InterviewAgent"] = None

    try:
        sdata: Optional[dict] = None
        if db:
            doc = db.collection("sessions").document(session_id).get()
            if doc.exists:
                sdata = doc.to_dict()
                stored_status = sdata.get("status", "IDLE")
                stored_meta = sdata.get("metadata", {})
                
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

        session_info: Optional[dict] = sdata 
        if db and session_info is None:
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
            question = get_question("two-sum")
            session_info = {
                "candidateEmail": "guest@demo.com",
                "difficulty": "Easy",
                "topics": ["Arrays", "HashMaps"],
                "questionId": question["id"],
            }

        question_ids = session_info.get("questionIds") or [session_info.get("questionId", "two-sum")]
        questions = [get_question(qid) for qid in question_ids]

        agent = InterviewAgent(session_id=session_id, db=db, questions=questions)
        agent.current_question_index = session_info.get("currentQuestionIndex", 0)
        agent.metadata.update(
            {
                "difficulty": session_info.get("difficulty", "Medium"),
                "questionIds": question_ids,
                "topics": session_info.get("topics", []),
                "candidateEmail": session_info.get("candidateEmail", "anonymous"),
            }
        )

        system_instr = _build_system_instruction(session_info, questions)
        gemini = GeminiLiveClient(GEMINI_API_KEY, LIVE_MODEL_ID)

        bucket = None
        try:
            bucket = storage.bucket()
        except Exception as e:
            print(f"Storage bucket error: {e}")

        cheat_detector = CheatDetector(
            session_id=session_id, db=db, bucket=bucket, api_key=GEMINI_API_KEY,
            model_id=TEXT_MODEL_ID
        )

        was_hydrated, _ = await asyncio.gather(
            asyncio.get_event_loop().run_in_executor(None, agent.hydrate_from_firestore),
            gemini.connect(system_instruction=system_instr),
        )

        if was_hydrated:
            print(f"Session {session_id}: RESUMING from {agent.current_state.value}")
            await websocket.send_json(
                {
                    "type": "state_update",
                    "payload": agent.current_state.value,
                    "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                    "metadata": agent.metadata,
                }
            )
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
            combined_greeting = f"[SYSTEM] {agent.get_system_instruction()}"
            if greeting_msg:
                combined_greeting += f"\n\n{greeting_msg}"
            await gemini.send_text(combined_greeting)

        async def receive_from_gemini():
            text_buffer = "" 
            try:
                async for message in gemini.listen():
                    if message["type"] == "turn_complete":
                        text_buffer = ""  
                        await websocket.send_json({"type": "turn_complete"})
                        if agent.current_state == AgentState.COMPLETED:
                            print(f"[Gemini] Session ended logically. Closing receiver loop.")
                            break
                        continue

                    if message["type"] == "tool_call":
                        call = message["payload"]
                        result = await _handle_tool_call(call, agent, websocket, gemini)
                        await gemini.send_tool_response(call["id"], call["name"], result)
                        continue

                    if message["type"] == "text":
                        if "CHEAT_DETECTED" in message["payload"]:
                            print(f"[LLM] Trap Triggered! Candidate used an AI assistant.")
                            v = {"reason": "Unauthorized AI assistance detected via code signature.", "severity": "TERMINATE", "box_2d": [0,0,0,0], "probability": 1.0}
                            scripted = await agent.handle_event("end_interview", {"reason": "ai_scraping_trap_triggered"})
                            agent.metadata["cheat_reason"] = v["reason"]
                            agent.metadata["violation_severity"] = "TERMINATE"
                            await websocket.send_json({
                                "type": "state_update",
                                "payload": agent.current_state.value,
                                "screenRequired": False,
                                "metadata": agent.metadata,
                                "violation": v
                            })
                            if scripted:
                                await gemini.send_text_urgent(scripted)
                            await agent.save_final_report()
                            continue

                    await websocket.send_json(message)

            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Receive loop error: {e}")

        screen_task: Optional[asyncio.Task] = None
        webcam_task: Optional[asyncio.Task] = None
        last_frame_time = time.time()

        async def analyze_frame_bg(frame_data: str, source: str = "screen"):
            """Vision check for cheating."""
            try:
                v = await asyncio.wait_for(cheat_detector.process_frame(frame_data, source), timeout=10.0)
                if v is None:
                    return 

                if v is False:
                    await websocket.send_json({
                        "type": "state_update",
                        "payload": agent.current_state.value,
                        "metadata": agent.metadata,
                        "violation": None,
                        "is_webcam": source == "webcam"
                    })
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
                            "violation": v 
                        }
                    )
                    await gemini.send_text_urgent(
                        f"[SYSTEM] [CRITICAL VIOLATION] {reason}. Warn formally: This is the first and ONLY warning. Next violation will terminate the interview."
                    )
                    if scripted:
                        await gemini.send_text_urgent(scripted)
                elif severity == "TERMINATE":
                    print(f"[Vision] !!! TERMINATING interview due to critical violation: {reason} !!!")
                    scripted = await agent.handle_event("end_interview", {"reason": reason})
                    agent.metadata["cheat_reason"] = reason
                    agent.metadata["violation_severity"] = "TERMINATE"
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
                    await agent.save_final_report()
                else:
                    await websocket.send_json(
                        {
                            "type": "state_update",
                            "payload": agent.current_state.value,
                            "screenRequired": agent.current_state in SCREEN_REQUIRED_STATES,
                            "metadata": agent.metadata,
                            "violation": v,
                            "is_webcam": source == "webcam"
                        }
                    )
            except Exception as e:
                print(f"Background analysis task failed: {e}")

        async def forward_client_to_gemini():
            nonlocal screen_task, webcam_task, last_frame_time
            try:
                while True:
                    raw = await websocket.receive_text()
                    data = json.loads(raw)

                    if agent.current_state == AgentState.COMPLETED:
                        print(f"[Client] Session ended. Closing forwarder loop.")
                        break

                    msg_type = data.get("type")

                    if msg_type == "event":
                        event_type = data.get("payload")
                        event_data = data.get("data")

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
                                signal = event_data.get("signal", "")
                                if signal == "paste":
                                    await agent.record_cheat_event(
                                        "large_paste",
                                        {"char_count": event_data.get("charCount", 0)},
                                    )
                                    continue
                                elif signal == "typing":
                                    await agent.handle_event("typing_activity", None)
                                    continue
                                signal_text = signal or "The candidate pressed a button."
                            else:
                                signal_text = f"The candidate triggered '{event_type}'. Evaluate if ready to advance phase."
                            await gemini.send_text(
                                f"[SYSTEM] {signal_text} Output [ADVANCE: <STATE>] if appropriate."
                            )
                            continue

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

                        _CONVERSATION_STATES = {
                            AgentState.GREETING,
                            AgentState.THINK_TIME, AgentState.APPROACH_LISTEN,
                            AgentState.CODING, AgentState.HINT_DELIVERY,
                            AgentState.TESTING, AgentState.OPTIMIZATION,
                        }
                        _URGENT_EVENTS = {"tab_switch", "screen_share_ended"}

                        if new_state != old_state:
                            sys_instr = f"[SYSTEM] {agent.get_system_instruction()}"
                            is_cheat_term = (
                                new_state == AgentState.COMPLETED
                                and agent.metadata.get("terminated_for_cheating")
                            )
                            if is_cheat_term:
                                await gemini.send_text_urgent(sys_instr)
                            elif event_type in _URGENT_EVENTS:
                                merged = f"{sys_instr}\n\n{scripted}" if scripted else sys_instr
                                await gemini.send_text_urgent(merged)
                            elif old_state in _CONVERSATION_STATES:
                                merged = f"{sys_instr}\n\n{scripted}" if scripted else sys_instr
                                await gemini.send_text_urgent(merged)
                            else:
                                merged = f"{sys_instr}\n\n{scripted}" if scripted else sys_instr
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
                            await gemini.send_context(
                                f"[SYSTEM: CANDIDATE CODE UPDATE]\n```\n{snippet}\n```"
                            )

                    elif msg_type == "frame":
                        msg_data = data["payload"]
                        source = data.get("source", "screen")
                        latency = time.time() - last_frame_time
                        
                        if agent.current_state not in (AgentState.IDLE, AgentState.COMPLETED):
                            if source == "webcam":
                                if webcam_task is None or webcam_task.done():
                                    webcam_task = asyncio.create_task(analyze_frame_bg(msg_data, source="webcam"))
                            elif agent.current_state in SCREEN_REQUIRED_STATES:
                                if screen_task is None or screen_task.done():
                                    screen_task = asyncio.create_task(analyze_frame_bg(msg_data, source="screen"))
                        last_frame_time = time.time()

            except WebSocketDisconnect:
                print(f"Client disconnected: {session_id}")
            except asyncio.CancelledError:
                pass
            except Exception as e:
                print(f"Forwarder error: {e}")
            finally:
                if screen_task: screen_task.cancel()
                if webcam_task: webcam_task.cancel()
                print(f"Forwarder tasks cleaned up for {session_id}")

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
        if db and agent:
            try:
                if agent.current_state == AgentState.COMPLETED:
                    update_data = {
                        "status": "COMPLETED",
                        "endedAt": datetime.utcnow().isoformat(),
                        "endReason": "completed",
                        "currentQuestionIndex": agent.current_question_index,
                    }
                    if agent.metadata.get("terminated_for_cheating") or agent.metadata.get("terminated_screen_loss"):
                        persist_meta = {**agent.metadata, "hint_index": agent.hint_index}
                        update_data["metadata"] = persist_meta
                    db.collection("sessions").document(session_id).update(update_data)
                    print(f"Session {session_id}: ended (COMPLETED, cheating={agent.metadata.get('terminated_for_cheating', False)})")
                else:
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
                        "currentQuestionIndex": agent.current_question_index,
                    })
                    print(f"Session {session_id}: saved for resumption (state={agent.current_state.value}, 60s window started)")
            except Exception as e:
                print(f"Session persist error: {e}")
        if session_id in _ACTIVE_SESSIONS and _ACTIVE_SESSIONS[session_id][0] == websocket:
            del _ACTIVE_SESSIONS[session_id]

        if gemini:
            await gemini.close()
        try:
            if websocket.client_state.name != "DISCONNECTED":
                await websocket.close()
        except Exception:
            pass


def _build_system_instruction(session_info: dict, questions: list) -> str:
    difficulty = session_info.get("difficulty", "Medium")
    candidate = session_info.get("candidateEmail", "Anonymous")
    n = len(questions) if questions else 1

    difficulty_rules = ""
    if difficulty == "Hard":
        difficulty_rules = """
HARD MODE RULES (strictly enforced):
- Require the candidate to discuss brute force BEFORE jumping to the optimal solution.
- Do NOT advance from APPROACH_LISTEN unless an optimal complexity solution is discussed.
- Ask aggressive follow-up questions: "What if the input is empty? What about duplicates? Risk of integer overflow?"
- Require at least two distinct approaches to be discussed.
- Push for rigorous Big O analysis of time AND space.
"""
    elif difficulty == "Easy":
        difficulty_rules = """
EASY MODE RULES:
- Be more encouraging. Guide more freely if the candidate is stuck.
- Still require the candidate to explain their approach before coding.
- Ask about edge cases but don't be overly aggressive.
"""

    return f"""You are SYNTH — a senior software engineer with 10+ years at top tech companies (Google, Meta, Amazon). You are conducting a live DSA coding interview. You are sharp, professional, encouraging, and deeply technical. You speak naturally — not like a robot.

CANDIDATE: {candidate}
DIFFICULTY: {difficulty}
TOTAL QUESTIONS THIS SESSION: {n}

BEHAVIORAL RULES (follow strictly):
- Thought Process First: When the candidate jumps straight to code, ask "Can you walk me through the trade-offs of this approach before you start coding?"
- Pattern Recognition: If the candidate correctly identifies the algorithmic pattern (e.g., "this is a sliding window"), acknowledge it positively. If they miss it, guide them toward it with Socratic questions — never just tell them.
- Adaptive Hinting: Wait for the candidate to be stuck (2+ minutes of silence or explicit request for help) before offering a hint. Never give the answer outright. Give conceptual nudges: "Think about how a HashMap reduces lookup from O(n) to O(1)."
- Pseudo-code Welcome: Encourage candidates to write comments or pseudo-code first. If they do, acknowledge it: "Good — writing it out first is a great habit."
- Do NOT penalize minor syntax errors under time pressure — judge logic and complexity, not semicolons.
- Validate creative solutions: If a candidate uses an unusual but valid algorithm, say so — don't silently mark it wrong.
- Never interrupt active typing. Wait for a pause or an explicit signal before asking questions.
- Silence check-in: If the candidate has been quiet for ~2 minutes, check in naturally: "Are you working through the edge cases, or would a small nudge help?"
- After code is written, always ask: "What's the time and space complexity of this solution? Can we do better?"
- After optimization discussion, ask: "Did you recognize the pattern this problem falls under?"
- After each question (except the last), transition smoothly without saying goodbye — just move on to the next problem.
- Proactive Multimodality: Use the vision feed to provide proactive feedback. If the candidate stops typing and looks at a specific line of code for a few seconds, ask: "I see you're looking at that section—would you like to discuss the trade-offs there?" or "I see you're heading toward an O(n²) approach—do you think we could find a linear time solution?"
- NEVER hallucinate or make up facts about the problem. If you are unsure, ask the candidate.
- NEVER answer for the candidate or reveal solutions. Your role is to probe, not teach.
- NEVER ignore a direct question from the candidate — engage briefly, then redirect professionally.
- If asked something off-topic, answer briefly and redirect: "Interesting — let's keep our focus on the problem though."
{difficulty_rules}
ENVIRONMENT (critical — never contradict these):
- The candidate uses a browser-based platform — everything is in one browser tab.
- A Monaco code editor (same as VS Code) is embedded on the LEFT side — ALWAYS visible. Never tell them to "open" any editor.
- When a problem is assigned, it appears automatically in the editor. You do not need to describe it verbally.
- Vision Awareness: You have a real-time vision feed of the candidate's screen and webcam. Use this to provide proactive, multimodal feedback and to detect if the candidate looks confused or stuck.
- The candidate's code is visible to you in real time via [SYSTEM: CANDIDATE CODE UPDATE] messages.

RESPONSE RULES:
- Speak naturally. Keep responses concise (under 60 words) unless explaining something deeply technical.
- NEVER repeat, recite, or mention anything prefixed with [SYSTEM].
- Output [ADVANCE: TARGET_STATE] to transition phases — NEVER say trigger phrases like "CANDIDATE READY".
- Output [WARN: reason] to issue integrity warnings.
- NEVER speak [ADVANCE:...] or [WARN:...] tags aloud — they are silent signals only."""


# State transitions
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
    "APPROACH_LISTEN": "candidate_ready",
    "CODING": "approach_accepted",
    "TESTING": "coding_finished",
    "HINT_DELIVERY": "hint_requested",
    "OPTIMIZATION": "tests_passed",
    "COMPLETED": "optimization_finished",
}

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
    """Dispatches tool calls."""
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

        if agent.current_state == AgentState.COMPLETED and not agent.metadata.get("terminated_for_cheating"):
            asyncio.create_task(
                _generate_and_email_scorecard(agent, websocket)
            )

        sys_instr = f"[SYSTEM] {agent.get_system_instruction()}"
        if scripted:
            return f"{sys_instr}\n\n{scripted}"
        return sys_instr

    elif name == "save_final_report":
        print(f"Tool Call: save_final_report for {agent.session_id}")
        success = await agent.save_final_report()
        return "Report saved successfully." if success else "Failed to save report."

    return f"Unknown tool: {name}"


async def _generate_and_email_scorecard(agent: "InterviewAgent", websocket: WebSocket) -> None:
    try:
        if not db:
            return
        session_id = agent.session_id
        doc = db.collection("sessions").document(session_id).get()
        if not doc.exists:
            return
        data = doc.to_dict()

        question_ids = data.get("questionIds") or [data.get("questionId", "two-sum")]
        last_idx = max(0, agent.current_question_index - 1) if agent.current_question_index > 0 else len(question_ids) - 1
        question = get_question(question_ids[min(last_idx, len(question_ids) - 1)])

        meta = agent.metadata
        test_results = data.get("lastTestResults")
        language = data.get("lastTestLanguage", "python")
        cheat_events = data.get("cheatEvents", meta.get("cheat_events", []))

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
            cheat_events=cheat_events,
        )

        try:
            db.collection("sessions").document(session_id).update({"scorecard": scorecard})
        except Exception:
            pass

        try:
            await websocket.send_json({"type": "scorecard", "payload": scorecard})
        except Exception:
            pass

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
