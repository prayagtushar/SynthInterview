# API

FastAPI service that orchestrates:
- Story analysis and long-context planning (Gemini)
- Panel image generation (Imagen)
- Real-time streaming over WebSockets
- Persistence in Firestore + Cloud Storage

## Run locally

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```
