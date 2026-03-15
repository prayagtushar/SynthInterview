# SynthInterview Web

The frontend application for SynthInterview, providing a high-fidelity interface for both candidates and recruiters.

## Features

- **Candidate Interface:**
  - Real-time voice interaction with visual feedback.
  - Integrated Monaco Editor with multi-language support.
  - Live proctoring indicators and security banners.
  - Dynamic session progress tracking.
- **Recruiter Portal:**
  - Session initialization and candidate invite management.
  - Deep-dive scorecard analysis with AI commentary.
  - Integrity audit logs with captured proctoring flags.
- **System:**
  - Real-time WebSocket synchronization with the backend.
  - Modern, responsive design using Tailwind CSS.
  - High-performance animations powered by Framer Motion.

## Technical Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Editor:** @monaco-editor/react
- **Database (Client):** Firebase SDK

## Local Development

Ensure you have configured the `.env` file in this directory based on `.env.example`.

### Setup

```bash
bun install
```

### Running the App

```bash
bun run dev
```

The application will be accessible at `http://localhost:3000`.
