from enum import Enum
from typing import Dict, Any, Optional, List
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
    TERMINATED = "TERMINATED"
    FLAGGED = "FLAGGED"
    SCREEN_NOT_VISIBLE = "SCREEN_NOT_VISIBLE"


class InterviewAgent:
    def __init__(self, session_id: str, db: Any, questions: Optional[List[Dict]] = None):
        self.session_id = session_id
        self.db = db
        self.current_state = AgentState.IDLE
        self.last_transition_time = datetime.utcnow()
        self.metadata = {}
        self.timer_task = None
        self.silence_timer_task: Optional[asyncio.Task] = None

        # Multi-question support
        self.questions: List[Dict] = questions or []
        self.current_question_index: int = 0

        self.hint_index = 0
        self.previous_state: Optional[AgentState] = None
        self._env_check_target: Optional[AgentState] = None
        self._pending_timer_msg: Optional[str] = None
        self._candidate_code: str = ""
        self._problem_delivered_once: bool = False
        self.last_activity_time: datetime = datetime.utcnow()

    @property
    def question(self) -> Dict:
        """Returns the current question. Backward-compatible with all self.question references."""
        if self.questions and self.current_question_index < len(self.questions):
            return self.questions[self.current_question_index]
        return {}

    def hydrate_from_firestore(self) -> bool:
        """Restores state from Firestore for resumption."""
        if not self.db:
            return False
        try:
            doc = self.db.collection("sessions").document(self.session_id).get()
            if not doc.exists:
                return False
            data = doc.to_dict()
            stored_status = data.get("status", "IDLE")
            if stored_status in ("IDLE", "COMPLETED", "TERMINATED"):
                return False
            try:
                self.current_state = AgentState(stored_status)
            except ValueError:
                return False
            stored_meta = data.get("metadata", {})
            self.metadata.update(stored_meta)
            self.hint_index = stored_meta.get("hint_index", 0)
            self.current_question_index = stored_meta.get("current_question_index", 0)
            self._candidate_code = stored_meta.get("candidate_code", "")
            self._problem_delivered_once = stored_status not in ("IDLE", "GREETING")
            prev = stored_meta.get("previous_state")
            if prev:
                try:
                    self.previous_state = AgentState(prev)
                except ValueError:
                    pass
            print(f"Agent hydrated for {self.session_id}: state={self.current_state.value}, q_idx={self.current_question_index}, hints={self.hint_index}")
            return True
        except Exception as e:
            print(f"Agent hydration error: {e}")
            return False

    async def update_state(self, new_state: AgentState, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Transitions the agent to a new state and updates Firestore."""
        old_state = self.current_state
        if old_state not in (AgentState.FLAGGED, AgentState.SCREEN_NOT_VISIBLE, AgentState.ENV_CHECK):
            self.previous_state = old_state
        
        self.current_state = new_state
        self.last_transition_time = datetime.utcnow()
        if metadata:
            self.metadata.update(metadata)

        # Cancel any existing timers
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None
        if self.silence_timer_task:
            self.silence_timer_task.cancel()
            self.silence_timer_task = None

        q = self.question
        if new_state == AgentState.PROBLEM_DELIVERY and q:
            self.metadata["question"] = {
                "id": q.get("id", ""),
                "title": q.get("title", "Coding Problem"),
                "description": q.get("description", ""),
                "testCases": q.get("testCases", []),
                "structuredTests": q.get("structured_tests", []),
                "pattern": q.get("pattern", ""),
                "optimalTimeComplexity": q.get("optimalTimeComplexity", ""),
                "optimalSpaceComplexity": q.get("optimalSpaceComplexity", ""),
                "starterCode": q.get("starterCode", {}),
            }

        # Start silence timer for active coding/discussion states
        if new_state in (AgentState.CODING, AgentState.APPROACH_LISTEN):
            self.last_activity_time = datetime.utcnow()
            self.silence_timer_task = asyncio.create_task(self._silence_timer(120))

        if self.db:
            persist_meta = {
                **self.metadata,
                "hint_index": self.hint_index,
                "current_question_index": self.current_question_index,
            }
            if self.previous_state:
                persist_meta["previous_state"] = self.previous_state.value
            snapshot = {
                "status": self.current_state.value,
                "lastUpdated": self.last_transition_time.isoformat(),
                "currentQuestionIndex": self.current_question_index,
                "metadata": persist_meta,
            }
            # Fire-and-forget: run in thread pool so the event loop is never blocked
            asyncio.create_task(self._persist_bg(snapshot))

        print(f"Agent state changed for {self.session_id}: {old_state.value} -> {new_state.value} (q {self.current_question_index + 1}/{len(self.questions)})")

        return await self.on_state_enter(new_state)

    async def _persist_bg(self, data: dict) -> None:
        """Write to Firestore in a thread-pool executor — never blocks the event loop."""
        try:
            loop = asyncio.get_event_loop()
            doc_ref = self.db.collection("sessions").document(self.session_id)
            await loop.run_in_executor(None, doc_ref.update, data)
        except Exception as e:
            print(f"Firestore persist error: {e}")

    async def record_cheat_event(self, event_type: str, detail: Any = None) -> None:
        """Silently logs a cheat event to Firestore without prompting the candidate."""
        event = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "detail": detail,
        }
        # Keep in-memory list for scorecard
        if "cheat_events" not in self.metadata:
            self.metadata["cheat_events"] = []
        self.metadata["cheat_events"].append(event)

        if self.db:
            from google.cloud.firestore_v1 import ArrayUnion
            asyncio.create_task(self._persist_bg({"cheatEvents": ArrayUnion([event])}))

        print(f"[CheatEvent] {event_type}: {detail} for session {self.session_id}")

    async def on_state_enter(self, state: AgentState) -> Optional[str]:
        """State-specific logic and scripted messages."""
        q = self.question
        n_questions = len(self.questions)
        q_num = self.current_question_index + 1

        if state == AgentState.GREETING:
            q_count_text = f"{n_questions} coding question{'s' if n_questions != 1 else ''}"
            return (
                f"[SYSTEM] Greet the candidate warmly. Tell them you are SYNTH, a senior engineer conducting their DSA interview today. "
                f"Mention they will complete {q_count_text} in this session. "
                "Ask them to share their ENTIRE screen (not a browser tab) so the interview can begin. "
                "Do NOT mention the code editor, opening any application, or the problem yet. "
                "Speak naturally, not like a script."
            )

        elif state == AgentState.ENV_CHECK:
            return None

        elif state == AgentState.PROBLEM_DELIVERY:
            if not self._problem_delivered_once:
                self._problem_delivered_once = True
                progress = f"Question {q_num} of {n_questions}" if n_questions > 1 else "Your question"
                return (
                    f"[SYSTEM] {progress} has just been loaded into the Monaco editor on the left of the candidate's screen. "
                    "Say something like: 'I've loaded your problem into the editor — take a moment to read it through. "
                    "Ask me anything if you need clarification on the constraints or examples.' "
                    "Then STOP and LISTEN. Encourage them to think aloud or write pseudo-code first. "
                    "When they confirm they understand and are ready, output [ADVANCE: APPROACH_LISTEN] in text. Do NOT speak it."
                )
            return (
                f"[SYSTEM] Question {q_num} of {n_questions} is still in the editor. "
                "Ask if they have any remaining questions. When they confirm they're ready, output [ADVANCE: APPROACH_LISTEN] in text."
            )

        elif state == AgentState.THINK_TIME:
            self.timer_task = asyncio.create_task(self._start_think_nudge(60))
            return "[SYSTEM] Stay quiet. Let them think."

        elif state == AgentState.APPROACH_LISTEN:
            return (
                "[SYSTEM] Ask them to walk through their approach before coding. "
                "Encourage them to mention the pattern they're using (e.g. 'Is this a Sliding Window approach?'). "
                "Ask about time and space complexity of their proposed approach. "
                "If they jump straight to code, ask: 'Can you walk me through the trade-offs of this approach first?'"
            )

        elif state == AgentState.SCREEN_NOT_VISIBLE:
            return (
                "[SYSTEM] URGENT: The candidate's screen share has stopped. "
                "Say immediately: 'I can no longer see your screen. "
                "Please share your entire screen again to continue the interview.'"
            )

        elif state == AgentState.CODING:
            if self.previous_state == AgentState.ENV_CHECK:
                title = q.get("title", "the problem")
                return f"[SYSTEM] Environment verified. Resume silently observing the candidate code {title}."
            return (
                "[SYSTEM] Watch them code silently. Do NOT interrupt while they are actively typing. "
                "Wait for a pause before asking any questions. "
                "If they declare they're done, verify by asking about their complexity before advancing."
            )

        elif state == AgentState.HINT_DELIVERY:
            hints = q.get("hints", [])
            if self.hint_index < len(hints):
                hint = hints[self.hint_index]
                self.hint_index += 1
                return f"[SYSTEM] Give this conceptual hint (do NOT give the answer): {hint}"
            else:
                return "[SYSTEM] No hints left. Encourage them to think through edge cases."

        elif state == AgentState.TESTING:
            return (
                "[SYSTEM] Walk through the test cases with the candidate. "
                "Ask them to trace through their code manually before running it. "
                "Discuss edge cases: empty input, single element, duplicates, negative numbers."
            )

        elif state == AgentState.OPTIMIZATION:
            return (
                "[SYSTEM] Ask: 'What is the time and space complexity of your current solution?' "
                "Then: 'Can we do better?' Discuss trade-offs. "
                f"The optimal complexity for this problem is {q.get('optimalTimeComplexity', 'unknown')} time, {q.get('optimalSpaceComplexity', 'unknown')} space. "
                "Ask: 'Did you recognize what pattern or technique this problem uses?' "
                "When the discussion is complete, output [ADVANCE: COMPLETED] in TEXT ONLY — do NOT speak the tag."
            )

        elif state in (AgentState.COMPLETED, AgentState.TERMINATED):
            if self.metadata.get("terminated_for_cheating"):
                return "[SYSTEM] Say exactly: 'You've exceeded the allowed number of cheating violations — terminating this session. Goodbye!' Then stop."
            if n_questions > 1:
                return (
                    f"[SYSTEM] The candidate has completed all {n_questions} questions. "
                    "Thank them warmly and professionally. Give brief verbal feedback on their performance — "
                    "what they did well and one area to focus on. End the interview naturally."
                )
            return "[SYSTEM] Thank them warmly and end the interview. Give brief verbal feedback."

        elif state == AgentState.FLAGGED:
            reason = self.metadata.get("cheat_reason", "a violation")
            return f"[SYSTEM] Gently but firmly warn them about: {reason}. Then resume the interview."

        return None

    async def _silence_timer(self, seconds: int) -> None:
        """Fires a silence check-in after `seconds` of inactivity."""
        try:
            await asyncio.sleep(seconds)
            elapsed = (datetime.utcnow() - self.last_activity_time).total_seconds()
            if elapsed >= seconds - 5:  # Still inactive
                self._pending_timer_msg = (
                    "[SYSTEM] The candidate has been quiet for 2 minutes with no typing activity. "
                    "Check in naturally and briefly: 'I noticed some quiet time — are you thinking through the approach, "
                    "or would a small nudge help?' Do not be intrusive."
                )
        except asyncio.CancelledError:
            pass

    async def _start_think_nudge(self, seconds: int) -> None:
        """Sends soft nudge after timeout."""
        await asyncio.sleep(seconds)
        nudge = (
            "[SYSTEM] The think-time timer (60s) has elapsed, but the candidate may still be thinking. "
            "Gently say: 'Take your time, but whenever you're ready, walk me through your approach.' "
            "Do NOT force them."
        )
        self._pending_timer_msg = nudge

    async def _start_timer(self, seconds: int, target_state: AgentState) -> None:
        """Handles delayed automatic state transitions."""
        await asyncio.sleep(seconds)
        msg = await self.handle_event("timer_expired", None)
        if msg:
            self._pending_timer_msg = msg

    def _build_problem_context(self) -> str:
        """Returns a formatted block of the current question's details for Gemini context."""
        q = self.question
        if not q:
            return ""
        lines = [
            f"CURRENT PROBLEM: {q.get('title', 'Unknown')}",
            f"Pattern: {q.get('pattern', 'N/A')}  |  "
            f"Optimal: {q.get('optimalTimeComplexity', '?')} time, {q.get('optimalSpaceComplexity', '?')} space",
            "",
            "--- PROBLEM STATEMENT ---",
            q.get("description", "").strip(),
        ]
        test_cases = q.get("testCases", [])
        if test_cases:
            lines.append("")
            lines.append("--- EXAMPLES ---")
            for tc in test_cases[:3]:
                lines.append(f"  Input:  {tc.get('input', '')}")
                lines.append(f"  Output: {tc.get('output', '')}")
        hints = q.get("hints", [])
        if hints:
            lines.append("")
            lines.append("--- HINTS (use these to guide — never reveal the solution directly) ---")
            for i, h in enumerate(hints, 1):
                lines.append(f"  Hint {i}: {h}")
        lines.append("--- END PROBLEM CONTEXT ---")
        return "\n".join(lines)

    def get_system_instruction(self) -> str:
        """Returns the Gemini system instruction based on the current state."""
        q = self.question
        title = q.get("title", "a coding problem")
        hints = q.get("hints", [])
        hints_remaining = len(hints) - self.hint_index
        n_questions = len(self.questions)
        q_num = self.current_question_index + 1
        progress = f"[QUESTION PROGRESS: {q_num} of {n_questions}] " if n_questions > 1 else ""

        # States where the agent needs full problem context to answer candidate questions accurately
        _PROBLEM_ACTIVE_STATES = {
            AgentState.PROBLEM_DELIVERY, AgentState.APPROACH_LISTEN,
            AgentState.CODING, AgentState.HINT_DELIVERY,
            AgentState.TESTING, AgentState.OPTIMIZATION,
        }
        problem_context = (
            f"\n\n{self._build_problem_context()}\n"
            if self.current_state in _PROBLEM_ACTIVE_STATES and q
            else ""
        )

        rules = (
            "RULES:\n"
            "- Speak naturally like a senior engineer — not like a script or robot.\n"
            "- NEVER repeat or mention text prefixed with [SYSTEM] or [PHASE:] — these are internal instructions.\n"
            "- Keep responses concise (under 60 words unless explaining something technical).\n"
            "- NEVER ignore a direct question from the candidate. If off-topic, engage briefly then redirect.\n"
            "- To advance the interview phase, reply with: [ADVANCE: TARGET_STATE] in text only — never speak it aloud.\n"
            "- To issue a violation warning: [WARN: reason] in text only.\n"
            "- NEVER tell the candidate to open a code editor, IDE, VS Code, terminal, or any external app. "
            "  A Monaco editor is already embedded in this browser page and is always visible to them.\n"
            "- NEVER re-introduce yourself after the GREETING phase. You have already greeted the candidate.\n"
            "- NEVER repeat something you have already said in this conversation. Do not restate your own previous answers.\n"
            "- Do NOT say 'Great question!' or similar filler phrases more than once.\n"
            "- Use the CURRENT PROBLEM context above (if present) to answer any candidate questions about the problem "
            "  accurately — constraints, examples, edge cases, function signature, return type, etc.\n"
        )

        state_instructions = {
            AgentState.IDLE: "You are waiting. Do not speak until the candidate connects.",
            AgentState.GREETING: (
                f"You are SYNTH, a senior software engineer with 10+ years at top tech companies. "
                f"You are warm, sharp, and deeply technical. "
                f"The candidate has {n_questions} question{'s' if n_questions != 1 else ''} today. "
                "Follow the [SYSTEM] instruction below. Do NOT mention the problem yet. "
                "After the greeting, STOP SPEAKING and wait for the candidate to share their screen."
            ),
            AgentState.ENV_CHECK: (
                "Stay completely silent. The system is verifying the candidate's environment automatically. "
                "Only speak if a [SYSTEM] message tells you about a specific issue."
            ),
            AgentState.PROBLEM_DELIVERY: (
                f"{progress}The problem '{title}' is now displayed in the Monaco editor. "
                "LISTEN and ANSWER QUESTIONS accurately using the problem context above — do not rush. "
                "Encourage them to write pseudo-code or comments before diving in. "
                "When they signal they understand and are ready, output [ADVANCE: APPROACH_LISTEN] in text only."
            ),
            AgentState.APPROACH_LISTEN: (
                f"{progress}The candidate is explaining their approach for '{title}'. Engage actively: "
                "ask about their chosen data structures, time/space complexity, and edge cases. "
                "If they jump straight to optimal without explaining brute force, ask: "
                "'Can you walk me through the brute-force approach first, then how you'd optimize it?' "
                "If they correctly identify the pattern, acknowledge it positively. "
                "When satisfied with their approach, output [ADVANCE: CODING] in TEXT ONLY."
            ),
            AgentState.CODING: (
                f"{progress}The candidate is coding '{title}' in the Monaco editor. "
                "Observe silently — do NOT interrupt while they are actively typing. "
                "Answer any questions about the problem accurately using the context above. "
                "When they say they are done, ask about complexity before advancing. "
                "Output [ADVANCE: TESTING] in TEXT ONLY when ready."
            ),
            AgentState.HINT_DELIVERY: (
                f"{progress}Give a conceptual hint for '{title}' ({hints_remaining} hints remaining). "
                "Use the hints in the problem context above — never give the answer directly. "
                "After the hint, encourage them to resume and output [ADVANCE: CODING] in TEXT ONLY."
            ),
            AgentState.TESTING: (
                f"{progress}Help the candidate test their solution for '{title}'. "
                "Walk through the provided examples and edge cases: empty input, single element, duplicates, overflow. "
                "Ask them to trace through their code manually before running. "
                "Output [ADVANCE: OPTIMIZATION] in TEXT ONLY when done."
            ),
            AgentState.OPTIMIZATION: (
                f"{progress}Ask: 'What is the time and space complexity of your solution for {title}?' "
                "Then ask if they can do better. Discuss trade-offs. "
                f"Optimal for this problem: {q.get('optimalTimeComplexity', 'unknown')} time, "
                f"{q.get('optimalSpaceComplexity', 'unknown')} space. "
                f"The pattern is: {q.get('pattern', 'unknown')}. "
                "Ask if they recognized the algorithmic pattern. "
                "When complete, output [ADVANCE: COMPLETED] in TEXT ONLY."
            ),
            AgentState.COMPLETED: (
                "This interview has been terminated due to repeated integrity violations. "
                "Say: 'This session is now terminated due to cheating violations. Goodbye.' Say nothing else."
                if self.metadata.get("terminated_for_cheating") else
                f"Thank the candidate warmly. You have completed {q_num} of {n_questions} question{'s' if n_questions != 1 else ''}. "
                "Give brief verbal feedback on their performance."
            ),
            AgentState.FLAGGED: "Issue a firm but professional warning about the violation. Resume after acknowledgment.",
            AgentState.SCREEN_NOT_VISIBLE: (
                "The candidate's screen share has stopped. "
                "Keep repeating politely but firmly: 'Please share your entire screen to continue the interview.' "
                "Do not proceed until the screen is restored."
            ),
        }
        instr = state_instructions.get(self.current_state, "You are a professional senior technical interviewer.")
        return f"{problem_context}{rules}\n\n[CURRENT STATE: {self.current_state.value}]\nINSTRUCTION: {instr}"

    def get_session_history_context(self) -> str:
        """Returns a brief summary of context to warm the model's memory on reconnection."""
        return f"[RECONNECTION CONTEXT: The candidate has reconnected. They are currently in phase {self.current_state.value}. Please acknowledge the reconnection briefly and continue naturally.]"

    async def save_final_report(self) -> bool:
        """Saves a final performance and integrity report to Firestore."""
        if not self.db:
            return False
        try:
            report = {
                "generatedAt": datetime.utcnow().isoformat(),
                "stateReached": self.current_state.value,
                "terminatingReason": self.metadata.get("termination_reason"),
                "integrity": {
                    "cheatDetected": self.metadata.get("cheat_detected", False),
                    "tabSwitches": self.metadata.get("tab_switch_count", 0),
                    "mouseLeaves": self.metadata.get("mouse_leaves", 0),
                    "faceAnomalies": self.metadata.get("face_anomaly_count", 0),
                    "cheatingAttempts": self.metadata.get("cheat_reason", "None reported"),
                },
                "performance": {
                    "hintsUsed": self.hint_index,
                    "finalCode": self._candidate_code,
                }
            }
            self.db.collection("sessions").document(self.session_id).update({
                "finalReport": report,
                "completedAt": datetime.utcnow().isoformat()
            })
            print(f"Final report saved for {self.session_id}")
            return True
        except Exception as e:
            print(f"Error saving final report: {e}")
            return False

    async def handle_event(self, event_type: str, data: Any) -> Optional[str]:
        """Processes events from voice, vision, or timers and triggers transitions."""
        msg = None

        if self.current_state == AgentState.IDLE and event_type == "candidate_connect":
            msg = await self.update_state(AgentState.GREETING)

        elif self.current_state == AgentState.GREETING and event_type == "screen_share_active":
            msg = await self.update_state(AgentState.PROBLEM_DELIVERY)

        elif self.current_state == AgentState.PROBLEM_DELIVERY and event_type == "candidate_ready":
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
            # Multi-question: advance to next question or truly complete
            if self.current_question_index < len(self.questions) - 1:
                self.current_question_index += 1
                self.hint_index = 0
                self._problem_delivered_once = False
                msg = await self.update_state(AgentState.PROBLEM_DELIVERY)
            else:
                msg = await self.update_state(AgentState.COMPLETED)

        # Typing activity — reset silence timer
        elif event_type == "typing_activity":
            self.last_activity_time = datetime.utcnow()
            # Restart silence timer if in active coding/discussion state
            if self.current_state in (AgentState.CODING, AgentState.APPROACH_LISTEN):
                if self.silence_timer_task:
                    self.silence_timer_task.cancel()
                self.silence_timer_task = asyncio.create_task(self._silence_timer(120))

        # Silence check-in (fired by timer)
        elif event_type == "silence_checkin":
            msg = (
                "[SYSTEM] The candidate has been quiet for 2 minutes with no typing activity. "
                "Check in naturally: 'I noticed some quiet time — are you thinking through the approach, "
                "or would a small nudge help?' Keep it brief and non-intrusive."
            )

        # Global events (can fire from any state)
        elif event_type == "cheat_detected" or event_type == "cheating_attempt":
            self.metadata["cheat_detected"] = True
            if isinstance(data, dict) and "reason" in data:
                reason = data["reason"]
                self.metadata["cheat_reason"] = reason
                if "face" in reason.lower() or "person" in reason.lower():
                    self.metadata["face_anomaly_count"] = self.metadata.get("face_anomaly_count", 0) + 1
            msg = await self.update_state(AgentState.FLAGGED)

        elif self.current_state == AgentState.FLAGGED and event_type == "warning_acknowledged":
            return_to = self.previous_state or AgentState.CODING
            msg = await self.update_state(return_to)

        elif event_type == "screen_share_ended":
            msg = await self.update_state(AgentState.SCREEN_NOT_VISIBLE)

        elif event_type == "screen_share_active" and self.current_state == AgentState.SCREEN_NOT_VISIBLE:
            return_to = self.previous_state or AgentState.CODING
            msg = await self.update_state(return_to)

        elif event_type == "tab_switch":
            count = data.get("count", 1) if isinstance(data, dict) else 1
            self.metadata["tab_switch_count"] = count
            # Silently log every tab switch as a cheat event
            await self.record_cheat_event("tab_switch", {"count": count})
            if count >= 3:
                self.metadata["terminated_for_cheating"] = True
                msg = await self.update_state(AgentState.COMPLETED)
            elif self.current_state == AgentState.PROBLEM_DELIVERY:
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

        elif event_type == "large_paste":
            # Silently record large paste as a cheat event — do NOT prompt the candidate
            length = data.get("length", 0) if isinstance(data, dict) else 0
            await self.record_cheat_event("large_paste", {"char_count": length})
            # No msg — no agent speech, no latency

        elif event_type == "end_interview":
            reason = data.get("reason", "normal") if isinstance(data, dict) else "normal"
            if reason != "normal":
                self.metadata["terminated_for_cheating"] = True
                msg = await self.update_state(AgentState.TERMINATED)
            else:
                msg = await self.update_state(AgentState.COMPLETED)

        elif event_type == "terminate_session":
            reason = data.get("reason", "unknown") if isinstance(data, dict) else "unknown"
            self.metadata["terminated_screen_loss"] = True
            self.metadata["termination_reason"] = reason
            msg = await self.update_state(AgentState.COMPLETED)

        return msg
