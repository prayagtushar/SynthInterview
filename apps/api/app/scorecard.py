"""
Scorecard generation for SynthInterview.
Uses Gemini to analyze the interview and produce structured scores across 6 dimensions.
"""

import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


_SCORE_WEIGHTS = {
    "problem_understanding": 0.20,
    "approach": 0.25,
    "communication": 0.15,
    "code_quality": 0.20,
    "correctness": 0.15,
    "time_management": 0.05,
}

_HINT_DEDUCTIONS = {0: 0, 1: 5, 2: 15, 3: 30}


async def generate_scorecard(
    session_data: dict,
    question: dict,
    final_code: str,
    hint_index: int,
    test_results: Optional[dict],
    phase_durations: Optional[dict],
    tab_switch_count: int,
    conversation_summary: str,
) -> dict:
    """
    Generate a full scorecard using Gemini.
    Returns a dict with scores, rating, feedback, and dimension_feedback.
    """
    hint_deduction = _HINT_DEDUCTIONS.get(min(hint_index, 3), 30)
    test_passed = test_results.get("passed", 0) if test_results else 0
    test_total = test_results.get("total", 0) if test_results else 0
    test_summary = f"{test_passed}/{test_total} test cases passed" if test_total > 0 else "Not run"

    prompt = _build_prompt(
        question=question,
        final_code=final_code,
        hint_index=hint_index,
        hint_deduction=hint_deduction,
        test_summary=test_summary,
        phase_durations=phase_durations or {},
        tab_switch_count=tab_switch_count,
        conversation_summary=conversation_summary,
        difficulty=session_data.get("difficulty", "Medium"),
    )

    raw = await _call_gemini(prompt)
    if raw is None:
        return _fallback_scorecard(hint_deduction, test_passed, test_total)

    scorecard = _parse_scorecard(raw, hint_deduction)
    return scorecard


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(
    question: dict,
    final_code: str,
    hint_index: int,
    hint_deduction: int,
    test_summary: str,
    phase_durations: dict,
    tab_switch_count: int,
    conversation_summary: str,
    difficulty: str,
) -> str:
    code_snippet = final_code[-2000:] if len(final_code) > 2000 else final_code
    phases_text = "\n".join(f"  - {k}: {v:.0f}s" for k, v in phase_durations.items()) or "  (not available)"

    hints_text = (
        f"{hint_index} hint(s) used (deduct {hint_deduction}% from approach score)"
        if hint_index > 0 else "No hints used"
    )

    return f"""You are an expert technical interviewer evaluating a candidate's performance.

QUESTION: {question.get('title', 'Unknown')} (Difficulty: {difficulty})
DESCRIPTION: {question.get('description', '')[:400]}
OPTIMAL: Time {question.get('optimalTimeComplexity', 'N/A')}, Space {question.get('optimalSpaceComplexity', 'N/A')}

CANDIDATE FINAL CODE ({len(final_code)} chars):
```
{code_snippet}
```

INTERVIEW METRICS:
- Test cases: {test_summary}
- Hints used: {hints_text}
- Tab switches: {tab_switch_count}
- Phase durations:
{phases_text}

INTERVIEW CONVERSATION SUMMARY:
{conversation_summary or "Not available"}

YOUR TASK:
Score the candidate on each dimension from 0–100. Apply the hint deduction to the approach score.
Be fair but rigorous. Return ONLY valid JSON with this exact structure:

{{
  "scores": {{
    "problem_understanding": <0-100>,
    "approach": <0-100 after hint deduction>,
    "communication": <0-100>,
    "code_quality": <0-100>,
    "correctness": <0-100>,
    "time_management": <0-100>
  }},
  "dimension_feedback": {{
    "problem_understanding": "<1-2 sentence specific feedback>",
    "approach": "<1-2 sentence specific feedback>",
    "communication": "<1-2 sentence specific feedback>",
    "code_quality": "<1-2 sentence specific feedback>",
    "correctness": "<1-2 sentence specific feedback>",
    "time_management": "<1-2 sentence specific feedback>"
  }},
  "feedback": "<3-4 sentence overall assessment. Mention strengths, areas for improvement, and one specific actionable suggestion>",
  "improvement_areas": ["<topic1>", "<topic2>", "<topic3>"],
  "strengths": ["<strength1>", "<strength2>"]
}}

Scoring guidelines:
- problem_understanding: Did they identify edge cases? Ask good clarifying questions?
- approach: Was their algorithm correct? Optimal? Reduce by {hint_deduction}% for hints.
- communication: Did they explain their thinking clearly? Respond well to questions?
- code_quality: Clean code, naming, readability, structure (0 hints expected in this dimension)
- correctness: Based on test results ({test_summary}). If tests not run, infer from code review.
- time_management: Was time distributed reasonably across phases?
"""


# ── Gemini caller ─────────────────────────────────────────────────────────────

async def _call_gemini(prompt: str) -> Optional[str]:
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1200,
            ),
        )
        return response.text
    except Exception as e:
        logger.error("Gemini scorecard generation failed: %s", e)
        return None


# ── Parser ────────────────────────────────────────────────────────────────────

def _parse_scorecard(raw: str, hint_deduction: int) -> dict:
    """Extract JSON from Gemini response and compute weighted overall score."""
    try:
        # Strip markdown code fences if present
        text = raw.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        data = json.loads(text)
        scores = data.get("scores", {})

        # Compute weighted overall score
        overall = 0.0
        for dim, weight in _SCORE_WEIGHTS.items():
            overall += scores.get(dim, 0) * weight
        overall = round(overall)

        rating = _rating(overall)

        return {
            "scores": scores,
            "overall_score": overall,
            "rating": rating,
            "feedback": data.get("feedback", ""),
            "dimension_feedback": data.get("dimension_feedback", {}),
            "improvement_areas": data.get("improvement_areas", []),
            "strengths": data.get("strengths", []),
        }
    except Exception as e:
        logger.error("Failed to parse scorecard JSON: %s\nRaw: %s", e, raw[:300])
        return _fallback_scorecard(hint_deduction, 0, 0)


def _fallback_scorecard(hint_deduction: int, test_passed: int, test_total: int) -> dict:
    """Returns a basic scorecard when Gemini is unavailable."""
    base_approach = max(0, 60 - hint_deduction)
    correctness = round((test_passed / test_total) * 100) if test_total > 0 else 50
    scores = {
        "problem_understanding": 60,
        "approach": base_approach,
        "communication": 60,
        "code_quality": 60,
        "correctness": correctness,
        "time_management": 70,
    }
    overall = round(sum(v * _SCORE_WEIGHTS[k] for k, v in scores.items()))
    return {
        "scores": scores,
        "overall_score": overall,
        "rating": _rating(overall),
        "feedback": "Scorecard was generated without AI analysis. Please review the submission manually.",
        "dimension_feedback": {},
        "improvement_areas": [],
        "strengths": [],
    }


def _rating(score: int) -> str:
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Needs Improvement"
    return "Needs Significant Practice"
