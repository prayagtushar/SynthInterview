import React, { useState, useEffect } from "react";
import {
  CircleDot,
  XCircle,
  AlertTriangle,
  Monitor,
  Timer,
  Cpu,
  Info,
} from "lucide-react";

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
    <header className="h-12 border-b border-white/5 flex items-center justify-between px-5 bg-slate-950/40 backdrop-blur-xl shrink-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 group cursor-default">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center transition-all group-hover:border-indigo-500/40 group-hover:bg-indigo-500/20">
            <Cpu
              size={14}
              className="text-indigo-400 group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase">
              Synth<span className="text-white">Interview</span>
            </span>
            <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
              Autonomous Proctoring
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/5" />

        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.05em] shadow-sm transition-all duration-500 ${stateColor.replace("rounded", "rounded-full")} border border-white/5`}
        >
          <div className="scale-75 opacity-70">{stateIcon}</div>
          {currentState.replace(/_/g, " ")}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timer UI */}
        <div
          onClick={() => isConnected && setIsTimerRunning(!isTimerRunning)}
          className={`flex items-center gap-2 cursor-pointer text-[10px] font-mono font-bold px-3 py-1 rounded-lg border transition-all duration-300 ${
            isTimerRunning
              ? "text-indigo-300 bg-indigo-500/5 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]"
              : "text-slate-500 bg-slate-900 border-white/5 opacity-50"
          } hover:border-indigo-500/40 hover:opacity-100`}
          title="Click to toggle timer"
        >
          <Timer
            size={12}
            className={isTimerRunning ? "text-indigo-400" : "text-slate-600"}
          />
          {formatTime(time)}
        </div>

        {/* Dynamic Status Indicator */}
        {(() => {
          const conversationStates = new Set([
            "THINK_TIME",
            "APPROACH_LISTEN",
            "CODING",
            "HINT_DELIVERY",
            "TESTING",
            "OPTIMIZATION",
          ]);

          let s = {
            dot: "bg-slate-500",
            text: "text-slate-500",
            label: "Standby",
            glow: "",
          };

          if (isSpeaking) {
            s = {
              dot: "bg-indigo-400 animate-pulse",
              text: "text-indigo-300 text-glow-indigo",
              label: "Synth Responding",
              glow: "shadow-[0_0_12px_rgba(99,102,241,0.4)]",
            };
          } else if (isUserSpeaking) {
            s = {
              dot: "bg-emerald-400 animate-bounce",
              text: "text-emerald-400 text-glow-emerald",
              label: "Listening...",
              glow: "shadow-[0_0_12px_rgba(52,211,153,0.4)]",
            };
          } else if (isConnected && conversationStates.has(currentState)) {
            s = {
              dot: "bg-indigo-500/40",
              text: "text-indigo-400/80",
              label: "Active Session",
              glow: "",
            };
          } else if (!isConnected) {
            s = {
              dot: "bg-rose-500/50",
              text: "text-rose-400/60",
              label: "Disconnected",
              glow: "",
            };
          }

          return (
            <div className="flex items-center gap-2.5 bg-white/[0.02] px-3 py-1 rounded-full border border-white/5 transition-all duration-500">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${s.dot} ${s.glow}`}
              />
              <span
                className={`text-[9px] font-black tracking-[0.15em] uppercase transition-all duration-500 ${s.text}`}
              >
                {s.label}
              </span>
            </div>
          );
        })()}

        {isConnected && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/5 border border-rose-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
            <span className="text-[8px] font-black text-rose-500/80 uppercase tracking-tighter">
              REC
            </span>
          </div>
        )}

        <div className="h-3 w-px bg-white/5" />

        {!isConnected ? (
          <button
            id="start-interview-btn"
            onClick={connect}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-white/5"
          >
            <CircleDot size={12} className="text-rose-500" />
            Launch
          </button>
        ) : (
          <button
            id="end-interview-btn"
            onClick={disconnect}
            className="flex items-center gap-2 bg-slate-900 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
          >
            <XCircle size={12} />
            Exit
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
    <div className="flex flex-col gap-[1px]">
      {isSpeaking && isUserSpeaking && (
        <div className="flex items-center gap-2 px-6 py-1.5 bg-indigo-500/10 border-b border-indigo-500/20 animate-in slide-in-from-top duration-300">
          <Info size={12} className="text-indigo-400" />
          <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wide">
            Collision detected: Synth is talking. Please mute or wait.
          </span>
        </div>
      )}

      {screenLost && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2 bg-amber-500/20 rounded border border-amber-500/30">
              <span className="text-[10px] font-black text-amber-500 tracking-tighter">
                SCREEN_LOST
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">
                Feed Interrupted
              </span>
              <span className="text-[9px] text-amber-300/60 uppercase tracking-tight">
                Active window monitoring is required for this session.
              </span>
            </div>
          </div>
          <button
            onClick={reshareScreen}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-xl"
          >
            <Monitor size={12} />
            Relink Screen
          </button>
        </div>
      )}

      {tabSwitchWarning && (
        <div className="flex items-center px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 animate-in slide-in-from-top duration-300">
          <AlertTriangle size={12} className="text-rose-400 mr-3 shrink-0" />
          <span className="text-[10px] text-rose-300 font-black uppercase tracking-wider">
            Violation:{" "}
            <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded ml-1">
              Tab Switch
            </span>{" "}
            — {tabSwitchWarning.count}/{tabSwitchWarning.max} warnings.
            {tabSwitchWarning.count >= tabSwitchWarning.max &&
              " AUTOMATIC TERMINATION TRIGGERED."}
          </span>
        </div>
      )}

      {currentState === "FLAGGED" && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 animate-in slide-in-from-top duration-300 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2 border border-rose-500/30 bg-rose-500/10 rounded">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                FLAGGED
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-100 font-bold uppercase tracking-wider">
                Security Anomaly Detected
              </span>
              <span className="text-[9px] text-rose-300/60 uppercase tracking-tight italic">
                Reason: {violationReason || "Suspicious eye/keyboard activity."}
              </span>
            </div>
          </div>
          <button
            onClick={() => sendEvent("warning_acknowledged")}
            className="px-5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg"
          >
            Acknowledge warning
          </button>
        </div>
      )}
    </div>
  );
};
