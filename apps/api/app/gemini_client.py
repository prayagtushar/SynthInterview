import base64
import asyncio
from typing import AsyncIterator, Optional, List, Dict, Any
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
        # Separate queues: realtime (audio/frames) never blocked by text turns
        self._realtime_queue: asyncio.Queue = asyncio.Queue()
        self._text_queue: asyncio.Queue = asyncio.Queue()
        self._realtime_task: asyncio.Task | None = None
        self._text_task: asyncio.Task | None = None
        # Signals when model turn is complete (safe to send next text)
        self._turn_complete = asyncio.Event()

    async def connect(self, system_instruction: str, tools: Optional[List[Dict]] = None) -> None:
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=system_instruction,
            tools=tools,
            realtime_input_config=types.RealtimeInputConfig(
                automatic_activity_detection=types.AutomaticActivityDetection(
                    disabled=False,
                    startOfSpeechSensitivity=types.StartSensitivity.START_SENSITIVITY_HIGH,
                    endOfSpeechSensitivity=types.EndSensitivity.END_SENSITIVITY_HIGH,
                    silenceDurationMs=500,
                )
            ),
        )
        self._session_ctx = self.client.aio.live.connect(
            model=self.model_id, config=config
        )
        self.session = await self._session_ctx.__aenter__()
        self._turn_complete.set()  # ready for first send
        # Start two independent sender tasks
        self._realtime_task = asyncio.create_task(self._realtime_loop())
        self._text_task = asyncio.create_task(self._text_loop())

    async def _realtime_loop(self):
        """Drains audio and frame sends immediately — never blocked by text turns."""
        try:
            while True:
                kind, payload = await self._realtime_queue.get()
                if kind == "_stop":
                    return
                try:
                    raw = base64.b64decode(payload)
                    mime = "audio/pcm;rate=16000" if kind == "audio" else "image/jpeg"
                    await self.session.send_realtime_input(
                        media=types.Blob(data=raw, mime_type=mime)
                    )
                except Exception as e:
                    print(f"Gemini realtime send error ({kind}): {e}")
        except asyncio.CancelledError:
            pass

    async def _text_loop(self):
        """Sends text turns only after the model's current turn finishes."""
        try:
            while True:
                kind, payload = await self._text_queue.get()
                if kind == "_stop":
                    return
                try:
                    await asyncio.wait_for(self._turn_complete.wait(), timeout=30)
                    self._turn_complete.clear()
                    await self.session.send_client_content(
                        turns={"role": "user", "parts": [{"text": payload}]},
                        turn_complete=True,
                    )
                except asyncio.TimeoutError:
                    print("Gemini: timed out waiting for turn_complete, sending anyway")
                    self._turn_complete.clear()
                    await self.session.send_client_content(
                        turns={"role": "user", "parts": [{"text": payload}]},
                        turn_complete=True,
                    )
                except Exception as e:
                    print(f"Gemini text send error: {e}")
        except asyncio.CancelledError:
            pass

    async def send_text(self, text: str) -> None:
        """Queue a text turn to be sent when the model's current turn finishes."""
        await self._text_queue.put(("text", text))

    async def send_text_urgent(self, text: str) -> None:
        """Send immediately, interrupting the model's current turn."""
        if not self.session:
            return
        self._turn_complete.clear()  # prevent text_loop from sending until new turn ends
        await self.session.send_client_content(
            turns={"role": "user", "parts": [{"text": text}]},
            turn_complete=True,
        )

    async def send_audio(self, audio_b64: str) -> None:
        """Queue an audio chunk — never blocked by text turns."""
        await self._realtime_queue.put(("audio", audio_b64))

    async def send_frame(self, frame_b64: str) -> None:
        """Queue a screen frame — never blocked by text turns."""
        await self._realtime_queue.put(("frame", frame_b64))

    def mark_turn_complete(self):
        """Called by the receiver when model turn finishes."""
        self._turn_complete.set()

    async def send_tool_response(self, call_id: str, name: str, output: Any) -> None:
        """Sends the result of a tool call back to Gemini."""
        await self.session.send_client_content(
            turns=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part(
                            function_response=types.FunctionResponse(
                                name=name,
                                id=call_id,
                                response={"result": output},
                            )
                        )
                    ],
                )
            ],
            turn_complete=True,
        )

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
                            if part.function_call:
                                yield {
                                    "type": "tool_call",
                                    "payload": {
                                        "name": part.function_call.name,
                                        "args": part.function_call.args,
                                        "id": part.function_call.id,
                                    },
                                }
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
        for task in [self._realtime_task, self._text_task]:
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        self._realtime_task = None
        self._text_task = None
        if self._session_ctx:
            try:
                await self._session_ctx.__aexit__(None, None, None)
            except Exception:
                pass
            finally:
                self._session_ctx = None
                self.session = None
        # Drain any pending SDK background tasks to suppress
        # "Task exception never retrieved" from BaseApiClient.aclose()
        # (known issue: Live API uses WebSocket, so _async_httpx_client is never set)
        await asyncio.sleep(0)
