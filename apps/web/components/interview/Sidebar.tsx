import React from "react";
import { Mic, MicOff, Monitor, User } from "lucide-react";

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
    <div className="w-14 flex flex-col items-center py-5 border-r border-indigo-500/20 gap-6 bg-slate-950">
      <div className="w-8 h-8 bg-indigo-500 text-white flex items-center justify-center font-black text-xs rounded-sm cursor-pointer select-none">
        S
      </div>

      <div className="flex flex-col gap-5 mt-2">
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          className={`p-2 rounded-md transition-colors ${
            isMuted
              ? "bg-red-900/60 text-red-300"
              : "text-gray-500 hover:text-white hover:bg-white/5"
          }`}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={
            screenLost
              ? reshareScreen
              : isConnected
                ? stopScreenShare
                : undefined
          }
          title={
            screenLost
              ? "Click to reshare screen"
              : isConnected
                ? "Click to stop screen share"
                : "Screen share inactive"
          }
          className={`p-2 rounded-md transition-colors ${
            screenLost
              ? "text-amber-400 animate-pulse hover:bg-amber-900/30"
              : isConnected
                ? "text-green-400 hover:bg-white/5"
                : "text-gray-600"
          }`}
        >
          <Monitor size={18} />
        </button>
      </div>

      <div className="mt-auto mb-2">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border border-white/10">
          <User size={16} />
        </div>
      </div>
    </div>
  );
};
