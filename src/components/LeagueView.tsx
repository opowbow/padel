import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  UserPlus,
  CheckCircle,
  TrendingUp,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { League, LeagueStanding, RecordedMatch, Player } from '../types/padel';
import { getRankingBadge } from '../utils/rankingData';

interface LeagueViewProps {
  leagues: League[];
  activeLeagueId: string;
  onSelectLeague: (id: string) => void;
  standings: LeagueStanding[];
  matches: RecordedMatch[];
  currentPlayer: Player;
  onRegisterForLeague: (leagueId: string, playerId: string) => void;
  onOpenRecordScore: (leagueId: string) => void;
  weightedScoring: boolean;
}

export const LeagueView: React.FC<LeagueViewProps> = ({
  leagues,
  activeLeagueId,
  onSelectLeague,
  standings,
  matches,
  currentPlayer,
  onRegisterForLeague,
  onOpenRecordScore,
  weightedScoring,
}) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const activeLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0];
  const isCurrentPlayerRegistered = activeLeague?.registeredPlayerIds.includes(currentPlayer.id);

  // Filter matches for current league
  const leagueMatches = matches.filter((m) => m.leagueId === activeLeague?.id);

  // Top 3 Podium
  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  return (
    <div className="space-y-6">
      {/* League Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* League Selector Dropdown */}
              <select
                value={activeLeagueId}
                onChange={(e) => onSelectLeague(e.target.value)}
                className="bg-slate-800/90 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-lime-400"
              >
                {leagues.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    🏆 {lg.name}
                  </option>
                ))}
              </select>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                {activeLeague?.season}
              </span>

              {weightedScoring && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/15 text-lime-400 border border-lime-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Weighted Wins Enabled
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {activeLeague?.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {activeLeague?.description}
            </p>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span>👥 {activeLeague?.registeredPlayerIds.length} Registered Players</span>
              <span>•</span>
              <span>🎾 {leagueMatches.length} Recorded Matches</span>
              <span>•</span>
              <span>📅 Season ends: {activeLeague?.activeUntil}</span>
            </div>
          </div>

          {/* Quick League Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {isCurrentPlayerRegistered ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-md">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>You are Registered!</span>
              </div>
            ) : (
              <button
                onClick={() => onRegisterForLeague(activeLeague.id, currentPlayer.id)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4 font-bold" />
                <span>Sign Up for this League</span>
              </button>
            )}

            <button
              onClick={() => onOpenRecordScore(activeLeague.id)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 shadow-md transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>+ Record Match Score</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {standings.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* #2 Silver */}
          {top2 && (
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5 relative overflow-hidden order-2 md:order-1">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 font-black text-base shadow-inner">
                2
              </div>
              <img
                src={top2.player.avatar}
                alt={top2.player.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-400"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Medal className="w-3 h-3 text-slate-400" /> Silver Standing
                </span>
                <p className="text-sm font-bold text-white truncate">{top2.player.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono font-bold text-lime-400">{top2.leaguePoints} pts</span>
                  <span>•</span>
                  <span>{top2.won}W - {top2.lost}L</span>
                </div>
              </div>
            </div>
          )}

          {/* #1 Gold Champion */}
          {top1 && (
            <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/50 flex items-center gap-4 relative overflow-hidden order-1 md:order-2 shadow-xl shadow-amber-500/10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg">
                1
              </div>
              <img
                src={top1.player.avatar}
                alt={top1.player.name}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-amber-400 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> League Leader
                </span>
                <p className="text-base font-black text-white truncate">{top1.player.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="font-mono font-black text-amber-300 text-sm">{top1.leaguePoints} pts</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">+{top1.pointDiff} Diff</span>
                </div>
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {top3 && (
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5 relative overflow-hidden order-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-500 font-black text-base shadow-inner">
                3
              </div>
              <img
                src={top3.player.avatar}
                alt={top3.player.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-700"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-600" /> Bronze Standing
                </span>
                <p className="text-sm font-bold text-white truncate">{top3.player.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono font-bold text-lime-400">{top3.leaguePoints} pts</span>
                  <span>•</span>
                  <span>{top3.won}W - {top3.lost}L</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-lime-400" />
              Official League Standings & Leadership Board
            </h3>
            <p className="text-xs text-slate-400">
              Rankings determined by total league points, points won & lost differential, and match outcomes
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>PW = Points Won</span>
            <span>•</span>
            <span>PL = Points Lost</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 uppercase text-[10px] tracking-wider text-slate-400 font-black">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-3 text-center">Skill Rating</th>
                <th className="py-3 px-3 text-center">Played (MP)</th>
                <th className="py-3 px-3 text-center">W - L</th>
                <th className="py-3 px-3 text-center">Points (PW - PL)</th>
                <th className="py-3 px-3 text-center">Point Diff</th>
                <th className="py-3 px-3 text-center">Recent Form</th>
                <th className="py-3 px-4 text-right">League Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {standings.map((row) => {
                const isCurrent = row.playerId === currentPlayer.id;
                const badge = getRankingBadge(row.player.rankingScore, row.player.rankingText);

                return (
                  <tr
                    key={row.playerId}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      isCurrent ? 'bg-lime-500/10 font-bold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      {row.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400 font-bold">#{row.rank}</span>
                      )}
                    </td>

                    {/* Player */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.player.avatar}
                          alt={row.player.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{row.player.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-lime-400 text-slate-950 font-black">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {row.player.playSide}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Skill Rating */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${badge.badgeColor}`}>
                        {row.player.rankingScore.toFixed(1)}
                      </span>
                    </td>

                    {/* Matches Played */}
                    <td className="py-3 px-3 text-center font-mono">{row.played}</td>

                    {/* Won - Lost */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="text-emerald-400">{row.won}</span>
                      <span className="text-slate-500"> - </span>
                      <span className="text-rose-400">{row.lost}</span>
                    </td>

                    {/* Points Won / Points Lost */}
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      <span className="text-slate-200">{row.pointsWon}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-slate-400">{row.pointsLost}</span>
                    </td>

                    {/* Net Differential */}
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {row.pointDiff > 0 ? (
                        <span className="text-emerald-400">+{row.pointDiff}</span>
                      ) : row.pointDiff < 0 ? (
                        <span className="text-rose-400">{row.pointDiff}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Form badges */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.length > 0 ? (
                          row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center font-mono ${
                                res === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Total League Points */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-sm text-lime-400 drop-shadow">
                        {row.leaguePoints}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recorded League Matches & Weighted Wins Breakdown List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Recent League Match Results & Weighted Formulas
            </h3>
            <p className="text-xs text-slate-400">
              Click any match to inspect its points won, points lost, and weighted scoring breakdown!
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {leagueMatches.map((m) => {
            const isExpanded = expandedMatchId === m.id;
            const teamAWon = m.winnerTeam === 'A';

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all hover:border-slate-700"
              >
                {/* Match Summary Row */}
                <div
                  onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <span>{m.date}</span>
                      <span>•</span>
                      <span>{m.courtName}</span>
                      {m.weightedBonusApplied && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Weighted Win
                          </span>
                        </>
                      )}
                    </div>

                    {/* Teams Display */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      {/* Team A */}
                      <span className={teamAWon ? 'text-lime-400 font-black' : 'text-slate-300'}>
                        {m.teamA.player1.name} & {m.teamA.player2.name}
                      </span>
                      <span className="text-slate-500 font-mono">
                        ({m.teamA.pointsWon} pts won)
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                        vs
                      </span>

                      {/* Team B */}
                      <span className={!teamAWon ? 'text-cyan-400 font-black' : 'text-slate-300'}>
                        {m.teamB.player1.name} & {m.teamB.player2.name}
                      </span>
                      <span className="text-slate-500 font-mono">
                        ({m.teamB.pointsWon} pts won)
                      </span>
                    </div>
                  </div>

                  {/* Score & Points Award */}
                  <div className="flex items-center gap-4">
                    {/* Sets Display */}
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                      {m.setScores.map((s, idx) => (
                        <span key={idx} className="text-white">
                          {s}
                          {idx < m.setScores.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>

                    {/* Award Points */}
                    <div className="text-right">
                      <div className="text-xs font-black text-lime-400 font-mono">
                        Team A: +{m.scoringBreakdown.totalTeamAPoints} pts
                      </div>
                      <div className="text-xs font-black text-cyan-400 font-mono">
                        Team B: +{m.scoringBreakdown.totalTeamBPoints} pts
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Weighted Breakdown Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-850 bg-slate-900/50 text-xs space-y-2">
                    <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Detailed Formula Calculation Breakdown:
                    </div>
                    <div className="space-y-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                      {m.scoringBreakdown.formulaExplanation.map((line, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-slate-500">▶</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
