import React, { useState } from 'react';
import { X, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { Player, PlaySide, DominantHand } from '../types/padel';
import { RANKING_PRESETS, parseRankingScore, getRankingBadge } from '../utils/rankingData';

interface PlayerSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (playerData: Omit<Player, 'id' | 'matchesPlayed' | 'matchesWon' | 'currentStreak' | 'weeklyPointsGained' | 'weeklyRankDelta' | 'joinedDate'>) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
];

export const PlayerSignUpModal: React.FC<PlayerSignUpModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [rankingMode, setRankingMode] = useState<'preset' | 'manual'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(3); // Level 3.0
  const [manualRankingText, setManualRankingText] = useState('Level 3.7 - Intermediate Plus');
  const [playSide, setPlaySide] = useState<PlaySide>('Left (Drive)');
  const [dominantHand, setDominantHand] = useState<DominantHand>('Right');
  const [bio, setBio] = useState('Eager to play weekly league games and weekend social hits!');

  if (!isOpen) return null;

  const currentPreset = RANKING_PRESETS[selectedPresetIndex];
  const activeRankingText = rankingMode === 'preset' ? currentPreset.label : manualRankingText;
  const activeRankingScore = rankingMode === 'preset' ? currentPreset.level : parseRankingScore(manualRankingText);
  const badge = getRankingBadge(activeRankingScore, activeRankingText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onRegister({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@padelhub.io`,
      avatar: selectedAvatar,
      rankingText: activeRankingText,
      rankingScore: activeRankingScore,
      rankingType: rankingMode,
      playSide,
      dominantHand,
      bio,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-lime-400 text-slate-950">
                <Sparkles className="w-5 h-5 font-bold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Player Sign-Up & Ranking
                </h3>
                <p className="text-xs text-slate-400">
                  Join PadelHub, set your skill level, and start booking matches!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Avatar & Basic Info */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Avatar
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {AVATAR_OPTIONS.map((av, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(av)}
                  className={`relative rounded-xl overflow-hidden transition-all flex-shrink-0 ${
                    selectedAvatar === av
                      ? 'ring-4 ring-lime-400 scale-105'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt="avatar option" className="w-12 h-12 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Carlos Alcaraz"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
              />
            </div>
          </div>

          {/* Ranking Selection Section (Preset vs Manual) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-lime-400 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Player Skill Ranking
                </span>
                <p className="text-[11px] text-slate-400">
                  Pick from standard list or enter custom manual rating
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setRankingMode('preset')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    rankingMode === 'preset'
                      ? 'bg-lime-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  List of Options
                </button>
                <button
                  type="button"
                  onClick={() => setRankingMode('manual')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    rankingMode === 'manual'
                      ? 'bg-lime-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual Text
                </button>
              </div>
            </div>

            {/* If Preset Selected */}
            {rankingMode === 'preset' ? (
              <div className="space-y-2">
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                >
                  {RANKING_PRESETS.map((preset, index) => (
                    <option key={preset.level} value={index}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  💡 {currentPreset.description}
                </p>
              </div>
            ) : (
              /* If Manual Text Selected */
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualRankingText}
                  onChange={(e) => setManualRankingText(e.target.value)}
                  placeholder="e.g. Level 3.75 - Intermediate Plus / Playtomic 4.1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                />
                <p className="text-[11px] text-slate-400">
                  Enter your rating text (e.g. <i>Playtomic 3.8</i>, <i>Advanced 4.5</i>, or <i>Intermediate</i>).
                </p>
              </div>
            )}

            {/* Live Preview Badge */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <span className="text-xs text-slate-400">Calculated Match Rating:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeColor}`}>
                  {activeRankingScore.toFixed(1)} / 7.0
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Playing Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Court Side Preference
              </label>
              <select
                value={playSide}
                onChange={(e) => setPlaySide(e.target.value as PlaySide)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
              >
                <option value="Left (Drive)">Left (Drive - Defensive / Builder)</option>
                <option value="Right (Revés)">Right (Revés - Offensive / Finisher)</option>
                <option value="Both Sides">Both Sides (Versatile)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dominant Hand
              </label>
              <select
                value={dominantHand}
                onChange={(e) => setDominantHand(e.target.value as DominantHand)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
              >
                <option value="Right">Right-Handed</option>
                <option value="Left">Left-Handed (Lefty Advantage!)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Player Bio / Style Notes
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Loves fast viboras and solid defense off the back glass..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 text-xs"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-lime-500/20 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              <span>Complete Sign Up & Enter Hub</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
