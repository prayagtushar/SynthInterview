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
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-blue-500/20 flex items-center justify-center transition-all group-hover:border-blue-500/40">
            <img
              src="/logo.svg"
              alt="SynthInterview Logo"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black tracking-[0.2em] text-slate-300 uppercase">
              Synth<span className="text-white">Interview</span>
            </span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Smart Security Active
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/5" />

        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.05em] shadow-sm transition-all duration-500 ${stateColor.replace("rounded", "rounded-full")} border border-white/5`}
        >
          <div className="scale-75 opacity-70">{stateIcon}</div>
          {currentState === "PROBLEM_DELIVERY"
            ? "New Problem"
            : currentState === "THINK_TIME"
              ? "Problem Intro"
              : currentState === "APPROACH_LISTEN"
                ? "Listening"
                : currentState === "TESTING"
                  ? "Testing Solution"
                  : currentState === "OPTIMIZATION"
                    ? "Refining Code"
                    : currentState.replace(/_/g, " ")}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          onClick={() => isConnected && setIsTimerRunning(!isTimerRunning)}
          className={`flex items-center gap-2.5 cursor-pointer text-[11px] font-mono font-bold px-4 py-1.5 rounded-full border transition-all duration-300 ${
            isTimerRunning
              ? "text-blue-300 bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              : "text-slate-500 bg-slate-900 border-white/5 opacity-50"
          } hover:border-blue-500/40 hover:opacity-100`}
          title="Click to toggle timer"
        >
          <Timer
            size={14}
            className={isTimerRunning ? "text-blue-400" : "text-slate-600"}
          />
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

          let s = {
            dot: "bg-slate-500",
            text: "text-slate-500",
            label: "Standby",
            glow: "",
          };

          if (isSpeaking) {
            s = {
              dot: "bg-blue-400 animate-pulse",
              text: "text-blue-300 text-glow-blue",
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
              dot: "bg-blue-500/40",
              text: "text-blue-400/80",
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
            <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/5 transition-all duration-500">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-500 ${s.dot} ${s.glow}`}
              />
              <span
                className={`text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-500 ${s.text}`}
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
            className="flex items-center gap-2.5 bg-white hover:bg-slate-100 text-black px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            <CircleDot size={14} className="text-rose-500" />
            Start Session
          </button>
        ) : (
          <button
            id="end-interview-btn"
            onClick={disconnect}
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <XCircle size={14} />
            End Now
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
        <div className="flex items-center gap-2 px-6 py-1.5 bg-blue-500/10 border-b border-blue-500/20 animate-in slide-in-from-top duration-300">
          <Info size={12} className="text-blue-400" />
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wide">
            Collision detected: Synth is talking. Please mute or wait.
          </span>
        </div>
      )}

      {screenLost && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2 border border-amber-500/30 bg-amber-500/10 rounded-full">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">
                NOTICE
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">
                Screen Feed Lost
              </span>
              <span className="text-[9px] text-amber-300/60 uppercase tracking-tight">
                Screen sharing is required to proceed with the technical
                session.
              </span>
            </div>
          </div>
          <button
            onClick={reshareScreen}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full transition-all shadow-xl"
          >
            <Monitor size={12} />
            Reshare Screen
          </button>
        </div>
      )}

      {tabSwitchWarning && (
        <div className="flex items-center px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 animate-in slide-in-from-top duration-300">
          <AlertTriangle size={12} className="text-rose-400 mr-3 shrink-0" />
          <span className="text-[10px] text-rose-300 font-black uppercase tracking-wider">
            Alert:{" "}
            <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full ml-1 text-[9px]">
              Tab Switch
            </span>{" "}
            — {tabSwitchWarning.count}/{tabSwitchWarning.max} warnings issued.
            {tabSwitchWarning.count >= tabSwitchWarning.max &&
              " AUTO-TERMINATION IN PROGRESS."}
          </span>
        </div>
      )}

      {currentState === "FLAGGED" && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 animate-in slide-in-from-top duration-300 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2 border border-rose-500/30 bg-rose-500/10 rounded-full">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                ALERT
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-100 font-bold uppercase tracking-wider">
                Security Warning
              </span>
              <span className="text-[9px] text-rose-300/60 uppercase tracking-tight italic">
                Reason: {violationReason || "Unusual tab or keyboard activity."}
              </span>
            </div>
          </div>
          <button
            onClick={() => sendEvent("warning_acknowledged")}
            className="px-5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full transition-all shadow-lg"
          >
            I understand
          </button>
        </div>
      )}
    </div>
  );
};
