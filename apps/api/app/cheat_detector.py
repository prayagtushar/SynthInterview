import base64
import time
from typing import Optional, Dict, List, Any
from datetime import datetime
from google import genai
from google.genai import types
import asyncio
from google.cloud import firestore

class CheatDetector:
    def __init__(self, session_id: str, db: Any, bucket: Any, api_key: str, model_id: str = "gemini-2.5-flash"):
        self.session_id = session_id
        self.db = db
        self.bucket = bucket
        self.model_id = model_id
        self.client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})
        self.consecutive_flags = 0
        self.total_strikes = 0  # Total persistent violations
        self.last_analysis_time = 0
        self.analysis_interval = 4  # Aggressive analysis for live proctoring
        self.violation_log: List[Dict] = []
        
    async def process_frame(self, frame_b64: str) -> Optional[Dict]:
        """Analyzes a frame and returns violation info if threshold met."""
        now = time.time()
        if now - self.last_analysis_time < self.analysis_interval:
            return None
            
        self.last_analysis_time = now
        print(f"[Vision] Analyzing frame... (Consecutive Flags: {self.consecutive_flags})")
        
        try:
            violation = await self._analyze_with_gemini(frame_b64)
            if violation:
                self.consecutive_flags += 1
                self.total_strikes += 1
                print(f"[Vision] VIOLATION: Consecutive={self.consecutive_flags}, Total={self.total_strikes}")
                return await self._handle_violation(violation, frame_b64)
            else:
                if self.consecutive_flags > 0:
                    self.consecutive_flags -= 1
                    print(f"[Vision] No violation. Counter decayed to: {self.consecutive_flags}")
                return None
        except Exception as e:
            print(f"CheatDetector error: {e}")
            return None

    async def _analyze_with_gemini(self, frame_b64: str) -> Optional[Dict]:
        """Uses Gemini Vision to detect violations."""
        prompt = """
        Analyze this screen frame from a technical coding interview.
        YOUR GOAL: Detect ACTIVE cheating (split screens, external AI tools, or other IDEs).
        
        STRICT VIOLATIONS include:
        1. Any split-screen or side-by-side windows. The screen must ONLY show the single interview browser window occupies most of the screen.
        2. External IDEs/Terminals (VS Code, Cursor, Antigravity, local terminals).
        3. Visible AI tools or search engines (ChatGPT, Claude, Grok, Google).
        
        CRITICAL: If you see ANY window other than the SynthInterview web platform taking up visual space (split screen), it is a DEFINITE VIOLATION. Be extremely strict.
        
        Return ONLY a JSON object:
        { 
          "is_violation": boolean, 
          "probability": float (0-1),
          "type": string, 
          "reason": string,
          "box_2d": [ymin, xmin, ymax, xmax] (Normalized 0-1000, ONLY if a violation is detected)
        }
        """
        
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_id,
                contents=[
                    types.Part.from_bytes(data=base64.b64decode(frame_b64), mime_type="image/jpeg"),
                    types.Part.from_text(text=prompt)
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            print(f"[Vision] Gemini raw response: {response.text}")
            
            import json
            import re
            
            # Clean up response text in case it has markdown blocks
            text = response.text.strip()
            if text.startswith("```json"):
                text = re.sub(r"^```json\s*", "", text)
                text = re.sub(r"\s*```$", "", text)
            elif text.startswith("```"):
                text = re.sub(r"^```\s*", "", text)
                text = re.sub(r"\s*```$", "", text)
                
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
        # Strike System:
        # 3 total strikes OR 2 consecutive flags = TERMINATE
        if self.consecutive_flags >= 2 or self.total_strikes >= 3:
            violation_type = "TERMINATE"
        else:
            violation_type = "HARD"
            
        print(f"[Vision] Violation Handled: {violation_type} (Flags: {self.consecutive_flags}, Total: {self.total_strikes})")
        
        if violation_type in ["HARD", "TERMINATE"]:
            timestamp = datetime.utcnow().isoformat()
            screenshot_ref = None
            
            # For HARD/TERMINATE violations, store screenshot and log to Firestore
            if violation_type in ["HARD", "TERMINATE"]:
                screenshot_ref = await self._upload_screenshot(frame_b64, timestamp)
                log_entry = {
                    "timestamp": timestamp,
                    "type": violation["type"],
                    "reason": violation["reason"],
                    "screenshotRef": screenshot_ref
                }
                self.violation_log.append(log_entry)
                
                # Update Firestore session document
                try:
                    self.db.collection("sessions").document(self.session_id).update({
                        "violation_log": firestore.ArrayUnion([log_entry]),
                        "status": "FLAGGED"
                    })
                except Exception as e:
                    print(f"Firestore log error: {e}")

            return {
                "severity": violation_type,
                "reason": violation["reason"],
                "type": violation["type"],
                "box_2d": violation.get("box_2d"),
                "probability": violation.get("probability", 1.0),
                "screenshotRef": screenshot_ref
            }
            
        return {
            "severity": "FLAG",
            "reason": violation["reason"],
            "box_2d": violation.get("box_2d"),
            "probability": violation.get("probability", 0.0)
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
            print(f"Storage upload error: {e}")
            return None
