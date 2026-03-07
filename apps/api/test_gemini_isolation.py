import asyncio
import os
import base64
from dotenv import load_dotenv
from app.gemini_client import GeminiLiveClient

load_dotenv()

async def run_isolation_test():
    api_key = os.getenv("GEMINI_API_KEY")
    model_id = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment")
        return

    print(f"Connecting to Gemini Live ({model_id})...")
    client = GeminiLiveClient(api_key, model_id)
    
    try:
        await client.connect(system_instruction="You are a test assistant. Respond briefly to confirm you can hear and see.")
        print("Connected! Sending mock data...")

        # 1. Send text greeting
        await client.send_text("Hello Gemini, this is an isolation test. Can you hear me?")

        # 2. Mock some frames (using small 1x1 transparent pixel for test simplicity)
        pixel_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        for i in range(5):
            await client.send_frame(pixel_b64)
            await asyncio.sleep(0.5)

        # 3. Listen for response
        print("Listening for responses (waiting 5 seconds)...")
        
        async def receive():
            async for message in client.listen():
                if message["type"] == "text":
                    print(f"Gemini says: {message['payload']}")
                elif message["type"] == "audio":
                    print(f"Gemini sent {len(message['payload'])} bytes of audio data")

        try:
            await asyncio.wait_for(receive(), timeout=10.0)
        except asyncio.TimeoutError:
            print("Finished listening.")

    except Exception as e:
        print(f"Test Failed: {e}")
    finally:
        await client.close()
        print("Test Complete.")

if __name__ == "__main__":
    asyncio.run(run_isolation_test())
