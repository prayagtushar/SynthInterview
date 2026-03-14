import React, { useState, useEffect } from "react";
import { CircleDot, XCircle, AlertTriangle, Monitor } from "lucide-react";

interface HeaderProps {
  currentState: string;
  stateIcon: React.ReactNode;
  stateColor: string;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentState,
  stateIcon,
  stateColor,
  isSpeaking,
  isUserSpeaking,
  isConnected,
  connect,
  disconnect,
}) => {
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (isConnected) {
      setIsTimerRunning(true);
      setTime(0);
    } else {
      setIsTimerRunning(false);
    }
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <header className="h-12 border-b border-indigo-500/20 flex items-center justify-between px-5 bg-slate-900 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          SynthInterview
        </span>
        <div className="h-3 w-px bg-white/10 mx-1" />
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${stateColor}`}
        >
          {stateIcon}
          {currentState.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          className="cursor-pointer text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700 transition-colors"
          title="Click to start/stop timer"
        >
          {formatTime(time)}
        </div>

        {(() => {
          const conversationStates = new Set([
            "THINK_TIME",
            "APPROACH_LISTEN",
            "CODING",
            "HINT_DELIVERY",
            "TESTING",
            "OPTIMIZATION",
          ]);
          const s = isSpeaking
            ? {
                dot: "bg-purple-400",
                text: "text-purple-400",
                label: "Synth Speaking",
              }
            : isUserSpeaking
              ? {
                  dot: "bg-green-400",
                  text: "text-green-400",
                  label: "Listening to you",
                }
              : isConnected && conversationStates.has(currentState)
                ? {
                    dot: "bg-green-400 opacity-60",
                    text: "text-green-400",
                    label: "Your turn",
                  }
                : isConnected
                  ? {
                      dot: "bg-gray-500",
                      text: "text-gray-400",
                      label: "Connected",
                    }
                  : {
                      dot: "bg-red-500",
                      text: "text-red-400",
                      label: "AI Offline",
                    };
          return (
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.dot}`}
              />
              <span
                className={`text-[10px] font-bold tracking-widest uppercase ${s.text}`}
              >
                {s.label}
              </span>
            </div>
          );
        })()}

        {!isConnected ? (
          <button
            id="start-interview-btn"
            onClick={connect}
            className="flex items-center gap-2 bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            <CircleDot size={12} className="animate-pulse text-red-500" />
            Start Interview
          </button>
        ) : (
          <button
            id="end-interview-btn"
            onClick={disconnect}
            className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 text-red-400 px-3 py-1 rounded text-xs font-bold hover:bg-red-900/40 transition-colors"
          >
            <XCircle size={12} />
            End
          </button>
        )}
      </div>
    </header>
  );
};

interface BannersProps {
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  screenLost: boolean;
  tabSwitchWarning: { count: number; max: number } | null;
  currentState: string;
  violationReason: string | null;
  reshareScreen: () => void;
  sendEvent: (event: string, payload?: any) => void;
}

export const Banners: React.FC<BannersProps> = ({
  isSpeaking,
  isUserSpeaking,
  screenLost,
  tabSwitchWarning,
  currentState,
  violationReason,
  reshareScreen,
  sendEvent,
}) => {
  return (
    <>
      {isSpeaking && isUserSpeaking && (
        <div className="flex items-center gap-2 px-5 py-1.5 bg-blue-950/60 border-b border-blue-800/40 shrink-0">
          <span className="text-[10px] text-blue-300 font-medium">
            Synth is speaking — please listen and wait for your turn.
          </span>
        </div>
      )}

      {screenLost && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-amber-950/60 border-b border-amber-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-amber-300 font-medium">
              Screen share stopped — the interviewer is waiting for you to
              reshare your screen.
            </span>
          </div>
          <button
            onClick={reshareScreen}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded transition-colors"
          >
            <Monitor size={12} />
            Share Screen Again
          </button>
        </div>
      )}

      {tabSwitchWarning && (
        <div className="flex items-center px-5 py-2 bg-orange-950/60 border-b border-orange-800/50 shrink-0">
          <AlertTriangle size={14} className="text-orange-400 mr-2 shrink-0" />
          <span className="text-xs text-orange-300 font-medium">
            Tab switch detected — {tabSwitchWarning.count}/
            {tabSwitchWarning.max} warnings used.
            {tabSwitchWarning.count >= tabSwitchWarning.max
              ? " Interview terminated."
              : " One more will end the interview."}
          </span>
        </div>
      )}

      {currentState === "FLAGGED" && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-red-950/60 border-b border-red-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-red-300 font-medium">
              VIOLATION DETECTED:{" "}
              {violationReason || "Suspicious activity detected"}
            </span>
          </div>
          <button
            onClick={() => sendEvent("warning_acknowledged")}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
          >
            Acknowledge
          </button>
        </div>
      )}
    </>
  );
};
