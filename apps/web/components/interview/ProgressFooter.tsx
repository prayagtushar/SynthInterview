import React from "react";
import { ChevronRight } from "lucide-react";

interface ProgressFooterProps {
  currentState: string;
}

export const ProgressFooter: React.FC<ProgressFooterProps> = ({
  currentState,
}) => {
  const steps = [
    "GREETING",
    "ENV_CHECK",
    "PROBLEM_DELIVERY",
    "CODING",
    "TESTING",
    "COMPLETED",
  ];

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

  return (
    <div className="p-3 border-t border-white/5 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
          Interview Progress
        </span>
        <ChevronRight size={10} className="text-gray-700" />
      </div>
      <div className="flex gap-0.5">
        {steps.map((s) => {
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
  );
};
