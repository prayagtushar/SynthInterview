# SynthInterview API

The backend orchestration service for SynthInterview, built with FastAPI. It handles the real-time interaction between the candidate, the Gemini Live API, and the code execution environment.

## Capabilities

- **AI Interview Orchestration:** Manages real-time voice and text dialogue using the Gemini 2.5 Flash Live API.
- **Code Execution Engine:** Securely runs candidate code against test cases for Python, JavaScript, and TypeScript.
- **Automated Proctoring:** Analyzes video and screen frames in real-time to detect integrity violations.
- **Evaluation & Scorecards:** Generates comprehensive performance reports using AI-driven analysis.
- **Communication:** Sends session invites and post-interview scorecards via SMTP.
- **Persistence:** Stores session data, proctoring artifacts, and reports in Firebase Firestore and Google Cloud Storage.

## Technical Stack

- **Framework:** FastAPI
- **AI Integration:** Google GenAI SDK (Gemini Live API)
- **Database:** Firebase Firestore
- **Storage:** Google Cloud Storage
- **Task Management:** Asyncio

## Local Development

Ensure you have configured the `.env` file in this directory based on `.env.example`.

### Setup

```bash
uv venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
uv pip install -r requirements.txt
```

### Running the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API documentation will be available at `http://localhost:8000/docs`.
