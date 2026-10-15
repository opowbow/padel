import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  UserPlus,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Info,
  Flame,
  Users,
} from 'lucide-react';
import { Player } from '../types/padel';
import { getRankingBadge } from '../utils/rankingData';

interface HeaderProps {
  currentPlayer: Player;
  players: Player[];
  onSelectPlayer: (id: string) => void;
  onOpenSignUp: () => void;
  onOpenMembers?: () => void;
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
  onOpenMembers,
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-blue-600 to-pink-500 flex items-center justify-center shadow-lg shadow-sky-500/25 transform hover:rotate-6 transition-transform">
              <Flame className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white uppercase italic">
                Padel<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-pink-500">Slay</span>
              </span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Padel App
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Mixin Magic & Winter Padel Slay League
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Web vs Mobile */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => onToggleViewMode('web')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'web'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Desktop</span>
          </button>

          <button
            onClick={() => onToggleViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'mobile'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App</span>
          </button>
        </div>

        {/* Right Section: Member list button, Weighted wins toggle, & Player profile switcher */}
        <div className="flex items-center gap-3">
          {/* Join Member List button */}
          {onOpenMembers && (
            <button
              onClick={onOpenMembers}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members Roster</span>
            </button>
          )}

          {/* Weighted Scoring Toggle */}
          <div className="relative">
            <button
              onClick={onToggleWeightedScoring}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                weightedScoring
                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle weighted win scoring engine"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden lg:inline">Weighted Wins:</span>
              <span className="font-mono">{weightedScoring ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowWeightingInfo(!showWeightingInfo)}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center border border-slate-600 hover:bg-slate-700"
            >
              <Info className="w-2.5 h-2.5" />
            </button>

            {/* Tooltip info modal */}
            {showWeightingInfo && (
              <div className="absolute right-0 mt-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                    Weighted Scoring Engine
                  </span>
                  <button
                    onClick={() => setShowWeightingInfo(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Awards higher points for <strong>Giant-Killer Upset wins</strong> (beating a higher-ranked team) and <strong>Partner Carry bonuses</strong> (winning with a developing partner).
                </p>
                <div className="p-2 rounded-lg bg-slate-950 text-[10px] font-mono text-orange-400">
                  Total = Base Win (20) + Net Points Diff + Opponent Bonus + Carry Bonus
                </div>
              </div>
            )}
          </div>

          {/* Active Player Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            >
              <img
                src={currentPlayer.avatar}
                alt={currentPlayer.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-sky-400/50"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1 leading-tight">
                  <span className="truncate max-w-[110px]">{currentPlayer.name}</span>
                </div>
                <div className="text-[10px] text-sky-400 font-mono font-bold">
                  {badge.label}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                <div className="p-3 bg-slate-950/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Switch Active Slay Player:
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
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
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-pink-500/15 border border-pink-500/30'
                            : 'hover:bg-slate-800'
                        }`}
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-pink-400' : 'text-slate-200'}`}>
                            {p.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {pBadge.label} ({p.rankingScore.toFixed(1)})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 bg-slate-950/60 flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      onOpenSignUp();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-pink-500/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Sign Up New Player</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Reset all demo data back to defaults?')) {
                        onResetData();
                        setShowUserDropdown(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-[11px] font-semibold transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Demo Data</span>
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
