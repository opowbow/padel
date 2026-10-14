import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Save,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import { Player, PlaySide, DominantHand } from '../types/padel';
import { RANKING_PRESETS, parseRankingScore, getRankingBadge } from '../utils/rankingData';

interface ProfileViewProps {
  currentPlayer: Player;
  onUpdatePlayer: (updated: Player) => void;
  onOpenSignUp: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentPlayer,
  onUpdatePlayer,
  onOpenSignUp,
}) => {
  const [rankingMode, setRankingMode] = useState<'preset' | 'manual'>(currentPlayer.rankingType);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(() => {
    const idx = RANKING_PRESETS.findIndex((p) => p.level === currentPlayer.rankingScore);
    return idx >= 0 ? idx : 3;
  });
  const [manualText, setManualText] = useState(currentPlayer.rankingText);
  const [playSide, setPlaySide] = useState<PlaySide>(currentPlayer.playSide);
  const [dominantHand, setDominantHand] = useState<DominantHand>(currentPlayer.dominantHand);
  const [bio, setBio] = useState(currentPlayer.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentPreset = RANKING_PRESETS[selectedPresetIndex];
  const activeRankingText = rankingMode === 'preset' ? currentPreset.label : manualText;
  const activeRankingScore = rankingMode === 'preset' ? currentPreset.level : parseRankingScore(manualText);
  const badge = getRankingBadge(activeRankingScore, activeRankingText);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdatePlayer({
      ...currentPlayer,
      rankingText: activeRankingText,
      rankingScore: activeRankingScore,
      rankingType: rankingMode,
      playSide,
      dominantHand,
      bio,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const winRate = currentPlayer.matchesPlayed > 0
    ? Math.round((currentPlayer.matchesWon / currentPlayer.matchesPlayed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <img
            src={currentPlayer.avatar}
            alt={currentPlayer.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-lime-400/50 shadow-xl"
          />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeColor}`}>
                {badge.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {currentPlayer.playSide}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {currentPlayer.dominantHand}-Handed
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {currentPlayer.name}
            </h2>
            <p className="text-xs text-slate-400">{currentPlayer.email}</p>

            {currentPlayer.bio && (
              <p className="text-xs text-slate-300 italic pt-1 max-w-xl">
                "{currentPlayer.bio}"
              </p>
            )}
          </div>

          <div className="flex sm:flex-col gap-2">
            <button
              onClick={onOpenSignUp}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-lime-400" />
              <span>+ Add New Player</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Calculated Rating
            </span>
            <span className="text-2xl font-black font-mono text-lime-400">
              {currentPlayer.rankingScore.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Matches Won / Total
            </span>
            <span className="text-2xl font-black font-mono text-white">
              {currentPlayer.matchesWon} <span className="text-xs text-slate-400">/ {currentPlayer.matchesPlayed}</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Win Rate
            </span>
            <span className="text-2xl font-black font-mono text-cyan-400">
              {winRate}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Weekly Points Gained
            </span>
            <span className="text-2xl font-black font-mono text-amber-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />+{currentPlayer.weeklyPointsGained}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Ranking & Preferences Form */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              Update Your Padel Ranking & Skill Level
            </h3>
            <p className="text-xs text-slate-400">
              Switch between standard presets or enter custom manual rating text
            </p>
          </div>

          {savedSuccess && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" /> Changes Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {/* Ranking Mode Toggle */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Ranking Input Method:
              </span>

              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setRankingMode('preset')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    rankingMode === 'preset'
                      ? 'bg-lime-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  List of Standard Options
                </button>
                <button
                  type="button"
                  onClick={() => setRankingMode('manual')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    rankingMode === 'manual'
                      ? 'bg-lime-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual Text Input
                </button>
              </div>
            </div>

            {rankingMode === 'preset' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Skill Level Tier
                </label>
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
                <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  💡 {currentPreset.description}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Custom Manual Ranking Text
                </label>
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="e.g. Level 3.75 - Intermediate Plus / Playtomic 4.1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                />
                <p className="text-[11px] text-slate-400">
                  You can enter your exact club rating (e.g. "Playtomic 3.8", "LTA 4.2", "Beginner 1.5"). The engine extracts numeric values automatically for league calculations.
                </p>
              </div>
            )}

            {/* Calculated Rating Bar */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Match System Rating:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${badge.badgeColor}`}>
                  {activeRankingScore.toFixed(1)} / 7.0
                </span>
                <span className="text-xs text-slate-300 font-semibold">{badge.label}</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preferred Court Side
              </label>
              <select
                value={playSide}
                onChange={(e) => setPlaySide(e.target.value as PlaySide)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
              >
                <option value="Left (Drive)">Left Side (Drive - Play Builder)</option>
                <option value="Right (Revés)">Right Side (Revés - Finisher)</option>
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
              >
                <option value="Right">Right-Handed</option>
                <option value="Left">Left-Handed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Playing Style / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20"
          >
            <Save className="w-4 h-4 font-bold" />
            <span>Save Profile & Ranking Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
};
