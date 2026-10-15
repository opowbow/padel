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
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1534751516642-a171ed28723c?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
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
  const [bio, setBio] = useState('Ready for weekly Mixin Magic and Winter League matches!');

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
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@playslay.io`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-pink-950/40 via-slate-900 to-orange-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Join PadelSlay
              </h3>
              <p className="text-xs text-slate-400">
                Register player profile & set your skill ranking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Your Avatar
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {AVATAR_OPTIONS.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt="avatar"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-12 h-12 rounded-xl object-cover cursor-pointer transition ${
                    selectedAvatar === av
                      ? 'ring-3 ring-pink-500 scale-105'
                      : 'opacity-60 hover:opacity-100 ring-1 ring-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name / Nickname *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Franny - the OG - JZ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
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
                placeholder="you@playslay.io"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Skill Ranking Section */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Skill Ranking Input:
              </label>

              {/* Mode switch */}
              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setRankingMode('preset')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    rankingMode === 'preset'
                      ? 'bg-pink-500 text-white font-bold'
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
                      ? 'bg-pink-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual Text
                </button>
              </div>
            </div>

            {rankingMode === 'preset' ? (
              <div className="space-y-2">
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                >
                  {RANKING_PRESETS.map((preset, index) => (
                    <option key={preset.level} value={index}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  💡 {currentPreset.description}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualRankingText}
                  onChange={(e) => setManualRankingText(e.target.value)}
                  placeholder="e.g. Level 3.75 - Intermediate Plus / Playtomic 4.2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
                <p className="text-[11px] text-slate-400">
                  Type your club ranking or description. The system parses your numerical level automatically.
                </p>
              </div>
            )}

            {/* Live Evaluated Skill Badge */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Matchmaking Rating:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${badge.badgeColor}`}>
                  {activeRankingScore.toFixed(1)} / 7.0
                </span>
                <span className="text-xs text-slate-300 font-semibold">{badge.label}</span>
              </div>
            </div>
          </div>

          {/* Court Side & Hand Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preferred Court Side
              </label>
              <select
                value={playSide}
                onChange={(e) => setPlaySide(e.target.value as PlaySide)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="Left (Drive)">Left Side (Drive)</option>
                <option value="Right (Revés)">Right Side (Revés)</option>
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="Right">Right-Handed</option>
                <option value="Left">Left-Handed</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Short Bio / Playing Style
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-500 text-xs"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 mt-2"
          >
            <UserCheck className="w-4 h-4 font-bold" />
            <span>Complete Registration & Enter Court</span>
          </button>
        </form>
      </div>
    </div>
  );
};
