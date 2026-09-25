import React, { useState } from 'react';
import { Play, Plus, Users, Zap, Bot, ArrowRight, ShieldCheck } from 'lucide-react';
import { AVATARS, PLAYER_COLORS } from '../utils/avatars';
import { sounds } from '../utils/audio';

interface HomeViewProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;
  color: string;
  setColor: (color: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onSoloPractice: () => void;
  isConnecting: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playerName,
  setPlayerName,
  avatar,
  setAvatar,
  color,
  setColor,
  onCreateRoom,
  onJoinRoom,
  onSoloPractice,
  isConnecting,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Please enter your nickname first!');
      return;
    }
    if (!joinCode.trim()) {
      setErrorMsg('Please enter a 4-letter room code!');
      return;
    }
    setErrorMsg('');
    sounds.playDrawClick();
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  const handleCreateSubmit = () => {
    if (!playerName.trim()) {
      setErrorMsg('Please enter your nickname first!');
      return;
    }
    setErrorMsg('');
    sounds.playDrawClick();
    onCreateRoom();
  };

  const handlePracticeSubmit = () => {
    if (!playerName.trim()) {
      setErrorMsg('Please enter your nickname first!');
      return;
    }
    setErrorMsg('');
    sounds.playDrawClick();
    onSoloPractice();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Zap className="w-3.5 h-3.5 fill-amber-400" />
          Real-Time Multiplayer Duel
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
          Quick <span className="text-amber-400">Draw</span>
        </h1>
        <p className="text-sm text-zinc-400 max-w-xs mx-auto">
          Fastest reflex wins the round. 5 rounds of high-noon showdowns with friends.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs px-3.5 py-2.5 rounded-xl text-center animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            Your Nickname
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={14}
            placeholder="e.g. Wyatt Earp"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white rounded-xl px-4 py-2.5 text-base font-semibold outline-none transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            Choose Avatar & Color
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  setAvatar(av.emoji);
                  sounds.playDrawClick();
                }}
                className={`w-11 h-11 shrink-0 rounded-xl text-xl flex items-center justify-center transition-all ${
                  avatar === av.emoji
                    ? 'ring-2 ring-amber-400 scale-105 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: avatar === av.emoji ? `${color}20` : undefined,
                  borderColor: avatar === av.emoji ? color : undefined,
                }}
              >
                {av.emoji}
              </button>
            ))}
          </div>

          {/* Color swatches */}
          <div className="flex gap-2 items-center mt-2.5">
            {PLAYER_COLORS.slice(0, 7).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Create Room */}
        <button
          onClick={handleCreateSubmit}
          disabled={isConnecting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Create New Room</span>
        </button>

        {/* Join Room Form */}
        <form onSubmit={handleJoinSubmit} className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ROOM CODE"
            className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-blue-500 text-white font-mono font-bold tracking-widest text-center uppercase rounded-xl px-3 py-3 text-base outline-none transition-all placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={isConnecting}
            className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-display font-bold text-base rounded-xl flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Join</span>
          </button>
        </form>

        {/* Quick Solo Practice / Duel Bot */}
        <div className="pt-2">
          <button
            onClick={handlePracticeSubmit}
            disabled={isConnecting}
            className="w-full py-2.5 px-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex items-center justify-between text-xs font-medium transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white block">Solo Practice vs AI Sheriff</span>
                <span className="text-[11px] text-zinc-400">Test reaction speed instantly</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-zinc-400">
        <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
          <span className="text-white font-bold block text-xs">2–12</span>
          <span>Live Players</span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
          <span className="text-amber-400 font-bold block text-xs">5 Rounds</span>
          <span>Quick Paced</span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
          <span className="text-emerald-400 font-bold block text-xs">Zero Lag</span>
          <span>Server Timed</span>
        </div>
      </div>
    </div>
  );
};
