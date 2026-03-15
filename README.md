# SynthInterview

SynthInterview is an intelligent orchestration platform designed to conduct autonomous technical coding interviews. It integrates real-time video and audio processing with a live coding environment to provide a structured and objective evaluation process.

The platform is powered by the Gemini Live API for low-latency dialogue and vision-based analysis, enabling it to act as a senior technical interviewer.

## Demo Access

To access all features of SynthInterview, enter the passcode **`SYNTH2025`** on the login page.

## Features

- **Real-Time Voice Interaction:** Low-latency conversations powered by the Gemini Live API.
- **Multimodal Evaluation:** Live video and screen analysis for behavioral and technical assessment.
- **Integrated Code Environment:** A browser-based IDE with syntax highlighting and multi-language support.
- **Automated Scorecards:** Comprehensive post-interview analysis of technical and communication skills.
- **Integrity Monitoring:** Automated proctoring to ensure session fairness.

## Project Structure

This project is a monorepo managed with Turborepo.

- **`apps/web`**: Next.js frontend application.
- **`apps/api`**: FastAPI backend server for AI orchestration.
- **`packages/types`**: Shared TypeScript definitions.

## Setup and Installation

### Prerequisites

| Tool   | Version | Link                                  |
| :----- | :------ | :------------------------------------ |
| Bun    | Latest  | [bun.sh](https://bun.sh/)             |
| Python | 3.10+   | [python.org](https://www.python.org/) |
| uv     | Latest  | [astral.sh/uv](https://astral.sh/uv)  |

### Configuration

Before running the application, configure the environment variables by copying the example files:

1. **Root Directory:** `copy .env.example .env`
2. **Apps/Web:** `copy apps/web/.env.example apps/web/.env`
3. **Apps/API:** `copy apps/api/.env.example apps/api/.env`

Required configuration includes:

- **GEMINI_API_KEY**: Obtain from [Google AI Studio](https://aistudio.google.com/app/apikey).
- **FIREBASE_SERVICE_ACCOUNT_JSON**: Service account credentials from the Firebase Console.
- **Firebase Public Keys**: Client-side keys (`API_KEY`, `PROJECT_ID`, etc.) for the frontend.
- **GCS_BUCKET_NAME**: Google Cloud Storage bucket for storing proctoring artifacts.
- **SMTP Settings**: (Optional) For sending session invites and scorecards via email.

<details>
<summary><b>Windows Setup</b></summary>

Run the following command in PowerShell:

```powershell
bun run setup:windows
```

</details>

<details>
<summary><b>macOS Setup</b></summary>

Run the following command in your terminal:

```bash
bun run setup:mac
```

</details>

## Building the Application
```bash
bun run build
```

## Running the Application

To start both the frontend and backend development servers simultaneously:

```bash
bun run dev
```

The services will be available at:

- Frontend: `https://synth-interview-web-1082839508369.asia-south1.run.app`
- API Backend: `https://synth-interview-api-1082839508369.asia-south1.run.app`

## Deployment

Automated deployment scripts for Google Cloud Platform (GCP) are available in `deploy.sh` and `cloudbuild.yaml`.
