import React, { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { RunResult } from "../../lib/types";

interface StructuredTest {
  label: string;
  input: string;
  expected: string | number | boolean;
}

interface TestCasesPanelProps {
  structuredTests: StructuredTest[];
  runResult: RunResult | null;
  isRunning: boolean;
  runCode: () => void;
  onClose: () => void;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({
  structuredTests,
  runResult,
  isRunning,
  runCode,
  onClose,
}) => {
  const [tab, setTab] = useState<"cases" | "results" | "scratchpad">("cases");
  const [scratchpad, setScratchpad] = useState("");

  // Auto-switch to results tab when a run completes
  useEffect(() => {
    if (runResult) setTab("results");
  }, [runResult]);

  const resultLabel =
    runResult
      ? `Results (${runResult.passed}/${runResult.total})`
      : "Results";

  return (
    <div className="h-52 border-t border-indigo-500/20 bg-slate-950 flex flex-col shrink-0">
      {/* Tab bar */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-indigo-500/20 bg-slate-900 shrink-0">
        <div className="flex items-center gap-1">
          {(["cases", "results", "scratchpad"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest rounded transition-colors ${
                tab === t
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-600/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "cases"
                ? "Test Cases"
                : t === "results"
                  ? resultLabel
                  : "Scratchpad"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 text-green-400 text-[10px] px-2 py-0.5 rounded transition-colors"
          >
            {isRunning ? (
              <Loader2 size={9} className="animate-spin" />
            ) : (
              <PlayCircle size={9} />
            )}
            {isRunning ? "Running..." : "Run Tests"}
          </button>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Close test panel"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto">
        {/* Test Cases tab */}
        {tab === "cases" && (
          <div className="p-3 space-y-2">
            {structuredTests.length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic text-center py-4">
                Test cases will appear when a problem is assigned.
              </p>
            ) : (
              structuredTests.map((tc, i) => {
                const result = runResult?.results?.[i];
                return (
                  <div
                    key={i}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {tc.label}
                      </span>
                      {result &&
                        (result.passed ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : (
                          <XCircle size={12} className="text-red-400" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                          Input
                        </span>
                        <pre className="text-[10px] text-zinc-300 font-mono mt-0.5 overflow-x-auto">
                          {String(tc.input)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                          Expected
                        </span>
                        <pre className="text-[10px] text-zinc-300 font-mono mt-0.5 overflow-x-auto">
                          {String(tc.expected)}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Results tab */}
        {tab === "results" && (
          <div className="p-3 space-y-1.5">
            {!runResult ? (
              <p className="text-[10px] text-zinc-600 italic text-center py-4">
                Run your code to see results.
              </p>
            ) : runResult.error ? (
              <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3">
                <p className="text-[10px] font-bold text-red-400 mb-1">Error</p>
                <pre className="text-[10px] text-red-300 font-mono whitespace-pre-wrap">
                  {runResult.error}
                </pre>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-bold ${
                      runResult.passed === runResult.total
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {runResult.passed}/{runResult.total} passed
                  </span>
                  {runResult.execTime !== undefined && (
                    <span className="text-[10px] text-zinc-600">
                      {runResult.execTime}ms
                    </span>
                  )}
                </div>
                {runResult.results?.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2 rounded-lg border ${
                      r.passed
                        ? "border-emerald-800/30 bg-emerald-950/20"
                        : "border-red-800/30 bg-red-950/20"
                    }`}
                  >
                    {r.passed ? (
                      <CheckCircle2
                        size={12}
                        className="text-emerald-400 mt-0.5 shrink-0"
                      />
                    ) : (
                      <XCircle
                        size={12}
                        className="text-red-400 mt-0.5 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-zinc-300">
                        {r.label}
                      </span>
                      {!r.passed && (
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          got{" "}
                          <code className="text-red-300">{String(r.actual)}</code>
                          , expected{" "}
                          <code className="text-emerald-300">
                            {String(r.expected)}
                          </code>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Scratchpad tab */}
        {tab === "scratchpad" && (
          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Use this space for notes, pseudo-code, edge cases... (local only)"
            className="w-full h-full resize-none bg-transparent p-3 text-[11px] text-zinc-300 font-mono placeholder:text-zinc-700 outline-none"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};
