import React from 'react';
import {
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  Users,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { PadelGame, LeagueStanding } from '../types/padel';

interface HomeHeroCardsProps {
  onNavigateToGames: (filterType?: 'all' | 'mixin' | 'league') => void;
  onNavigateToLeague: () => void;
  onNavigateToMembers: () => void;
  onOpenRecordScore: () => void;
  topStandings: LeagueStanding[];
  activeGames: PadelGame[];
}

export const HomeHeroCards: React.FC<HomeHeroCardsProps> = ({
  onNavigateToGames,
  onNavigateToLeague,
  onNavigateToMembers,
  onOpenRecordScore,
  topStandings,
  activeGames,
}) => {
  const top4 = topStandings.slice(0, 4);

  // Filter games for Mixin and League
  const openSpotsCount = activeGames.reduce((acc, g) => {
    const filled = Object.values(g.players).filter(Boolean).length;
    return acc + (4 - filled);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Two Main Cards: Mixin Magic & Winter Padel Slay League */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Mixin Magic */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-950/70 via-slate-900 to-indigo-950/40 border-2 border-sky-500/40 p-4 sm:p-7 shadow-2xl flex flex-col justify-between group hover:border-sky-400 transition-all">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/25 transition"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Social & Rotation Sessions
              </span>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                {openSpotsCount} Open Spots
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Mixin Magic</span>
                <span className="text-xl">✨</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md leading-relaxed">
                Jump into fast-paced 4-player social games, partner rotations, and Americanos. Meet fellow PadelSlay members on court!
              </p>
            </div>

            {/* Quick Court Preview for Mixin */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Featured Mixin Courts Today:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-bold text-sky-400 block truncate">Court 2 - Sunset Court</span>
                    <span className="text-[10px] text-slate-400">19:00 • 2 Spots Open</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-bold text-blue-400 block truncate">Court 4 - Center Court</span>
                    <span className="text-[10px] text-slate-400">17:30 • Americano</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => onNavigateToGames('all')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
            >
              <span>Explore Mixin Magic Games</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToMembers}
              className="text-xs font-bold text-slate-300 hover:text-sky-300 flex items-center gap-1 transition"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Join Member List</span>
            </button>
          </div>
        </div>

        {/* Card 2: Winter Padel Slay League (Eye-Catching Animated Attraction) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950/50 to-orange-950/30 border-2 border-sky-400/50 p-4 sm:p-7 shadow-2xl flex flex-col justify-between group hover:border-sky-300 transition-all animate-league-attract">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/25 transition"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-orange-400" />
                Championship Division
              </span>
              <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400 animate-flame-shimmer" />
                Featured League
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Winter Padel Slay League</span>
                <span className="text-xl">🔥</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md leading-relaxed">
                The premier competitive championship. Points won & lost recorded every game with giant-killer weighted bonus points.
              </p>
            </div>

            {/* Top 4 Players Showcase */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Top 4 Ranked Slay Titans:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {top4.map((standing, idx) => (
                  <div
                    key={standing.playerId}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-orange-600 text-white'
                          : 'bg-sky-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <img
                      src={standing.player.avatar}
                      alt={standing.player.name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                    />
                    <div className="truncate flex-1">
                      <span className="font-bold text-white block text-[11px] truncate">
                        {standing.player.name}
                      </span>
                      <span className="text-[9px] text-sky-400 font-mono font-bold">
                        {standing.leaguePoints} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onNavigateToLeague}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
            >
              <span>View Full Standings & Scores</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenRecordScore}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>+ Record Match Score</span>
            </button>
          </div>
        </div>
      </div>

      {/* Designated Court Locations & Status Directory */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>🏟️</span>
              <span>Court Locations & Live Playing Status</span>
            </h3>
            <p className="text-xs text-slate-400">
              Games are scheduled across 4 designated indoor and outdoor arenas
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30 self-start sm:self-auto">
            All 4 Courts Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              courtNum: 'Court 1',
              name: 'Pink Glass Arena',
              spec: 'Indoor • Panoramic Super Glass',
              surface: 'Mondo Supercourt XN',
              status: 'Active Match',
              color: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
            },
            {
              courtNum: 'Court 2',
              name: 'Sunset Court',
              spec: 'Indoor • Mondo Pro Turf',
              surface: 'Sunset Amber Coating',
              status: 'Open Booking',
              color: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
            },
            {
              courtNum: 'Court 3',
              name: 'Electric Blue Skyline',
              spec: 'Outdoor • 360° Open Air',
              surface: 'Sky Blue Championship Turf',
              status: 'Reserved 18:00',
              color: 'border-sky-400/40 text-sky-300 bg-sky-500/10',
            },
            {
              courtNum: 'Court 4',
              name: 'Center Court Pro',
              spec: 'Indoor • Center Stadium Showcourt',
              surface: 'LED Scoreboard & Glass Backing',
              status: 'League Matches',
              color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
            },
          ].map((c) => (
            <div
              key={c.courtNum}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono border ${c.color}`}>
                  {c.courtNum}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {c.status}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{c.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{c.spec}</p>
                <p className="text-[10px] text-slate-500">{c.surface}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
