import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  UserPlus,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Player } from '../types/padel';
import { getRankingBadge } from '../utils/rankingData';

interface HeaderProps {
  currentPlayer: Player;
  players: Player[];
  onSelectPlayer: (id: string) => void;
  onOpenSignUp: () => void;
  viewMode: 'web' | 'mobile';
  onToggleViewMode: (mode: 'web' | 'mobile') => void;
  weightedScoring: boolean;
  onToggleWeightedScoring: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlayer,
  players,
  onSelectPlayer,
  onOpenSignUp,
  viewMode,
  onToggleViewMode,
  weightedScoring,
  onToggleWeightedScoring,
  onResetData,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWeightingInfo, setShowWeightingInfo] = useState(false);
  const badge = getRankingBadge(currentPlayer.rankingScore, currentPlayer.rankingText);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 via-lime-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-lime-500/20 transform hover:rotate-6 transition-transform">
              <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white uppercase italic">
                PADEL<span className="text-lime-400">SMASH</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30">
                PRO HUB
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Group Bookings • Ranked Leagues • Player Growth
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Web vs Mobile) */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => onToggleViewMode('web')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'web'
                ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop / Full Web View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Web View</span>
          </button>

          <button
            onClick={() => onToggleViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'mobile'
                ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile Smartphone Interactive Frame"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App View</span>
          </button>
        </div>

        {/* Right Section: Active User Switcher, Weighted Wins Toggle, Reset */}
        <div className="flex items-center gap-3">
          {/* Weighted Scoring Feature Toggle */}
          <div className="relative hidden md:block">
            <button
              onClick={onToggleWeightedScoring}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                weightedScoring
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Weighted Win scoring (Higher reward for beating top teams or carrying weaker partner)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Weighted Wins: {weightedScoring ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => setShowWeightingInfo(!showWeightingInfo)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] border border-slate-700"
              title="Learn how weighted wins work"
            >
              <Info className="w-2.5 h-2.5" />
            </button>

            {showWeightingInfo && (
              <div className="absolute top-10 right-0 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-xs text-slate-300 z-50 animate-in fade-in zoom-in-95">
                <p className="font-bold text-amber-400 mb-1">⚡ Weighted Win Scoring Engine</p>
                <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                  When enabled, match winners earn bonus league points if they defeat higher-ranked opponents, plus a carry bonus when partnering with a lower-rated player!
                </p>
                <button
                  onClick={() => setShowWeightingInfo(false)}
                  className="w-full py-1 bg-slate-800 text-slate-200 rounded text-[11px] hover:bg-slate-700"
                >
                  Got it
                </button>
              </div>
            )}
          </div>

          {/* Current Player Profile & Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-700/80 p-1.5 pr-3 rounded-xl border border-slate-700 transition-all text-left"
            >
              <img
                src={currentPlayer.avatar}
                alt={currentPlayer.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-lime-400/50"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="truncate max-w-[100px]">{currentPlayer.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${badge.badgeColor}`}>
                    {currentPlayer.rankingScore.toFixed(1)}
                  </span>
                </div>
                <div className="text-[10px] text-lime-400/90 flex items-center gap-1">
                  <span>+{currentPlayer.weeklyPointsGained} pts this wk</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active Player
                  </p>
                  <p className="text-xs text-slate-500">
                    Test bookings & league scoring as any player:
                  </p>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {players.map((p) => {
                    const isSelected = p.id === currentPlayer.id;
                    const pBadge = getRankingBadge(p.rankingScore, p.rankingText);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPlayer(p.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-800/80 transition-colors ${
                          isSelected ? 'bg-lime-500/10 border-l-2 border-lime-400' : ''
                        }`}
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{p.rankingText}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${pBadge.badgeColor}`}>
                          {p.rankingScore.toFixed(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-800 flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSignUp();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Sign Up New Player</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Reset all bookings, matches, and players to default demo data?')) {
                        onResetData();
                        setShowUserDropdown(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-slate-400 hover:text-slate-200 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Sample Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
