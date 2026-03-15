import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CircleDot,
  XCircle,
  AlertTriangle,
  Monitor,
  Timer,
  Info,
  Zap,
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
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black shrink-0 z-10">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-4 group cursor-pointer">
          <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 group-hover:border-white/30 transition-all">
            <Zap className="text-white" size={18} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[12px] font-black tracking-[0.3em] text-white uppercase italic">
              Synth<span className="text-white/20 not-italic ml-1">v2.5</span>
            </span>
          </div>
        </Link>

        <div className="h-6 w-[1px] bg-white/10" />

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            Status
          </div>
          <div
            className={`inline-flex items-center gap-3 px-4 py-1.5 border border-white/10 text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-500 ${stateColor.replace("rounded-full", "").replace("rounded", "")} bg-white/5`}
          >
            <div className="scale-75 opacity-70">{stateIcon}</div>
            {currentState === "PROBLEM_DELIVERY"
              ? "New Challenge"
              : currentState === "THINK_TIME"
                ? "Analyzing"
                : currentState === "APPROACH_LISTEN"
                  ? "Collaborating"
                  : currentState === "TESTING"
                    ? "Validating"
                    : currentState === "OPTIMIZATION"
                      ? "Refining"
                      : currentState.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div
          onClick={() => isConnected && setIsTimerRunning(!isTimerRunning)}
          className={`flex items-center gap-4 cursor-pointer text-[12px] font-black px-5 py-2 border transition-all duration-300 ${
            isTimerRunning
              ? "text-white bg-white/5 border-white/20"
              : "text-white/20 bg-transparent border-white/5"
          } hover:border-white/40`}
          title="Toggle Chronometer"
        >
          <Timer
            size={14}
            className={isTimerRunning ? "text-white" : "text-white/20"}
          />
          <span className="font-mono tracking-widest">{formatTime(time)}</span>
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
            dot: "bg-white/10",
            text: "text-white/20",
            label: "Standby",
          };

          if (isSpeaking) {
            s = {
              dot: "bg-white animate-pulse",
              text: "text-white",
              label: "Synth Active",
            };
          } else if (isUserSpeaking) {
            s = {
              dot: "bg-emerald-500 animate-bounce",
              text: "text-emerald-400",
              label: "Receiving Feed",
            };
          } else if (isConnected && conversationStates.has(currentState)) {
            s = {
              dot: "bg-white/40",
              text: "text-white/60",
              label: "Encrypted Link",
            };
          } else if (!isConnected) {
            s = {
              dot: "bg-red-500/50",
              text: "text-red-400/60",
              label: "Offline",
            };
          }

          return (
            <div className="flex items-center gap-4 bg-white/[0.02] px-5 py-2 border border-white/5">
              <div
                className={`w-1.5 h-1.5 rounded-none transition-all duration-500 ${s.dot}`}
              />
              <span
                className={`text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${s.text}`}
              >
                {s.label}
              </span>
            </div>
          );
        })()}

        <div className="h-6 w-[1px] bg-white/10" />

        {!isConnected ? (
          <button
            id="start-interview-btn"
            onClick={connect}
            className="flex items-center gap-3 bg-white text-black px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-[#eee] active:scale-95 shadow-[0_10px_30px_-5px_rgba(255,255,255,0.2)]"
          >
            <CircleDot size={14} className="text-red-600" />
            Initialize
          </button>
        ) : (
          <button
            id="end-interview-btn"
            onClick={disconnect}
            className="flex items-center gap-3 bg-white/5 border border-white/10 hover:border-red-500/40 text-white/40 hover:text-red-400 px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95"
          >
            <XCircle size={14} />
            Terminate
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
