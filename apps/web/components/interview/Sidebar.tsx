import React from "react";
import { Mic, MicOff, Monitor, Zap } from "lucide-react";

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
    <div className="w-16 flex flex-col items-center py-6 border-r border-white/5 gap-8 bg-black z-20">
      <div className="w-10 h-10 relative group cursor-pointer">
        <div className="relative w-full h-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-white/30">
          <Zap className="text-white" size={20} />
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-2">
        <SidebarButton
          onClick={toggleMute}
          title={isMuted ? "RESTORE AUDIO FEED" : "INTERRUPT AUDIO FEED"}
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
              ? "UPLINK FAILURE: CLICK TO RESHARE"
              : isConnected
                ? "TERMINATE FEED"
                : "UPLINK INACTIVE"
          }
          isActive={screenLost}
          variant={screenLost ? "warning" : isConnected ? "success" : "ghost"}
          icon={<Monitor size={20} />}
        />
      </div>

      <div className="mt-auto flex flex-col gap-4 pb-4">
        <div className="w-8 h-[1px] bg-white/10 mx-auto" />
        <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] transform -rotate-90 origin-center whitespace-nowrap mb-8">
          Synth Engine
        </div>
      </div>
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
    default: "text-white/40 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    warning:
      "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 animate-pulse",
    success: "text-white/80 hover:bg-white/10",
    ghost: "text-white/20 hover:text-white/40 hover:bg-white/[0.02]",
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-3 transition-all duration-200 border border-transparent ${variants[variant]} ${
          isActive ? "border-current bg-current/5" : ""
        }`}
      >
        {icon}
      </button>
      <div className="absolute left-full ml-4 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
        {title}
      </div>
    </div>
  );
};
