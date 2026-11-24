import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Sparkles,
  Users,
  TrendingUp,
  Flame,
  ChevronDown,
  ChevronUp,
  History,
  CalendarClock,
  Calendar,
  Shuffle,
  Mic,
  Pencil,
  Check,
  X,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import {
  League,
  LeagueStanding,
  RecordedMatch,
  Player,
  NextGameSession,
} from '../types/padel';
import { LeagueGamesPanel } from './LeagueGamesPanel';
import { getShortPlayerName } from '../utils/teamGenerator';
import { PlayerAvatar } from './PlayerAvatar';

interface LeagueViewProps {
  leagues: League[];
  activeLeagueId: string;
  onSelectLeague: (id: string) => void;
  standings: LeagueStanding[];
  matches: RecordedMatch[];
  currentPlayer: Player;
  nextGameSession: NextGameSession | null;
  onOpenRecordScore: (leagueId: string) => void;
  onOpenCreateGameSession: () => void;
  onOpenImportNextGames?: () => void;
  onOpenManagePlayers: () => void;
  onRenamePlayer: (playerId: string, newName: string) => void;
  onUpdateFixtureDraftScore: (
    fixtureId: string,
    teamAScore: number | undefined,
    teamBScore: number | undefined
  ) => void;
  onUpdateNextSessionDate: (newDate: string) => void;
  onRecordSingleFixture: (
    fixtureId: string,
    overrideScores?: { teamAScore: number; teamBScore: number }
  ) => void;
  onRecordAllScoredFixtures: () => number;
  onUpdateRecordedSessionDate: (sessionKey: string, newDate: string) => void;
  weightedScoring: boolean;
  activeGamesPanel?: 'last' | 'next' | null;
  onChangeGamesPanel?: (panel: 'last' | 'next' | null) => void;
}

