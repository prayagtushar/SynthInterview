import base64
import os
import asyncio
import json
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from app.agent import InterviewAgent, AgentState

load_dotenv()

app = FastAPI(title="SynthInterview API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Initialization
firebase_cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if firebase_cred_json:
    cred_dict = json.loads(firebase_cred_json)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
else:
    # Fallback to default credentials
    try:
        firebase_admin.initialize_app()
    except Exception:
        # If already initialized or fails
        pass

db = firestore.client()

# Gemini Live configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

client = genai.Client(api_key=GEMINI_API_KEY, http_options={'api_version': 'v1alpha'})

from app.agent import InterviewAgent, AgentState

# Models
class SessionConfig(BaseModel):
    candidateEmail: str
    difficulty: str  # Easy / Medium / Hard
    topics: List[str]
    questionId: Optional[str] = "two-sum"
    timeLimit: int = 45

class SessionResponse(BaseModel):
    sessionId: str
    candidateEmail: str
    difficulty: str
    topics: List[str]
    questionId: str
    startTime: Optional[str] = None
    status: Optional[str] = "IDLE"

@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "SynthInterview API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/sessions", response_model=SessionResponse)
async def create_session(config: SessionConfig):
    session_id = str(uuid.uuid4())
    session_data = {
        "sessionId": session_id,
        "candidateEmail": config.candidateEmail,
        "difficulty": config.difficulty,
        "topics": config.topics,
        "questionId": config.questionId,
        "timeLimit": config.timeLimit,
        "createdAt": datetime.utcnow().isoformat(),
        "status": "IDLE"
    }
    
    db.collection("sessions").document(session_id).set(session_data)
    return session_data

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc.to_dict()

@app.websocket("/ws/live/{session_id}")
async def live_socket(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    
    # Initialize Agent
    agent = InterviewAgent(session_id, db, client)
    
    try:
        # Load session data to get question/difficulty
        doc = db.collection("sessions").document(session_id).get()
        if not doc.exists:
            # Fallback to a default session info rather than silently failing
            session_info = {
                "difficulty": "Easy",
                "questionId": "two-sum",
                "topics": ["Arrays", "HashMaps"],
                "candidateEmail": "guest@synth.demo"
            }
            # Optional: save it to db so the rest of the flow logs properly
            db.collection("sessions").document(session_id).set(session_info)
        else:
            session_info = doc.to_dict()
        agent.metadata["difficulty"] = session_info.get("difficulty", "Medium")
        agent.metadata["questionId"] = session_info.get("questionId", "two-sum")
        agent.metadata["topics"] = session_info.get("topics", [])

        # Initial state transition
        welcome_msg = await agent.update_state(AgentState.GREETING)
        
        # Build comprehensive system instruction
        system_instr = f"""
        {agent.get_system_instruction()}
        
        CONTEXT:
        - Candidate: {session_info.get('candidateEmail', 'Anonymous')}
        - Difficulty: {agent.metadata['difficulty']}
        - Topics: {', '.join(agent.metadata['topics'])}
        - Question: {agent.metadata['questionId']}
        
        INSTRUCTIONS:
        1. You are SYNTH, a professional and encouraging technical interviewer.
        2. Speak clearly and concisely.
        3. Transition through phases only when criteria are met.
        4. If you see the environment is clean (only IDE visible), say "ENVIRONMENT VERIFIED" clearly.
        """

        config = {
            "response_modalities": ["AUDIO"],
            "system_instruction": system_instr
        }

        async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
            
            # Send initial state to frontend
            await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})

            # Send initial greeting if any
            if welcome_msg:
                await session.send(input=welcome_msg, end_of_turn=True)

            async def receive_from_gemini():
                try:
                    async for message in session.receive():
                        if message.server_content and message.server_content.model_turn:
                            for part in message.server_content.model_turn.parts:
                                if part.text:
                                    await websocket.send_json({"type": "text", "payload": part.text})
                                    
                                    # Automated state detection from Gemini's response
                                    if "environment verified" in part.text.lower() and agent.current_state == AgentState.ENV_CHECK:
                                        next_msg = await agent.handle_event("workspace_clean", None)
                                        await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})
                                        if next_msg:
                                            await session.send(input=next_msg, end_of_turn=True)
                                            
                                if part.inline_data:
                                    audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                    await websocket.send_json({"type": "audio", "payload": audio_b64})
                except Exception as e:
                    print(f"Receive loop terminating: {e}")

            async def send_to_gemini():
                try:
                    while True:
                        data = await websocket.receive_json()
                        
                        # Handle State Transitions via WebSocket events
                        if data["type"] == "event":
                            event_type = data.get("payload")
                            next_msg = await agent.handle_event(event_type, data.get("data"))
                            await websocket.send_json({"type": "state_update", "payload": agent.current_state.value})
                            if next_msg:
                                await session.send(input=next_msg, end_of_turn=False)
                            
                        elif data["type"] == "audio":
                            await session.send(input={"mime_type": "audio/pcm;rate=16000", "data": data["payload"]}, end_of_turn=False)
                        elif data["type"] == "frame":
                            await session.send(input={"mime_type": "image/jpeg", "data": data["payload"]}, end_of_turn=False)
                        elif data["type"] == "text":
                            await session.send(input=data["payload"], end_of_turn=True)
                except WebSocketDisconnect:
                    print("WebSocket connection closed by client.")
                except Exception as e:
                    print(f"Send loop terminating: {e}")

            # Run both tasks concurrently and cancel the other if one finishes/fails
            task_rx = asyncio.create_task(receive_from_gemini())
            task_tx = asyncio.create_task(send_to_gemini())
            
            done, pending = await asyncio.wait(
                [task_rx, task_tx],
                return_when=asyncio.FIRST_COMPLETED
            )
            for p in pending:
                p.cancel()

    except Exception as e:
        print(f"Error in Live Session: {e}")
        try:
            await websocket.send_json({"type": "error", "payload": str(e)})
        except:
            pass
        if not websocket.client_state.name == "DISCONNECTED":
            await websocket.close()
