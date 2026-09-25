import React from 'react';
import { X, Award, AlertTriangle, Clock, Zap, Target } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-white">How To Play Quick Draw</h3>
            <p className="text-xs text-zinc-400">Out-draw your opponents in real-time</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-zinc-300">
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800 flex gap-3 items-start">
            <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">1. The Countdown</span>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every round begins with a 3-second countdown. Keep your finger poised and ready, but don't pull the trigger yet!
              </p>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800 flex gap-3 items-start">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">2. The Signal</span>
              <p className="text-xs text-zinc-400 mt-0.5">
                At an unpredictable moment (1.5 to 5 seconds after countdown), the server flashes the <strong className="text-amber-400">DRAW!</strong> signal. Tap the screen or press <strong className="text-white">Spacebar</strong> instantly!
              </p>
            </div>
          </div>

          <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-900/40 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block">3. Watch Out for False Starts!</span>
              <p className="text-xs text-amber-200/80 mt-0.5">
                If you tap before the signal appears, you trigger a <strong className="text-amber-400">FALSE START</strong>. You are disqualified for that round and receive 0 points.
              </p>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-2 font-bold text-white">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Scoring per Round (5 Rounds total)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-zinc-900 p-2 rounded-lg border border-amber-500/40">
                <span className="text-amber-400 font-bold block text-sm">🥇 1st</span>
                <span className="text-white font-mono font-bold">+3 pts</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-700">
                <span className="text-slate-300 font-bold block text-sm">🥈 2nd</span>
                <span className="text-white font-mono font-bold">+2 pts</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded-lg border border-orange-900/40">
                <span className="text-amber-600 font-bold block text-sm">🥉 3rd</span>
                <span className="text-white font-mono font-bold">+1 pt</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-bold text-base rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
        >
          Got It, Let's Duel!
        </button>
      </div>
    </div>
  );
};
