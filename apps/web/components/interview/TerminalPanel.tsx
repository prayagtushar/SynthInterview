import React from "react";
import {
  Terminal as TerminalIcon,
  Loader2,
  ChevronDown,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { RunResult, ExecResult } from "../../lib/types";

interface TerminalProps {
  runResult: RunResult | null;
  execResult: ExecResult | null;
  isRunning: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  runResult,
  execResult,
  isRunning,
  onClose,
  onClear,
}) => {
  return (
    <div className="h-[240px] shrink-0 border-t border-white/5 bg-[#08080c] flex flex-col shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-20">
      {/* Terminal Header */}
      <div className="h-9 flex items-center justify-between px-4 bg-slate-900/60 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TerminalIcon size={12} className="text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Output Console
            </span>
          </div>

          <div className="h-3 w-px bg-white/10" />

          {runResult && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                runResult.passed === runResult.total && runResult.total > 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                  : runResult.total === 0
                    ? "bg-slate-500/10 text-slate-400 border border-white/5"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
              }`}
            >
              {runResult.passed === runResult.total && runResult.total > 0 ? (
                <CheckCircle2 size={10} />
              ) : (
                <XCircle size={10} />
              )}
              <span>
                {runResult.total > 0
                  ? `TESTS: ${runResult.passed}/${runResult.total}`
                  : "NO TESTS"}
              </span>
              {runResult.execTime != null && (
                <span className="opacity-50 ml-1">
                  · {runResult.execTime}ms
                </span>
              )}
            </div>
          )}

          {execResult && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${execResult.stderr ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}
            >
              {execResult.stderr ? (
                <XCircle size={10} />
              ) : (
                <CheckCircle2 size={10} />
              )}
              <span>
                {execResult.stderr ? "EXECUTION FAILED" : "EXECUTION SUCCESS"}
              </span>
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-[10px] text-blue-400 animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              <span className="font-bold uppercase tracking-widest">
                Running...
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            title="Clear & Close"
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            title="Collapse"
            className="p-1.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-auto p-5 font-mono text-[12px] leading-relaxed selection:bg-blue-500/30">
        <div className="max-w-4xl mx-auto space-y-3">
          {isRunning && !runResult && !execResult && (
            <div className="flex items-center gap-3 text-slate-500">
              <span className="opacity-30">❯</span>
              <span className="animate-pulse">
                compiling and executing tests...
              </span>
            </div>
          )}

          {runResult && (
            <div className="space-y-3">
              {runResult.error && (
                <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg">
                  <pre className="text-rose-400 whitespace-pre-wrap text-[11px] font-mono leading-normal">
                    {runResult.error}
                  </pre>
                </div>
              )}

              <div className="grid gap-2">
                {runResult.results.length > 0
                  ? runResult.results.map((r, i) => (
                      <div
                        key={i}
                        className={`group flex items-start gap-4 p-3 rounded-xl border transition-all duration-200 ${
                          r.passed
                            ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20 shadow-[0_2px_10px_-5px_theme(colors.emerald.500/0.1)]"
                            : "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20 shadow-[0_2px_10px_-5px_theme(colors.rose.500/0.1)]"
                        }`}
                      >
                        <div
                          className={`mt-0.5 p-1 rounded-full ${r.passed ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}
                        >
                          {r.passed ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <span
                            className={`text-[11px] font-black uppercase tracking-widest ${r.passed ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {r.label}
                          </span>

                          {!r.passed && (
                            <div className="mt-1 flex flex-col gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
                              <div className="grid grid-cols-[60px_1fr] gap-2 items-baseline">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Expected
                                </span>
                                <pre className="text-emerald-300 text-[11px] whitespace-pre-wrap break-all">
                                  {typeof r.expected === "string"
                                    ? r.expected
                                    : JSON.stringify(r.expected)}
                                </pre>
                              </div>
                              <div className="h-px bg-white/5" />
                              <div className="grid grid-cols-[60px_1fr] gap-2 items-baseline">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Actual
                                </span>
                                <pre className="text-rose-300 text-[11px] whitespace-pre-wrap break-all">
                                  {typeof r.actual === "string"
                                    ? r.actual
                                    : JSON.stringify(r.actual)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  : !runResult.error && (
                      <div className="flex flex-col items-center py-10 gap-3 opacity-40">
                        <TerminalIcon size={40} className="text-slate-600" />
                        <span className="text-[11px] font-bold uppercase tracking-[.2em] text-slate-500">
                          No Automated Tests
                        </span>
                      </div>
                    )}
              </div>
            </div>
          )}

          {execResult && (
            <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                </div>
                <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Process stdout
                </span>
              </div>
              <div className="p-4">
                {execResult.stderr && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">
                      Error Stream:
                    </span>
                    <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed opacity-90">
                      {execResult.stderr}
                    </pre>
                  </div>
                )}
                {execResult.stdout && (
                  <div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">
                      Output Stream:
                    </span>
                    <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {execResult.stdout}
                    </pre>
                  </div>
                )}
                {!execResult.stdout && !execResult.stderr && (
                  <div className="py-6 text-center italic text-slate-600 font-serif">
                    - Process completed with no output -
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
