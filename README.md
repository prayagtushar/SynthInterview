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

<details>
<summary><strong>🍎 macOS Setup</strong></summary>

#### Prerequisites

Before setting up the project, ensure you have the following installed on your Mac:

| Tool                  | Required Version | Installation                                                                    |
| --------------------- | ---------------- | ------------------------------------------------------------------------------- | ----- |
| **Bun**               | Latest           | `curl -fsSL https://bun.sh/install                                              | bash` |
| **Python**            | 3.10+            | Pre-installed or via `brew install python@3.11`                                 |
| **Redis**             | Latest           | `brew install redis` then `brew services start redis`                           |
| **Docker** (optional) | Latest           | [Download from Docker website](https://www.docker.com/products/docker-desktop/) |

#### Setup Steps

1. **Install Homebrew** (if not installed):

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Redis**:

   ```bash
   brew install redis
   brew services start redis
   ```

3. **Install Bun**:

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

4. **Verify installations**:

   ```bash
   bun --version        # Should show version
   python3 --version    # Should show 3.10+
   redis-cli ping       # Should return PONG
   ```

5. **Install dependencies**:

   ```bash
   bun install
   ```

6. **Configure environment**:

   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   ```

7. **Start development servers**:
   ```bash
   bun run dev
   ```

Access the application at:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`

</details>

<details>
<summary><strong>🪟 Windows Setup</strong></summary>

#### Prerequisites

| Tool                  | Required Version | Installation                                                                                  |
| --------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| **Bun**               | Latest           | `winget install oven-sh.bun` or [Download installer](https://github.com/oven-sh/bun/releases) |
| **Python**            | 3.10+            | [Download from python.org](https://www.python.org/downloads/)                                 |
| **Redis**             | Latest           | [Download Redis for Windows](https://github.com/tporadowski/redis/releases) or use WSL        |
| **Docker** (optional) | Latest           | [Download from Docker website](https://www.docker.com/products/docker-desktop/)               |

#### Setup Steps (Windows)

1. **Install Python**:
   - Download Python 3.11+ from [python.org](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"

2. **Install Bun**:

   ```powershell
   winget install oven-sh.bun
   ```

   Or download from [GitHub releases](https://github.com/oven-sh/bun/releases)

3. **Install Redis** (choose one method):

   **Option A - Using WSL (Recommended)**:

   ```bash
   # Install WSL first
   wsl --install
   # Then in Ubuntu/WSL
   sudo apt update
   sudo apt install redis-server
   redis-server --daemonize yes
   ```

   **Option B - Using Memurai or Redis Windows port**:
   - Download [Memurai](https://www.memurai.com/) (free) or
   - Download Redis from [GitHub](https://github.com/tporadowski/redis/releases)

4. **Verify installations** (in PowerShell):

   ```powershell
   bun --version
   python --version    # Or python3 --version
   redis-cli ping      # If using WSL or Redis in PATH
   ```

5. **Install dependencies**:

   ```powershell
   bun install
   ```

6. **Configure environment**:

   ```powershell
   # In PowerShell
   copy .env.example .env
   copy apps\web\.env.example apps\web\.env
   copy apps\api\.env.example apps\api\.env
   ```

7. **Start development servers**:
   ```powershell
   bun run dev
   ```

Access the application at:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`

</details>

### Quick Start (Docker Alternative)

For a fully containerized environment without manual installations:

```bash
docker compose up --build
```
