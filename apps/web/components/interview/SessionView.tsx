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
} from "lucide-react";

// State badge colors
const STATE_COLORS: Record<string, string> = {
  IDLE:             "bg-gray-800 text-gray-400",
  GREETING:         "bg-blue-900/50 text-blue-300",
  ENV_CHECK:        "bg-yellow-900/50 text-yellow-300",
  PROBLEM_DELIVERY: "bg-purple-900/50 text-purple-300",
  THINK_TIME:       "bg-indigo-900/50 text-indigo-300",
  APPROACH_LISTEN:  "bg-cyan-900/50 text-cyan-300",
  CODING:           "bg-green-900/50 text-green-300",
  HINT_DELIVERY:    "bg-orange-900/50 text-orange-300",
  TESTING:          "bg-teal-900/50 text-teal-300",
  OPTIMIZATION:     "bg-pink-900/50 text-pink-300",
  COMPLETED:        "bg-emerald-900/50 text-emerald-300",
  FLAGGED:          "bg-red-900/50 text-red-300",
};

const STATE_ICONS: Record<string, React.ReactNode> = {
  IDLE:             <CircleDot size={12} />,
  GREETING:         <User size={12} />,
  ENV_CHECK:        <Monitor size={12} />,
  PROBLEM_DELIVERY: <FileText size={12} />,
  THINK_TIME:       <span className="text-xs">💭</span>,
  APPROACH_LISTEN:  <span className="text-xs">🗣</span>,
  CODING:           <Play size={12} />,
  HINT_DELIVERY:    <Lightbulb size={12} />,
  TESTING:          <Terminal size={12} />,
  OPTIMIZATION:     <span className="text-xs">⚡</span>,
  COMPLETED:        <CheckCircle size={12} />,
  FLAGGED:          <AlertTriangle size={12} />,
};

// State transitions the user can manually trigger (for testing / button controls)
const MANUAL_TRANSITIONS: Record<string, { label: string; event: string; icon: React.ReactNode }[]> = {
  CODING:           [{ label: "Request Hint", event: "hint_requested", icon: <Lightbulb size={12} /> },
                     { label: "Done Coding",  event: "coding_finished", icon: <CheckCircle size={12} /> }],
  APPROACH_LISTEN:  [{ label: "Accepted Approach", event: "approach_accepted", icon: <CheckCircle size={12} /> }],
  PROBLEM_DELIVERY: [{ label: "I Understand", event: "candidate_ready", icon: <CheckCircle size={12} /> }],
  TESTING:          [{ label: "Tests Passed", event: "tests_passed", icon: <CheckCircle size={12} /> }],
  OPTIMIZATION:     [{ label: "Done Optimizing", event: "optimization_finished", icon: <CheckCircle size={12} /> }],
  FLAGGED:          [{ label: "Acknowledged", event: "warning_acknowledged", icon: <CheckCircle size={12} /> }],
};

export default function SessionView() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("id") || "default-session",
    [searchParams],
  );

  const { isConnected, feedback, currentState, connect, disconnect, sendEvent } =
    useInterview(sessionId);

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "scorecard">("feedback");
  const [code, setCode] = useState(
    `// Your solution here\n// The AI is watching and listening...\n\nfunction solve(nums, target) {\n  // Write your solution\n}\n`,
  );
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll feedback to top (newest first)
  useEffect(() => {
    if (feedbackRef.current) {
      feedbackRef.current.scrollTop = 0;
    }
  }, [feedback]);

  const stateColor = STATE_COLORS[currentState] || "bg-gray-800 text-gray-400";
  const stateIcon  = STATE_ICONS[currentState]  || <CircleDot size={12} />;
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
              isMuted ? "bg-red-900/60 text-red-300" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            title="Screen Share Active"
            className={`p-2 rounded-md transition-colors ${
              isConnected ? "text-green-400" : "text-gray-600"
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
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${stateColor}`}>
              {stateIcon}
              {currentState.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
              <span className={`text-[10px] font-bold tracking-widest uppercase ${isConnected ? "text-green-400" : "text-red-400"}`}>
                {isConnected ? "AI Online" : "AI Offline"}
              </span>
            </div>

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

        {/* Editor + AI Panel */}
        <div className="flex-1 flex min-h-0">

          {/* Monaco Editor */}
          <div className="flex-[3] min-w-0 border-r border-white/5">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              theme="vs-dark"
              onChange={(val) => setCode(val || "")}
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
                      onClick={() => sendEvent(t.event)}
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
                        ? "Synth is listening…"
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
                  { label: "Approach Quality",      key: "approach" },
                  { label: "Code Quality",          key: "code" },
                  { label: "Communication",         key: "communication" },
                  { label: "Test Performance",      key: "tests" },
                  { label: "Optimization",          key: "optimization" },
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
                {["GREETING","ENV_CHECK","PROBLEM_DELIVERY","CODING","TESTING","COMPLETED"].map((s) => {
                  const states = ["GREETING","ENV_CHECK","PROBLEM_DELIVERY","THINK_TIME","APPROACH_LISTEN","CODING","HINT_DELIVERY","TESTING","OPTIMIZATION","COMPLETED","FLAGGED"];
                  const currentIdx = states.indexOf(currentState);
                  const thisIdx = states.indexOf(s);
                  const done = currentIdx > thisIdx;
                  const active = s === currentState;
                  return (
                    <div
                      key={s}
                      title={s}
                      className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                        done ? "bg-white" : active ? "bg-white/60 animate-pulse" : "bg-white/10"
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
