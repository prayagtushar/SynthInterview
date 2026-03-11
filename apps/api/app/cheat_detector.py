import base64
import time
from typing import Optional, Dict, List, Any
from datetime import datetime
from google import genai
from google.genai import types
import asyncio
from google.cloud import firestore

class CheatDetector:
    def __init__(self, session_id: str, db: Any, bucket: Any, api_key: str):
        self.session_id = session_id
        self.db = db
        self.bucket = bucket
        self.client = genai.Client(api_key=api_key)
        self.consecutive_flags = 0
        self.last_analysis_time = 0
        self.analysis_interval = 10  # Analyze every 10 seconds to save costs
        self.violation_log: List[Dict] = []
        
    async def process_frame(self, frame_b64: str) -> Optional[Dict]:
        """Analyzes a frame and returns violation info if threshold met."""
        now = time.time()
        if now - self.last_analysis_time < self.analysis_interval:
            return None
            
        self.last_analysis_time = now
        
        try:
            violation = await self._analyze_with_gemini(frame_b64)
            if violation:
                self.consecutive_flags += 1
                return await self._handle_violation(violation, frame_b64)
            else:
                self.consecutive_flags = 0
                return None
        except Exception as e:
            print(f"CheatDetector error: {e}")
            return None

    async def _analyze_with_gemini(self, frame_b64: str) -> Optional[Dict]:
        """Uses Gemini Vision to detect violations."""
        prompt = """
        Analyze this screen frame from a technical interview.
        YOUR GOAL: Detect ACTIVE cheating. Do NOT be alarmist.
        
        RULES:
        1. IGNORE the taskbar, dock, or system tray. Pinned or background apps are NOT violations.
        2. IGNORE the browser name/brand.
        3. VIOLATIONS are ONLY:
           (a) A foreground window that is NOT the code editor or the SynthInterview tab.
           (b) The browser has search engines, AI sites, or documentation visible in the ACTIVE tab or side-by-side.
           (c) The candidate is copying code from a non-editor source.
        
        If unsure, do NOT flag.
           
        Return ONLY a JSON object:
        { "is_violation": boolean, "type": string, "reason": string }
        """
        
        # Use gemini-2.5-flash for vision analysis
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=base64.b64decode(frame_b64), mime_type="image/jpeg"),
                types.Part.from_text(text=prompt)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        try:
            import json
            result = json.loads(response.text)
            if result.get("is_violation"):
                return result
        except:
            pass
        return None

    async def _handle_violation(self, violation: Dict, frame_b64: str) -> Dict:
        """Applies threshold logic and logs to Firestore/Storage."""
        if self.consecutive_flags >= 5:
            violation_type = "HARD"
        elif self.consecutive_flags >= 2:
            violation_type = "SOFT"
        else:
            violation_type = "FLAG"
        
        if violation_type in ["SOFT", "HARD"]:
            timestamp = datetime.utcnow().isoformat()
            screenshot_ref = None
            
            # For HARD violations, store screenshot and log to Firestore
            if violation_type == "HARD":
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
                "screenshotRef": screenshot_ref
            }
            
        return {"severity": "FLAG", "reason": violation["reason"]}

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
