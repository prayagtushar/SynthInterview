
# AI Coding Interview Agent

## Gemini Live Agent Challenge — Live Agents Category

**Deadline:** March 16, 2026

---

# 1. Executive Summary

**InterviewAI** is a real-time AI coding interviewer powered by the **Gemini Live API**.

The agent conducts full technical coding interviews via **voice and screen share**, watching the candidate’s editor in real time, asking adaptive follow-up questions, detecting off-screen activity, providing contextual hints, and generating a recruiter scorecard after the interview.

> 🎯 **Core Value Proposition**  
> The only AI interviewer that can simultaneously **HEAR the candidate, SEE their screen, and THINK about their code — all in real time.**

### Hackathon Details

| Category | Live Agents |
|---|---|
| Primary Tech | Gemini Live API + Google ADK |
| Cloud Hosting | Google Cloud Run + Firestore |
| Voice Layer | ElevenLabs Persona Voice + Gemini Native TTS |
| Target Users | Recruiters, Bootcamps, Hiring Platforms |
| Estimated Build Time | 14 Days |

---

# 2. System Architecture

## 2.1 High-Level Architecture

The system consists of four primary layers:

1. Candidate Frontend
2. Backend Orchestration
3. AI Intelligence Layer
4. Cloud Infrastructure

| Layer | Component | Technology | Responsibility |
|---|---|---|---|
| Frontend | Candidate App | React + WebRTC | Screen share capture, audio stream, interview UI |
| Frontend | Recruiter Dashboard | React | View reports, configure sessions |
| Backend | API Server | FastAPI | Session management, REST API |
| Backend | Agent Core | Google ADK | Conversation flow, state machine |
| AI | Vision + Voice | Gemini Live API | Speech recognition, screen analysis |
| AI | Voice Persona | ElevenLabs | Human-like interviewer voice |
| Cloud | Hosting | Cloud Run | Containerized backend |
| Cloud | Database | Firestore | Session data, transcripts |
| Cloud | Storage | Cloud Storage | Snapshots, audio, reports |
| Cloud | Authentication | Firebase Auth | Candidate & recruiter authentication |

---

## 2.2 Data Flow

1. Candidate opens interview URL and authenticates via Firebase Auth.
2. Browser requests screen sharing via WebRTC `getDisplayMedia`.
3. Screen frames (5 fps) and microphone audio stream to backend via WebSocket.
4. Backend forwards audio + frames to Gemini Live API.
5. Gemini processes multimodal input.
6. ADK agent interprets output and decides next action.
7. Response text sent to ElevenLabs TTS.
8. Audio response streamed back to candidate.
9. All events logged to Firestore.
10. Post-session evaluation report generated.

---

# 3. Detailed Tech Stack

## 3.1 Frontend

| Tool | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | Latest | UI components |
| WebRTC | Native API | Screen + audio streaming |
| Socket.io | 4.x | WebSocket communication |
| Monaco Editor | Latest | Code preview |
| React Query | 5.x | Server state management |
| Zustand | 4.x | Client state |
| Framer Motion | 11.x | Animations |
| Recharts | 2.x | Dashboard charts |

---

## 3.2 Backend

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | 0.111 | REST API + WebSockets |
| Google ADK | Latest | Agent orchestration |
| google-genai SDK | Latest | Gemini Live integration |
| firebase-admin | 6.x | Firestore + Auth |
| google-cloud-storage | 2.x | File storage |
| Pillow | 10.x | Image processing |
| ElevenLabs SDK | Latest | Voice synthesis |
| Pydantic | 2.x | Validation |
| Uvicorn | 0.29 | ASGI server |
| Redis | 7.x | Session state |
| WeasyPrint | Latest | PDF generation |

---

## 3.3 Google Cloud Services

| Service | Usage |
|---|---|
| Cloud Run | Host backend |
| Firestore | Store sessions & transcripts |
| Cloud Storage | Store snapshots & reports |
| Firebase Auth | Authentication |
| Cloud Memorystore | Redis session state |
| Artifact Registry | Docker images |
| Cloud Build | CI/CD pipeline |
| Vertex AI | Gemini API access |
| Cloud Logging | Monitoring |
| Secret Manager | API key storage |

---

# 4. Complete Interview Flow

## Phase 0 — Pre-Session Setup

Recruiter configures session:

- Difficulty (Easy / Medium / Hard)
- Topic tags
- Time limit
- Number of problems

Firestore session structure:

