import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Zap, AlertTriangle, CheckCircle, Clock, ShieldAlert, Award } from 'lucide-react';
import type { RoomState } from '../types/game';
import { sounds } from '../utils/audio';

interface GameViewProps {
  roomState: RoomState;
  myPlayerId: string;
  onPlayerDraw: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  roomState,
  myPlayerId,
  onPlayerDraw,
}) => {
  const me = roomState.players[myPlayerId];
  const myReaction = me?.currentRoundReaction;
  const hasReacted = Boolean(myReaction);
  const isFalseStart = myReaction?.falseStart;
  const reactionTime = myReaction?.reactionTimeMs;

  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [tapEffect, setTapEffect] = useState(false);
  const prevPhase = useRef(roomState.phase);
  const prevCountdown = useRef(roomState.countdownNumber);

  // Audio & Haptic cues on phase change
  useEffect(() => {
    // Countdown beeps
    if (roomState.phase === 'countdown' && prevCountdown.current !== roomState.countdownNumber) {
      sounds.playCountdown(roomState.countdownNumber);
      prevCountdown.current = roomState.countdownNumber;
    }

    // Signal fired: Gunshot + screen shake + haptic vibration
    if (roomState.phase === 'signal_active' && prevPhase.current !== 'signal_active') {
      sounds.playDrawSignal();
      sounds.triggerVibration([80, 50, 80]);
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 350);
    }

    // False start buzzer sound
    if (myReaction?.falseStart) {
      sounds.playFalseStart();
      sounds.triggerVibration(180);
    }

    prevPhase.current = roomState.phase;
  }, [roomState.phase, roomState.countdownNumber, myReaction?.falseStart]);

  // Handle trigger tap / draw
  const handleTrigger = useCallback(() => {
    if (hasReacted) return; // already tapped this round

    setTapEffect(true);
    setTimeout(() => setTapEffect(false), 200);

    if (roomState.phase === 'signal_active') {
      sounds.playDrawClick();
      sounds.triggerVibration(40);
    } else if (roomState.phase === 'waiting_for_signal' || roomState.phase === 'countdown') {
      sounds.playFalseStart();
      sounds.triggerVibration(150);
    }

    onPlayerDraw();
  }, [hasReacted, roomState.phase, onPlayerDraw]);

  // Spacebar hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTrigger]);

  // Sorted list of players by score
  const sortedPlayers = Object.values(roomState.players).sort((a, b) => b.score - a.score);

  return (
    <div
      className={`max-w-xl mx-auto px-4 py-4 flex flex-col justify-between min-h-[calc(100vh-4rem)] select-none ${
        isScreenShaking ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Top Header: Round & Mini Scoreboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">ROUND</span>
            <span className="font-display font-black text-lg text-amber-400">
              {roomState.currentRound} <span className="text-zinc-500 font-normal">/ {roomState.totalRounds}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">YOUR SCORE:</span>
            <span className="font-mono font-black text-lg text-white bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800">
              {me?.score || 0} pts
            </span>
          </div>
        </div>

        {/* Live player avatars and score pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sortedPlayers.map((p) => {
            const isMe = p.id === myPlayerId;
            const reaction = p.currentRoundReaction;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shrink-0 transition-all ${
                  isMe
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-zinc-900/70 border-zinc-800/80'
                }`}
              >
                <span className="text-base">{p.avatar}</span>
                <span className="font-bold text-white max-w-[80px] truncate">{p.name}</span>
                <span className="font-mono text-amber-400 font-bold ml-1">{p.score}</span>
                {reaction?.falseStart && (
                  <span className="text-[10px] text-red-400 font-bold px-1 bg-red-950/60 rounded">
                    EARLY
                  </span>
                )}
                {reaction && !reaction.falseStart && reaction.reactionTimeMs && (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold px-1 bg-emerald-950/60 rounded">
                    {reaction.reactionTimeMs}ms
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Duel Stage / Reaction Zone */}
      <div className="my-auto py-4">
        {/* COUNTDOWN PHASE */}
        {roomState.phase === 'countdown' && (
          <div
            onClick={handleTrigger}
            className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl bg-zinc-900/90 border-2 border-zinc-800 flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden cursor-pointer group active:scale-[0.99] transition-transform"
          >
            <div className="text-xs uppercase font-bold tracking-widest text-zinc-500 mb-2">
              STEADY YOUR TRIGGER...
            </div>
            <div className="font-display font-black text-8xl sm:text-9xl text-amber-400 tracking-tighter drop-shadow-2xl animate-pulse">
              {roomState.countdownNumber}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-full border border-zinc-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>DO NOT TAP YET! Wait for signal</span>
            </div>
          </div>
        )}

        {/* WAITING FOR SIGNAL (TENSE SUSPENSE) */}
        {roomState.phase === 'waiting_for_signal' && (
          <div
            onClick={handleTrigger}
            className={`w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden cursor-pointer transition-all ${
              isFalseStart
                ? 'bg-red-950/80 border-4 border-red-600'
                : 'bg-gradient-to-b from-amber-950/30 to-zinc-950 border-2 border-amber-500/40 hover:border-amber-500/70'
            }`}
          >
            {isFalseStart ? (
              <div className="space-y-3 animate-shake">
                <div className="w-16 h-16 rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <div className="font-display font-black text-4xl sm:text-5xl text-red-500 tracking-wider">
                  FALSE START!
                </div>
                <p className="text-xs text-red-300 max-w-xs mx-auto">
                  You pulled the trigger too early! Disqualified for this round.
                </p>
                <div className="text-xs font-mono font-bold text-red-400 bg-red-950 px-3 py-1 rounded-lg inline-block">
                  0 points this round
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-ping" />
                <div className="font-display font-black text-3xl sm:text-5xl text-white tracking-widest uppercase">
                  WAIT FOR IT...
                </div>
                <p className="text-xs sm:text-sm text-amber-300/80 font-medium max-w-xs mx-auto">
                  Hold your fire! Any tap right now is a <span className="font-bold text-red-400">FALSE START</span>!
                </p>
              </div>
            )}
          </div>
        )}

        {/* SIGNAL ACTIVE (FLASH & DRAW!) */}
        {roomState.phase === 'signal_active' && (
          <div
            onClick={handleTrigger}
            className={`w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden cursor-pointer transition-all ${
              hasReacted
                ? isFalseStart
                  ? 'bg-red-950/80 border-4 border-red-600'
                  : 'bg-emerald-950/80 border-4 border-emerald-500'
                : 'bg-gradient-to-br from-emerald-500 via-amber-400 to-yellow-500 border-4 border-white animate-flash-glow shadow-emerald-500/50'
            }`}
          >
            {hasReacted ? (
              isFalseStart ? (
                <div className="space-y-2">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                  <div className="font-display font-black text-4xl text-red-400">FALSE START</div>
                  <div className="text-xs text-zinc-300">Triggered before signal</div>
                </div>
              ) : (
                <div className="space-y-3 animate-scaleUp">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    Trigger Pulled!
                  </div>

                  <div className="font-mono font-black text-6xl sm:text-7xl text-white tracking-tight drop-shadow-md">
                    {reactionTime} <span className="text-2xl text-emerald-400">ms</span>
                  </div>

                  {myReaction?.rank && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-display font-bold text-lg text-amber-400 bg-zinc-950/80 px-3 py-1 rounded-xl border border-zinc-700">
                        {myReaction.rank === 1 && '🥇 1st PLACE (+3 pts)'}
                        {myReaction.rank === 2 && '🥈 2nd PLACE (+2 pts)'}
                        {myReaction.rank === 3 && '🥉 3rd PLACE (+1 pt)'}
                        {myReaction.rank > 3 && `${myReaction.rank}th Place (+0 pts)`}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400">Waiting for other gunslingers...</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="font-display font-black text-7xl sm:text-9xl text-zinc-950 tracking-tighter drop-shadow-lg leading-none">
                  {roomState.signalWord}
                </div>
                <div className="text-zinc-950 font-bold text-base sm:text-xl tracking-widest uppercase bg-white/90 px-6 py-2 rounded-full inline-block shadow-md">
                  TAP SCREEN OR SPACEBAR NOW!
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Big Tap Action Button (Mobile-friendly Trigger Pad) */}
      <div className="pt-2">
        <button
          onClick={handleTrigger}
          disabled={hasReacted}
          className={`w-full py-5 rounded-2xl font-display font-black text-xl sm:text-2xl tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl ${
            hasReacted
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
              : roomState.phase === 'signal_active'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-zinc-950 ring-4 ring-white shadow-emerald-500/40 active:scale-95'
              : 'bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 text-zinc-200 active:scale-95'
          }`}
        >
          <Zap
            className={`w-6 h-6 ${
              roomState.phase === 'signal_active' ? 'fill-zinc-950 text-zinc-950' : 'text-amber-400'
            }`}
          />
          <span>
            {hasReacted
              ? isFalseStart
                ? 'FALSE START RECORDED'
                : `LOCKED IN (${reactionTime}ms)`
              : roomState.phase === 'signal_active'
              ? 'TAP TO DRAW NOW!'
              : 'TRIGGER PAD (SPACEBAR)'}
          </span>
        </button>
        <p className="text-center text-[11px] text-zinc-500 mt-2">
          Tap the big target above, this button, or press Spacebar
        </p>
      </div>
    </div>
  );
};
