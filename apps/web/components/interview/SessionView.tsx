"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { type OnMount } from "@monaco-editor/react";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import { useInterview } from "../../lib/useInterview";
import {
  Mic,
  MicOff,
  Monitor,
  Play,
  ChevronRight,
  ChevronDown,
  Terminal,
  User,
  CircleDot,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  WifiOff,
  Code2,
  Hash,
  Keyboard,
  Loader2,
  X,
  ChevronUp,
} from "lucide-react";

// Supported languages
const LANGUAGES = [
  { id: "javascript", label: "JavaScript", ext: ".js", icon: "JS" },
  { id: "typescript", label: "TypeScript", ext: ".ts", icon: "TS" },
  { id: "python", label: "Python", ext: ".py", icon: "PY" },
  { id: "cpp", label: "C++", ext: ".cpp", icon: "C+" },
  { id: "java", label: "Java", ext: ".java", icon: "JA" },
  { id: "go", label: "Go", ext: ".go", icon: "GO" },
] as const;

const DEFAULT_CODE: Record<string, string> = {
  javascript:
    "// Your solution here\n\nfunction solve(nums, target) {\n  // Write your code...\n}\n",
  typescript:
    "// Your solution here\n\nfunction solve(nums: number[], target: number): number[] {\n  // Write your code...\n}\n",
  python:
    "# Your solution here\n\ndef solve(nums, target):\n    # Write your code...\n    pass\n",
  cpp: "// Your solution here\n#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    // Write your code...\n}\n",
  java: "// Your solution here\n\nclass Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your code...\n    }\n}\n",
  go: "// Your solution here\npackage main\n\nfunc solve(nums []int, target int) []int {\n\t// Write your code...\n\treturn nil\n}\n",
};

// Map Monaco language IDs -> Piston runtime names + versions
const PISTON_RUNTIMES: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  cpp: { language: "c++", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
  go: { language: "go", version: "1.16.2" },
};

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  execTime?: number;
}

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

// Events that should be sent directly to the state machine (legitimate user actions)
// vs. signals that should be routed to the AI agent for evaluation
const DIRECT_EVENTS = new Set([
  "screen_share_active",
  "hint_requested",
  "warning_acknowledged",
]);

