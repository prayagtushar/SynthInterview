import React from "react";
import { Mic, MicOff, Monitor } from "lucide-react";

interface SidebarProps {
  isMuted: boolean;
  toggleMute: () => void;
  screenLost: boolean;
  isConnected: boolean;
  reshareScreen: () => void;
  stopScreenShare: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMuted,
  toggleMute,
  screenLost,
  isConnected,
  reshareScreen,
  stopScreenShare,
}) => {
  return (
    <div className="w-14 flex flex-col items-center py-4 border-r border-indigo-500/10 gap-6 bg-slate-950/80 backdrop-blur-xl z-20">
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-sm rounded-xl cursor-pointer select-none shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">
        S
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <SidebarButton
          onClick={toggleMute}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          isActive={isMuted}
          variant={isMuted ? "danger" : "default"}
          icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        />

        <SidebarButton
          onClick={
            screenLost
              ? reshareScreen
              : isConnected
                ? stopScreenShare
                : undefined
          }
          title={
            screenLost
              ? "Screen share stopped - click to reshare"
              : isConnected
                ? "Stop screen share"
                : "Screen share inactive"
          }
          isActive={screenLost}
          variant={screenLost ? "warning" : isConnected ? "success" : "ghost"}
          icon={<Monitor size={20} />}
        />
      </div>

      <div className="mt-auto flex flex-col gap-4 pb-2"></div>
    </div>
  );
};

interface SidebarButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  title: string;
  isActive?: boolean;
  variant?: "default" | "danger" | "warning" | "success" | "ghost";
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  onClick,
  title,
  isActive,
  variant = "default",
}) => {
  const variants = {
    default: "text-slate-500 hover:text-white hover:bg-white/5",
    danger: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
    warning:
      "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 animate-pulse",
    success: "text-emerald-400 hover:bg-emerald-500/10",
    ghost: "text-slate-600 hover:text-slate-300 hover:bg-white/5",
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-2.5 rounded-xl transition-all duration-200 ${variants[variant]} ${
          isActive ? "shadow-inner" : ""
        }`}
      >
        {icon}
      </button>
      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
        {title}
      </div>
    </div>
  );
};
