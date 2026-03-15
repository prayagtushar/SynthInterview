import React from "react";

interface AIAvatarProps {
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isConnected: boolean;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  isSpeaking,
  isUserSpeaking,
  isConnected,
}) => {
  return (
    <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/5 shadow-2xl relative overflow-hidden group/avatar">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border transition-all duration-500 ${
            isSpeaking
              ? "border-blue-400/60 shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-105"
              : isUserSpeaking
                ? "border-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                : "border-white/10 group-hover/avatar:border-white/20"
          }`}
        >
          <div
            className={`absolute inset-0.5 rounded-full bg-gradient-to-br from-blue-500/20 to-sky-500/20 ${isSpeaking ? "animate-pulse" : ""}`}
          />
          <span className="relative z-10 text-base font-black text-white/90">
            S
          </span>
        </div>
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
            <div className="absolute inset-[-4px] rounded-full border border-blue-400/10 animate-pulse" />
          </>
        )}
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-sm font-black text-white tracking-tight">Synth</p>
        <p className="text-[10px] font-bold tracking-wide uppercase mt-0.5">
          {isSpeaking ? (
            <span className="text-blue-400 animate-pulse">Speaking…</span>
          ) : isUserSpeaking ? (
            <span className="text-emerald-400">Listening…</span>
          ) : isConnected ? (
            <span className="text-slate-500">Standby</span>
          ) : (
            <span className="text-slate-600">Offline</span>
          )}
        </p>
      </div>
      <div className="flex items-end gap-[3px] h-8 relative z-10 px-2">
        {[
          { color: "bg-blue-400", anim: "animate-wave-sm" },
          { color: "bg-sky-400", anim: "animate-wave-md" },
          { color: "bg-white", anim: "animate-wave-lg" },
          { color: "bg-sky-400", anim: "animate-wave-md" },
          { color: "bg-blue-400", anim: "animate-wave-sm" },
        ].map((bar, i) => (
          <div
            key={i}
            className={`w-[4px] rounded-full transition-all duration-500 ${
              isSpeaking
                ? `${bar.color} ${bar.anim} shadow-[0_0_12px_rgba(59,130,246,0.6)]`
                : isUserSpeaking
                  ? "bg-emerald-400 animate-wave-md"
                  : "bg-white/10 h-1"
            }`}
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
