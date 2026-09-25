import React, { useState } from 'react';
import { Copy, Check, Play, UserPlus, Trash2, Crown, Bot, Sparkles, Share2 } from 'lucide-react';
import type { RoomState } from '../types/game';
import { sounds } from '../utils/audio';

interface LobbyViewProps {
  roomState: RoomState;
  myPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayerId,
  onStartGame,
  onAddBot,
  onRemoveBot,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const players = Object.values(roomState.players);
  const isHost = roomState.hostId === myPlayerId;
  const botCount = players.filter((p) => p.isBot).length;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopiedCode(true);
    sounds.playDrawClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sounds.playDrawClick();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Room Code Card */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />
        
        <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
          Room Code
        </span>

        <div className="flex items-center justify-center gap-3">
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-amber-400 drop-shadow-sm bg-zinc-950/80 px-6 py-2 rounded-xl border border-zinc-800">
            {roomState.roomCode}
          </div>
        </div>

        {/* Copy buttons */}
        <div className="flex gap-2 justify-center pt-1">
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">Share this code or link with friends on other devices/tabs</p>
      </div>

      {/* Players List Header & Count */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white">Gunslingers</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 font-mono font-bold">
              {players.length}/12
            </span>
          </div>

          {isHost && botCount < 5 && (
            <button
              onClick={() => {
                sounds.playDrawClick();
                onAddBot();
              }}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>+ Add Bot</span>
            </button>
          )}
        </div>

        {/* Players List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {players.map((p) => {
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'bg-zinc-950/70 border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner"
                    style={{ backgroundColor: `${p.color}25`, borderColor: p.color, borderWidth: 1 }}
                  >
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">
                        {p.name} {isMe && <span className="text-xs text-amber-400 font-normal">(You)</span>}
                      </span>
                      {p.isHost && (
                        <span title="Room Host" className="inline-flex">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </span>
                      )}
                      {p.isBot && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          AI BOT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {p.isBot ? 'Simulated Reflex' : 'Ready to draw'}
                    </span>
                  </div>
                </div>

                {isHost && p.isBot && (
                  <button
                    onClick={() => {
                      sounds.playDrawClick();
                      onRemoveBot(p.id);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Remove Bot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Start Game or Waiting indicator */}
        <div className="pt-2">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playDrawClick();
                onStartGame();
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-display font-black text-xl rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-zinc-950" />
              <span>START DUEL (5 ROUNDS)</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Waiting for host to start duel...</span>
              </div>
              <p className="text-xs text-zinc-500">Keep your eyes sharp when the countdown begins!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
