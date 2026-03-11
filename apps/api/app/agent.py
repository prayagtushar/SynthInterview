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
        self._pending_timer_msg: Optional[str] = None
        self._candidate_code: str = ""  # Latest editor snapshot from frontend

    def hydrate_from_firestore(self) -> bool:
        """Restores agent state from Firestore for reconnection support.
        Returns True if state was successfully restored, False otherwise."""
        if not self.db:
            return False
        try:
            doc = self.db.collection("sessions").document(self.session_id).get()
            if not doc.exists:
                return False
            data = doc.to_dict()
            stored_status = data.get("status", "IDLE")
            # Only hydrate if the session was in an active state
            if stored_status in ("IDLE", "COMPLETED"):
                return False
            try:
                self.current_state = AgentState(stored_status)
            except ValueError:
                return False
            stored_meta = data.get("metadata", {})
            self.metadata.update(stored_meta)
            self.hint_index = stored_meta.get("hint_index", 0)
            prev = stored_meta.get("previous_state")
            if prev:
                try:
                    self.previous_state = AgentState(prev)
                except ValueError:
                    pass
            print(f"Agent hydrated for {self.session_id}: state={self.current_state.value}, hints={self.hint_index}")
            return True
        except Exception as e:
            print(f"Agent hydration error: {e}")
            return False

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

        # Attach question data to metadata when entering PROBLEM_DELIVERY
        # so the frontend can inject it into the code editor as comments
        if new_state == AgentState.PROBLEM_DELIVERY and self.question:
            self.metadata["question"] = {
                "title": self.question.get("title", "Coding Problem"),
                "description": self.question.get("description", ""),
                "testCases": self.question.get("testCases", []),
                "optimalTimeComplexity": self.question.get("optimalTimeComplexity", ""),
                "optimalSpaceComplexity": self.question.get("optimalSpaceComplexity", ""),
            }

        # Update Firestore session state (persist hint_index + previous_state for reconnection)
        if self.db:
            try:
                persist_meta = {**self.metadata, "hint_index": self.hint_index}
                if self.previous_state:
                    persist_meta["previous_state"] = self.previous_state.value
                self.db.collection("sessions").document(self.session_id).update({
                    "status": self.current_state.value,
                    "lastUpdated": self.last_transition_time.isoformat(),
                    "metadata": persist_meta
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
                    f"[SYSTEM] Environment check is complete. Announce: 'Environment verified! '"
                    f"Then say: 'I have loaded the problem \'{title}\' into your editor. "
                    f"Take a moment to read through it. Let me know when you understand and are ready to discuss your approach.'"
                    f" Do NOT read the problem statement aloud — it is already displayed in the editor."
                )
            return (
                f"[SYSTEM] The problem '{title}' has been loaded into the candidate's code editor as comments. "
                f"Tell them to review it in their editor. Do NOT read it aloud. Ask them to confirm when they understand."
            )

        elif state == AgentState.THINK_TIME:
            self.timer_task = asyncio.create_task(
                self._start_think_nudge(60)
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

    async def _start_think_nudge(self, seconds: int) -> None:
        """After `seconds`, sends a soft nudge instead of force-transitioning.
        The AI will gently ask if the candidate is ready to share their approach."""
        await asyncio.sleep(seconds)
        nudge = (
            "[SYSTEM] The think-time timer (60s) has elapsed, but the candidate may still be thinking. "
            "Gently say: 'Take your time, but whenever you're ready, walk me through your approach.' "
            "Do NOT force them. If they start explaining, output [ADVANCE: APPROACH_LISTEN]."
        )
        self._pending_timer_msg = nudge

    async def _start_timer(self, seconds: int, target_state: AgentState) -> None:
        """Handles delayed automatic state transitions (used for non-think timers)."""
        await asyncio.sleep(seconds)
        msg = await self.handle_event("timer_expired", None)
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
            "- To advance the interview phase, reply with the exact text command: [ADVANCE: TARGET_STATE]\n"
            "- To issue a violation warning to the candidate, reply with the exact text command: [WARN: reason]\n"
            "- Do NOT speak the [ADVANCE: ...] or [WARN: ...] tags out loud in audio. Only output them in text.\n"
        )

        state_instructions = {
            AgentState.IDLE: "You are waiting. Do not speak until the candidate connects.",
            AgentState.GREETING: (
                "You are SYNTH, a professional interviewer. Greet the candidate warmly. "
                "Ask them to share their ENTIRE screen (not just a tab) and have a code editor open. "
                "Wait for them to share their screen — the system will automatically advance you to the next phase. "
                "Do NOT attempt to verify the environment yourself. Do NOT mention the coding problem yet."
            ),
            AgentState.ENV_CHECK: (
                "Stay completely silent for now. The system is verifying the candidate's environment automatically. "
                "Only speak if a [SYSTEM] message tells you about a specific environment issue to address. "
                "Do NOT say 'environment verified' or any similar phrase. The system handles transitions automatically."
            ),
            AgentState.PROBLEM_DELIVERY: (
                f"The problem '{title}' is already displayed in the candidate's code editor as a comment. "
                "Tell them: 'Your problem has been loaded into the editor - please take a moment to read through it.' "
                "Wait for them to confirm they understand (e.g., they say 'I understand', 'I'm ready', 'got it'). "
                "Once they confirm, output the tag [ADVANCE: THINK_TIME] in your TEXT RESPONSE ONLY — do NOT speak it."
            ),
            AgentState.THINK_TIME: (
                "The candidate is thinking about their approach. Stay SILENT — do not prompt or rush them. "
                "After 60 seconds the system will send a gentle nudge. "
                "When the candidate begins explaining their approach or says something like 'I am ready' or 'I think I have an idea', "
                "output the tag [ADVANCE: APPROACH_LISTEN] in your TEXT RESPONSE ONLY — do NOT speak the tag."
            ),
            AgentState.APPROACH_LISTEN: (
                "The candidate is explaining their approach. Engage and ask clarifying questions about: "
                "data structures chosen, time/space complexity, and edge cases. "
                "When you are satisfied with their approach, output [ADVANCE: CODING] in TEXT ONLY — do NOT speak it."
            ),
            AgentState.CODING: (
                f"Observe the candidate coding {title}. Stay mostly silent unless they ask for help. "
                "If they ask for a hint, tell them you'll provide one shortly. "
                "The cheat detection system handles cheating — do NOT try to detect it yourself. "
                "When the candidate says they are done coding or says 'done' / 'finished', "
                "output [ADVANCE: TESTING] in TEXT ONLY — do NOT speak the tag."
            ),
            AgentState.HINT_DELIVERY: (
                f"Deliver the hint clearly and concisely ({hints_remaining} hints left). "
                "After giving the hint, tell them to resume coding and "
                "output [ADVANCE: CODING] in TEXT ONLY — do NOT speak the tag."
            ),
            AgentState.TESTING: (
                "Help the candidate test their solution against the test cases. "
                "Walk through edge cases together. When the solution passes or they've tested thoroughly, "
                "output [ADVANCE: OPTIMIZATION] in TEXT ONLY — do NOT speak the tag."
            ),
            AgentState.OPTIMIZATION: (
                "Discuss time and space complexity improvements. Ask if they can reduce complexity further. "
                "When the discussion is complete, output [ADVANCE: COMPLETED] in TEXT ONLY — do NOT speak the tag."
            ),
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
                # Stay in PROBLEM_DELIVERY — do NOT revert to ENV_CHECK (that mutes the agent).
                # Instead, the agent interrupts its own problem explanation with a stern warning,
                # then resumes reading the problem.
                msg = (
                    "[SYSTEM] URGENT: The candidate just switched tabs while you were explaining the problem! "
                    "STOP reading the problem immediately. In a firm, stern tone say: "
                    "'Stop. Do not switch tabs while I am talking. This is your warning. "
                    "Come back to this screen right now.' "
                    "Then PAUSE for 3 seconds of silence. After the pause, calmly say: "
                    "'Okay, let me continue with the problem.' and resume reading the problem from where you left off."
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
