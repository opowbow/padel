import React from 'react';
import {
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';
import { Player, RecordedMatch } from '../types/padel';
import { calculateMatchScoring, sortMatchesChronologically } from '../utils/scoringEngine';
import { getShortPlayerName } from '../utils/teamGenerator';

interface PlayerGamesDrilldownProps {
  player: Player;
  matches: RecordedMatch[];
  weightedScoring: boolean;
  mode: 'last4' | 'last8';
  onChangeMode: (nextMode: 'last4' | 'last8') => void;
  onClose: () => void;
}

export const PlayerGamesDrilldown: React.FC<PlayerGamesDrilldownProps> = ({
  player,
  matches,
  weightedScoring,
  mode,
  onChangeMode,
  onClose,
}) => {
  // All matches in this league involving this player, most recent first
  const playerMatchesDesc = sortMatchesChronologically(
    matches.filter(
      (m) =>
        m.teamA.player1.id === player.id ||
        m.teamA.player2.id === player.id ||
        m.teamB.player1.id === player.id ||
        m.teamB.player2.id === player.id
    )
  ).reverse();

  const limit = mode === 'last8' ? 8 : 4;
  const visibleMatches = playerMatchesDesc.slice(0, limit);
  const totalCount = playerMatchesDesc.length;

  // Summary across the currently displayed window (last 4 or last 8)
  let windowWins = 0;
  let windowLosses = 0;
  let windowDraws = 0;
  let windowPtsFor = 0;
  let windowPtsAgainst = 0;

  visibleMatches.forEach((m) => {
    const isTeamA = m.teamA.player1.id === player.id || m.teamA.player2.id === player.id;
    const myPts = isTeamA ? m.teamA.pointsWon : m.teamB.pointsWon;
    const oppPts = isTeamA ? m.teamB.pointsWon : m.teamA.pointsWon;
    windowPtsFor += myPts;
    windowPtsAgainst += oppPts;
    if (m.winnerTeam === 'Tie') {
      windowDraws += 1;
    } else if ((isTeamA && m.winnerTeam === 'A') || (!isTeamA && m.winnerTeam === 'B')) {
      windowWins += 1;
    } else {
      windowLosses += 1;
    }
  });

  const windowDiff = windowPtsFor - windowPtsAgainst;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-2xl bg-slate-950/95 border border-sky-500/35 p-3 @xl:p-4 space-y-3 shadow-inner"
    >
      {/* Drill-down Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/90">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              {getShortPlayerName(player)} — Last {mode === 'last8' ? '8' : '4'} Games
            </span>
          </span>

          {visibleMatches.length > 0 && (
            <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">{windowWins}W</span>
              <span className="text-slate-500">-</span>
              <span className="text-rose-400 font-bold">{windowLosses}L</span>
              {windowDraws > 0 ? `-${windowDraws}D` : ''} • {windowPtsFor}-{windowPtsAgainst} (
              {windowDiff >= 0 ? `+${windowDiff}` : windowDiff})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Segmented Toggle between Last 4 & More (Last 8) */}
          <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => onChangeMode('last4')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                mode === 'last4'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 4
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('last8')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                mode === 'last8'
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 8
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close player match history"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Matches List (Read-Only — editing scores is strictly inside Tasks -> Scores -> Edit) */}
      {visibleMatches.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          No recorded games yet for {player.name}. Once a score is saved, it will appear here automatically.
        </p>
      ) : (
        <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-2.5">
          {visibleMatches.map((m, idx) => {
            const isTeamA =
              m.teamA.player1.id === player.id || m.teamA.player2.id === player.id;
            const partner = isTeamA
              ? m.teamA.player1.id === player.id
                ? m.teamA.player2
                : m.teamA.player1
              : m.teamB.player1.id === player.id
              ? m.teamB.player2
              : m.teamB.player1;
            const opp1 = isTeamA ? m.teamB.player1 : m.teamA.player1;
            const opp2 = isTeamA ? m.teamB.player2 : m.teamA.player2;

            const myPts = isTeamA ? m.teamA.pointsWon : m.teamB.pointsWon;
            const oppPts = isTeamA ? m.teamB.pointsWon : m.teamA.pointsWon;

            const dynBreakdown = weightedScoring
              ? calculateMatchScoring({
                  teamAPlayer1: m.teamA.player1,
                  teamAPlayer2: m.teamA.player2,
                  teamBPlayer1: m.teamB.player1,
                  teamBPlayer2: m.teamB.player2,
                  teamAPointsWon: m.teamA.pointsWon,
                  teamBPointsWon: m.teamB.pointsWon,
                  winnerTeam: m.winnerTeam,
                  useWeighting: true,
                })
              : m.scoringBreakdown;

            const awardedLeaguePts = weightedScoring
              ? isTeamA
                ? dynBreakdown.totalTeamAPoints
                : dynBreakdown.totalTeamBPoints
              : myPts;

            const result: 'W' | 'L' | 'D' =
              m.winnerTeam === 'Tie'
                ? 'D'
                : (isTeamA && m.winnerTeam === 'A') || (!isTeamA && m.winnerTeam === 'B')
                ? 'W'
                : 'L';

            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl border transition space-y-2 ${
                  result === 'W'
                    ? 'bg-emerald-950/15 border-emerald-500/30'
                    : result === 'L'
                    ? 'bg-rose-950/15 border-rose-500/25'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Top metadata bar */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-black text-[10px] ${
                        result === 'W'
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : result === 'L'
                          ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {result === 'W' ? 'WIN' : result === 'L' ? 'LOSS' : 'DRAW'}
                    </span>

                    <span className="text-slate-400 font-mono text-[10px]">
                      #{idx + 1}
                    </span>

                    {m.date && (
                      <span className="text-sky-300 font-mono font-semibold">
                        {m.date}
                      </span>
                    )}
                    {m.round && (
                      <span className="text-orange-300 font-semibold">{m.round}</span>
                    )}
                    <span className="text-slate-400 truncate">• {m.courtName}</span>
                  </div>
                </div>

                {/* Matchup & Score */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 space-y-0.5 text-xs">
                    <div className="truncate text-white font-bold">
                      <span className="text-sky-300">{getShortPlayerName(player)}</span>
                      <span className="text-slate-400 font-normal"> w/ </span>
                      <span>{getShortPlayerName(partner)}</span>
                    </div>
                    <div className="truncate text-[11px] text-slate-400">
                      vs{' '}
                      <span className="text-slate-200 font-semibold">
                        {getShortPlayerName(opp1)} & {getShortPlayerName(opp2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-sky-400">
                      +{awardedLeaguePts}p
                    </span>
                    <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono font-black text-xs flex items-center gap-1">
                      {result === 'W' && (
                        <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                      <span
                        className={
                          result === 'W'
                            ? 'text-emerald-300'
                            : result === 'L'
                            ? 'text-rose-300'
                            : 'text-white'
                        }
                      >
                        {myPts}
                      </span>
                      <span className="text-slate-500">-</span>
                      <span className="text-slate-300">{oppPts}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom "More -> Last 8 Games" / "Show Less -> Last 4 Games" Footer */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 font-mono">
          Showing {visibleMatches.length} of {totalCount} recorded game
          {totalCount === 1 ? '' : 's'}
          {mode === 'last8' && totalCount <= 4 && totalCount > 0
            ? ' (new scores up to 8 will appear here automatically)'
            : ''}
        </span>

        {mode === 'last4' ? (
          <button
            type="button"
            onClick={() => onChangeMode('last8')}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>
              More — See Last 8 Games
              {totalCount > 4 ? ` (${Math.min(8, totalCount)})` : ''}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChangeMode('last4')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Show Less (Last 4 Games)</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