const FormPills: React.FC<{ form: ('W' | 'L' | 'D')[] }> = ({ form }) => {
  if (form.length === 0) {
    return <span className="text-[10px] font-mono text-slate-500">–</span>;
  }
  return (
    <div className="inline-flex items-center gap-1" title="Rolling form for last set of games">
      {form.map((res, i) => (
        <span
          key={i}
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black font-mono shrink-0 ${
            res === 'W'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : res === 'L'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
        >
          {res}
        </span>
      ))}
    </div>
  );
};

export const LeagueView: React.FC<LeagueViewProps> = ({
  leagues,
  activeLeagueId,
  onSelectLeague,
  standings,
  matches,
  currentPlayer,
  nextGameSession,
  onOpenRecordScore,
  onOpenCreateGameSession,
  onOpenImportNextGames,
  onOpenManagePlayers,
  onRenamePlayer,
  onUpdateFixtureDraftScore,
  onUpdateNextSessionDate,
  onRecordSingleFixture,
  onRecordAllScoredFixtures,
  onUpdateRecordedSessionDate,
  weightedScoring,
  activeGamesPanel: controlledGamesPanel,
  onChangeGamesPanel,
}) => {
  const [expandedDateKeys, setExpandedDateKeys] = useState<Record<string, boolean>>({});
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [internalGamesPanel, setInternalGamesPanel] = useState<'last' | 'next' | null>(null);
  const activeGamesPanel =
    controlledGamesPanel !== undefined ? controlledGamesPanel : internalGamesPanel;
  const setGamesPanel = (next: 'last' | 'next' | null) => {
    if (onChangeGamesPanel) {
      onChangeGamesPanel(next);
    } else {
      setInternalGamesPanel(next);
    }
  };
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const activeLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0];
  const leagueMatches = matches.filter((m) => m.leagueId === activeLeague?.id);

  // Group recorded matches by date / session so each date is an expandable link
  const dateGroups = useMemo(() => {
    const map = new Map<
      string,
      { key: string; date: string; matches: RecordedMatch[] }
    >();

    for (const m of leagueMatches) {
      const key = m.date ? `date:${m.date}` : m.sessionId || 'session-spreadsheet-1';
      const existing = map.get(key);
      if (existing) {
        existing.matches.push(m);
      } else {
        map.set(key, { key, date: m.date || '', matches: [m] });
      }
    }

    const list = Array.from(map.values()).reverse();
    list.sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
      return 0;
    });
    return list;
  }, [leagueMatches]);

  const toggleDateGroup = (key: string) => {
    setExpandedDateKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatDateLinkLabel = (dateStr: string, groupMatches: RecordedMatch[]): string => {
    if (dateStr) {
      const parsed = new Date(`${dateStr}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    }
    const firstSlot = groupMatches[0]?.timeSlot?.split('–')[0] || '';
    const lastSlot =
      groupMatches[groupMatches.length - 1]?.timeSlot?.split('–')[1] || '';
    const timeRange = firstSlot && lastSlot ? ` (${firstSlot}–${lastSlot})` : '';
    return `Session Results${timeRange} — Add / View Date`;
  };

  // Top 3 Rankings Podium
  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  const openFixturesCount = nextGameSession
    ? nextGameSession.fixtures.filter((f) => !f.completed).length
    : 0;

  const startEditName = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
  };

  const commitEditName = (playerId: string) => {
    if (editingName.trim()) {
      onRenamePlayer(playerId, editingName.trim());
    }
    setEditingPlayerId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-4 @xl:space-y-5">
      {/* Top Quick-Action Bar: Last Games | Next Games | Create Game | Players | Voice/Easy Score */}
      <div className="p-3 @xl:p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/50 to-slate-900 border border-slate-800 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {leagues.length > 1 ? (
              <select
                value={activeLeagueId}
                onChange={(e) => onSelectLeague(e.target.value)}
                className="bg-slate-800/90 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400"
              >
                {leagues.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    🏆 {lg.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-black text-white truncate">
                🏆 {activeLeague?.name}
              </span>
            )}

            <span className="text-[11px] text-slate-400 font-mono hidden @xl:inline">
              👥 {standings.length} Players • 🎾 {leagueMatches.length} Matches
            </span>

            {weightedScoring && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Weighted
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 @xl:gap-2">
            {activeGamesPanel && (
              <button
                type="button"
                onClick={() => setGamesPanel(null)}
                className="px-2.5 @xl:px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/50 text-[11px] @xl:text-xs font-black flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>League Table</span>
              </button>
            )}

            {onOpenImportNextGames && (
              <button
                type="button"
                onClick={onOpenImportNextGames}
                title="Upload CSV or Google Sheet for Next Games"
                className="px-2.5 @xl:px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] @xl:text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Import CSV / Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenManagePlayers}
              className="px-2.5 @xl:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] @xl:text-xs font-bold flex items-center gap-1 transition"
            >
              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Players</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenRecordScore(activeLeague.id)}
              className="px-2.5 @xl:px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[11px] @xl:text-xs font-bold flex items-center gap-1 transition"
            >
              <Mic className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>+ Score</span>
            </button>
          </div>
        </div>

        {/* Primary Top 3 Action Buttons: Last Games, Next Games, Create Game */}
        <div className="grid grid-cols-3 gap-1.5 @xl:gap-3">
          <button
            type="button"
            onClick={() => setGamesPanel(activeGamesPanel === 'last' ? null : 'last')}
            className={`py-2 @xl:py-2.5 px-1.5 @xl:px-4 rounded-2xl font-black text-[10px] @xl:text-xs uppercase tracking-wide flex flex-col @lg:flex-row items-center justify-center gap-1 @lg:gap-1.5 transition border min-w-0 ${
              activeGamesPanel === 'last'
                ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-lg shadow-sky-500/25'
                : 'bg-slate-950/80 hover:bg-slate-800 text-sky-300 border-sky-500/40'
            }`}
          >
            <History className="w-3.5 h-3.5 @xl:w-4 @xl:h-4 shrink-0" />
            <span className="truncate">Last Games</span>
          </button>

          <button
            type="button"
            onClick={() => setGamesPanel(activeGamesPanel === 'next' ? null : 'next')}
            className={`py-2 @xl:py-2.5 px-1.5 @xl:px-4 rounded-2xl font-black text-[10px] @xl:text-xs uppercase tracking-wide flex flex-col @lg:flex-row items-center justify-center gap-1 @lg:gap-1.5 transition border min-w-0 ${
              activeGamesPanel === 'next'
                ? 'bg-orange-500 text-slate-950 border-orange-300 shadow-lg shadow-orange-500/25'
                : 'bg-slate-950/80 hover:bg-slate-800 text-orange-300 border-orange-500/40'
            }`}
          >
            <div className="flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 @xl:w-4 @xl:h-4 shrink-0" />
              {openFixturesCount > 0 && (
                <span
                  className={`px-1 rounded-full text-[9px] font-mono ${
                    activeGamesPanel === 'next'
                      ? 'bg-slate-950 text-orange-300'
                      : 'bg-orange-500/20 text-orange-300'
                  }`}
                >
                  {openFixturesCount}
                </span>
              )}
            </div>
            <span className="truncate">Next Games</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateGameSession}
            className="py-2 @xl:py-2.5 px-1.5 @xl:px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 text-white font-black text-[10px] @xl:text-xs uppercase tracking-wide flex flex-col @lg:flex-row items-center justify-center gap-1 @lg:gap-1.5 shadow-lg shadow-pink-500/25 transition min-w-0"
          >
            <Shuffle className="w-3.5 h-3.5 @xl:w-4 @xl:h-4 shrink-0" />
            <span className="truncate">Create Game</span>
          </button>
        </div>
      </div>

      {/* Expandable Panel when Last Games or Next Games is clicked */}
      {activeGamesPanel ? (
        <LeagueGamesPanel
          mode={activeGamesPanel}
          onClose={() => {
            setGamesPanel(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          matches={leagueMatches}
          nextGameSession={nextGameSession}
          onOpenCreateGame={() => {
            onOpenCreateGameSession();
            setGamesPanel('next');
          }}
          onOpenImportNextGames={onOpenImportNextGames}
          onUpdateFixtureDraftScore={onUpdateFixtureDraftScore}
          onUpdateNextSessionDate={onUpdateNextSessionDate}
          onRecordSingleFixture={onRecordSingleFixture}
          onRecordAllScoredFixtures={onRecordAllScoredFixtures}
          onUpdateRecordedSessionDate={onUpdateRecordedSessionDate}
        />
      ) : (
        <>

      {/* TOP 3 RANKINGS PODIUM */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Top 3 Rankings</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {leagueMatches.length} Matches
          </span>
        </div>

        <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-2.5 @xl:gap-3">
          {/* #1 Leader */}
          {top1 && (
            <div className="p-3.5 @xl:p-4 rounded-3xl bg-gradient-to-b from-amber-500/25 via-slate-900 to-slate-900 border-2 border-amber-400/60 flex items-center gap-3 relative overflow-hidden shadow-xl shadow-amber-500/10">
              <div className="w-9 h-9 @xl:w-10 @xl:h-10 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center text-slate-950 font-black text-base shadow shrink-0">
                1
              </div>
              <PlayerAvatar
                name={top1.player.name}
                className="w-11 h-11 @xl:w-12 @xl:h-12 rounded-2xl text-base ring-2 ring-amber-400"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
                      👑 #1 LEADER
                    </span>
                    <p className="text-sm font-black text-white truncate">{top1.player.name}</p>
                  </div>
                  <span className="text-base font-mono font-black text-amber-300 shrink-0">
                    {top1.leaguePoints} pts
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-300 font-mono">
                  <span>
                    {top1.won}W-{top1.lost}L ({top1.pointDiff >= 0 ? `+${top1.pointDiff}` : top1.pointDiff})
                  </span>
                  <FormPills form={top1.form} />
                </div>
              </div>
            </div>
          )}

          {/* #2 Runner-Up */}
          {top2 && (
            <div className="p-3.5 @xl:p-4 rounded-3xl bg-gradient-to-b from-slate-700/25 via-slate-900 to-slate-900 border border-slate-400/40 flex items-center gap-3 relative overflow-hidden shadow-lg">
              <div className="w-9 h-9 @xl:w-10 @xl:h-10 rounded-2xl bg-slate-300 text-slate-950 flex items-center justify-center font-black text-base shadow shrink-0">
                2
              </div>
              <PlayerAvatar
                name={top2.player.name}
                className="w-11 h-11 @xl:w-12 @xl:h-12 rounded-2xl text-base ring-2 ring-slate-300"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">
                      🥈 #2 RANKED
                    </span>
                    <p className="text-sm font-black text-white truncate">{top2.player.name}</p>
                  </div>
                  <span className="text-base font-mono font-black text-sky-300 shrink-0">
                    {top2.leaguePoints} pts
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-300 font-mono">
                  <span>
                    {top2.won}W-{top2.lost}L ({top2.pointDiff >= 0 ? `+${top2.pointDiff}` : top2.pointDiff})
                  </span>
                  <FormPills form={top2.form} />
                </div>
              </div>
            </div>
          )}

          {/* #3 Third Place */}
          {top3 && (
            <div className="p-3.5 @xl:p-4 rounded-3xl bg-gradient-to-b from-orange-600/20 via-slate-900 to-slate-900 border border-orange-500/40 flex items-center gap-3 relative overflow-hidden shadow-lg">
              <div className="w-9 h-9 @xl:w-10 @xl:h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-base shadow shrink-0">
                3
              </div>
              <PlayerAvatar
                name={top3.player.name}
                className="w-11 h-11 @xl:w-12 @xl:h-12 rounded-2xl text-base ring-2 ring-orange-400"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider block">
                      🥉 #3 RANKED
                    </span>
                    <p className="text-sm font-black text-white truncate">{top3.player.name}</p>
                  </div>
                  <span className="text-base font-mono font-black text-orange-300 shrink-0">
                    {top3.leaguePoints} pts
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-300 font-mono">
                  <span>
                    {top3.won}W-{top3.lost}L ({top3.pointDiff >= 0 ? `+${top3.pointDiff}` : top3.pointDiff})
                  </span>
                  <FormPills form={top3.form} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL LEAGUE STANDINGS DIRECTLY UNDERNEATH TOP 3 */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="p-3.5 @xl:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs @xl:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Full League Standings ({standings.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Form shows rolling results for the last set of games • Tap <Pencil className="w-3 h-3 inline text-slate-400" /> to edit any player name
            </p>
          </div>

          <div className="hidden @xl:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>PW = Points Won</span>
            <span>•</span>
            <span>PL = Points Lost</span>
          </div>
        </div>

        {/* Uncropped Mobile / Narrow Container Standings List */}
        <div className="@2xl:hidden divide-y divide-slate-800/70">
          {standings.map((row) => {
            const isCurrent = row.playerId === currentPlayer.id;
            const isEditing = editingPlayerId === row.playerId;

            return (
              <div
                key={row.playerId}
                className={`p-3 space-y-2 transition-colors ${
                  isCurrent ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {row.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shrink-0">
                        1
                      </span>
                    ) : row.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs shrink-0">
                        2
                      </span>
                    ) : row.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs shrink-0">
                        3
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 text-slate-400 font-mono font-bold text-xs shrink-0">
                        #{row.rank}
                      </span>
                    )}

                    <PlayerAvatar
                      name={isEditing && editingName.trim() ? editingName : row.player.name}
                      className="w-8 h-8 rounded-full text-xs"
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          commitEditName(row.playerId);
                        }}
                        className="flex items-center gap-1 flex-1 min-w-0"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-800 border border-sky-400 text-xs font-bold text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlayerId(null)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">
                          {row.player.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                            YOU
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditName(row.player)}
                          title={`Edit ${row.player.name}'s name`}
                          className="p-1 rounded-md text-slate-500 hover:text-sky-300 hover:bg-slate-800 transition shrink-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm text-sky-400">
                      {row.leaguePoints}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 ml-0.5">pts</span>
                  </div>
                </div>

                {/* Compact Second Line: MP, W-L, PW-PL (Diff), and Rolling Form */}
                <div className="flex items-center justify-between gap-2 pl-8 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-400">{row.played}MP</span>
                    <span>•</span>
                    <span>
                      <span className="text-emerald-400 font-bold">{row.won}W</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-rose-400 font-bold">{row.lost}L</span>
                    </span>
                    <span>•</span>
                    <span>
                      {row.pointsWon}-{row.pointsLost}{' '}
                      <span
                        className={
                          row.pointDiff > 0
                            ? 'text-emerald-400 font-bold'
                            : row.pointDiff < 0
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        ({row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff})
                      </span>
                    </span>
                  </div>

                  <FormPills form={row.form} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Desktop Table (Wide Containers Only) */}
        <div className="hidden @2xl:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 uppercase text-[10px] tracking-wider text-slate-400 font-black">
              <tr>
                <th className="py-3 px-4 text-center">#</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-2 text-center">MP</th>
                <th className="py-3 px-2 text-center">W - L</th>
                <th className="py-3 px-2 text-center">PW - PL</th>
                <th className="py-3 px-2 text-center">Diff</th>
                <th className="py-3 px-2 text-center">Form (Last Set)</th>
                <th className="py-3 px-4 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {standings.map((row) => {
                const isCurrent = row.playerId === currentPlayer.id;
                const isEditing = editingPlayerId === row.playerId;

                return (
                  <tr
                    key={row.playerId}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      isCurrent ? 'bg-sky-500/10 font-bold' : ''
                    }`}
                  >
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
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono font-bold text-xs">
                          #{row.rank}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          name={isEditing && editingName.trim() ? editingName : row.player.name}
                          className="w-8 h-8 rounded-full text-xs"
                        />

                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              commitEditName(row.playerId);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-sky-400 text-xs font-bold text-white focus:outline-none"
                            />
                            <button
                              type="submit"
                              title="Save name"
                              className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPlayerId(null)}
                              title="Cancel"
                              className="p-1 rounded-lg bg-slate-800 text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <div className="min-w-0 flex items-center gap-1.5 group">
                            <span className="font-bold text-white truncate">
                              {row.player.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-mono font-bold">
                                YOU
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => startEditName(row.player)}
                              title={`Edit ${row.player.name}'s name`}
                              className="p-1 rounded-md text-slate-500 hover:text-sky-300 hover:bg-slate-800 transition"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center font-mono">{row.played}</td>

                    <td className="py-3 px-2 text-center font-mono whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">{row.won}</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-rose-400 font-bold">{row.lost}</span>
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-[11px] whitespace-nowrap">
                      <span className="text-slate-200">{row.pointsWon}</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-slate-400">{row.pointsLost}</span>
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-bold">
                      <span
                        className={
                          row.pointDiff > 0
                            ? 'text-emerald-400'
                            : row.pointDiff < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center">
                        <FormPills form={row.form} />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-sm text-sky-400">
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

      {/* Recorded Match Results Grouped as Expandable Date Links */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-3.5 @xl:p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs @xl:text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Recorded Match Results ({leagueMatches.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click a date below to expand or collapse all match results from that session
            </p>
          </div>
        </div>

        {dateGroups.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No recorded match results yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {dateGroups.map((group) => {
              const isDateExpanded = Boolean(expandedDateKeys[group.key]);
              const roundsSet = new Set(
                group.matches.map((m) => m.round).filter(Boolean)
              );
              const label = formatDateLinkLabel(group.date, group.matches);

              return (
                <div
                  key={group.key}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all hover:border-slate-700"
                >
                  {/* Clickable Date Link Header */}
                  <button
                    type="button"
                    onClick={() => toggleDateGroup(group.key)}
                    className="w-full p-3 @xl:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-slate-900/70 transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-xs @xl:text-sm font-black text-sky-400 hover:text-sky-300 underline decoration-sky-400/60 underline-offset-4 truncate">
                        {label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 shrink-0">
                        {group.matches.length} match{group.matches.length === 1 ? '' : 'es'}
                        {roundsSet.size > 0 ? ` • ${roundsSet.size} rounds` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 shrink-0">
                      <span className="hidden @xl:inline">
                        {isDateExpanded ? 'Hide Matches' : 'Show Matches'}
                      </span>
                      {isDateExpanded ? (
                        <ChevronUp className="w-4 h-4 text-sky-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Matches for Clicked Date */}
                  {isDateExpanded && (
                    <div className="p-3 @xl:p-4 pt-2 border-t border-slate-800 bg-slate-900/40 space-y-2.5 animate-in fade-in">
                      {/* Optional Session Date Picker */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs">
                        <span className="text-[11px] text-slate-400">
                          Tap any match below to view its scoring breakdown
                        </span>
                        <label className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400">
                            Session Date:
                          </span>
                          <input
                            type="date"
                            value={group.date}
                            onChange={(e) => {
                              const nextVal = e.target.value;
                              if (!nextVal) return;
                              onUpdateRecordedSessionDate(group.key, nextVal);
                              setExpandedDateKeys((prev) => ({
                                ...prev,
                                [`date:${nextVal}`]: true,
                              }));
                            }}
                            className="bg-transparent text-xs font-mono font-bold text-sky-300 focus:outline-none"
                          />
                        </label>
                      </div>

                      <div className="space-y-2">
                        {group.matches.map((m) => {
                          const isExpanded = expandedMatchId === m.id;
                          const teamAWon = m.winnerTeam === 'A';
                          const teamBWon = m.winnerTeam === 'B';

                          return (
                            <div
                              key={m.id}
                              className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden transition-all hover:border-slate-700"
                            >
                              <div
                                onClick={() =>
                                  setExpandedMatchId(isExpanded ? null : m.id)
                                }
                                className="p-2.5 @xl:p-3 flex flex-col @xl:flex-row items-start @xl:items-center justify-between gap-2 cursor-pointer select-none"
                              >
                                <div className="space-y-1 min-w-0 w-full @xl:w-auto">
                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                    {m.round && (
                                      <span className="text-orange-300 font-bold">
                                        {m.round}
                                      </span>
                                    )}
                                    {m.timeSlot && (
                                      <span className="font-mono text-slate-400">
                                        ({m.timeSlot})
                                      </span>
                                    )}
                                    {(m.round || m.timeSlot) && <span>•</span>}
                                    <span className="text-sky-400 font-bold">
                                      🏟️ {m.courtName}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                                    <span
                                      className={
                                        teamAWon
                                          ? 'text-emerald-300 font-black'
                                          : 'text-slate-300'
                                      }
                                    >
                                      {getShortPlayerName(m.teamA.player1)} &{' '}
                                      {getShortPlayerName(m.teamA.player2)}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-white">
                                      {m.setScores.join(', ')}
                                    </span>
                                    <span
                                      className={
                                        teamBWon
                                          ? 'text-emerald-300 font-black'
                                          : 'text-slate-300'
                                      }
                                    >
                                      {getShortPlayerName(m.teamB.player1)} &{' '}
                                      {getShortPlayerName(m.teamB.player2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 w-full @xl:w-auto justify-between @xl:justify-end">
                                  <div className="text-right font-mono text-[11px]">
                                    <span className="text-sky-300 font-bold">
                                      +{m.scoringBreakdown.totalTeamAPoints}p
                                    </span>
                                    <span className="text-slate-600 mx-1">/</span>
                                    <span className="text-blue-400 font-bold">
                                      +{m.scoringBreakdown.totalTeamBPoints}p
                                    </span>
                                  </div>

                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-3 pb-3 pt-2 border-t border-slate-800 bg-slate-900/50 text-xs">
                                  <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                                    {m.scoringBreakdown.formulaExplanation.map(
                                      (line, i) => (
                                        <div
                                          key={i}
                                          className="flex items-start gap-2"
                                        >
                                          <span className="text-slate-500 shrink-0">
                                            ▶
                                          </span>
                                          <span className="break-words">{line}</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
