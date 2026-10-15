import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  Users,
  Flame,
  CheckCircle2,
  Calendar,
  Check,
  Zap,
} from 'lucide-react';
import { Player, SignUpOption, SIGN_UP_OPTIONS } from '../types/padel';
import { getRankingBadge } from '../utils/rankingData';

interface SignUpOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  currentPlan?: SignUpOption;
  onConfirmSignUp: (option: SignUpOption, notes?: string) => void;
  defaultOption?: SignUpOption;
}

export const SignUpOptionsModal: React.FC<SignUpOptionsModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  currentPlan,
  onConfirmSignUp,
  defaultOption = 'both',
}) => {
  const [selectedOption, setSelectedOption] = useState<SignUpOption>(currentPlan || defaultOption);
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const badge = getRankingBadge(currentPlayer.rankingScore, currentPlayer.rankingText);
  const selectedConfig = SIGN_UP_OPTIONS.find((opt) => opt.id === selectedOption) || SIGN_UP_OPTIONS[2];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSignUp(selectedOption, notes);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  const getOptionIcon = (id: SignUpOption) => {
    switch (id) {
      case 'mixin':
        return <Calendar className="w-5 h-5 text-sky-400" />;
      case 'league':
        return <Trophy className="w-5 h-5 text-orange-400" />;
      case 'both':
        return <Flame className="w-5 h-5 text-pink-400 animate-flame-shimmer" />;
      case 'casual':
        return <Users className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-pink-500"></div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-sky-500/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 border-b border-slate-800 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <Zap className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Player Registration
                </span>
                <span className="text-[10px] font-bold text-slate-400">PadelSlay</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                Sign Up for PadelSlay
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Identity Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <img
              src={currentPlayer.avatar}
              alt={currentPlayer.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-400/50"
            />
            <div>
              <span className="text-slate-400">Signing up as: </span>
              <strong className="text-white font-bold">{currentPlayer.name}</strong>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeColor}`}>
            {badge.label}
          </span>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
              Select Your Sign-Up Option:
            </label>

            {/* The 4 Explicit Options */}
            <div className="space-y-2.5">
              {SIGN_UP_OPTIONS.map((option) => {
                const isSelected = selectedOption === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? `${option.borderActive} bg-gradient-to-r ${option.gradient}`
                        : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Custom Radio Circle */}
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'border-sky-400 bg-sky-400 text-slate-950 shadow-sm'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-slate-900 border border-slate-700/60 shrink-0">
                            {getOptionIcon(option.id)}
                          </span>
                          <span className="font-black text-sm sm:text-base text-white tracking-tight">
                            {option.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                          {option.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {option.description}
                      </p>

                      {/* Feature Indicators */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
                        {option.includesMixin && (
                          <span className="flex items-center gap-1 text-sky-400">
                            <CheckCircle2 className="w-3 h-3" /> Mixin Sessions
                          </span>
                        )}
                        {option.includesLeague && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <CheckCircle2 className="w-3 h-3" /> Winter League Ladder
                          </span>
                        )}
                        {option.id === 'casual' && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <CheckCircle2 className="w-3 h-3" /> Social Standby Roster
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Notes / Vibes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Playing Availability / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Free Tue & Thu evenings / Looking for competitive left-side partner"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                  <span>Signed Up Successfully!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 font-bold" />
                  <span>Confirm: {selectedConfig.label}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
