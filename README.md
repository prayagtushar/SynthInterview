# SynthInterview Monorepo

Monorepo for SynthInterview with a synchronized frontend and backend.

## Architecture

```text
synth-interview/
├── apps/
│   ├── web/                # Next.js + Tailwind (Frontend)
│   └── api/                # Python FastAPI (AI orchestrator)
├── packages/
│   ├── config/             # Shared configs
│   └── types/              # Shared TypeScript definitions
├── bun.lock
├── turbo.json
└── package.json            # Workspace root
```

## Stack

- Monorepo: Turborepo
- Package manager: Bun
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: FastAPI + WebSockets
- AI layer: Gemini (director) + Imagen (artist)
- Database: Cloud Firestore
- Storage: Google Cloud Storage

## Development

```bash
bun install
bun run dev
```

This starts web on `http://localhost:3000` and API on `http://localhost:8000`.

## Environment

Copy and customize:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

## Docker

Build and run both services:

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
