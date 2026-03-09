"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { useInterview } from "../../lib/useInterview";
import {
  Mic,
  MicOff,
  Monitor,
  Play,
  ChevronRight,
  Terminal,
  User,
  CircleDot,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  WifiOff,
} from "lucide-react";

// State badge colors
const STATE_COLORS: Record<string, string> = {
  IDLE: "bg-gray-800 text-gray-400",
  GREETING: "bg-blue-900/50 text-blue-300",
  ENV_CHECK: "bg-yellow-900/50 text-yellow-300",
  PROBLEM_DELIVERY: "bg-purple-900/50 text-purple-300",
  THINK_TIME: "bg-indigo-900/50 text-indigo-300",
  APPROACH_LISTEN: "bg-cyan-900/50 text-cyan-300",
  CODING: "bg-green-900/50 text-green-300",
  HINT_DELIVERY: "bg-orange-900/50 text-orange-300",
  TESTING: "bg-teal-900/50 text-teal-300",
  OPTIMIZATION: "bg-pink-900/50 text-pink-300",
  COMPLETED: "bg-emerald-900/50 text-emerald-300",
  FLAGGED: "bg-red-900/50 text-red-300",
  SCREEN_NOT_VISIBLE: "bg-amber-900/50 text-amber-300",
};

const STATE_ICONS: Record<string, React.ReactNode> = {
  IDLE: <CircleDot size={12} />,
  GREETING: <User size={12} />,
  ENV_CHECK: <Monitor size={12} />,
  PROBLEM_DELIVERY: <FileText size={12} />,
  THINK_TIME: <span className="text-xs">💭</span>,
  APPROACH_LISTEN: <span className="text-xs">🗣</span>,
  CODING: <Play size={12} />,
  HINT_DELIVERY: <Lightbulb size={12} />,
  TESTING: <Terminal size={12} />,
  OPTIMIZATION: <span className="text-xs">⚡</span>,
  COMPLETED: <CheckCircle size={12} />,
  FLAGGED: <AlertTriangle size={12} />,
  SCREEN_NOT_VISIBLE: <WifiOff size={12} />,
};

// State transitions the user can manually trigger (for testing / button controls)
const MANUAL_TRANSITIONS: Record<
  string,
  { label: string; event: string; icon: React.ReactNode }[]
> = {
  GREETING: [
    {
      label: "Share Screen & Mic",
      event: "screen_share_active",
      icon: <Monitor size={12} />,
    },
  ],
  ENV_CHECK: [],
  PROBLEM_DELIVERY: [
    {
      label: "I Understand",
      event: "candidate_ready",
      icon: <CheckCircle size={12} />,
    },
  ],
  THINK_TIME: [
    { label: "Skip Timer", event: "timer_expired", icon: <Play size={12} /> },
  ],
  APPROACH_LISTEN: [
    {
      label: "Accept Approach",
      event: "approach_accepted",
      icon: <CheckCircle size={12} />,
    },
  ],
  CODING: [
    {
      label: "Request Hint",
      event: "hint_requested",
      icon: <Lightbulb size={12} />,
    },
    {
      label: "Done Coding",
      event: "coding_finished",
      icon: <CheckCircle size={12} />,
    },
  ],
  TESTING: [
    {
      label: "Tests Passed",
      event: "tests_passed",
      icon: <CheckCircle size={12} />,
    },
  ],
  OPTIMIZATION: [
    {
      label: "Done Optimizing",
      event: "optimization_finished",
      icon: <CheckCircle size={12} />,
    },
  ],
  FLAGGED: [
    {
      label: "Acknowledged",
      event: "warning_acknowledged",
      icon: <CheckCircle size={12} />,
    },
  ],
  SCREEN_NOT_VISIBLE: [
    {
      label: "Share Screen Again",
      event: "screen_share_active",
      icon: <Monitor size={12} />,
    },
  ],
};

