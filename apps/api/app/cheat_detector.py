import base64
import json
import re
import time
from typing import Optional, Dict, List, Any
from datetime import datetime
from google import genai
from google.genai import types
import asyncio
from google.cloud import firestore
import re


class CheatDetector:
    def __init__(
        self,
        session_id: str,
        db: Any,
        bucket: Any,
        api_key: str,
        model_id: str,
    ):
        self.session_id = session_id
        self.db = db
        self.bucket = bucket
        self.model_id = model_id
        self.client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})
        self.consecutive_flags = 0
        self.total_strikes = 0
        self.last_analysis_time = 0
        self.analysis_interval = 2.0
        self.violation_log: List[Dict] = []
        self.hydrate()

    def hydrate(self):
        """Restores history from Firestore."""
        if not self.db: return
        try:
            doc = self.db.collection("sessions").document(self.session_id).get()
            if doc.exists:
                data = doc.to_dict()
                log = data.get("violation_log", [])
                self.violation_log = log
                self.total_strikes = len(log)
                print(f"[Vision] Hydrated CheatDetector: {self.total_strikes} existing strikes.")
        except Exception as e:
            print(f"CheatDetector hydration error: {e}")

    async def process_frame(self, frame_b64: str, source: str = "screen") -> Optional[Dict]:
        """Analyzes a frame for violations."""
        now = time.time()
        if now - self.last_analysis_time < self.analysis_interval:
            return None

        self.last_analysis_time = now
        print(f"[Vision] Analyzing frame using {self.model_id}... (Consecutive Flags: {self.consecutive_flags})")

        try:
            violation = await self._analyze_with_gemini(frame_b64, source)
            if violation:
                self.consecutive_flags += 1
                self.total_strikes += 1
                print(
                    f"[Vision] VIOLATION: Consecutive={self.consecutive_flags}, Total={self.total_strikes}"
                )
                return await self._handle_violation(violation, frame_b64)
            else:
                if self.consecutive_flags > 0:
                    self.consecutive_flags -= 1
                    print(f"[Vision] No violation. Counter decayed to: {self.consecutive_flags}")
                return False  # Explicitly return False for analyzed but clean
        except Exception as e:
            print(f"CheatDetector error: {e}")
            return None

    async def _analyze_with_gemini(self, frame_b64: str, source: str) -> Optional[Dict]:
        """Uses Gemini Vision to detect violations."""
        prompt = f"""
        Analyze this {source.upper()} image from a technical coding interview proctoring system.
        
        GOAL: Detect UNFAIR assistance or proctoring violations.
        
        VIOLATIONS TO DETECT:
        1. Split-screen/Dual Monitor: If THIS IS A SCREEN FRAME, detect any other window (VS Code, Browser, Notes) alongside the interview platform. The interview web platform should occupy the entire screen.
        2. External IDEs/Terminals: Detect usage of VS Code, Cursor, IntelliJ, or Terminal outside the browser.
        3. AI Tools/Search: Detect ChatGPT, Claude, Google Search, or any AI coding assistants.
        4. Multiple People: If THIS IS A WEBCAM FRAME, detect more than one person in the frame, including people passing by in the background or partial silhouettes.
        5. Face Missing/Covered: If THIS IS A WEBCAM FRAME, detect if the candidate's face is obstructed, if they are wearing a mask/headphones (unless allowed), or looking away frequently.
        6. Electronic Devices: STRICTLY detect phones, tablets, e-readers, or any secondary screens. Even if only a corner of a phone is visible or the candidate is looking at a phone off-camera (infer from gaze), flag it.
        
        CRITICAL: Your goal is a zero-tolerance proctoring check. If you see ANY evidence of unfair help, flag it with high probability.
        
        Return ONLY valid JSON:
        { 
          "is_violation": boolean, 
          "probability": float (0.0-1.0),
          "type": "SPLIT_SCREEN" | "EXTERNAL_IDE" | "AI_TOOL" | "MULTIPLE_FACES" | "FACE_COVERED" | "DEVICE_DETECTED",
          "reason": "Specific one-sentence explanation",
          "box_2d": [ymin, xmin, ymax, xmax] (Normalized 0-1000, ONLY if violation)
        }
        """

        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_id,
                contents=[
                    types.Part.from_bytes(data=base64.b64decode(frame_b64), mime_type="image/jpeg"),
                    types.Part.from_text(text=prompt),
                ],
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )

            print(f"[Vision] Gemini raw response: {response.text}")

            # Clean up response (handle markdown)
            text = (response.text or "").strip()

            # More robust JSON extraction
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                text = json_match.group(0)
            else:
                print(f"[Vision] No JSON found in text: {text[:100]}")
                return None

            result = json.loads(text)
            if result.get("is_violation"):
                print(f"[Vision] VIOLATION DETECTED: {result.get('reason')}")
                return result
            else:
                print(f"[Vision] No violation detected.")
        except Exception as e:
            print(f"[Vision] Analysis error: {e}")
        return None

    async def _handle_violation(self, violation: Dict, frame_b64: str) -> Dict:
        """Applies threshold logic and logs to Firestore/Storage."""
        if self.consecutive_flags >= 3 or self.total_strikes >= 5:
            violation_type = "TERMINATE"
        else:
            violation_type = "HARD"

        print(
            f"[Vision] Violation Handled: {violation_type} (Flags: {self.consecutive_flags}, Total: {self.total_strikes})"
        )

        if violation_type in ["HARD", "TERMINATE"]:
            timestamp = datetime.utcnow().isoformat()
            screenshot_ref = None

            screenshot_ref = await self._upload_screenshot(frame_b64, timestamp)
            log_entry = {
                "timestamp": timestamp,
                "type": violation["type"],
                "reason": violation["reason"],
                "screenshotRef": screenshot_ref,
            }
            self.violation_log.append(log_entry)

            try:
                self.db.collection("sessions").document(self.session_id).update(
                    {"violation_log": firestore.ArrayUnion([log_entry]), "status": "FLAGGED"}
                )
            except Exception as e:
                print(f"Firestore log error: {e}")

            return {
                "severity": violation_type,
                "reason": violation["reason"],
                "type": violation["type"],
                "box_2d": violation.get("box_2d"),
                "probability": violation.get("probability", 1.0),
                "screenshotRef": screenshot_ref,
            }

        return {
            "severity": "FLAG",
            "reason": violation["reason"],
            "box_2d": violation.get("box_2d"),
            "probability": violation.get("probability", 0.0),
        }

    async def _upload_screenshot(self, frame_b64: str, timestamp: str) -> Optional[str]:
        """Uploads screenshot to Cloud Storage."""
        if not self.bucket:
            return None

        try:
            filename = f"violations/{self.session_id}/{timestamp.replace(':', '-')}.jpg"
            blob = self.bucket.blob(filename)
            raw_data = base64.b64decode(frame_b64)
            await asyncio.to_thread(blob.upload_from_string, raw_data, content_type="image/jpeg")
            return f"gs://{self.bucket.name}/{filename}"
        except Exception as e:
            msg = str(e).lower()
            if "billing" in msg or "delinquent" in msg:
                print(f"[PROCTOR] CRITICAL: Storage billing disabled. Skipping uploads.")
                self.bucket = None 
            else:
                print(f"Storage upload error: {e}")
            return None
