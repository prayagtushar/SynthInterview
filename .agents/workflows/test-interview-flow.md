---
description: Test the full interview flow (Tasks 1, 2, 3)
---

## Pre-requisites

- `bun run dev` is running (both `api:dev` and `web:dev`)
- API at http://localhost:8000
- Frontend at http://localhost:3000
- `.env` has GEMINI_API_KEY and GEMINI_MODEL=gemini-2.5-flash-native-audio-latest

---

## STEP 1 — Create a Test Session

Run this curl command to create a session:

```bash
curl -s -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{"candidateEmail":"test@demo.com","difficulty":"Easy","topics":["Arrays","HashMaps"],"questionId":"two-sum"}' | python3 -m json.tool
```

Copy the `sessionId` from the response.

---

## STEP 2 — Open the Session Page

Navigate to:

```
http://localhost:3000/session?id=<SESSION_ID_FROM_STEP_1>
```

The page should show:

- ✅ State badge: **IDLE**
- ✅ "Start Interview" button visible

---

## STEP 3 — Start the Interview

Click **"Start Interview"** (id=`start-interview-btn`).

Your browser will ask for:

1. Microphone permission → Allow
2. Screen share permission → Share your screen (select the code editor window)

Expected backend logs:

```
Agent state changed: IDLE -> GREETING
Agent state changed: GREETING -> ENV_CHECK
```

Expected frontend:

- ✅ State badge changes to **GREETING** then **ENV CHECK**
- ✅ You should **HEAR** Synth's greeting voice
- ✅ AI Feedback panel shows Synth's text

---

## STEP 4 — ENV_CHECK (Automated via AI Vision)

The AI (Synth) will scan your screen share. It will look for:

- Only a code editor visible = PASS
- Browser tabs, messaging apps = FAIL

**Test A — Clean Environment:**
Make sure only VS Code / the editor is visible.
Expected: Synth says "ENVIRONMENT VERIFIED" and state moves to **PROBLEM DELIVERY**

**Test B — Cheating Detection:**
Open a new browser tab with a website visible.
Expected: Synth detects it, warns you, state moves to **FLAGGED**

---

## STEP 5 — Problem Delivery

Synth reads out the "Two Sum" problem.

When you understand it, click **"I Understand"** button (id=`action-candidate_ready`).
Expected:

- ✅ State moves to **THINK TIME**
- ✅ Synth says you have 2 minutes to think

---

## STEP 6 — Approach Listen

After 2 minutes (or timer fires), state auto-moves to **APPROACH LISTEN**.

Speak your approach aloud into the microphone:

> "I'll use a HashMap to store each number's complement and index. For each num, I'll check if its complement already exists in the map."

Synth will ask follow-up questions about Big O complexity.
When satisfied, Synth says "APPROACH ACCEPTED" → state moves to **CODING**.

---

## STEP 7 — Coding

Write your Two Sum solution in the Monaco editor. Synth watches your screen.

```javascript
function twoSum(nums, target) {
	const map = new Map();
	for (let i = 0; i < nums.length; i++) {
		const complement = target - nums[i];
		if (map.has(complement)) return [map.get(complement), i];
		map.set(nums[i], i);
	}
}
```

**Test — Hint Request:**
Click **"Request Hint"** (id=`action-hint_requested`)
Expected: Synth gives Hint 1 from the question bank without revealing the answer

When done, click **"Done Coding"** (id=`action-coding_finished`)
Expected: State moves to **TESTING**

---

## STEP 8 — Testing

Synth reads out the test cases aloud:

- Input: [2,7,11,15], target=9 → Expected: [0,1]
- Input: [3,2,4], target=6 → Expected: [1,2]

Run your code mentally / in the editor.

Click **"Tests Passed"** (id=`action-tests_passed`)
Expected: State moves to **OPTIMIZATION**

---

## STEP 9 — Optimization

Synth asks about O(n) vs O(n²) complexity.

Discuss your HashMap approach being O(n) time and O(n) space.

Click **"Done Optimizing"** (id=`action-optimization_finished`)
Expected: State moves to **COMPLETED**

---

## STEP 10 — Completed

Synth delivers a closing message thanking the candidate.
State badge shows **COMPLETED** in green.

Verify in Firestore:

- Navigate to Firebase Console > Firestore > sessions > <session_id>
- Field `status` should be `"COMPLETED"`

---

## STEP 11 — Verify API

```bash
# Check session status
curl -s http://localhost:8000/sessions/<SESSION_ID> | python3 -m json.tool

# List all questions
curl -s http://localhost:8000/questions | python3 -m json.tool
```

---

## Regression Test Checklist

| Test                                   | Expected                            |
| -------------------------------------- | ----------------------------------- |
| Start Interview without microphone     | Alert shown, no crash               |
| Start Interview button fires only once | No duplicate sessions               |
| GREETING → ENV_CHECK fires after 500ms | Not skipped                         |
| Synth voice plays (AI audio)           | Hear Synth speaking                 |
| Mic audio goes to Gemini               | Gemini responds to your voice       |
| Screen frames sent at 5fps             | Backend receives `frame` events     |
| Hint respects index                    | 3 hints max, each more specific     |
| FLAGGED → returns to prev state        | Coding resumes after acknowledgment |
| End Interview during CODING            | Session closes gracefully           |
| New session has correct question       | `questionId` matches difficulty     |