export default function SessionView() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("id") || "default-session",
    [searchParams],
  );

  const {
    isConnected,
    feedback,
    currentState,
    screenLost,
    isSpeaking,
    isUserSpeaking,
    isThinking,
    violationReason,
    tabSwitchWarning,
    isTerminated,
    connect,
    disconnect,
    sendEvent,
    reshareScreen,
    stopScreenShare,
    acquireAndStartMedia,
  } = useInterview(sessionId);

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "scorecard">(
    "feedback",
  );
  const [code, setCode] = useState(
    `// Your solution here\n// The AI is watching and listening...\n\nfunction solve(nums, target) {\n  // Write your solution\n}\n`,
  );
  const feedbackRef = useRef<HTMLDivElement>(null);
  // Track current state in a ref for Monaco paste handler closure
  const currentStateForPaste = useRef(currentState);

  // Keep paste-handler ref in sync with currentState
  useEffect(() => {
    currentStateForPaste.current = currentState;
  }, [currentState]);

  // Auto-scroll feedback to top (newest first)
  useEffect(() => {
    if (feedbackRef.current) {
      feedbackRef.current.scrollTop = 0;
    }
  }, [feedback]);

  if (isTerminated) {
    return (
      <div className="flex h-screen bg-[#0d0d0d] items-center justify-center font-mono">
        <div className="text-center space-y-5 max-w-sm px-6">
          <XCircle size={52} className="text-red-500 mx-auto" />
          <p className="text-white font-bold text-2xl tracking-tight">
            Interview Terminated
          </p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            This interview session was ended due to a policy violation.
            The recruiter has been notified of the result.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-5 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const stateColor = STATE_COLORS[currentState] || "bg-gray-800 text-gray-400";
  const stateIcon = STATE_ICONS[currentState] || <CircleDot size={12} />;
  const transitions = MANUAL_TRANSITIONS[currentState] || [];

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden font-mono">
      {/* ── Left Sidebar ─────────────────────────────────────────── */}
      <div className="w-14 flex flex-col items-center py-5 border-r border-white/5 gap-6 bg-[#080808]">
        <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black text-xs rounded-sm cursor-pointer select-none">
          S
        </div>

        <div className="flex flex-col gap-5 mt-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
            className={`p-2 rounded-md transition-colors ${
              isMuted
                ? "bg-red-900/60 text-red-300"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={
              screenLost
                ? reshareScreen
                : isConnected
                  ? stopScreenShare
                  : undefined
            }
            title={
              screenLost
                ? "Click to reshare screen"
                : isConnected
                  ? "Click to stop screen share"
                  : "Screen share inactive"
            }
            className={`p-2 rounded-md transition-colors ${
              screenLost
                ? "text-amber-400 animate-pulse hover:bg-amber-900/30"
                : isConnected
                  ? "text-green-400 hover:bg-white/5"
                  : "text-gray-600"
            }`}
          >
            <Monitor size={18} />
          </button>
        </div>

        <div className="mt-auto mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border border-white/10">
            <User size={16} />
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 border-b border-white/5 flex items-center justify-between px-5 bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              SynthInterview
            </span>
            <div className="h-3 w-px bg-white/10 mx-1" />
            {/* Current State Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${stateColor}`}
            >
              {stateIcon}
              {currentState.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 4-state audio indicator: Speaking / Thinking / Listening / Offline */}
            {(() => {
              const s = isSpeaking
                ? { dot: "bg-blue-400",  text: "text-blue-400",  label: "Speaking"  }
                : isThinking
                ? { dot: "bg-amber-400", text: "text-amber-400", label: "Thinking…" }
                : isConnected
                ? { dot: "bg-green-400", text: "text-green-400", label: "Listening" }
                : { dot: "bg-red-500",   text: "text-red-400",   label: "AI Offline" };
              return (
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.dot}`} />
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${s.text}`}>
                    {s.label}
                  </span>
                </div>
              );
            })()}

            {!isConnected ? (
              <button
                id="start-interview-btn"
                onClick={connect}
                className="flex items-center gap-2 bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                <CircleDot size={12} className="animate-pulse text-red-500" />
                Start Interview
              </button>
            ) : (
              <button
                id="end-interview-btn"
                onClick={disconnect}
                className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 text-red-400 px-3 py-1 rounded text-xs font-bold hover:bg-red-900/40 transition-colors"
              >
                <XCircle size={12} />
                End
              </button>
            )}
          </div>
        </header>

        {/* Interruption warning — shown when user speaks while agent is speaking */}
        {isSpeaking && isUserSpeaking && (
          <div className="flex items-center gap-2 px-5 py-1.5 bg-blue-950/60 border-b border-blue-800/40 shrink-0">
            <span className="text-[10px] text-blue-300 font-medium">
              Synth is speaking — please listen and wait for your turn.
            </span>
          </div>
        )}

        {/* Screen Share Lost Banner */}
        {screenLost && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-amber-950/60 border-b border-amber-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">
                Screen share stopped — the interviewer is waiting for you to reshare your screen.
              </span>
            </div>
            <button
              onClick={reshareScreen}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded transition-colors"
            >
              <Monitor size={12} />
              Share Screen Again
            </button>
          </div>
        )}

        {/* Tab Switch Warning Banner */}
        {tabSwitchWarning && (
          <div className="flex items-center px-5 py-2 bg-orange-950/60 border-b border-orange-800/50 shrink-0">
            <AlertTriangle size={14} className="text-orange-400 mr-2 shrink-0" />
            <span className="text-xs text-orange-300 font-medium">
              Tab switch detected — {tabSwitchWarning.count}/{tabSwitchWarning.max} warnings used.
              {tabSwitchWarning.count >= tabSwitchWarning.max
                ? " Interview terminated."
                : " One more will end the interview."}
            </span>
          </div>
        )}

        {/* Cheat Violation Banner */}
        {currentState === "FLAGGED" && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-red-950/60 border-b border-red-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-300 font-medium">
                VIOLATION DETECTED: {violationReason || "Suspicious activity detected"}
              </span>
            </div>
            <button
              onClick={() => sendEvent("warning_acknowledged")}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Editor + AI Panel */}
        <div className="flex-1 flex min-h-0 relative">
          {/* ENV_CHECK overlay — shown while environment is being verified */}
          {currentState === "ENV_CHECK" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/85 z-20 gap-5">
              <div className="w-12 h-12 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-white font-bold text-lg tracking-wide uppercase">
                  Environment Check
                </p>
                <p className="text-neutral-400 text-xs text-center max-w-xs leading-relaxed">
                  Stay on this tab. Verification completes automatically after
                  12 seconds of continuous presence.
                </p>
              </div>
            </div>
          )}

          {/* Monaco Editor */}
          <div className="flex-[3] min-w-0 border-r border-white/5">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              theme="vs-dark"
              onChange={(val) => setCode(val || "")}
              onMount={(editor) => {
                // Paste detection: flag large pastes during CODING as potential AI assist
                editor.onDidPaste((e) => {
                  if (currentStateForPaste.current !== "CODING") return;
                  const pastedText = editor
                    .getModel()
                    ?.getValueInRange(e.range) ?? "";
                  if (pastedText.length > 50) {
                    sendEvent("large_paste", { length: pastedText.length });
                  }
                });
              }}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "JetBrains Mono, Menlo, Monaco, monospace",
                lineNumbers: "on",
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
              }}
            />
          </div>

          {/* Right Panel */}
          <div className="w-[320px] flex flex-col bg-[#080808] shrink-0">
            {/* Tab Bar */}
            <div className="flex border-b border-white/5 shrink-0">
              <button
                onClick={() => setActiveTab("feedback")}
                className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  activeTab === "feedback"
                    ? "text-white border-b border-white"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                AI Feedback
              </button>
              <button
                onClick={() => setActiveTab("scorecard")}
                className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  activeTab === "scorecard"
                    ? "text-white border-b border-white"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                Scorecard
              </button>
            </div>

            {/* Manual Controls (when in states with available transitions) */}
            {isConnected && transitions.length > 0 && (
              <div className="px-4 py-3 border-b border-white/5 space-y-2 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                  Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((t) => (
                    <button
                      key={t.event}
                      id={`action-${t.event}`}
                      onClick={() =>
                        t.event === "screen_share_active"
                          ? acquireAndStartMedia()
                          : sendEvent(t.event)
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold text-gray-300 hover:text-white transition-colors"
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback / Scorecard Content */}
            {activeTab === "feedback" ? (
              <div
                ref={feedbackRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {feedback.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded p-4 mt-4">
                    <p className="text-[10px] text-gray-600 text-center italic leading-relaxed">
                      {isConnected
                        ? isSpeaking
                          ? "Synth is speaking…"
                          : isThinking
                          ? "Synth is thinking…"
                          : "Synth is listening…"
                        : "Start the interview to begin."}
                    </p>
                  </div>
                ) : (
                  [...feedback].reverse().map((msg, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.03] border border-white/5 rounded p-3 space-y-1"
                    >
                      <p className="text-[11px] leading-relaxed text-gray-300">
                        {msg}
                      </p>
                      <span className="text-[9px] text-gray-600 uppercase tracking-widest">
                        {i === 0 ? "just now" : `${i * 15}s ago`} · SYNTH
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {[
                  { label: "Problem Understanding", key: "problem" },
                  { label: "Approach Quality", key: "approach" },
                  { label: "Code Quality", key: "code" },
                  { label: "Communication", key: "communication" },
                  { label: "Test Performance", key: "tests" },
                  { label: "Optimization", key: "optimization" },
                ].map(({ label }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-700">
                        {currentState === "COMPLETED" ? "—/5" : "..."}
                      </span>
                    </div>
                    <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-white/40 transition-all duration-1000 ${
                          currentState === "COMPLETED" ? "w-1/2" : "w-0"
                        }`}
                      />
                    </div>
                  </div>
                ))}

                <div className="border border-dashed border-white/10 rounded p-3 mt-4">
                  <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                    {currentState === "COMPLETED"
                      ? "Scorecard generated — check recruiter dashboard."
                      : "Full scorecard generated after interview ends."}
                  </p>
                </div>
              </div>
            )}

            {/* State Progress Footer */}
            <div className="p-3 border-t border-white/5 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                  Interview Progress
                </span>
                <ChevronRight size={10} className="text-gray-700" />
              </div>
              <div className="flex gap-0.5">
                {[
                  "GREETING",
                  "ENV_CHECK",
                  "PROBLEM_DELIVERY",
                  "CODING",
                  "TESTING",
                  "COMPLETED",
                ].map((s) => {
                  const states = [
                    "GREETING",
                    "ENV_CHECK",
                    "PROBLEM_DELIVERY",
                    "THINK_TIME",
                    "APPROACH_LISTEN",
                    "CODING",
                    "HINT_DELIVERY",
                    "TESTING",
                    "OPTIMIZATION",
                    "COMPLETED",
                    "FLAGGED",
                  ];
                  const currentIdx = states.indexOf(currentState);
                  const thisIdx = states.indexOf(s);
                  const done = currentIdx > thisIdx;
                  const active = s === currentState;
                  return (
                    <div
                      key={s}
                      title={s}
                      className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                        done
                          ? "bg-white"
                          : active
                            ? "bg-white/60 animate-pulse"
                            : "bg-white/10"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
