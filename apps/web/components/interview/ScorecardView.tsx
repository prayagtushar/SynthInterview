import React from "react";
import { ScorecardData } from "../../lib/types";

interface ScorecardViewProps {
  scorecard: ScorecardData | null;
  currentState: string;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  scorecard,
  currentState,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {scorecard ? (
        <>
          {/* Overall score */}
          <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-indigo-500/10 rounded-xl shadow-lg">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 flex items-center justify-center shrink-0 bg-indigo-500/5">
              <span className="text-sm font-black text-indigo-400">
                {scorecard.overall_score}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">
                {scorecard.rating}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Overall Score
              </p>
            </div>
          </div>

          {/* Dimension scores */}
          {[
            { label: "Problem Understanding", key: "problem_understanding" },
            { label: "Approach & Algorithm", key: "approach" },
            { label: "Code Quality", key: "code_quality" },
            { label: "Communication", key: "communication" },
            { label: "Correctness", key: "correctness" },
            { label: "Time Management", key: "time_management" },
          ].map(({ label, key }) => {
            const score = (scorecard.scores as any)?.[key] ?? 0;
            const pct = Math.min(100, Math.max(0, score));
            const color =
              pct >= 70
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : pct >= 40
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-200">{score}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-1000`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {scorecard.dimension_feedback?.[key] && (
                  <p className="text-[9px] text-slate-500 leading-relaxed italic">
                    {scorecard.dimension_feedback[key]}
                  </p>
                )}
              </div>
            );
          })}

          {/* Feedback */}
          {scorecard.feedback && (
            <div className="border border-white/5 rounded p-3 bg-white/[0.02]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
                Feedback
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {scorecard.feedback}
              </p>
            </div>
          )}

          {/* Strengths & Improvements */}
          {scorecard.strengths?.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
                Strengths
              </p>
              <ul className="space-y-1">
                {scorecard.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-[10px] text-green-400/80 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scorecard.improvement_areas?.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
                Areas to Improve
              </p>
              <ul className="space-y-1">
                {scorecard.improvement_areas.map((a, i) => (
                  <li
                    key={i}
                    className="text-[10px] text-yellow-400/80 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">→</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[9px] text-gray-700 text-center">
            Scorecard emailed to candidate.
          </p>
        </>
      ) : (
        <>
          {[
            { label: "Problem Understanding" },
            { label: "Approach & Algorithm" },
            { label: "Code Quality" },
            { label: "Communication" },
            { label: "Correctness" },
            { label: "Time Management" },
          ].map(({ label }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <span>{label}</span>
                <span className="opacity-20">—</span>
              </div>
              <div className="h-px bg-slate-800 rounded-full" />
            </div>
          ))}
          <div className="border border-dashed border-indigo-500/20 rounded-xl p-6 bg-indigo-500/5">
            <p className="text-[10px] text-slate-500 text-center leading-relaxed italic uppercase tracking-wider">
              {currentState === "COMPLETED"
                ? "Generating professional scorecard…"
                : "Scorecard will be generated after interview."}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
