import React from 'react';
import { ArrowRight, Trophy, AlertTriangle, Clock, Zap } from 'lucide-react';
import type { RoomState } from '../types/game';
import { sounds } from '../utils/audio';

interface RoundResultsViewProps {
  roomState: RoomState;
  myPlayerId: string;
  onNextRound: () => void;
}

export const RoundResultsView: React.FC<RoundResultsViewProps> = ({
  roomState,
  myPlayerId,
  onNextRound,
}) => {
  const isHost = roomState.hostId === myPlayerId;
  const players = Object.values(roomState.players);

  // Sort by round reaction (successful draws sorted by reactionTimeMs, then false starts, then missed)
  const roundRanking = [...players].sort((a, b) => {
    const rA = a.currentRoundReaction;
    const rB = b.currentRoundReaction;

    const timeA = rA && !rA.falseStart && rA.reactionTimeMs ? rA.reactionTimeMs : 99999;
    const timeB = rB && !rB.falseStart && rB.reactionTimeMs ? rB.reactionTimeMs : 99999;

    return timeA - timeB;
  });

  // Cumulative score ranking
  const totalScoreRanking = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Round Header */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full inline-block">
          Round {roomState.currentRound} of {roomState.totalRounds} Recap
        </span>
        <h2 className="font-display text-3xl font-black uppercase text-white tracking-wide">
          Draw Rankings
        </h2>
      </div>

      {/* Round Reaction Times */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-1 flex items-center justify-between">
          <span>Speed & Points</span>
          <span className="font-mono text-amber-400">Round {roomState.currentRound}</span>
        </div>

        <div className="space-y-2">
          {roundRanking.map((p, idx) => {
            const isMe = p.id === myPlayerId;
            const r = p.currentRoundReaction;
            const isSuccessful = r && !r.falseStart && r.reactionTimeMs !== null;
            const points = r?.pointsEarned || 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe ? 'bg-amber-500/10 border-amber-500/40' : 'bg-zinc-950/70 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-display font-black text-sm">
                    {isSuccessful ? (
                      idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`
                    ) : r?.falseStart ? (
                      '⚠️'
                    ) : (
                      '❌'
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.avatar}</span>
                    <div>
                      <span className="font-bold text-sm text-white">
                        {p.name} {isMe && <span className="text-xs text-amber-400 font-normal">(You)</span>}
                      </span>
                      {r?.falseStart && (
                        <span className="block text-[11px] text-red-400 font-semibold">
                          False Start (Early Trigger)
                        </span>
                      )}
                      {!r?.falseStart && !isSuccessful && (
                        <span className="block text-[11px] text-zinc-500 font-semibold">
                          No reaction / Missed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {isSuccessful ? (
                    <div>
                      <div className="font-mono font-bold text-sm text-emerald-400">
                        {r.reactionTimeMs} ms
                      </div>
                      <div className="font-display font-bold text-xs text-amber-400">
                        {points > 0 ? `+${points} pts` : '+0 pts'}
                      </div>
                    </div>
                  ) : (
                    <div className="font-display font-bold text-xs text-zinc-500">+0 pts</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cumulative Scoreboard */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
        <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
          <span>Overall Standings</span>
          <span className="text-[11px] text-zinc-500">After {roomState.currentRound} Rounds</span>
        </div>

        <div className="space-y-1.5">
          {totalScoreRanking.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-center font-bold text-zinc-500">{idx + 1}.</span>
                <span>{p.avatar}</span>
                <span className="text-zinc-200 font-medium truncate max-w-[120px]">{p.name}</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Round Action */}
      <div className="space-y-2">
        {isHost ? (
          <button
            onClick={() => {
              sounds.playDrawClick();
              onNextRound();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{roomState.currentRound >= roomState.totalRounds ? 'VIEW FINAL RESULTS' : 'NEXT ROUND NOW'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="text-center p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            Waiting for next round...
          </div>
        )}

        <div className="text-center text-xs text-zinc-500 font-mono">
          Auto-advancing in {roomState.resultsCountdownSec}s...
        </div>
      </div>
    </div>
  );
};
