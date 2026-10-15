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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/20 via-slate-900 to-indigo-950/40 border-2 border-sky-400/40 p-4 sm:p-8 shadow-2xl">
        {/* Glow ambient effect */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar & Crown */}
          <div className="relative flex-shrink-0 text-center">
            {/* Crown Icon */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30">
                <Trophy className="w-6 h-6 fill-white" />
              </div>
            </div>

            <div className="relative mt-2">
              <img
                src={player.avatar}
                alt={player.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-sky-400 ring-4 ring-sky-400/30 shadow-2xl"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950 border border-sky-400 text-sky-300 text-[11px] font-black uppercase tracking-wider font-mono shadow-md">
                WEEK 41 MVP
              </span>
            </div>
          </div>

          {/* Details & Stats */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Most Improved Slay Player of the Week
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeColor}`}>
                {player.rankingText}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {player.name}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed max-w-2xl bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              "{commentary}"
            </p>

            {/* Growth Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Weekly Points Surge
                </span>
                <span className="text-xl font-black font-mono text-sky-400 flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4" />+{pointsGained}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Rating Leap
                </span>
                <span className="text-xl font-black font-mono text-orange-400 flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4" />+{rankDelta.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Streak
                </span>
                <span className="text-xl font-black font-mono text-pink-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4" />{streak} Wins
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Match Win Rate
                </span>
                <span className="text-xl font-black font-mono text-sky-400 flex items-center justify-center gap-1">
                  {winRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Runner-Ups Podiums */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-400" />
            Weekly Improvement Leaderboard & Contenders
          </h3>
          <p className="text-xs text-slate-400">
            Players recording high point gains, winning streaks, and rating jumps over the past 7 days
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {runnerUps.map((r, i) => (
            <div
              key={r.player.id}
              className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5 hover:border-slate-600 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-slate-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-800 shrink-0">
                #{i + 2}
              </div>
              <img
                src={r.player.avatar}
                alt={r.player.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{r.player.name}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                  <span className="text-sky-400 font-bold">+{r.pointsGained} pts</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-orange-400">+{r.rankDelta.toFixed(1)} lvl</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Hall of Fame */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            Past Most Improved Champions
          </h3>
          <span className="text-xs font-mono text-slate-400">Season Archive</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {historicalAwards.map((item) => (
            <div
              key={`${item.year}-W${item.weekNumber}-${item.player.id}`}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
            >
              <img
                src={item.player.avatar}
                alt={item.player.name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 rounded">
                    Week {item.weekNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.year}</span>
                </div>
                <h4 className="font-bold text-white text-xs truncate mt-0.5">
                  {item.player.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {item.commentary || item.headline}
                </p>
                <span className="text-[10px] font-mono text-orange-400 font-bold block mt-1">
                  +{item.pointsGained} pts gained
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