```json
{
  "sessionId": "",
  "candidateEmail": "",
  "difficulty": "",
  "topics": [],
  "questionId": "",
  "startTime": ""
}
````

---

## Phase 1 — Environment Verification

Agent greets candidate.

Candidate must:

* Share full screen
* Open editor
* Close all files

Gemini checks:

* Editor in focus
* Clean workspace
* No browser tabs

---

## Phase 2 — Problem Statement

Agent reads problem aloud.

Candidate commands:

* “Repeat the question”
* “Explain simpler”

Agent confirms understanding.

---

## Phase 3 — Thinking Time

Candidate receives **1–2 minutes** thinking time.

Agent asks:

* Why that data structure?
* Time complexity?
* Edge cases?
* Scalability?

Approach scored (1-5).

---

## Phase 4 — Live Coding

Agent observes coding in real time.

Behaviors:

* Detect inactivity
* Provide hints if requested
* Detect cheating
* Monitor editor activity

---

## Phase 5 — Testing

Agent provides test cases:

1. Basic
2. Edge
3. Stress

Gemini reads terminal output and logs pass/fail.

---

## Phase 6 — Optimization

Agent asks candidate to optimize solution.

Gemini verifies:

* Time complexity
* Space complexity

---

## Phase 7 — Wrap-Up

Agent ends session.

System generates:

* Transcript
* Evaluation report
* Recruiter PDF

---

# 5. Agent State Machine

| State            | Entry              | Exit                |
| ---------------- | ------------------ | ------------------- |
| IDLE             | Session created    | Candidate joins     |
| GREETING         | Candidate connects | Screen share active |
| ENV_CHECK        | Screen detected    | Clean workspace     |
| PROBLEM_DELIVERY | Env verified       | Candidate confirms  |
| THINK_TIME       | Problem understood | Timer expires       |
| APPROACH_LISTEN  | Thinking done      | Questions complete  |
| CODING           | Approach accepted  | Candidate finished  |
| HINT_DELIVERY    | Hint requested     | Hint delivered      |
| TESTING          | Coding finished    | Tests complete      |
| OPTIMIZATION     | Tests passed       | Optimization done   |
| COMPLETED        | Interview finished | Session closed      |
| FLAGGED          | Cheat detected     | Warning issued      |

---

#
- Send structured prompt to Gemini (non-live, standard API): generate JSON scorecard
    with dimensions
- Scorecard dimensions: Problem Understanding (1- 5 ), Approach Quality (1-5), Code
    Quality (1-5), Test Performance (1-5), Communication (1-5), Optimization Ability (1-5),
    Overall Recommendation (Hire / No Hire / Strong Hire)
- Build PDF renderer using weasyprint: styled HTML template → PDF with company
    branding slots
- Upload PDF to Cloud Storage; store signed URL in Firestore session document
- Send email notification to recruiter with PDF link via Firebase Extension (email trigger)

#### TASK 10 — Question Bank (Day 12)

```
Checkpoint: 20+ questions seeded across 3 difficulties and 5 topic categories. Agent can
retrieve appropriate question based on session config.
```
- Design Firestore schema: questions/{id} → { title, description, difficulty, topics[], hints[],
    testCases[], solutions[], timeComplexity, spaceComplexity }
- Seed 20 questions: 6 Easy (Arrays, Strings), 8 Medium (Hashmaps, Binary Search,
    Sliding Window), 6 Hard (DP, Graphs, Trees)
- Build question selector: filter by session config, avoid repeats (check candidate history in
    Firestore)
- Add hint chain: each question has 3 progressive hints (directional only, never full
    solution)

#### TASK 11 — Polish, Testing & Demo Prep (Day 13-14)


Checkpoint: Full end-to-end demo recorded. Architecture diagram finalized. Cloud
deployment proven. GitHub README complete with spin-up instructions.

- End-to-end test: run 2 full mock interviews (Easy + Medium difficulty)
- Load test: simulate 3 concurrent sessions on Cloud Run — verify auto-scaling works
- Error handling audit: WebSocket disconnection recovery, Gemini API timeout fallback,
    TTS failure graceful degradation
- Record 4-minute demo video: open with cheat detection scene (high wow factor), show
    full flow, end with recruiter PDF report
- Create architecture diagram (Lucidchart or Excalidraw) showing all components and
    data flows
- Record GCP console screen showing Cloud Run deployment (proof of hosting)
- Write GitHub README: setup instructions, environment variables, local run guide,
    deploy guide
- Write Devpost submission: problem statement, solution description, tech used, learnings
- Optional: Publish Medium blog post with #GeminiLiveAgentChallenge for bonus points


# 7. Environment Variables

| Variable            | Description               |
| ------------------- | ------------------------- |
| GEMINI_API_KEY      | Gemini API key            |
| ELEVENLABS_API_KEY  | ElevenLabs key            |
| ELEVENLABS_VOICE_ID | Voice ID                  |
| FIREBASE_PROJECT_ID | Firebase project          |
| GCS_BUCKET_NAME     | Storage bucket            |
| REDIS_URL           | Redis instance            |
| GEMINI_MODEL        | gemini-2.0-flash-live-001 |

---

# 8. Hackathon Bonus Strategy

## Bonus 1 — Publish Content

Medium article:

**"How I Built a Real-Time AI Coding Interviewer with Gemini Live API"**

Use hashtag:

```
#GeminiLiveAgentChallenge
```

---

## Bonus 2 — Automated Cloud Deployment

Include:

* `cloudbuild.yaml`
* Terraform scripts
* Infrastructure configs

---

## Bonus 3 — Join Google Developer Group

Register and add GDG profile to submission.

---

# Final Outcome

A fully automated **AI coding interviewer** capable of conducting technical interviews with:

* Real-time voice interaction
* Screen monitoring
* Adaptive questioning
* Automated evaluation reports
