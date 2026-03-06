from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
import json
from google.genai import Client
import firebase_admin
from firebase_admin import firestore

class AgentState(Enum):
    IDLE = "IDLE"
    GREETING = "GREETING"
    ENV_CHECK = "ENV_CHECK"
    PROBLEM_DELIVERY = "PROBLEM_DELIVERY"
    THINK_TIME = "THINK_TIME"
    APPROACH_LISTEN = "APPROACH_LISTEN"
    CODING = "CODING"
    HINT_DELIVERY = "HINT_DELIVERY"
    TESTING = "TESTING"
    OPTIMIZATION = "OPTIMIZATION"
    COMPLETED = "COMPLETED"
    FLAGGED = "FLAGGED"

import asyncio

class InterviewAgent:
    def __init__(self, session_id: str, db: Any, gemini_client: Client):
        self.session_id = session_id
        self.db = db
        self.gemini_client = gemini_client
        self.current_state = AgentState.IDLE
        self.last_transition_time = datetime.utcnow()
        self.metadata = {}
        self.timer_task = None

    async def update_state(self, new_state: AgentState, metadata: Optional[Dict[str, Any]] = None):
        """Transitions the agent to a new state and updates Firestore."""
        old_state = self.current_state
        self.current_state = new_state
        self.last_transition_time = datetime.utcnow()
        if metadata:
            self.metadata.update(metadata)

        # Cancel any existing timer
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None

        # Update Firestore session state
        self.db.collection("sessions").document(self.session_id).update({
            "status": self.current_state.value,
            "lastUpdated": self.last_transition_time.isoformat(),
            "metadata": self.metadata
        })
        
        print(f"Agent state changed for {self.session_id}: {old_state.value} -> {new_state.value}")
        
        # Trigger state-specific entry logic
        return await self.on_state_enter(new_state)

    async def on_state_enter(self, state: AgentState):
        """Performs actions when entering a new state."""
        response = None
        if state == AgentState.GREETING:
            response = "Welcome! I'm your AI interviewer. Before we begin, please share your full screen and open your code editor."
        elif state == AgentState.ENV_CHECK:
            response = "I'm checking your environment now. Please make sure you have no browser tabs or other applications open except your editor."
        elif state == AgentState.PROBLEM_DELIVERY:
            response = "Great, your environment looks good. Let's start with the problem. I'll read it now..."
        elif state == AgentState.THINK_TIME:
            response = "You have 1 minute to think about the approach. I'll be observing silently."
            # Start automated timer (e.g. 60 seconds for demo)
            self.timer_task = asyncio.create_task(self._start_timer(60, AgentState.APPROACH_LISTEN))
        elif state == AgentState.APPROACH_LISTEN:
            response = "Please walk me through your planned approach. I'd love to hear about the data structures and algorithms you're considering."
        elif state == AgentState.CODING:
            response = "You can start coding now. I'll be watching your progress and can offer hints if you get stuck."
        elif state == AgentState.HINT_DELIVERY:
            response = "I see you're looking for a hint. Here's something to think about..."
        elif state == AgentState.TESTING:
            response = "I see you're finished coding. Let's run some test cases and see how it performs."
        elif state == AgentState.OPTIMIZATION:
            response = "The basic version works. Can we optimize this for better time or space complexity?"
        elif state == AgentState.COMPLETED:
            response = "The interview is now complete. Thank you for your time! I've generated an evaluation report for the recruiter."
        elif state == AgentState.FLAGGED:
            response = "I've detected some unusual activity. Please focus on the editor and avoid external resources."
        
        return response

    async def _start_timer(self, seconds: int, target_state: AgentState):
        """Handles delayed state transitions."""
        await asyncio.sleep(seconds)
        await self.update_state(target_state)

    def get_system_instruction(self) -> str:
        """Returns the Gemini system instruction based on the current state."""
        instructions = {
            AgentState.IDLE: "Wait for the candidate to connect. Do not speak.",
            AgentState.GREETING: "Introduce yourself warmly. Ask the candidate to share their screen and open their editor.",
            AgentState.ENV_CHECK: "Analyze the screen share frames. Ensure only a code editor is visible. No browser tabs, no messaging apps, no notes. Flag any violations.",
            AgentState.PROBLEM_DELIVERY: "Deliver the coding problem statement clearly. Simplify it if the candidate asks questions.",
            AgentState.THINK_TIME: "Stay silent. Observe the candidate's screen for any activity. Start a 2-minute timer in your thoughts.",
            AgentState.APPROACH_LISTEN: "Listen to the candidate's voice explanation of their algorithm. Ask follow-up questions about time complexity (Big O) and chosen data structures.",
            AgentState.CODING: "Watch the screen in real-time. Do not interrupt unless you detect a 'cheat' (switching tabs, using AI assistants) or if the candidate stays stuck for too long.",
            AgentState.HINT_DELIVERY: "Provide a subtle, directional hint. Do not give the code or the full solution. Help them overcome the current specific block.",
            AgentState.TESTING: "Watch the terminal output. Identify which test cases are passing or failing. Help the candidate debug if they are confused by output.",
            AgentState.OPTIMIZATION: "Verify the candidate's claims about Big O complexity. Challenge them to reach a more optimal solution if one exists.",
            AgentState.COMPLETED: "Generate a detailed evaluation including Problem Understanding, Approach, Code Quality, and Communication. Use a structured rubric (1-5).",
            AgentState.FLAGGED: "A warning has been triggered for potential cheating. Wait for acknowledgment and log the event."
        }
        return instructions.get(self.current_state, "You are a professional technical interviewer.")

    async def handle_event(self, event_type: str, data: Any):
        """Processes events from voice, vision, or timers and triggers transitions."""
        if self.current_state == AgentState.IDLE and event_type == "candidate_connect":
            await self.update_state(AgentState.GREETING)
            
        elif self.current_state == AgentState.GREETING and event_type == "screen_share_active":
            await self.update_state(AgentState.ENV_CHECK)
            
        elif self.current_state == AgentState.ENV_CHECK and event_type == "workspace_clean":
            await self.update_state(AgentState.PROBLEM_DELIVERY)
            
        elif self.current_state == AgentState.PROBLEM_DELIVERY and event_type == "candidate_ready":
            await self.update_state(AgentState.THINK_TIME)
            
        elif self.current_state == AgentState.THINK_TIME and event_type == "timer_expired":
            await self.update_state(AgentState.APPROACH_LISTEN)
            
        elif self.current_state == AgentState.APPROACH_LISTEN and event_type == "approach_accepted":
            await self.update_state(AgentState.CODING)
            
        elif self.current_state == AgentState.CODING and event_type == "hint_requested":
            await self.update_state(AgentState.HINT_DELIVERY)
            
        elif self.current_state == AgentState.HINT_DELIVERY and event_type == "hint_given":
            await self.update_state(AgentState.CODING)
            
        elif self.current_state == AgentState.CODING and event_type == "coding_finished":
            await self.update_state(AgentState.TESTING)
            
        elif self.current_state == AgentState.TESTING and event_type == "test_passed":
            await self.update_state(AgentState.OPTIMIZATION)
            
        elif self.current_state == AgentState.OPTIMIZATION and event_type == "optimization_finished":
            await self.update_state(AgentState.COMPLETED)
            
        if event_type == "cheat_detected":
            await self.update_state(AgentState.FLAGGED)
        elif self.current_state == AgentState.FLAGGED and event_type == "warning_acknowledged":
            # Revert to previous state? For now just go back to coding
            await self.update_state(AgentState.CODING)