// State transitions the user can trigger
const MANUAL_TRANSITIONS: Record<
  string,
  { label: string; event: string; icon: React.ReactNode; signal?: string }[]
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
      event: "candidate_signal",
      signal:
        "The candidate says they understand the problem and are ready to think about their approach.",
      icon: <CheckCircle size={12} />,
    },
  ],
  THINK_TIME: [],
  APPROACH_LISTEN: [],
  CODING: [
    {
      label: "Request Hint",
      event: "hint_requested",
      icon: <Lightbulb size={12} />,
    },
    {
      label: "I'm Done",
      event: "candidate_signal",
      signal:
        "The candidate says they are done coding their solution. Review their code and decide whether to proceed to testing.",
      icon: <CheckCircle size={12} />,
    },
  ],
  TESTING: [
    {
      label: "I'm Done",
      event: "candidate_signal",
      signal:
        "The candidate says they are done with testing. Evaluate and decide whether to move to optimization discussion.",
      icon: <CheckCircle size={12} />,
    },
  ],
  OPTIMIZATION: [
    {
      label: "I'm Done",
      event: "candidate_signal",
      signal:
        "The candidate says they are done discussing optimization. Wrap up if satisfied.",
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
    questionData,
    connect,
    disconnect,
    sendEvent,
    sendCode,
    setLastCopied,
    getLastCopied,
    reshareScreen,
    stopScreenShare,
    acquireAndStartMedia,
  } = useInterview(sessionId);

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "scorecard">(
    "feedback",
  );
  const [language, setLanguage] = useState("javascript");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE["javascript"]);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const feedbackRef = useRef<HTMLDivElement>(null);
  // Track current state in a ref for Monaco paste handler closure
  const currentStateForPaste = useRef(currentState);
  const editorRef = useRef<any>(null);
  const problemHeaderLines = useRef(0); // number of read-only problem comment lines
  const problemInjected = useRef(false); // prevent double injection

  // Code execution state
  const [isRunning, setIsRunning] = useState(false);
  const [execResult, setExecResult] = useState<ExecResult | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

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

  const {
    stateColor,
    stateIcon,
    transitions,
    currentLang,
    lineCount,
    charCount,
  } = useMemo(
    () => ({
      stateColor: STATE_COLORS[currentState] || "bg-gray-800 text-gray-400",
      stateIcon: STATE_ICONS[currentState] || <CircleDot size={12} />,
      transitions: MANUAL_TRANSITIONS[currentState] || [],
      currentLang: LANGUAGES.find((l) => l.id === language) || LANGUAGES[0],
      lineCount: code.split("\n").length,
      charCount: code.length,
    }),
    [currentState, language, code],
  );

  // Language switching handler
  const switchLanguage = useCallback(
    (langId: string) => {
      setLanguage(langId);
      // Re-generate code with problem header if question was already injected
      if (problemInjected.current && questionData) {
        const header = generateProblemComments(questionData, langId);
        const defaultBody = DEFAULT_CODE[langId] || "";
        setCode(header + "\n" + defaultBody);
        problemHeaderLines.current = header.split("\n").length;
      } else {
        setCode(DEFAULT_CODE[langId] || "");
      }
      setShowLangMenu(false);
    },
    [questionData],
  );

  // ---------- Piston code execution ----------
  const runCode = useCallback(async () => {
    const runtime = PISTON_RUNTIMES[language];
    if (!runtime) return;

    setIsRunning(true);
    setShowTerminal(true);
    setExecResult(null);
    const t0 = Date.now();

    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [
            {
              name: `solution${currentLang.ext}`,
              content: code,
            },
          ],
          stdin: "",
          args: [],
          compile_timeout: 10000,
          run_timeout: 5000,
        }),
      });
      if (!res.ok) throw new Error(`Piston error ${res.status}`);
      const data = await res.json();
      const result: ExecResult = {
        stdout: data.run?.stdout ?? "",
        stderr: (data.compile?.stderr ?? "") + (data.run?.stderr ?? ""),
        exitCode: data.run?.code ?? null,
        execTime: Date.now() - t0,
      };
      setExecResult(result);

      // Feed actual execution result to SYNTH
      if (isConnected) {
        const summary =
          `Candidate ran their ${language} code (exit ${result.exitCode}).\n` +
          (result.stderr
            ? `Errors:\n${result.stderr.slice(0, 400)}`
            : `Output:\n${result.stdout.slice(0, 400) || "(no output)"}`);
        sendEvent("candidate_signal", { signal: summary });
      }
    } catch (err) {
      setExecResult({
        stdout: "",
        stderr: err instanceof Error ? err.message : "Unknown execution error",
        exitCode: -1,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, currentLang.ext, isConnected, sendEvent]);

  // Generate problem statement as language-specific comments
  function generateProblemComments(
    q: NonNullable<typeof questionData>,
    langId: string,
  ): string {
    const isHash = langId === "python";
    const lines: string[] = [];

    // Top border
    if (!isHash) {
      lines.push("/*");
      lines.push(
        ` * ═══════════════════════════════════════════════════════════`,
      );
      lines.push(` *  ${q.title}`);
      lines.push(
        ` * ═══════════════════════════════════════════════════════════`,
      );
    } else {
      lines.push(
        "# ═══════════════════════════════════════════════════════════",
      );
      lines.push(`#  ${q.title}`);
      lines.push(
        "# ═══════════════════════════════════════════════════════════",
      );
    }

    // Description lines
    const descLines = q.description.split("\n");
    if (!isHash) {
      lines.push(" *");
      for (const dl of descLines) {
        lines.push(` *  ${dl}`);
      }
      lines.push(" *");
    } else {
      lines.push("#");
      for (const dl of descLines) {
        lines.push(`#  ${dl}`);
      }
      lines.push("#");
    }

    // Test cases
    if (q.testCases && q.testCases.length > 0) {
      if (!isHash) {
        lines.push(
          ` * ─── Test Cases ───────────────────────────────────────────`,
        );
        for (const tc of q.testCases) {
          lines.push(` *  Input:  ${tc.input}`);
          lines.push(` *  Output: ${tc.output}`);
          lines.push(` *`);
        }
      } else {
        lines.push(
          `# ─── Test Cases ───────────────────────────────────────────`,
        );
        for (const tc of q.testCases) {
          lines.push(`#  Input:  ${tc.input}`);
          lines.push(`#  Output: ${tc.output}`);
          lines.push(`#`);
        }
      }
    }

    // Close comment block
    if (!isHash) {
      lines.push(
        ` * ═══════════════════════════════════════════════════════════`,
      );
      lines.push(" */");
    } else {
      lines.push(
        "# ═══════════════════════════════════════════════════════════",
      );
    }

    lines.push(""); // blank separator line
    return lines.join("\n");
  }

  // Inject problem into editor when PROBLEM_DELIVERY state is reached
  useEffect(() => {
    if (
      currentState !== "PROBLEM_DELIVERY" ||
      !questionData ||
      problemInjected.current
    )
      return;
    problemInjected.current = true;

    const header = generateProblemComments(questionData, language);
    const existingCode = DEFAULT_CODE[language] || "";
    const fullCode = header + existingCode;
    setCode(fullCode);
    problemHeaderLines.current = header.split("\n").length;

    // Apply read-only constraint after Monaco updates
    setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;

      // No more restricted range logic to allow modifying the whole editor
      const editableStartLine = problemHeaderLines.current + 1;
      // Position cursor at the start of editable area
      editor.setPosition({ lineNumber: editableStartLine, column: 1 });
      editor.revealLineInCenter(editableStartLine);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, questionData, language]);

  // Monaco custom theme + editor setup
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // Custom dark theme
      monaco.editor.defineTheme("synth-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "4a5568", fontStyle: "italic" },
          { token: "keyword", foreground: "c084fc" },
          { token: "string", foreground: "86efac" },
          { token: "number", foreground: "fbbf24" },
          { token: "type", foreground: "67e8f9" },
          { token: "function", foreground: "93c5fd" },
          { token: "variable", foreground: "e2e8f0" },
        ],
        colors: {
          "editor.background": "#09090b",
          "editor.foreground": "#e2e8f0",
          "editor.lineHighlightBackground": "#ffffff08",
          "editor.selectionBackground": "#6366f140",
          "editor.inactiveSelectionBackground": "#6366f120",
          "editorCursor.foreground": "#a78bfa",
          "editorLineNumber.foreground": "#334155",
          "editorLineNumber.activeForeground": "#94a3b8",
          "editorIndentGuide.background": "#1e293b40",
          "editorIndentGuide.activeBackground": "#334155",
          "editorWidget.background": "#0f172a",
          "editorWidget.border": "#1e293b",
          "editorSuggestWidget.background": "#0f172a",
          "editorSuggestWidget.border": "#1e293b",
          "editorSuggestWidget.selectedBackground": "#1e293b",
        },
      });
      monaco.editor.setTheme("synth-dark");

      // Track cursor position
      editor.onDidChangeCursorPosition((e: any) => {
        setCursorPosition({
          line: e.position.lineNumber,
          col: e.position.column,
        });
      });

      // Fix 6: Track copy events to prevent false paste-cheating alerts
      editor.onDidPaste((e: any) => {
        if (currentStateForPaste.current !== "CODING") return;
        const pastedText = editor.getModel()?.getValueInRange(e.range) ?? "";
        if (pastedText.length > 50) {
          const lastCopied = getLastCopied();
          if (lastCopied && pastedText === lastCopied) return;
          sendEvent("large_paste", { length: pastedText.length });
        }
      });

      // Track copy actions
      editor.addAction({
        id: "track-copy",
        label: "Track Copy",
        keybindings: [],
        contextMenuGroupId: "9_cutcopypaste",
        run: (ed: any) => {
          const selection = ed.getSelection();
          if (selection) {
            const selectedText =
              ed.getModel()?.getValueInRange(selection) ?? "";
            if (selectedText) setLastCopied(selectedText);
          }
        },
      });

      const editorDom = editor.getDomNode();
      if (editorDom) {
        editorDom.addEventListener("copy", () => {
          const selection = editor.getSelection();
          if (selection) {
            const text = editor.getModel()?.getValueInRange(selection) ?? "";
            if (text) setLastCopied(text);
          }
        });
        editorDom.addEventListener("cut", () => {
          const selection = editor.getSelection();
          if (selection) {
            const text = editor.getModel()?.getValueInRange(selection) ?? "";
            if (text) setLastCopied(text);
          }
        });
      }
    },
    [sendEvent, getLastCopied, setLastCopied],
  );

  if (isTerminated) {
    return (
      <div className="flex h-screen bg-[#0d0d0d] items-center justify-center font-mono">
        <div className="text-center space-y-5 max-w-sm px-6">
          <XCircle size={52} className="text-red-500 mx-auto" />
          <p className="text-white font-bold text-2xl tracking-tight">
            Interview Terminated
          </p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            This interview session was ended due to a policy violation. The
            recruiter has been notified of the result.
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
                ? {
                    dot: "bg-blue-400",
                    text: "text-blue-400",
                    label: "Speaking",
                  }
                : isThinking
                  ? {
                      dot: "bg-amber-400",
                      text: "text-amber-400",
                      label: "Thinking…",
                    }
                  : isConnected
                    ? {
                        dot: "bg-green-400",
                        text: "text-green-400",
                        label: "Listening",
                      }
                    : {
                        dot: "bg-red-500",
                        text: "text-red-400",
                        label: "AI Offline",
                      };
              return (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.dot}`}
                  />
                  <span
                    className={`text-[10px] font-bold tracking-widest uppercase ${s.text}`}
                  >
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
                Screen share stopped — the interviewer is waiting for you to
                reshare your screen.
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
            <AlertTriangle
              size={14}
              className="text-orange-400 mr-2 shrink-0"
            />
            <span className="text-xs text-orange-300 font-medium">
              Tab switch detected — {tabSwitchWarning.count}/
              {tabSwitchWarning.max} warnings used.
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
                VIOLATION DETECTED:{" "}
                {violationReason || "Suspicious activity detected"}
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
          {/* GREETING / Request Screen Share Overlay */}
          {currentState === "GREETING" &&
            isConnected &&
            feedback.length > 0 &&
            !isSpeaking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/85 z-20 gap-5">
                <div className="flex flex-col items-center text-center space-y-4 max-w-sm bg-[#080808] border border-white/10 p-8 rounded-lg shadow-2xl">
                  <Monitor
                    size={48}
                    className="text-blue-400 mb-2 animate-pulse"
                  />
                  <h3 className="text-white font-bold text-lg tracking-wide uppercase">
                    Share Screen & Mic
                  </h3>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-4">
                    The interviewer is ready. Please share your entire screen
                    and allow microphone access to proceed.
                  </p>
                  <button
                    onClick={acquireAndStartMedia}
                    className="w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Monitor size={14} />
                    Start
                  </button>
                </div>
              </div>
            )}

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

          {/* Monaco Editor with Toolbar */}
          <div className="flex-[3] min-w-0 border-r border-white/5 flex flex-col">
            {/* Editor Toolbar */}
            <div className="h-9 flex items-center justify-between px-3 border-b border-white/5 bg-[#09090b] shrink-0">
              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-[10px] font-bold tracking-wider uppercase text-gray-300 hover:text-white"
                  >
                    <Code2 size={11} className="text-purple-400" />
                    {currentLang.label}
                    <ChevronDown size={10} className="text-gray-500" />
                  </button>
                  {showLangMenu && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-[#0f0f12] border border-white/10 rounded-lg shadow-2xl z-30 overflow-hidden">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => switchLanguage(lang.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors ${
                            lang.id === language
                              ? "bg-purple-500/20 text-purple-300"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[8px] font-black tracking-tighter">
                            {lang.icon}
                          </span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-3 w-px bg-white/5" />

                {/* File name */}
                <span className="text-[10px] text-gray-500 font-medium">
                  solution{currentLang.ext}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Code stats */}
                <div className="flex items-center gap-2 text-[9px] text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Hash size={9} />
                    {lineCount} lines
                  </span>
                  <span>{charCount} chars</span>
                </div>

                <div className="h-3 w-px bg-white/5" />

                {/* Cursor position */}
                <span className="text-[9px] text-gray-500 font-mono">
                  Ln {cursorPosition.line}, Col {cursorPosition.col}
                </span>

                {/* Keyboard shortcuts hint */}
                {isConnected && currentState === "CODING" && (
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                    <Keyboard size={9} />
                    <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-mono text-gray-500">
                      H
                    </kbd>
                    <span>Hint</span>
                  </div>
                )}

                <div className="h-3 w-px bg-white/5 mx-1" />

                {/* Run Code Button */}
                {/* Run Code Button — real Piston execution */}
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-green-400 text-[10px] font-medium px-2.5 py-1 rounded transition-colors group"
                >
                  {isRunning ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Play size={10} className="group-hover:text-green-300" />
                  )}
                  {isRunning ? "Running…" : "Run Code"}
                </button>
              </div>
            </div>

            {/* Editor + Terminal split container */}
            <div className="flex-1 min-h-0 flex flex-col relative">
              {/* Gradient accent on left edge */}
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent pointer-events-none z-10" />

              {/* Monaco Editor */}
              <div className={showTerminal ? "flex-1 min-h-0" : "h-full"}>
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  theme="synth-dark"
                  onChange={(val) => {
                    const newCode = val || "";
                    setCode(newCode);
                    sendCode(newCode);
                  }}
                  onMount={handleEditorMount}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    fontFamily:
                      '"JetBrains Mono", "Fira Code", Menlo, Monaco, monospace',
                    fontLigatures: true,
                    lineNumbers: "on",
                    renderLineHighlight: "line",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    bracketPairColorization: { enabled: true },
                    autoClosingBrackets: "always",
                    autoClosingQuotes: "always",
                    autoIndent: "full",
                    formatOnPaste: true,
                    renderWhitespace: "selection",
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 8,
                    lineNumbersMinChars: 3,
                  }}
                />
              </div>

              {/* Terminal output panel */}
              {showTerminal && (
                <div className="h-[200px] shrink-0 border-t border-white/5 bg-[#080810] flex flex-col">
                  {/* Terminal header */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal size={10} className="text-gray-500" />
                      <span className="text-[10px] font-medium text-gray-400">Output</span>
                      {execResult && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            execResult.exitCode === 0
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          exit {execResult.exitCode}
                          {execResult.execTime != null &&
                            ` · ${execResult.execTime}ms`}
                        </span>
                      )}
                      {isRunning && (
                        <Loader2
                          size={10}
                          className="animate-spin text-gray-500"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowTerminal(false)}
                        title="Collapse terminal"
                        className="p-0.5 text-gray-600 hover:text-gray-300 rounded transition-colors"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => {
                          setShowTerminal(false);
                          setExecResult(null);
                        }}
                        title="Close terminal"
                        className="p-0.5 text-gray-600 hover:text-gray-300 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Terminal content */}
                  <div className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
                    {isRunning && !execResult && (
                      <span className="text-gray-500 animate-pulse">
                        $ running…
                      </span>
                    )}
                    {execResult && (
                      <>
                        {execResult.stderr ? (
                          <pre className="text-red-400 whitespace-pre-wrap">
                            {execResult.stderr}
                          </pre>
                        ) : null}
                        {execResult.stdout ? (
                          <pre className="text-green-300 whitespace-pre-wrap">
                            {execResult.stdout}
                          </pre>
                        ) : null}
                        {!execResult.stdout && !execResult.stderr && (
                          <span className="text-gray-600">(no output)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[340px] flex flex-col bg-[#070709] shrink-0">
            {/* AI Avatar Area */}
            <div className="px-4 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                {/* Avatar with speaking ring */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border transition-all duration-300 ${
                      isSpeaking
                        ? "border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        : "border-white/10"
                    }`}
                  >
                    <span className="text-sm font-black text-white/90">S</span>
                  </div>
                  {/* Pulse ring when speaking */}
                  {isSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-purple-400/40 animate-ping" />
                      <div className="absolute inset-[-4px] rounded-full border border-purple-400/20 animate-pulse" />
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white tracking-wide">
                    Synth
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {isSpeaking
                      ? "Speaking…"
                      : isThinking
                        ? "Thinking…"
                        : isConnected
                          ? "Listening"
                          : "Offline"}
                  </p>
                </div>
                {/* Audio visualizer bars */}
                <div className="flex items-end gap-[2px] h-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-[3px] rounded-full transition-all duration-150 ${
                        isSpeaking
                          ? "bg-purple-400/80 animate-pulse"
                          : isUserSpeaking
                            ? "bg-green-400/60"
                            : "bg-white/10"
                      }`}
                      style={{
                        height:
                          isSpeaking || isUserSpeaking
                            ? `${6 + Math.random() * 14}px`
                            : "4px",
                        animationDelay: `${i * 75}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
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
                  {transitions.map((t) => {
                    const handleClick = () => {
                      if (t.event === "screen_share_active") {
                        acquireAndStartMedia();
                      } else if (t.event === "candidate_signal" && t.signal) {
                        sendEvent("candidate_signal", { signal: t.signal });
                      } else {
                        sendEvent(t.event);
                      }
                    };
                    return (
                      <button
                        key={t.label}
                        id={`action-${t.event}`}
                        onClick={handleClick}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold text-gray-300 hover:text-white transition-colors"
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    );
                  })}
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
