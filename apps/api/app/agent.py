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
            return (
                "Hello! I'm Synth, your AI technical interviewer from SynthInterview. "
                "Welcome to your coding interview session today. "
                "To get started, please share your full screen and open your code editor — "
                "just the editor, nothing else. Let me know when you're ready."
            )

        elif state == AgentState.ENV_CHECK:
            return (
                "Perfect, I can see your screen. Let me just do a quick environment check. "
                "Please make sure only your code editor is visible — "
                "no browser tabs, no messaging apps, no AI assistants open. "
                "This ensures a fair interview environment for everyone."
            )

        elif state == AgentState.PROBLEM_DELIVERY:
            difficulty = self.metadata.get("difficulty", "Medium")
            title = q.get("title", "Coding Problem")
            description = q.get("description", "")
            return (
                f"Great, your environment looks clean. Let's get started! "
                f"Today's problem is '{title}', a {difficulty}-difficulty question. "
                f"\n\n{description}\n\n"
                f"Take a moment to read through it carefully. "
                f"Let me know when you understand the problem and we'll move on to discussing your approach."
            )

        elif state == AgentState.THINK_TIME:
            return (
                "Excellent! You have 2 minutes to think about your approach silently. "
                "I'll be observing your screen quietly. "
                "Feel free to jot down notes or pseudocode in the editor. "
                "I'll check in with you when time is up."
            )
            self.timer_task = asyncio.create_task(
                self._start_timer(120, AgentState.APPROACH_LISTEN)
            )

        elif state == AgentState.APPROACH_LISTEN:
            return (
                "Time to talk through your approach! "
                "Walk me through the algorithm you're planning to use. "
                "I'd love to hear about the data structures you've chosen and "
                "your thoughts on the time and space complexity."
            )

        elif state == AgentState.CODING:
            return (
                "Sounds good! Go ahead and start coding your solution. "
                "I'll be watching your progress in real time. "
                "Don't hesitate to think out loud — and if you get stuck, just ask for a hint."
            )

        elif state == AgentState.HINT_DELIVERY:
            hints = q.get("hints", [])
            if self.hint_index < len(hints):
                hint = hints[self.hint_index]
                self.hint_index += 1
                return f"Here's something to help you along: {hint}"
            else:
                return (
                    "You've used all available hints. Try to work through it with what you've got — "
                    "I believe you can figure it out!"
                )

        elif state == AgentState.TESTING:
            test_cases = q.get("testCases", [])
            test_summary = "\n".join(
                [f"  • Input: {tc['input']} → Expected: {tc['output']}" for tc in test_cases[:3]]
            )
            return (
                f"I see you've written your solution. Let's test it against some cases:\n\n"
                f"{test_summary}\n\n"
                "Run your code against these examples and let me know how it performs."
            )

        elif state == AgentState.OPTIMIZATION:
            optimal_time = q.get("optimalTimeComplexity", "")
            return (
                f"The tests passed — great work! "
                f"Now let's think about optimization. "
                f"What's the time and space complexity of your current solution? "
                f"{'The optimal solution can achieve ' + optimal_time + '.' if optimal_time else ''} "
                f"Can you see a way to get there?"
            )

        elif state == AgentState.COMPLETED:
            return (
                "Excellent work today! The interview is now complete. "
                "You demonstrated solid problem-solving skills. "
                "I'll be generating a detailed evaluation report for the recruiter shortly. "
                "Thank you for your time and effort — best of luck with your application!"
            )

        elif state == AgentState.FLAGGED:
            return (
                "I've noticed some unusual activity that may violate our interview guidelines. "
                "Please keep your focus on the code editor only and avoid switching tabs or "
                "using external resources. This is your formal warning — subsequent violations "
                "will be logged in your evaluation report."
            )

        return None

    async def _start_timer(self, seconds: int, target_state: AgentState) -> None:
        """Handles delayed automatic state transitions."""
        await asyncio.sleep(seconds)
        await self.update_state(target_state)

    def get_system_instruction(self) -> str:
        """Returns the Gemini system instruction based on the current state."""
        q = self.question
        title = q.get("title", "a coding problem")
        description = q.get("description", "")
        test_cases = q.get("testCases", [])
        hints = q.get("hints", [])
        hints_remaining = len(hints) - self.hint_index

        state_instructions = {
            AgentState.IDLE: (
                "You are waiting. Do not speak until the candidate connects."
            ),
            AgentState.GREETING: (
                "You are SYNTH, a warm, professional technical interviewer. "
                "Greet the candidate, introduce yourself, and ask them to share their screen and open only a code editor."
                "Keep it brief and friendly."
            ),
            AgentState.ENV_CHECK: (
                "CRITICAL TASK: Analyze the screen share frames carefully. "
                "Check for: code editor open, no other browser tabs visible, no messaging apps, no AI assistants. "
                "If the environment is clean and only a code editor is visible, say the phrase 'ENVIRONMENT VERIFIED' clearly in your response. "
                "If there are violations, describe them politely and ask the candidate to close the offending windows."
            ),
            AgentState.PROBLEM_DELIVERY: (
                f"Deliver the coding problem clearly and patiently. The problem is: '{title}'. "
                f"Problem description: {description}\n"
                "Read it out loud clearly. Offer to repeat or clarify any part. "
                "Ask the candidate to confirm they understand the problem before proceeding. "
                "When they say they understand or are ready, say 'CANDIDATE READY' so we can move on."
            ),
            AgentState.THINK_TIME: (
                "Stay quiet and observe. The candidate is thinking. "
                "Do not speak unless directly spoken to. "
                "Watch the screen for any note-taking or pseudocode."
            ),
            AgentState.APPROACH_LISTEN: (
                "Listen attentively to the candidate's approach explanation. "
                "Ask targeted follow-up questions about: "
                "1. Data structures chosen and why "
                "2. Time complexity (Big O) of their approach "
                "3. Edge cases they've considered "
                "When you're satisfied with their approach, say 'APPROACH ACCEPTED' to move to coding."
            ),
            AgentState.CODING: (
                "Observe the candidate's coding in real time via screen share. "
                f"They are solving: {title}. "
                "Do NOT interrupt unless: "
                "1. You detect tab switching or AI tool usage (cheating) — say 'CHEAT DETECTED' "
                "2. The candidate has been stuck for over 5 minutes and shows distress "
                "3. The candidate explicitly asks for a hint — respond positively "
                "When you see they have finished writing code, say 'CODING COMPLETE' naturally."
            ),
            AgentState.HINT_DELIVERY: (
                f"You are providing a hint. There are {hints_remaining} hints remaining after this one. "
                "Give only a directional hint — never give the complete solution or full code. "
                "After giving the hint, say 'HINT DELIVERED' and let them get back to coding."
            ),
            AgentState.TESTING: (
                "Help the candidate test their solution. "
                f"The test cases are: {test_cases} "
                "Walk through each test case. Identify failures and help them debug systematically. "
                "When all tests pass, say 'TESTS PASSED' enthusiastically."
            ),
            AgentState.OPTIMIZATION: (
                f"Challenge the candidate to optimize their solution. "
                f"Optimal time complexity target: {q.get('optimalTimeComplexity', 'best possible')}. "
                f"Optimal space complexity target: {q.get('optimalSpaceComplexity', 'best possible')}. "
                "Ask them about current complexity and how to improve it. "
                "When they've discussed or optimized, say 'OPTIMIZATION COMPLETE'."
            ),
            AgentState.COMPLETED: (
                "The interview is complete. Thank the candidate warmly. "
                "Give brief verbal feedback on their performance. "
                "Be encouraging and professional. Mention the report will be sent to the recruiter."
            ),
            AgentState.FLAGGED: (
                "Issue a formal warning about the detected violation. "
                "Be firm but professional. Log the incident. "
                "After acknowledgment, resume the interview from where it was paused."
            ),
        }
        return state_instructions.get(self.current_state, "You are a professional technical interviewer.")

    async def handle_event(self, event_type: str, data: Any) -> Optional[str]:
        """Processes events from voice, vision, or timers and triggers transitions."""
        msg = None

        # State machine transitions
        if self.current_state == AgentState.IDLE and event_type == "candidate_connect":
            msg = await self.update_state(AgentState.GREETING)

        elif self.current_state == AgentState.GREETING and event_type == "screen_share_active":
            msg = await self.update_state(AgentState.ENV_CHECK)

        elif self.current_state == AgentState.ENV_CHECK and event_type == "workspace_clean":
            msg = await self.update_state(AgentState.PROBLEM_DELIVERY)

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
            msg = await self.update_state(AgentState.FLAGGED)

        elif self.current_state == AgentState.FLAGGED and event_type == "warning_acknowledged":
            # Return to previous state after warning acknowledged
            return_to = self.previous_state or AgentState.CODING
            msg = await self.update_state(return_to)

        elif event_type == "end_interview":
            msg = await self.update_state(AgentState.COMPLETED)

        return msg
