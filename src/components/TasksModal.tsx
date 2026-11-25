import React, { useState, useMemo } from 'react';
import {
  X,
  ClipboardList,
  Trophy,
  Pencil,
  PlusCircle,
  Users,
  FileSpreadsheet,
  Search,
  ArrowLeft,
  ChevronRight,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { Player, RecordedMatch } from '../types/padel';
import { sortMatchesChronologically, calculateMatchScoring } from '../utils/scoringEngine';
import { getShortPlayerName } from '../utils/teamGenerator';
import { PlayerAvatar } from './PlayerAvatar';

type TasksStep = 'root' | 'scores' | 'scores-edit';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  matches: RecordedMatch[];
  weightedScoring: boolean;
  onQuickUpdateScore: (matchId: string, teamAPointsWon: number, teamBPointsWon: number) => void;
  onOpenFullEditMatch: (match: RecordedMatch) => void;
  onOpenAddScore: () => void;
  onOpenManagePlayers: () => void;
  onOpenImportNextGames?: () => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  players,
  matches,
  weightedScoring,
  onQuickUpdateScore,
  onOpenFullEditMatch,
  onOpenAddScore,
  onOpenManagePlayers,
  onOpenImportNextGames,
}) => {
  const [step, setStep] = useState<TasksStep>('root');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [draftScoreA, setDraftScoreA] = useState<number>(0);
  const [draftScoreB, setDraftScoreB] = useState<number>(0);
  const [savedNotice, setSavedNotice] = useState<string>('');

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        getShortPlayerName(p).toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [players, searchQuery]);

  // Resolve active player: explicit selection (if still matching search) or auto-select when search narrows to 1 player
  const activePlayer = useMemo(() => {
    if (selectedPlayerId) {
      const explicit = filteredPlayers.find((p) => p.id === selectedPlayerId);
      if (explicit) return explicit;
    }
    if (searchQuery.trim() && filteredPlayers.length === 1) {
      return filteredPlayers[0];
    }
    return null;
  }, [filteredPlayers, selectedPlayerId, searchQuery]);

  const activePlayerMatches = useMemo(() => {
    if (!activePlayer) return [];
    return sortMatchesChronologically(
      matches.filter(
        (m) =>
          m.teamA.player1.id === activePlayer.id ||
          m.teamA.player2.id === activePlayer.id ||
          m.teamB.player1.id === activePlayer.id ||
          m.teamB.player2.id === activePlayer.id
      )
    ).reverse();
  }, [activePlayer, matches]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setStep('root');
    setSearchQuery('');
    setSelectedPlayerId(null);
    setEditingMatchId(null);
    setSavedNotice('');
    onClose();
  };

  const handleStartEdit = (m: RecordedMatch) => {
    setEditingMatchId(m.id);
    setDraftScoreA(m.teamA.pointsWon);
    setDraftScoreB(m.teamB.pointsWon);
    setSavedNotice('');
  };

  const handleSaveInlineScore = (m: RecordedMatch) => {
    onQuickUpdateScore(m.id, draftScoreA, draftScoreB);
    setEditingMatchId(null);
    setSavedNotice(
      `Updated ${getShortPlayerName(m.teamA.player1)} & ${getShortPlayerName(m.teamA.player2)} (${draftScoreA}-${draftScoreB}) ${getShortPlayerName(m.teamB.player1)} & ${getShortPlayerName(m.teamB.player2)} — League Table recalculated!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with Breadcrumb Navigation */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {step !== 'root' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingMatchId(null);
                  setSavedNotice('');
                  setStep(step === 'scores-edit' ? 'scores' : 'root');
                }}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 transition cursor-pointer shrink-0"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-slate-700 text-slate-200 border border-slate-600 shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setStep('root');
                    setEditingMatchId(null);
                  }}
                  className={`hover:text-white transition ${
                    step === 'root' ? 'text-white text-sm sm:text-base' : 'cursor-pointer text-slate-400'
                  }`}
                >
                  Tasks
                </button>

                {(step === 'scores' || step === 'scores-edit') && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <button
                      type="button"
                      onClick={() => {
                        setStep('scores');
                        setEditingMatchId(null);
                      }}
                      className={`hover:text-white transition ${
                        step === 'scores'
                          ? 'text-white text-sm sm:text-base'
                          : 'cursor-pointer text-slate-400'
                      }`}
                    >
                      Scores
                    </button>
                  </>
                )}

                {step === 'scores-edit' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-sky-400 text-sm sm:text-base">Edit</span>
                  </>
                )}
              </div>

              <p className="text-[11px] text-slate-400 truncate">
                {step === 'root' && 'Select a task category below'}
                {step === 'scores' && 'Choose a score management action'}
                {step === 'scores-edit' &&
                  'Search a player to view their games and edit recorded scores'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* STEP 1: TASKS ROOT MENU */}
          {step === 'root' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('scores')}
                className="w-full p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-sky-400/60 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-sky-300 transition">
                      Scores
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Edit existing player match scores or record a new match score
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400 shrink-0 transition" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  onOpenManagePlayers();
                }}
                className="w-full p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-slate-700/60 text-slate-200 border border-slate-600 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-wide">
                      Players Roster
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add, rename, or remove league players
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white shrink-0 transition" />
              </button>

              {onOpenImportNextGames && (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    onOpenImportNextGames();
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white uppercase tracking-wide">
                        Import CSV / Sheet
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Import upcoming game fixtures or player lists from CSV / Google Sheets
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white shrink-0 transition" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: TASKS -> SCORES OPTIONS */}
          {step === 'scores' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('scores-edit')}
                className="w-full p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-sky-400/60 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-sky-300 transition">
                      Edit
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Search for a player, view their recorded games, and edit any score
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400 shrink-0 transition" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  onOpenAddScore();
                }}
                className="w-full p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-wide">
                      Add New Score
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Record a new match result into the league table
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white shrink-0 transition" />
              </button>
            </div>
          )}

          {/* STEP 3: TASKS -> SCORES -> EDIT (SEARCH PLAYER & EDIT THEIR GAMES) */}
          {step === 'scores-edit' && (
            <div className="space-y-4">
              {/* Player Search Input */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  Search Player
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setEditingMatchId(null);
                    }}
                    placeholder="Type a player's name (e.g. Olive, Katie, Gabor)..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-semibold placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedPlayerId(null);
                        setEditingMatchId(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Matching Players Chips */}
                {filteredPlayers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    No players found matching "{searchQuery}".
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-0.5">
                    {filteredPlayers.map((p) => {
                      const isSelected = activePlayer?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlayerId(p.id);
                            setEditingMatchId(null);
                            setSavedNotice('');
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md shadow-sky-500/20'
                              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                          }`}
                        >
                          <PlayerAvatar
                            name={p.name}
                            className="w-5 h-5 rounded-full text-[9px]"
                          />
                          <span className="truncate max-w-[180px]">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {savedNotice && (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  ✓ {savedNotice}
                </div>
              )}

              {/* Selected Player's Games & Score Editor */}
              {!activePlayer ? (
                <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                  <Search className="w-6 h-6 text-sky-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">
                    Search or tap a player above to view their games
                  </p>
                  <p className="text-[11px] text-slate-400">
                    All recorded matches for that player will appear here so you can edit any score.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayerAvatar
                        name={activePlayer.name}
                        className="w-7 h-7 rounded-full text-xs"
                      />
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
                        {activePlayer.name} — Recorded Games ({activePlayerMatches.length})
                      </h4>
                    </div>
                  </div>

                  {activePlayerMatches.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center bg-slate-950/60 rounded-2xl border border-slate-800">
                      No recorded games found for {activePlayer.name}.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activePlayerMatches.map((m, idx) => {
                        const isTeamA =
                          m.teamA.player1.id === activePlayer.id ||
                          m.teamA.player2.id === activePlayer.id;
                        const result: 'W' | 'L' | 'D' =
                          m.winnerTeam === 'Tie'
                            ? 'D'
                            : (isTeamA && m.winnerTeam === 'A') ||
                              (!isTeamA && m.winnerTeam === 'B')
                            ? 'W'
                            : 'L';

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

                        const myLeaguePts = weightedScoring
                          ? isTeamA
                            ? dynBreakdown.totalTeamAPoints
                            : dynBreakdown.totalTeamBPoints
                          : isTeamA
                          ? m.teamA.pointsWon
                          : m.teamB.pointsWon;

                        const isEditingThis = editingMatchId === m.id;

                        return (
                          <div
                            key={m.id}
                            className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5"
                          >
                            {/* Game Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono font-black text-[10px] ${
                                    result === 'W'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : result === 'L'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {result === 'W' ? 'WIN' : result === 'L' ? 'LOSS' : 'DRAW'}
                                </span>
                                <span className="text-slate-500 font-mono">#{idx + 1}</span>
                                {m.date && (
                                  <span className="text-sky-300 font-mono font-semibold">
                                    {m.date}
                                  </span>
                                )}
                                {m.round && (
                                  <span className="text-orange-300 font-bold">{m.round}</span>
                                )}
                                {m.timeSlot && (
                                  <span className="text-slate-400 font-mono">({m.timeSlot})</span>
                                )}
                                <span className="text-sky-400 font-semibold">
                                  • 🏟️ {m.courtName}
                                </span>
                              </div>

                              {!isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(m)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit Score</span>
                                </button>
                              )}
                            </div>

                            {/* Matchup or Active Score Editor */}
                            {isEditingThis ? (
                              <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/40 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-pink-300 truncate">
                                    {getShortPlayerName(m.teamA.player1)} &{' '}
                                    {getShortPlayerName(m.teamA.player2)}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftScoreA(Math.max(0, draftScoreA - 1))
                                      }
                                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      value={draftScoreA}
                                      onChange={(e) =>
                                        setDraftScoreA(
                                          Math.max(0, parseInt(e.target.value || '0', 10))
                                        )
                                      }
                                      className="w-12 h-8 text-center rounded-lg bg-slate-950 border border-pink-500/40 font-mono font-black text-sm text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setDraftScoreA(draftScoreA + 1)}
                                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-sky-300 truncate">
                                    {getShortPlayerName(m.teamB.player1)} &{' '}
                                    {getShortPlayerName(m.teamB.player2)}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftScoreB(Math.max(0, draftScoreB - 1))
                                      }
                                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      value={draftScoreB}
                                      onChange={(e) =>
                                        setDraftScoreB(
                                          Math.max(0, parseInt(e.target.value || '0', 10))
                                        )
                                      }
                                      className="w-12 h-8 text-center rounded-lg bg-slate-950 border border-sky-500/40 font-mono font-black text-sm text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setDraftScoreB(draftScoreB + 1)}
                                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCloseModal();
                                      onOpenFullEditMatch(m);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Full Match Details</span>
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMatchId(null)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineScore(m)}
                                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase flex items-center gap-1.5 shadow cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Save Score</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold min-w-0">
                                  <span
                                    className={
                                      m.winnerTeam === 'A'
                                        ? 'text-emerald-300 font-black'
                                        : 'text-slate-200'
                                    }
                                  >
                                    {getShortPlayerName(m.teamA.player1)} &{' '}
                                    {getShortPlayerName(m.teamA.player2)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white">
                                    {m.setScores.join(', ')}
                                  </span>
                                  <span
                                    className={
                                      m.winnerTeam === 'B'
                                        ? 'text-emerald-300 font-black'
                                        : 'text-slate-200'
                                    }
                                  >
                                    {getShortPlayerName(m.teamB.player1)} &{' '}
                                    {getShortPlayerName(m.teamB.player2)}
                                  </span>
                                </div>

                                <span className="text-[11px] font-mono font-bold text-sky-400 shrink-0">
                                  +{myLeaguePts}p
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
