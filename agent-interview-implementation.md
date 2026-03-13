### 6.1 Sprint Structure (14 Days)

#### TASK 1 — Project Setup & Boilerplate (Day 1)

```
Checkpoint: Monorepo initialized, GCP project created, CI/CD pipeline running, skeleton
apps deploy to Cloud Run.
```

- Initialize monorepo with pnpm workspaces: /apps/frontend, /apps/backend,
  /packages/shared
- Setup GCP project: enable Cloud Run, Firestore, Cloud Storage, Secret Manager,
  Firebase Auth APIs
- Create Dockerfile for FastAPI backend; push to Artifact Registry
- Deploy skeleton "hello world" FastAPI app to Cloud Run — get public URL for proof of
  deployment
- Setup Cloud Build trigger: git push to main → build → deploy
- Initialize React + Vite frontend with TypeScript and TailwindCSS
- Add Firebase Auth to frontend (email/password for recruiter, magic link for candidate)

#### TASK 2 — Gemini Live API Integration (Day 2-3)

```
Checkpoint: Can stream audio + image frames to Gemini Live API and receive real-time text
responses. Tested in isolation via CLI script.
```

- Install google-genai SDK; configure API key in Secret Manager
- Build GeminiLiveClient class: manages WebSocket connection to Gemini, handles
  stream lifecycle
- Implement audio chunk forwarding: PCM16 audio from WebSocket → Gemini audio
  input
- Implement image frame forwarding: JPEG frames (5 fps) → Gemini image input
- Parse Gemini streaming output: extract text tokens, tool calls, function responses
- Write unit test: mock a 30-second audio stream + 10 frames → validate coherent
  response received
- Handle interruptions: if candidate speaks mid-agent-response, Gemini stream is reset
  and restarted

#### TASK 3 — WebRTC Screen Capture Pipeline (Day 3-4)

```
Checkpoint: Browser captures screen, streams 5fps JPEG frames + audio over WebSocket
to backend successfully. Latency < 300ms.
```

- Frontend: implement getDisplayMedia() for full screen capture with audio
- Frontend: implement getUserMedia() for microphone capture
- Build canvas-based frame extractor: draw video frame to canvas every 200ms →
  toBlob(JPEG, 0.7)
- Backend: FastAPI WebSocket endpoint /ws/interview/{sessionId}
- Backend: accept binary frame chunks + audio chunks; route to GeminiLiveClient
- Test end-to-end: open VSCode, capture, send to Gemini, ask "what editor is open?" —
  verify correct answer

#### TASK 4 — ADK Agent & State Machine (Day 4-6)

```
Checkpoint: Full interview flow runs end-to-end in terminal (no UI). All 7 phases execute with
correct transitions. Agent asks appropriate questions at each phase.
```

- Define ADK Agent with tools: verify_environment, deliver_problem, log_approach,
  provide_hint, run_test_case, generate_report, flag_violation
- Implement InterviewStateMachine class with all 12 states and transition rules
- Build system prompt for Gemini: interviewer persona, rules (never give solution), hint
  policy, tone guidelines
- Implement Phase 1: env verification loop (check screen, prompt correction, confirm
  clean workspace)
- Implement Phase 2: problem delivery with repeat/simplify intents
- Implement Phase 3: think timer (asyncio timer), approach listening, probing Q bank
- Implement Phase 4: coding watch mode, idle detection (no keystrokes > 3 min), hint
  gating
- Implement Phase 5: test case delivery and terminal output reading
- Implement Phase 6: optimization check and complexity verification
- Implement Phase 7: wrap-up and async report trigger
- Write integration test: run full simulated interview with mock candidate responses

#### TASK 5 — Cheat Detection System (Day 6-7)

```
Checkpoint: Agent correctly detects browser open, tab switch, and phone/second screen in
3 test scenarios. Warnings are issued within 5 seconds.
```

- Build CheatDetector class powered by Gemini vision analysis on each screen frame
- Define detection rules: (a) non-editor app in foreground, (b) browser with search/AI sites
  visible, (c) multiple windows/splits showing non-code content
- Implement threshold logic: 2 consecutive flagged frames = soft warning; 5 = hard
  warning + log
- Add violation_log array to Firestore session document: { timestamp, type, screenshotRef
  }
- Capture and store screenshot at time of violation to Cloud Storage
- Integrate verbal warning into ADK agent tools: call warn_candidate(reason) tool

- Surface violations in recruiter dashboard report with timestamps

#### TASK 6 — ElevenLabs Voice Persona (Day 7-8)

```
Checkpoint: Agent speaks with a consistent named persona voice. Latency from text to first
audio byte < 600ms. Handles interruptions gracefully.
```

- Create ElevenLabs voice: clone or select a professional neutral voice; name the persona
  (e.g., "Alex")
- Build ElevenLabsTTSClient: async text → streaming audio via ElevenLabs websocket
  TTS API
- Implement audio queue: ADK agent outputs text chunks → queue → TTS → audio
  stream to candidate
- Implement interruption handling: candidate speech detected → drain audio queue →
  reset TTS stream
- Fallback: if ElevenLabs latency > 1s, switch to Gemini native TTS (lower latency, less
  natural)
- Add voice settings: speaking rate, stability, clarity tuned for interview context (clear,
  measured pace)

#### TASK 7 — Frontend Interview UI (Day 8-10)

```
Checkpoint: Candidate can join interview, share screen, hear agent voice, see question
overlay, and view timer — all in one clean interface.
```

- Build /interview/[sessionId] page with: (a) screen share preview thumbnail, (b) agent
  avatar with speaking animation, (c) question overlay panel, (d) interview phase progress
  bar, (e) countdown timer
- Build audio visualizer: show waveform when agent is speaking vs. when candidate is
  speaking
- Implement mute/unmute control and screen share toggle with visual indicators
- Add hint request button (keyboard shortcut: H) that triggers verbal hint request
- Build "I'm Done" button for each phase transition that sends verbal + programmatic
  signal
- Implement connection status indicator: WebSocket health, Gemini stream health
- Add /waiting room page for before session start
- Mobile-responsive layout (tablet fallback)

#### TASK 8 — Recruiter Dashboard (Day 10-11)

```
Checkpoint: Recruiter can create sessions, view live active interviews, and access past
interview reports with scorecard and violation log.
```

- Build /dashboard page: list of past and active sessions
- Session creation wizard: select topic, difficulty, candidate email, send invite
- Live monitor view: see active session phase, time elapsed, violation count in real time
  via Firestore listeners
- Report view: expandable scorecard with all dimensions, code snapshots, violation
  timeline
- PDF download button: fetches report from Cloud Storage
- Bulk invite: CSV upload for multiple candidates

#### TASK 9 — Post-Interview Report Generation (Day 11-12)

```
Checkpoint: Within 2 minutes of session end, a structured PDF report is available in recruiter
dashboard with all evaluation dimensions filled.
```

- Build Firestore listener: trigger report generation on session status = COMPLETED
- Assemble session context: full transcript, approach notes, test results, optimization
  outcome, violation log
- Send structured prompt to Gemini (non-live, standard API): generate JSON scorecard
  with dimensions
- Scorecard dimensions: Problem Understanding (1- 5 ), Approach Quality (1-5), Code
  Quality (1-5), Test Performance (1-5), Communication (1-5), Optimization Ability (1-5),
  Overall Recommendation (Hire / No Hire / Strong Hire)
- Build PDF renderer using weasyprint: styled HTML template → PDF with company
  branding slots
- Upload PDF to Cloud Storage; store signed URL in Firestore session document
- Send email notification to recruiter with PDF link via Firebase Extension (email trigger)
