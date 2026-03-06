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
            await websocket.send_json({"type": "error", "payload": "Session not found"})
            await websocket.close()
            return

        session_info = doc.to_dict()
        agent.metadata["difficulty"] = session_info["difficulty"]
        agent.metadata["questionId"] = session_info["questionId"]

        # Initial state transition
        welcome_msg = await agent.update_state(AgentState.GREETING)
        
        config = {
            "response_modalities": ["TEXT", "AUDIO"],
            "system_instruction": agent.get_system_instruction()
        }

        async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
            
            # Send initial greeting if any
            if welcome_msg:
                await session.send(input=welcome_msg, end_of_turn=True)

            async def receive_from_gemini():
                async for message in session:
                    if message.text:
                        await websocket.send_json({"type": "text", "payload": message.text})
                    
                    if message.server_content and message.server_content.model_turn:
                        for part in message.server_content.model_turn.parts:
                            if part.text:
                                await websocket.send_json({"type": "text", "payload": part.text})
                            if part.inline_data:
                                audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                await websocket.send_json({"type": "audio", "payload": audio_b64})

            async def send_to_gemini():
                try:
                    while True:
                        data = await websocket.receive_json()
                        
                        # Handle State Transitions via WebSocket events
                        if data["type"] == "event":
                            event_type = data.get("payload")
                            await agent.handle_event(event_type, data.get("data"))
                            # Optional: Update Gemini with new instructions if needed
                            # Note: Changing system_instruction mid-session requires a new turn with clear directive
                            new_instruction = agent.get_system_instruction()
                            await session.send(input=f"[SYSTEM DIRECTIVE: {new_instruction}]", end_of_turn=False)
                            
                        elif data["type"] == "audio":
                            audio_bytes = base64.b64decode(data["payload"])
                            await session.send(input=audio_bytes, end_of_turn=False)
                        elif data["type"] == "frame":
                            frame_bytes = base64.b64decode(data["payload"])
                            await session.send(input={"mime_type": "image/jpeg", "data": frame_bytes}, end_of_turn=False)
                        elif data["type"] == "text":
                            await session.send(input=data["payload"], end_of_turn=True)
                except WebSocketDisconnect:
                    pass
                except Exception as e:
                    print(f"Error in send_to_gemini: {e}")

            await asyncio.gather(receive_from_gemini(), send_to_gemini())

    except Exception as e:
        print(f"Error in Live Session: {e}")
        try:
            await websocket.send_json({"type": "error", "payload": str(e)})
        except:
            pass
        if not websocket.client_state.name == "DISCONNECTED":
            await websocket.close()
