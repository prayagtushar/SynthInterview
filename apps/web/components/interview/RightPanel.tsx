import React from "react";
import { ScorecardData } from "../../lib/types";
import { AIAvatar } from "./AIAvatar";
import { FeedbackList } from "./FeedbackList";
import { ScorecardView } from "./ScorecardView";
import { ProgressFooter } from "./ProgressFooter";
import { Zap, Command } from "lucide-react";

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
  sessionId: string;
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
  sessionId,
}) => {
  return (
    <div className="w-[340px] flex flex-col bg-slate-950 shrink-0 border-l border-white/5 relative z-10">
      <div className="p-4 pt-6">
        <AIAvatar
          isSpeaking={isSpeaking}
          isUserSpeaking={isUserSpeaking}
          isConnected={isConnected}
        />
      </div>

      {/* Tab Switcher */}
      <div className="mx-4 mb-4 flex p-1 bg-slate-900 border border-white/5 rounded-full shrink-0 shadow-inner">
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === "feedback"
              ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab("scorecard")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === "scorecard"
              ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          }`}
        >
          Report
        </button>
      </div>

      {/* Manual Controls - Refined UI */}
      {isConnected && transitions.length > 0 && (
        <div className="px-5 py-4 bg-white/[0.02] border-y border-white/5 shrink-0 space-y-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Command size={10} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Session Controls
            </span>
          </div>

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
                  className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-full text-[10px] font-bold text-slate-400 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <Zap
                    size={11}
                    className="text-slate-600 group-hover:text-amber-400 transition-colors"
                  />
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
        <ScorecardView scorecard={scorecard} currentState={currentState} sessionId={sessionId} />
      )}

      <div className="p-4 bg-slate-900/30 border-t border-white/5 shrink-0">
        <ProgressFooter currentState={currentState} />
      </div>
    </div>
  );
};
