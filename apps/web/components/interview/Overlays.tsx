import React from "react";
import { Monitor, XCircle, ShieldBan, Home, ChevronRight } from "lucide-react";

interface OverlaysProps {
  currentState: string;
  isConnected: boolean;
  greetingDone: boolean;
  acquireAndStartMedia: () => void;
  isTerminated: boolean;
  screenViolation: {
    box_2d: [number, number, number, number];
    probability: number;
    reason: string;
  } | null;
  webcamViolation: {
    box_2d: [number, number, number, number];
    probability: number;
    reason: string;
  } | null;
  sessionBlocked: {
    type: "terminated" | "completed";
    reason: string;
  } | null;
}

export const Overlays: React.FC<OverlaysProps> = ({
  currentState,
  isConnected,
  greetingDone,
  acquireAndStartMedia,
  isTerminated,
  screenViolation,
  webcamViolation,
  sessionBlocked,
}) => {
  // Blocked session screen (terminated or completed)
  if (sessionBlocked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-[100] p-6 selection:bg-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05)_0%,transparent_50%)]" />
        <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center gap-8 group">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
            {sessionBlocked.type === "terminated" ? (
              <ShieldBan size={40} className="text-white" />
            ) : (
              <XCircle size={40} className="text-white" />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
              {sessionBlocked.type === "terminated"
                ? "Access Revoked"
                : "Session Complete"}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {sessionBlocked.reason}
            </p>
          </div>

          <div className="w-full h-px bg-white/5" />

          <div className="flex flex-col items-center gap-1.5 opacity-40">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Security Clearance
            </span>
            <span className="text-[8px] font-mono text-slate-600">
              ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-slate-100 text-black text-xs font-black uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl hover:shadow-white/5 active:scale-95"
          >
            <Home size={14} />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-[100] p-6">
        <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border border-rose-500/10 p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center gap-8">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center shadow-inner">
            <ShieldBan size={32} className="text-rose-500" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">
              Session Terminated
            </h2>
            <p className="text-rose-300/60 text-[13px] leading-relaxed font-medium">
              Automated proctoring has detected significant policy violations.
              This session is now closed and marked for manual review.
            </p>
          </div>

          <div className="w-full grid gap-4 p-5 bg-black/40 rounded-2xl border border-white/5 text-left">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                Incident Root: Policy Breach
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Your activity logs, screen recordings, and camera feed have been
              vaulted for recruiter investigation.
            </span>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-[0.1em] rounded-2xl transition-all shadow-lg hover:shadow-rose-900/20"
          >
            Exit Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentState === "GREETING" && isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-[80] backdrop-blur-sm p-6">
          <div className="w-full max-w-sm bg-slate-900/60 backdrop-blur-xl border border-blue-500/10 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center gap-8 relative overflow-hidden group">
            {/* Spinning background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/20 transition-all duration-700" />

            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center shadow-inner relative z-10">
              <Monitor
                size={32}
                className={`text-blue-400 ${greetingDone ? "animate-bounce" : "animate-pulse"}`}
              />
            </div>

            <div className="space-y-3 relative z-10">
              <h3 className="text-xl font-black uppercase tracking-widest text-white leading-none">
                Lobby Verification
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed px-4">
                {greetingDone
                  ? "Identity and system check complete. Share your feed to enter the secure coding environment."
                  : "Initializing Synth protocols. Preparing the interview workspace…"}
              </p>
            </div>

            <button
              onClick={acquireAndStartMedia}
              disabled={!greetingDone}
              className={`relative z-10 w-full flex items-center justify-center gap-3 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 ${
                greetingDone
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_-5px_rgba(59,130,246,0.4)] active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 opacity-50"
              }`}
            >
              {greetingDone ? (
                <>
                  Launch Console
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              ) : (
                "Authorizing..."
              )}
            </button>

            {!greetingDone && (
              <div className="w-24 h-[2px] bg-slate-800 rounded-full overflow-hidden relative z-10">
                <div
                  className="absolute inset-0 bg-blue-500/50 animate-[shimmer_1.5s_infinite]"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, transparent, white, transparent)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Violation Box */}
      {screenViolation && screenViolation.box_2d && !isTerminated && (
        <div className="absolute inset-0 pointer-events-none z-[90]">
          {(() => {
            const [ymin, xmin, ymax, xmax] = screenViolation.box_2d;
            const top = `${ymin / 10}%`;
            const left = `${xmin / 10}%`;
            const width = `${(xmax - xmin) / 10}%`;
            const height = `${(ymax - ymin) / 10}%`;

            return (
              <div
                className="absolute border border-rose-500/50 bg-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-500 ease-out flex flex-col items-start rounded-lg overflow-hidden backdrop-blur-[2px]"
                style={{ top, left, width, height }}
              >
                <div className="bg-rose-500 px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap shadow-xl">
                  <div className="w-1 h-1 bg-white rounded-full animate-ping shadow-[0_0_5px_white]" />
                  SCREEN_ANOMALY:{" "}
                  {(screenViolation.probability * 100).toFixed(0)}
                  %_CONFIDENCE
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/10 to-transparent h-1/2 w-full animate-[scan_2s_ease-in-out_infinite]" />
                <div className="mt-auto bg-black/60 p-2 text-[8px] text-rose-100 font-bold uppercase tracking-widest leading-none border-t border-rose-500/20 backdrop-blur-md">
                  S_REASON: {screenViolation.reason}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Webcam Violation Indicator (Simple) */}
      {webcamViolation && !isTerminated && (
        <div className="absolute top-4 right-4 z-[100] animate-bounce">
          <div className="bg-rose-600 text-white px-4 py-2 rounded-full border-2 border-white shadow-2xl flex items-center gap-2 font-bold text-sm">
            <ShieldBan size={18} />
            WEBCAM ALERT: {webcamViolation.reason}
          </div>
        </div>
      )}
    </>
  );
};
