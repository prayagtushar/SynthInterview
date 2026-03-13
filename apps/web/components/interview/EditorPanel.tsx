import React from "react";
import dynamic from "next/dynamic";
import { type OnMount } from "@monaco-editor/react";
import { Hash, Keyboard, Play, Loader2 } from "lucide-react";
import { LANGUAGES } from "../../lib/constants";
import { RunResult, ExecResult } from "../../lib/types";
import { LanguageSelector } from "./LanguageSelector";
import { Terminal } from "./TerminalPanel";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPanelProps {
  language: string;
  code: string;
  setCode: (code: string) => void;
  sendCode: (code: string) => void;
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
  setRunResult: (res: RunResult | null) => void;
  execResult: ExecResult | null;
  setExecResult: (res: ExecResult | null) => void;
  showLangMenu: boolean;
  setShowLangMenu: (show: boolean) => void;
  switchLanguage: (langId: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  language,
  code,
  setCode,
  sendCode,
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
  setRunResult,
  execResult,
  setExecResult,
  showLangMenu,
  setShowLangMenu,
  switchLanguage,
}) => {
  return (
    <div className="flex-[3] min-w-0 border-r border-indigo-500/20 flex flex-col bg-slate-950">
      {/* Editor Toolbar */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-indigo-500/20 bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <LanguageSelector
            currentLang={currentLang}
            showLangMenu={showLangMenu}
            setShowLangMenu={setShowLangMenu}
            switchLanguage={switchLanguage}
            language={language}
          />

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
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent pointer-events-none z-10" />

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
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              wordBasedSuggestions: "off",
              parameterHints: { enabled: false },
            }}
          />
        </div>

        {/* Terminal output panel */}
        {showTerminal && (
          <Terminal
            runResult={runResult}
            execResult={execResult}
            isRunning={isRunning}
            onClose={() => setShowTerminal(false)}
            onClear={() => {
              setShowTerminal(false);
              setExecResult(null);
              setRunResult(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
