import base64
import asyncio
from typing import AsyncIterator
from google import genai
from google.genai import types


class GeminiLiveClient:
    def __init__(self, api_key: str, model_id: str):
        self.client = genai.Client(
            api_key=api_key,
            http_options={"api_version": "v1alpha"}
        )
        self.model_id = model_id
        self._session_ctx = None
        self.session = None
        # Serializes ALL sends through one coroutine via queue
        self._send_queue: asyncio.Queue = asyncio.Queue()
        self._sender_task: asyncio.Task | None = None
        # Signals when model turn is complete (safe to send next text)
        self._turn_complete = asyncio.Event()

    async def connect(self, system_instruction: str) -> None:
        config = {
            "response_modalities": ["AUDIO"],
            "system_instruction": system_instruction,
        }
        self._session_ctx = self.client.aio.live.connect(
            model=self.model_id, config=config
        )
        self.session = await self._session_ctx.__aenter__()
        self._turn_complete.set()  # ready for first send
        # Start the single-writer task
        self._sender_task = asyncio.create_task(self._send_loop())

    async def _send_loop(self):
        """Single coroutine that processes ALL sends sequentially.
        This eliminates ANY possibility of concurrent WebSocket writes."""
        try:
            while True:
                kind, payload = await self._send_queue.get()
                if kind == "_stop":
                    return
                try:
                    if kind == "text":
                        # Wait for previous model turn to finish before sending text
                        # This prevents interrupting Gemini mid-response
                        await asyncio.wait_for(self._turn_complete.wait(), timeout=30)
                        self._turn_complete.clear()
                        await self.session.send_client_content(
                            turns={"role": "user", "parts": [{"text": payload}]},
                            turn_complete=True,
                        )
                    elif kind == "audio":
                        audio_bytes = base64.b64decode(payload)
                        await self.session.send_realtime_input(
                            media=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                        )
                    elif kind == "frame":
                        frame_bytes = base64.b64decode(payload)
                        await self.session.send_realtime_input(
                            media=types.Blob(data=frame_bytes, mime_type="image/jpeg")
                        )
                except asyncio.TimeoutError:
                    print("Gemini: timed out waiting for turn_complete, sending anyway")
                    self._turn_complete.clear()
                    if kind == "text":
                        await self.session.send_client_content(
                            turns={"role": "user", "parts": [{"text": payload}]},
                            turn_complete=True,
                        )
                except Exception as e:
                    print(f"Gemini send error ({kind}): {e}")
                    return
        except asyncio.CancelledError:
            pass

    async def send_text(self, text: str) -> None:
        """Queue a text turn to be sent when the model's current turn finishes."""
        await self._send_queue.put(("text", text))

    async def send_audio(self, audio_b64: str) -> None:
        """Queue an audio chunk for sending."""
        await self._send_queue.put(("audio", audio_b64))

    async def send_frame(self, frame_b64: str) -> None:
        """Queue a screen frame for sending."""
        await self._send_queue.put(("frame", frame_b64))

    def mark_turn_complete(self):
        """Called by the receiver when model turn finishes."""
        self._turn_complete.set()

    async def listen(self) -> AsyncIterator[dict]:
        """Persistently yield messages from Gemini across ALL turns."""
        if not self.session:
            return
        while True:
            try:
                had_data = False
                async for message in self.session.receive():
                    had_data = True
                    sc = message.server_content
                    if sc and sc.model_turn:
                        for part in sc.model_turn.parts:
                            if part.text:
                                yield {"type": "text", "payload": part.text}
                            if part.inline_data:
                                audio_b64 = base64.b64encode(
                                    part.inline_data.data
                                ).decode("utf-8")
                                yield {"type": "audio", "payload": audio_b64}
                    if sc and sc.turn_complete:
                        # Signal that it's safe to send the next text turn
                        self._turn_complete.set()
                        yield {"type": "turn_complete"}
                if not had_data:
                    return
            except asyncio.CancelledError:
                return
            except Exception as e:
                print(f"Gemini receive error: {e}")
                return

    async def close(self) -> None:
        if self._sender_task:
            self._sender_task.cancel()
            try:
                await self._sender_task
            except asyncio.CancelledError:
                pass
            self._sender_task = None
        if self._session_ctx:
            try:
                await self._session_ctx.__aexit__(None, None, None)
            except Exception:
                pass
            finally:
                self._session_ctx = None
                self.session = None
