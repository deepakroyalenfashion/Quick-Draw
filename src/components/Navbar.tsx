import React from 'react';
import { Volume2, VolumeX, HelpCircle, LogOut, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

interface NavbarProps {
  roomCode?: string;
  isConnected: boolean;
  onOpenRules: () => void;
  onLeaveRoom?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  isConnected,
  onOpenRules,
  onLeaveRoom,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg sm:text-xl tracking-wider text-white">
                QUICK DRAW
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PVP
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className="text-[11px] font-medium">{isConnected ? 'Server Online' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-zinc-400">ROOM:</span>
              <span className="font-mono font-bold text-amber-400 tracking-wider">{roomCode}</span>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={onOpenRules}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="How to Play"
            aria-label="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {onLeaveRoom && roomCode && (
            <button
              onClick={() => {
                sounds.playDrawClick();
                onLeaveRoom();
              }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-950/40 border border-red-900/50 hover:bg-red-900/50 px-2.5 py-1.5 rounded-lg transition-colors ml-1"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
