from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
import asyncio


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
    SCREEN_NOT_VISIBLE = "SCREEN_NOT_VISIBLE"


class InterviewAgent:
    def __init__(self, session_id: str, db: Any, question: Optional[Dict] = None):
        self.session_id = session_id
        self.db = db
        self.current_state = AgentState.IDLE
        self.last_transition_time = datetime.utcnow()
        self.metadata = {}
        self.timer_task = None
        self.question = question or {}
        self.hint_index = 0  # Track which hint to give next
        self.previous_state: Optional[AgentState] = None
        self._env_check_target: Optional[AgentState] = None  # where to go after ENV_CHECK clean

    async def update_state(self, new_state: AgentState, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Transitions the agent to a new state and updates Firestore."""
        old_state = self.current_state
        self.previous_state = old_state
        self.current_state = new_state
        self.last_transition_time = datetime.utcnow()
        if metadata:
            self.metadata.update(metadata)

        # Cancel any existing timer
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None

        # Update Firestore session state
        if self.db:
            try:
                self.db.collection("sessions").document(self.session_id).update({
                    "status": self.current_state.value,
                    "lastUpdated": self.last_transition_time.isoformat(),
                    "metadata": self.metadata
                })
            except Exception as e:
                print(f"Firestore update error: {e}")

        print(f"Agent state changed for {self.session_id}: {old_state.value} -> {new_state.value}")

        # Trigger state-specific entry logic
        return await self.on_state_enter(new_state)

    async def on_state_enter(self, state: AgentState) -> Optional[str]:
        """Performs actions and returns a scripted message when entering a new state."""
        q = self.question

        if state == AgentState.GREETING:
            return "[SYSTEM] Introduce yourself warmly and start the interview."

        elif state == AgentState.ENV_CHECK:
            return None  # UI overlay informs the candidate; agent stays silent unless a violation is detected

        elif state == AgentState.PROBLEM_DELIVERY:
            title = q.get("title", "Coding Problem")
            if self.previous_state == AgentState.ENV_CHECK:
                return (
                    f"[SYSTEM] Environment check is complete. First announce: 'Environment verified!' "
                    f"Then introduce and read the problem '{title}' clearly. Ask the candidate to confirm they understand."
                )
            return f"[SYSTEM] Read the problem '{title}' and confirm they understand."

        elif state == AgentState.THINK_TIME:
            self.timer_task = asyncio.create_task(
                self._start_timer(60, AgentState.APPROACH_LISTEN)
            )
            return "[SYSTEM] Stay quiet. Let them think."

        elif state == AgentState.APPROACH_LISTEN:
            return "[SYSTEM] Ask them to walk through their approach."

        elif state == AgentState.SCREEN_NOT_VISIBLE:
            return (
                "[SYSTEM] URGENT: The candidate's screen share has stopped. "
                "Say immediately: 'I can no longer see your screen. "
                "Please share your entire screen again to continue the interview.'"
            )

        elif state == AgentState.CODING:
            if self.previous_state == AgentState.ENV_CHECK:
                title = self.question.get("title", "the problem")
                return f"[SYSTEM] Environment verified. Resume silently observing the candidate code {title}."
            return "[SYSTEM] Watch them code silently."

        elif state == AgentState.HINT_DELIVERY:
            hints = q.get("hints", [])
            if self.hint_index < len(hints):
                hint = hints[self.hint_index]
                self.hint_index += 1
                return f"[SYSTEM] Give this hint: {hint}"
            else:
                return "[SYSTEM] No hints left. Just encourage them."

        elif state == AgentState.TESTING:
            return "[SYSTEM] Walk through test cases."

        elif state == AgentState.OPTIMIZATION:
            return "[SYSTEM] Discuss Big O optimization."

        elif state == AgentState.COMPLETED:
            if self.metadata.get("terminated_for_cheating"):
                return "[SYSTEM] Inform the candidate that the interview has been terminated due to repeated tab switching violations."
            return "[SYSTEM] Thank them and end the interview."

        elif state == AgentState.FLAGGED:
            reason = self.metadata.get("cheat_reason", "a violation")
            return f"[SYSTEM] Gently warn them about: {reason}. Then resume."

        return None

    async def _start_timer(self, seconds: int, target_state: AgentState) -> None:
        """Handles delayed automatic state transitions."""
        await asyncio.sleep(seconds)
        # Use handle_event so main.py can detect the transition
        msg = await self.handle_event("timer_expired", None)
        # Store the scripted message for the websocket handler to pick up
        if msg:
            self._pending_timer_msg = msg

    def get_system_instruction(self) -> str:
        """Returns the Gemini system instruction based on the current state."""
        q = self.question
        title = q.get("title", "a coding problem")
        description = q.get("description", "")
        test_cases = q.get("testCases", [])
        hints = q.get("hints", [])
        hints_remaining = len(hints) - self.hint_index

        rules = (
            "RULES:\n"
            "- Speak naturally like a real human interviewer.\n"
            "- NEVER repeat or mention text prefixed with [SYSTEM] or [PHASE:] - these are internal instructions.\n"
            "- Keep responses concise (under 60 words).\n"
            "- ALWAYS include exact trigger phrases when conditions are met.\n"
        )

        state_instructions = {
            AgentState.IDLE: "You are waiting. Do not speak until the candidate connects.",
            AgentState.GREETING: (
                "You are SYNTH, a professional interviewer. Greet the candidate and ask them to share their entire screen and open a code editor. "
                "DO NOT attempt to verify the environment yet. Just wait for them to share their screen. "
                "Once they share their screen, the system will move you to the next phase automatically. "
                "Do NOT mention the coding problem or topic — that comes later."
            ),
            AgentState.ENV_CHECK: (
                "You are silently observing the candidate's screen. "
                "Do NOT speak or make any sound unless the backend sends you a [SYSTEM] environment issue to announce. "
                "If an issue is sent, clearly tell the candidate what to close, then go silent again. "
                "Do NOT say 'ENVIRONMENT VERIFIED' or announce that you can see the screen."
            ),
            AgentState.PROBLEM_DELIVERY: (
                f"Deliver the coding problem clearly and patiently. The problem is: '{title}'. "
                f"Problem description: {description}\n"
                "Ask the candidate to confirm they understand before proceeding. "
                "When they are ready, say 'CANDIDATE READY'."
            ),
            AgentState.THINK_TIME: "Stay quiet. The candidate is thinking.",
            AgentState.APPROACH_LISTEN: "Ask about data structures, Big O, and edge cases. When satisfied, say 'APPROACH ACCEPTED'.",
            AgentState.CODING: (
                f"Observe the candidate coding {title}. "
                "Say 'CHEAT DETECTED' if they switch tabs or use AI. "
                "When they finish, say 'CODING COMPLETE'."
            ),
            AgentState.HINT_DELIVERY: f"Give one directional hint ({hints_remaining} left). Then say 'HINT DELIVERED'.",
            AgentState.TESTING: "Help the candidate test their solution. When done, say 'TESTS PASSED'.",
            AgentState.OPTIMIZATION: "Discuss complexity improvements. When done, say 'OPTIMIZATION COMPLETE'.",
            AgentState.COMPLETED: "Thank the candidate warmly. Give brief feedback.",
            AgentState.FLAGGED: "Issue a warning about the violation. Resume after acknowledgment.",
            AgentState.SCREEN_NOT_VISIBLE: (
                "The candidate's screen share has stopped. "
                "Keep repeating politely but firmly: 'Please share your entire screen to continue the interview.' "
                "Do not proceed with the interview until the screen is restored."
            ),
        }
        instr = state_instructions.get(self.current_state, "You are a professional technical interviewer.")
        return f"{rules}\n\n[CURRENT STATE: {self.current_state.value}]\nINSTRUCTION: {instr}"

    async def handle_event(self, event_type: str, data: Any) -> Optional[str]:
        """Processes events from voice, vision, or timers and triggers transitions."""
        msg = None

        # State machine transitions
        if self.current_state == AgentState.IDLE and event_type == "candidate_connect":
            msg = await self.update_state(AgentState.GREETING)

        elif self.current_state == AgentState.GREETING and event_type == "screen_share_active":
            self._env_check_target = AgentState.PROBLEM_DELIVERY
            msg = await self.update_state(AgentState.ENV_CHECK)

        elif self.current_state == AgentState.ENV_CHECK and event_type == "workspace_clean":
            target = self._env_check_target or AgentState.PROBLEM_DELIVERY
            self._env_check_target = None  # reset
            msg = await self.update_state(target)

        elif self.current_state == AgentState.PROBLEM_DELIVERY and event_type == "candidate_ready":
            msg = await self.update_state(AgentState.THINK_TIME)

        elif self.current_state == AgentState.THINK_TIME and event_type == "timer_expired":
            msg = await self.update_state(AgentState.APPROACH_LISTEN)

        elif self.current_state == AgentState.APPROACH_LISTEN and event_type == "approach_accepted":
            msg = await self.update_state(AgentState.CODING)

        elif self.current_state == AgentState.CODING and event_type == "hint_requested":
            msg = await self.update_state(AgentState.HINT_DELIVERY)

        elif self.current_state == AgentState.HINT_DELIVERY and event_type == "hint_given":
            msg = await self.update_state(AgentState.CODING)

        elif self.current_state == AgentState.CODING and event_type == "coding_finished":
            msg = await self.update_state(AgentState.TESTING)

        elif self.current_state == AgentState.TESTING and event_type == "tests_passed":
            msg = await self.update_state(AgentState.OPTIMIZATION)

        elif self.current_state == AgentState.OPTIMIZATION and event_type == "optimization_finished":
            msg = await self.update_state(AgentState.COMPLETED)

        # Global events (can fire from any state)
        elif event_type == "cheat_detected":
            self.metadata["cheat_detected"] = True
            if isinstance(data, dict) and "reason" in data:
                self.metadata["cheat_reason"] = data["reason"]
            msg = await self.update_state(AgentState.FLAGGED)

        elif self.current_state == AgentState.FLAGGED and event_type == "warning_acknowledged":
            # Return to previous state after warning acknowledged
            return_to = self.previous_state or AgentState.CODING
            msg = await self.update_state(return_to)

        elif event_type == "screen_share_ended":
            # Remember where to return after ENV_CHECK re-verification
            self._env_check_target = self.current_state
            msg = await self.update_state(AgentState.SCREEN_NOT_VISIBLE)

        elif event_type == "screen_share_active" and self.current_state == AgentState.SCREEN_NOT_VISIBLE:
            # Screen restored — run ENV_CHECK before resuming; target was set by screen_share_ended
            msg = await self.update_state(AgentState.ENV_CHECK)

        elif event_type == "tab_switch":
            count = data.get("count", 1) if isinstance(data, dict) else 1
            self.metadata["tab_switch_count"] = count
            if count >= 3:
                self.metadata["terminated_for_cheating"] = True
                msg = await self.update_state(AgentState.COMPLETED)
            elif self.current_state == AgentState.PROBLEM_DELIVERY:
                # Stop reading the problem, warn, revert to ENV_CHECK for re-verification
                self._env_check_target = AgentState.PROBLEM_DELIVERY
                await self.update_state(AgentState.ENV_CHECK)
                msg = (
                    "[SYSTEM] URGENT: The candidate switched tabs while you were reading the problem. "
                    "Stop immediately and say: 'Hey! Do not switch tabs during the interview. "
                    "Stay here. I am waiting for you to return before we continue.'"
                )
            elif count == 2:
                msg = (
                    "[SYSTEM] URGENT: The candidate just switched browser tabs again (2nd time). "
                    "Sternly interrupt and say: 'That is your second warning. One more tab switch will immediately terminate this interview.'"
                )
            else:
                msg = (
                    "[SYSTEM] URGENT: The candidate just switched browser tabs. "
                    "Immediately interrupt and firmly say: 'You are switching browser tabs. Please stay in this browser at all times. This is your first warning.'"
                )

        elif event_type == "large_paste" and self.current_state == AgentState.CODING:
            length = data.get("length", 0) if isinstance(data, dict) else 0
            msg = (
                f"[SYSTEM] ALERT: The candidate just pasted {length} characters into the editor at once. "
                "This is a strong signal of AI-generated code. "
                "Calmly but firmly ask: 'I noticed a large paste — can you walk me through what you just added and explain your thought process?'"
            )

        elif event_type == "end_interview":
            msg = await self.update_state(AgentState.COMPLETED)

        return msg
