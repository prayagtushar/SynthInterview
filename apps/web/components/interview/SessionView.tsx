"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import { type OnMount } from "@monaco-editor/react";
import { useInterview } from "../../lib/useInterview";
import {
  LANGUAGES,
  DEFAULT_CODE,
  STATE_COLORS,
  STATE_ICONS,
  MANUAL_TRANSITIONS,
} from "../../lib/constants";
import { ScorecardData, RunResult, ExecResult } from "../../lib/types";
import { generateProblemComments } from "../../lib/interviewUtils";

// Sub-components
import { Sidebar } from "./Sidebar";
import { Header, Banners } from "./Header";
import { EditorPanel } from "./EditorPanel";
import { RightPanel } from "./RightPanel";
import { Overlays } from "./Overlays";

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
    violationReason,
    tabSwitchWarning,
    isTerminated,
    questionData,
    scorecardData,
    isMuted,
    resetKey,
    greetingDone,
    connect,
    disconnect,
    sendEvent,
    sendCode,
    toggleMute,
    setLastCopied,
    getLastCopied,
    reshareScreen,
    stopScreenShare,
    acquireAndStartMedia,
  } = useInterview(sessionId);

  // Sync scorecard from WebSocket into local state
  useEffect(() => {
    if (scorecardData) {
      setScorecard(scorecardData);
      setActiveTab("scorecard");
    }
  }, [scorecardData]);

  // Reset all local editor/session state when a new session begins
  useEffect(() => {
    if (resetKey === 0) return; // skip initial mount
    setCode(DEFAULT_CODE["javascript"]);
    setLanguage("javascript");
    setExecResult(null);
    setRunResult(null);
    setShowTerminal(false);
    setScorecard(null);
    setActiveTab("feedback");
    problemInjected.current = false;
    problemHeaderLines.current = 0;
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);

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
      stateIcon: STATE_ICONS[currentState] || STATE_ICONS.IDLE,
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

  // ---------- Backend test-case execution ----------
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setShowTerminal(true);
    setRunResult(null);
    setExecResult(null);
    const t0 = Date.now();

    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/run-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: RunResult = await res.json();
      data.execTime = Date.now() - t0;
      setRunResult(data);

      // Feed results to SYNTH
      if (isConnected) {
        const summary = data.error
          ? `Candidate ran code — error: ${data.error.slice(0, 200)}`
          : `Candidate ran tests: ${data.passed}/${data.total} passed.${
              data.results.some((r) => !r.passed)
                ? " Failing: " +
                  data.results
                    .filter((r) => !r.passed)
                    .map(
                      (r) =>
                        `${r.label} (got ${r.actual}, expected ${r.expected})`,
                    )
                    .slice(0, 2)
                    .join("; ")
                : " All tests passed!"
            }`;
        sendEvent("candidate_signal", { signal: summary });
      }
    } catch (err) {
      setExecResult({
        stdout: "",
        stderr: err instanceof Error ? err.message : "Unknown execution error",
        exitCode: -1,
        execTime: Date.now() - t0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, sessionId, isConnected, sendEvent, API_BASE]);

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

      // Track copy events to prevent false paste-cheating alerts
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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-mono">
      <Overlays
        currentState={currentState}
        isConnected={isConnected}
        greetingDone={greetingDone}
        acquireAndStartMedia={acquireAndStartMedia}
        isTerminated={isTerminated}
      />

      <Sidebar
        isMuted={isMuted}
        toggleMute={toggleMute}
        screenLost={screenLost}
        isConnected={isConnected}
        reshareScreen={reshareScreen}
        stopScreenShare={stopScreenShare}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentState={currentState}
          stateIcon={stateIcon}
          stateColor={stateColor}
          isSpeaking={isSpeaking}
          isUserSpeaking={isUserSpeaking}
          isConnected={isConnected}
          connect={connect}
          disconnect={disconnect}
        />

        <Banners
          isSpeaking={isSpeaking}
          isUserSpeaking={isUserSpeaking}
          screenLost={screenLost}
          tabSwitchWarning={tabSwitchWarning}
          currentState={currentState}
          violationReason={violationReason}
          reshareScreen={reshareScreen}
          sendEvent={sendEvent}
        />

        <div className="flex-1 flex min-h-0 relative">
          <EditorPanel
            language={language}
            code={code}
            setCode={setCode}
            sendCode={sendCode}
            handleEditorMount={handleEditorMount}
            currentLang={currentLang}
            lineCount={lineCount}
            charCount={charCount}
            cursorPosition={cursorPosition}
            isConnected={isConnected}
            currentState={currentState}
            isRunning={isRunning}
            runCode={runCode}
            showTerminal={showTerminal}
            setShowTerminal={setShowTerminal}
            runResult={runResult}
            setRunResult={setRunResult}
            execResult={execResult}
            setExecResult={setExecResult}
            showLangMenu={showLangMenu}
            setShowLangMenu={setShowLangMenu}
            switchLanguage={switchLanguage}
          />

          <RightPanel
            isSpeaking={isSpeaking}
            isUserSpeaking={isUserSpeaking}
            isConnected={isConnected}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            transitions={transitions}
            acquireAndStartMedia={acquireAndStartMedia}
            sendEvent={sendEvent}
            feedback={feedback}
            feedbackRef={feedbackRef}
            scorecard={scorecard}
            currentState={currentState}
          />
        </div>
      </div>
    </div>
  );
}
