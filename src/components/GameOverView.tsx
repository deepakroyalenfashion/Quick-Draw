import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Zap, Award, Sparkles } from 'lucide-react';
import type { RoomState } from '../types/game';
import { sounds } from '../utils/audio';

interface GameOverViewProps {
  roomState: RoomState;
  myPlayerId: string;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  roomState,
  myPlayerId,
  onRestartGame,
  onLeaveRoom,
}) => {
  const isHost = roomState.hostId === myPlayerId;
  const players = Object.values(roomState.players);

  // Sorted leaderboard
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aMin = Math.min(...a.roundHistory.map((h) => h.reactionTimeMs || 9999));
    const bMin = Math.min(...b.roundHistory.map((h) => h.reactionTimeMs || 9999));
    return aMin - bMin;
  });

  const winner = sortedPlayers[0];
  const isWinnerMe = winner?.id === myPlayerId;

  // Find all-time fastest draw in this match
  let fastestDraw: { player: string; time: number; round: number } | null = null;
  players.forEach((p) => {
    p.roundHistory.forEach((h) => {
      if (h.reactionTimeMs && (!fastestDraw || h.reactionTimeMs < fastestDraw.time)) {
        fastestDraw = {
          player: p.name,
          time: h.reactionTimeMs,
          round: h.round,
        };
      }
    });
  });

  // Confetti cannon & victory fanfare on mount
  useEffect(() => {
    sounds.playVictory();
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // Confetti fallback
    }
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Winner Hero Banner */}
      <div className="bg-gradient-to-b from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 mb-3 shadow-lg shadow-amber-500/20">
          <Trophy className="w-9 h-9" />
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
          Tournament Champion
        </span>

        <h2 className="font-display text-3xl sm:text-4xl font-black text-white mt-1">
          {winner?.name}
        </h2>

        <div className="text-4xl my-2">{winner?.avatar}</div>

        <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 font-mono font-black text-lg">
          {winner?.score} Total Points
        </div>

        {isWinnerMe && (
          <div className="mt-3 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 py-1 px-3 rounded-full inline-block">
            🎉 You conquered the frontier!
          </div>
        )}
      </div>

      {/* Fastest Draw Stat Highlight */}
      {fastestDraw && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <span className="font-bold text-white block">Fastest Reflex of the Duel</span>
              <span className="text-zinc-400">
                {(fastestDraw as { player: string; time: number; round: number }).player} in Round {(fastestDraw as { player: string; time: number; round: number }).round}
              </span>
            </div>
          </div>
          <div className="font-mono font-black text-emerald-400 text-base">
            {(fastestDraw as { player: string; time: number; round: number }).time}ms
          </div>
        </div>
      )}

      {/* Full Final Leaderboard */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
          Final Duel Standings
        </h3>

        <div className="space-y-2">
          {sortedPlayers.map((p, idx) => {
            const isMe = p.id === myPlayerId;
            const validRounds = p.roundHistory.filter((h) => h.reactionTimeMs);
            const avgTime =
              validRounds.length > 0
                ? Math.round(
                    validRounds.reduce((acc, h) => acc + (h.reactionTimeMs || 0), 0) /
                      validRounds.length
                  )
                : null;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  idx === 0
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                    : isMe
                    ? 'bg-zinc-900 border-zinc-700'
                    : 'bg-zinc-950/70 border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-base w-6 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-2xl">{p.avatar}</span>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      {p.name} {isMe && <span className="text-xs text-amber-400 font-normal">(You)</span>}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {avgTime ? `Avg: ${avgTime}ms` : 'No valid draws'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-amber-400 text-lg">
                    {p.score} <span className="text-xs font-normal text-zinc-500">pts</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isHost ? (
          <button
            onClick={() => {
              sounds.playDrawClick();
              onRestartGame();
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>
        ) : (
          <div className="text-center p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            Waiting for host to restart game...
          </div>
        )}

        <button
          onClick={() => {
            sounds.playDrawClick();
            onLeaveRoom();
          }}
          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Main Menu</span>
        </button>
      </div>
    </div>
  );
};
