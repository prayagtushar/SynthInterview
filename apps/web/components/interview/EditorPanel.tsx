import React from "react";
import dynamic from "next/dynamic";
import { type OnMount } from "@monaco-editor/react";
import {
  Hash,
  Keyboard,
  Play,
  Loader2,
  Sparkles,
  Terminal as TerminalIcon,
} from "lucide-react";
import { LANGUAGES } from "../../lib/constants";
import { RunResult } from "../../lib/types";
import { LanguageSelector } from "./LanguageSelector";
import { TestCasesPanel } from "./TestCasesPanel";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPanelProps {
  language: string;
  code: string;
  setCode: (code: string) => void;
  sendCode: (code: string) => void;
  onTyping: () => void;
  handleEditorMount: OnMount;
  currentLang: (typeof LANGUAGES)[number];
  lineCount: number;
  charCount: number;
  cursorPosition: { line: number; col: number };
  isConnected: boolean;
  currentState: string;
  isRunning: boolean;
  runCode: () => void;
  showTerminal: boolean;
  setShowTerminal: (show: boolean) => void;
  runResult: RunResult | null;
  structuredTests: any[];
  showLangMenu: boolean;
  setShowLangMenu: (show: boolean) => void;
  switchLanguage: (langId: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  language,
  code,
  setCode,
  sendCode,
  onTyping,
  handleEditorMount,
  currentLang,
  lineCount,
  charCount,
  cursorPosition,
  isConnected,
  currentState,
  isRunning,
  runCode,
  showTerminal,
  setShowTerminal,
  runResult,
  structuredTests,
  showLangMenu,
  setShowLangMenu,
  switchLanguage,
}) => {
  return (
    <div className="flex-[3] min-w-0 border-r border-white/5 flex flex-col bg-[#050505] relative group">
      {/* Editor Toolbar */}
      <div className="h-12 flex items-center justify-between px-5 border-b border-white/5 bg-slate-900/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <LanguageSelector
            currentLang={currentLang}
            showLangMenu={showLangMenu}
            setShowLangMenu={setShowLangMenu}
            switchLanguage={switchLanguage}
            language={language}
          />

          <div className="h-3 w-px bg-white/10" />

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 group/badge">
            <span className="text-[11px] text-slate-400 font-bold tracking-tight group-hover/badge:text-white transition-colors">
              solution<span className="text-white/60 group-hover/badge:text-blue-400">{currentLang.ext}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <div className="text-blue-400/80">
              Ln {cursorPosition.line}, Col {cursorPosition.col}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runCode}
              disabled={isRunning || !isConnected}
              className={`flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 outline-none
                ${
                  isRunning
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-emerald-500/40"
                }`}
            >
              {isRunning ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Play size={13} fill="currentColor" className="opacity-80 group-hover:opacity-100" />
              )}
              {isRunning ? "Running..." : "Run Code"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 min-h-0 flex flex-col relative bg-[#030303]">
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none z-10" />

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
              onTyping();
            }}
            onMount={(editor, monaco) => {
              handleEditorMount(editor, monaco);
              // Set custom theme colors if needed (monaco handles it via defineTheme usually)
            }}
            options={{
              fontSize: 15,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 20, bottom: 20 },
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontLigatures: true,
              lineNumbers: "on",
              renderLineHighlight: "all",
              cursorBlinking: "expand",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              bracketPairColorization: { enabled: true },
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              autoIndent: "full",
              formatOnPaste: true,
              renderWhitespace: "selection",
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              wordBasedSuggestions: "off",
              parameterHints: { enabled: false },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: "visible",
                horizontal: "hidden",
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 10,
              },
            }}
          />
        </div>

        {/* Test Cases Panel */}
        {showTerminal && (
          <TestCasesPanel
            structuredTests={structuredTests}
            runResult={runResult}
            isRunning={isRunning}
            runCode={runCode}
            onClose={() => setShowTerminal(false)}
          />
        )}
      </div>
    </div>
  );
};
