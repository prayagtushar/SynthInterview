<div align="center">
  <h1>SYNTHINTERVIEW</h1>
  <p><b>Automated AI-Powered Technical Interviews</b></p>
</div>

---

SynthInterview is an intelligent orchestration platform designed to conduct complete technical coding interviews autonomously. It combines real-time video, audio processing, and code compilation to simulate a rigorous, structured, and fair interview process.

<br />

### Core Capabilities

- **Real-Time AI Interaction**  
  Low-latency spoken conversations powered by the Gemini Live API, handling dynamic dialogue seamlessly.

- **Integrated IDE**  
  A fully featured browser-based coding environment with syntax highlighting, supporting multiple languages.

- **Live Code Execution**  
  Secure, sandboxed runtime environments for instant candidate code validation and execution.

- **Active Proctoring**  
  Vision-based cheat detection that monitors for split screens, unauthorized IDEs, and AI assistance tools.

- **Automated Evaluation**  
  Detailed post-interview scorecards that analyze communication, approach, code quality, correctness, and time management.

<br />

### Stack & Architecture

The project is built as a monorepo utilizing Turborepo for synchronized cross-stack development.

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Python, FastAPI, WebSockets
- **AI Orchestration:** Google Gemini 2.0 Flash
- **Infrastructure:** Firebase Firestore, Google Cloud Storage
- **Tooling:** Bun, Docker

```text
synth-interview/
├── apps/
│   ├── web/                (Next.js Frontend)
│   └── api/                (FastAPI Orchestrator)
├── packages/
│   ├── config/             (Shared Configurations)
│   └── types/              (Shared TypeScript Definitions)
└── turbo.json              (Monorepo Root)
```

<br />

### Getting Started

**Prerequisites**
Ensure you have [Bun](https://bun.sh/) and Python installed on your system.

**1. Install dependencies**

```bash
bun install
```

**2. Environment Configuration**
Duplicate the provided example environment files and add your API keys.

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

**3. Launch Development Server**

```bash
bun run dev
```

The services will initialize across their respective local ports:

- Web Interface: `http://localhost:3000`
- API Server: `http://localhost:8000`

<br />

### Docker Deployment

For a fully containerized environment, you can build and run both services using Docker Compose.

```bash
docker compose up --build
```
