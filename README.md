<div align="center">

# SynthInterview

**Autonomous AI Technical Interviews powered by Gemini Live API.**

SynthInterview conducts end-to-end technical coding interviews. Using multimodal analysis, it watches the candidate's screen, listens to their logic, engages in real-time dialogue, and generates a comprehensive performance scorecard instantly.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-synthinterview.xyz-black?style=flat-square)](https://synthinterview.xyz/)
[![Gemini Live API](https://img.shields.io/badge/Gemini%20Live%20API-8E24AA?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](./LICENSE)

> **Demo Passcode:** `SYNTH2025`

</div>

---

## Architecture

![Architecture Diagram](./ARCHITECTURE_SIMPLE.png)

## The Multimodal Interviewer

SynthInterview replaces static prompts with a dynamic, multimodal interviewer that "sees" and "hears" the candidate just like a human would.

| Feature | Description |
|---|---|
| **Real-time Voice** | Low-latency, natural dialogue powered by the Gemini 2.5 Flash Live API. |
| **Vision-Aware** | Watches the Monaco editor in real-time to follow the candidate's coding logic and approach. |
| **Active Proctoring** | Automatically flags tab switches, unauthorized AI tools, and behavioral anomalies. |
| **Integrated IDE** | A seamless, in-browser Monaco editor environment supporting multiple languages. |
| **AI Scorecards** | Deep-dive evaluation of technical proficiency, communication, and problem-solving. |

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, Monaco Editor, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python 3.12, Google GenAI SDK |
| **AI Models** | Gemini 2.5 Flash Live (Multimodal) · Gemini 2.5 Flash (Processing) |
| **Cloud** | Google Cloud Run, Firestore, Cloud Storage, Firebase Auth |
| **Infrastructure** | Turborepo, Bun, Docker, uv |

---

## Project Structure

```
SynthInterview/
├── apps/
│   ├── web/          # Next.js frontend (Candidate & Recruiter portals)
│   └── api/          # FastAPI backend (AI Orchestration & Vision processing)
├── packages/
│   └── types/        # Shared TypeScript definitions
├── cloudbuild.yaml   # Automated CI/CD for GCP
└── deploy.sh         # One-click deployment script
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (Package Manager)
- [Python 3.10+](https://www.python.org/)
- [uv](https://astral.sh/uv) (Python Package Manager)

### 1. Installation

```bash
git clone https://github.com/prayagtushar/SynthInterview.git
cd SynthInterview
```

### 2. Configuration

Copy the example environment files and fill in your credentials from Google AI Studio and Firebase.

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### 3. Local Development

Start both the frontend and backend with a single command:

```bash
# For macOS / Linux
bun run setup:mac && bun run dev

# For Windows
bun run setup:windows && bun run dev
```

---

## Deployment

Continuous Deployment is configured via Google Cloud Build. Shifting to production is handled automatically on every push to `main`.

```bash
# Manual deployment trigger
./deploy.sh
```

| Service | Endpoint |
|---|---|
| **Frontend** | [synth-interview-web](https://synth-interview-web-1082839508369.asia-south1.run.app) |
| **API** | [synth-interview-api](https://synth-interview-api-1082839508369.asia-south1.run.app) |

---

<div align="center">

Built for the **Gemini Live Agent Challenge** · MIT License

</div>
