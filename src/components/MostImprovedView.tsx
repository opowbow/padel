import React from 'react';
import {
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Player, WeeklyAward } from '../types/padel';
import { getRankingBadge } from '../utils/rankingData';

interface MostImprovedViewProps {
  mostImprovedData: {
    player: Player;
    pointsGained: number;
    rankDelta: number;
    winRate: number;
    streak: number;
    commentary: string;
    runnerUps: { player: Player; pointsGained: number; rankDelta: number }[];
  };
  historicalAwards: WeeklyAward[];
}

export const MostImprovedView: React.FC<MostImprovedViewProps> = ({
  mostImprovedData,
  historicalAwards,
}) => {
  const { player, pointsGained, rankDelta, winRate, streak, commentary, runnerUps } =
    mostImprovedData;
  const badge = getRankingBadge(player.rankingScore, player.rankingText);

  return (
    <div className="space-y-6">
      {/* Hero Spotlight Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-indigo-950 border-2 border-amber-400/40 p-6 sm:p-8 shadow-2xl">
        {/* Glow ambient effect */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-lime-400/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar & Crown */}
          <div className="relative flex-shrink-0 text-center">
            {/* Crown Icon */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30">
                <Trophy className="w-6 h-6 fill-slate-950" />
              </div>
            </div>

            <div className="relative mt-2">
              <img
                src={player.avatar}
                alt={player.name}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-amber-400 ring-4 ring-amber-400/30 shadow-2xl"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950 border border-amber-400 text-amber-300 text-[11px] font-black uppercase tracking-wider font-mono shadow-md">
                WEEK 41 MVP
              </span>
            </div>
          </div>

          {/* Details & Stats */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Most Improved Player of the Week
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeColor}`}>
                {player.rankingText}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {player.name}
            </h2>

            <p className="text-sm text-slate-300 italic leading-relaxed max-w-2xl bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              "{commentary}"
            </p>

            {/* Growth Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Weekly Points Surge
                </span>
                <span className="text-xl font-black font-mono text-lime-400 flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4" />+{pointsGained}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Rating Leap
                </span>
                <span className="text-xl font-black font-mono text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4" />+{rankDelta.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Streak
                </span>
                <span className="text-xl font-black font-mono text-rose-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4" />{streak} Wins
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Match Win Rate
                </span>
                <span className="text-xl font-black font-mono text-cyan-400 flex items-center justify-center gap-1">
                  {winRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Runner-Ups Podiums */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-lime-400" />
            Weekly Improvement Leaderboard & Contenders
          </h3>
          <p className="text-xs text-slate-400">
            Players recording high point gains, winning streaks, and rating jumps over the past 7 days
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {runnerUps.map((r, i) => (
            <div
              key={r.player.id}
              className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5 hover:border-slate-600 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-slate-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-800">
                #{i + 2}
              </div>
              <img
                src={r.player.avatar}
                alt={r.player.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{r.player.name}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                  <span className="text-lime-400 font-bold">+{r.pointsGained} pts</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400">+{r.rankDelta.toFixed(1)} lvl</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Hall of Fame Archive */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Previous Weeks Hall of Fame
          </h3>
          <p className="text-xs text-slate-400">
            Archived weekly winners and their milestone performances
          </p>
        </div>

        <div className="space-y-3">
          {historicalAwards.map((award) => (
            <div
              key={award.weekNumber}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-xs font-mono">
                  W{award.weekNumber}
                </div>
                <img
                  src={award.player.avatar}
                  alt={award.player.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{award.player.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {award.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-md line-clamp-1">
                    {award.headline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-lime-400 font-bold">+{award.pointsGained} pts</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400">+{award.rankDelta} rank leap</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400">{award.winRate}% win rate</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
