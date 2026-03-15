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
    <div className="w-[340px] flex flex-col bg-black shrink-0 border-l border-white/5 relative z-10">
      <div className="p-8 pt-10">
        <AIAvatar
          isSpeaking={isSpeaking}
          isUserSpeaking={isUserSpeaking}
          isConnected={isConnected}
        />
      </div>

      {/* Tab Switcher */}
      <div className="mx-8 mb-6 flex bg-white/5 border border-white/5 shrink-0">
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
            activeTab === "feedback"
              ? "bg-white text-black"
              : "text-white/20 hover:text-white/40 hover:bg-white/[0.02]"
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab("scorecard")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
            activeTab === "scorecard"
              ? "bg-white text-black"
              : "text-white/20 hover:text-white/40 hover:bg-white/[0.02]"
          }`}
        >
          Report
        </button>
      </div>

      {/* Manual Controls - Refined UI */}
      {isConnected && transitions.length > 0 && (
        <div className="px-8 py-6 bg-white/[0.02] border-y border-white/5 shrink-0 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-4 bg-white/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Operations
            </span>
          </div>

          <div className="flex flex-col gap-2">
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
                  className="group relative flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 hover:border-white/20 text-[10px] font-black text-white/60 hover:text-white transition-all active:scale-[0.98] uppercase tracking-widest"
                >
                  <div className="flex items-center gap-3">
                    <Zap
                      size={12}
                      className="text-white/20 group-hover:text-white transition-colors"
                    />
                    {t.label}
                  </div>
                  <div className="w-1.5 h-1.5 bg-white/10 group-hover:bg-white transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback / Scorecard Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "feedback" ? (
          <FeedbackList
            feedback={feedback}
            feedbackRef={feedbackRef}
            isConnected={isConnected}
            isSpeaking={isSpeaking}
          />
        ) : (
          <ScorecardView
            scorecard={scorecard}
            currentState={currentState}
            sessionId={sessionId}
          />
        )}
      </div>

      <div className="p-6 bg-black border-t border-white/10 shrink-0">
        <ProgressFooter currentState={currentState} />
      </div>
    </div>
  );
};
