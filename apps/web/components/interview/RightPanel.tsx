import React from "react";
import { ScorecardData } from "../../lib/types";
import { AIAvatar } from "./AIAvatar";
import { FeedbackList } from "./FeedbackList";
import { ScorecardView } from "./ScorecardView";
import { ProgressFooter } from "./ProgressFooter";

interface RightPanelProps {
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isConnected: boolean;
  activeTab: "feedback" | "scorecard";
  setActiveTab: (tab: "feedback" | "scorecard") => void;
  transitions: any[];
  acquireAndStartMedia: () => void;
  sendEvent: (event: string, data?: any) => void;
  feedback: string[];
  feedbackRef: React.RefObject<HTMLDivElement | null>;
  scorecard: ScorecardData | null;
  currentState: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isSpeaking,
  isUserSpeaking,
  isConnected,
  activeTab,
  setActiveTab,
  transitions,
  acquireAndStartMedia,
  sendEvent,
  feedback,
  feedbackRef,
  scorecard,
  currentState,
}) => {
  return (
    <div className="w-[340px] flex flex-col bg-slate-950 shrink-0 border-l border-indigo-500/10">
      <AIAvatar
        isSpeaking={isSpeaking}
        isUserSpeaking={isUserSpeaking}
        isConnected={isConnected}
      />

      {/* Tab Bar */}
      <div className="flex border-b border-indigo-500/20 shrink-0 bg-slate-900/50">
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
            activeTab === "feedback"
              ? "text-indigo-400 bg-indigo-500/5 shadow-[inset_0_-2px_0_0_#6366f1]"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          AI Feedback
        </button>
        <button
          onClick={() => setActiveTab("scorecard")}
          className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
            activeTab === "scorecard"
              ? "text-indigo-400 bg-indigo-500/5 shadow-[inset_0_-2px_0_0_#6366f1]"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          Scorecard
        </button>
      </div>

      {/* Manual Controls */}
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
        <FeedbackList
          feedback={feedback}
          feedbackRef={feedbackRef}
          isConnected={isConnected}
          isSpeaking={isSpeaking}
        />
      ) : (
        <ScorecardView scorecard={scorecard} currentState={currentState} />
      )}

      <ProgressFooter currentState={currentState} />
    </div>
  );
};
