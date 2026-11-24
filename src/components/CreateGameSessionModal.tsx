import React, { useState, useRef } from 'react';
import {
  X,
  Shuffle,
  Calendar,
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  UserPlus,
  Trash2,
  RefreshCw,
  Pencil,
  Check,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { Player, RecordedMatch, NextGameSession } from '../types/padel';
import { generateSmartGameSession, getShortPlayerName } from '../utils/teamGenerator';
import { PlayerAvatar } from './PlayerAvatar';

interface CreateGameSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: string;
  players: Player[];
  previousMatches: RecordedMatch[];
  onSaveSession: (session: NextGameSession) => void;
  onQuickAddPlayer: (name: string, rankingScore?: number) => Player | null;
  onRenamePlayer?: (playerId: string, newName: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onOpenFullSignUp?: () => void;
  onOpenImportNextGames?: () => void;
}

export const CreateGameSessionModal: React.FC<CreateGameSessionModalProps> = ({
  isOpen,
  onClose,
  leagueId,
  players,
  previousMatches,
  onSaveSession,
  onQuickAddPlayer,
  onRenamePlayer,
  onRemovePlayer,
  onOpenFullSignUp,
  onOpenImportNextGames,
}) => {
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('18:00');
  const [roundsCount, setRoundsCount] = useState<number>(4);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerSkill, setNewPlayerSkill] = useState<number>(4.0);
  const [addedFeedback, setAddedFeedback] = useState<string>('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [previewSession, setPreviewSession] = useState<NextGameSession | null>(null);

  const addInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const selectedPlayers = players.filter((p) => !excludedIds.includes(p.id));
  const courtsPerRound = Math.floor(selectedPlayers.length / 4);
  const sitOutsPerRound = selectedPlayers.length - courtsPerRound * 4;

  const togglePlayer = (id: string) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setPreviewSession(null);
  };

  const handleAddInlinePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newPlayerName.trim();
    if (!raw) return;

    // Support adding a single player or comma-separated multiple players
    const names = raw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    const addedNames: string[] = [];
    const addedIds: string[] = [];

    for (const name of names) {
      const created = onQuickAddPlayer(name, newPlayerSkill);
      if (created) {
        addedIds.push(created.id);
        addedNames.push(created.name);
      }
    }

    if (addedIds.length > 0) {
      setExcludedIds((prev) => prev.filter((id) => !addedIds.includes(id)));
      setNewPlayerName('');
      setPreviewSession(null);
      setAddedFeedback(
        `Added ${addedNames.join(', ')} to the roster & selected for this game!`
      );
    }
  };

  const commitInlineRename = (playerId: string) => {
    if (onRenamePlayer && editingName.trim()) {
      onRenamePlayer(playerId, editingName.trim());
    }
    setEditingPlayerId(null);
    setEditingName('');
  };

  const handleGenerate = () => {
    if (selectedPlayers.length < 4) return;
    const generated = generateSmartGameSession({
      leagueId,
      date,
      startTime,
      roundsCount,
      durationPerRoundMinutes: 20,
      selectedPlayers,
      previousMatches,
    });
    setPreviewSession(generated);
  };

  const handleConfirmSave = () => {
    const sessionToSave =
      previewSession ||
      generateSmartGameSession({
        leagueId,
        date,
        startTime,
        roundsCount,
        durationPerRoundMinutes: 20,
        selectedPlayers,
        previousMatches,
      });
    onSaveSession(sessionToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Shuffle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight truncate">
                Create Game & Add Players
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Add players, pick who's in, and generate 20-min smart teams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenImportNextGames && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImportNextGames();
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV / Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                addInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                addInputRef.current?.focus();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Player</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Back to League Table"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">League</span>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* Prominent Add New Player Card right at the top of Create Game */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-sky-950/40 border border-emerald-500/35 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Add New Player to Game & League Roster
                </span>
              </div>
              {onOpenFullSignUp && (
                <button
                  type="button"
                  onClick={onOpenFullSignUp}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 cursor-pointer"
                >
                  Full Profile Form →
                </button>
              )}
            </div>

            <form
              onSubmit={handleAddInlinePlayer}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                ref={addInputRef}
                type="text"
                value={newPlayerName}
                onChange={(e) => {
                  setNewPlayerName(e.target.value);
                  if (addedFeedback) setAddedFeedback('');
                }}
                placeholder="Type player name / nickname (or comma-separated names)..."
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />

              <div className="flex items-center gap-2">
                <select
                  value={newPlayerSkill}
                  onChange={(e) => setNewPlayerSkill(Number(e.target.value))}
                  title="Starting skill rating"
                  className="px-2.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value={3.0}>Lvl 3.0</option>
                  <option value={3.5}>Lvl 3.5</option>
                  <option value={4.0}>Lvl 4.0</option>
                  <option value={4.5}>Lvl 4.5</option>
                  <option value={5.0}>Lvl 5.0</option>
                </select>

                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Player</span>
                </button>
              </div>
            </form>

            {addedFeedback && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                <span>✓ {addedFeedback}</span>
                <button
                  type="button"
                  onClick={() => setAddedFeedback('')}
                  className="text-emerald-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Date, Start Time, Rounds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Match Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPreviewSession(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Start Time (20m Slots)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setPreviewSession(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                20-Min Rounds
              </label>
              <select
                value={roundsCount}
                onChange={(e) => {
                  setRoundsCount(Number(e.target.value));
                  setPreviewSession(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
              >
                <option value={2}>2 Rounds (40 mins total)</option>
                <option value={3}>3 Rounds (60 mins total)</option>
                <option value={4}>4 Rounds (80 mins • Standard)</option>
                <option value={5}>5 Rounds (100 mins total)</option>
                <option value={6}>6 Rounds (120 mins total)</option>
              </select>
            </div>
          </div>

          {/* Player Selection + Inline Edit / Remove */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  Select Players Playing ({selectedPlayers.length} of {players.length} Selected)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {courtsPerRound > 0 ? (
                    <>
                      Generates <strong>{courtsPerRound} court{courtsPerRound > 1 ? 's' : ''}</strong> per 20-min round ({courtsPerRound * roundsCount} matches total)
                      {sitOutsPerRound > 0 && ` • ${sitOutsPerRound} rotating rest slot(s)/round`}
                    </>
                  ) : (
                    <span className="text-rose-400 font-semibold">
                      Select at least 4 players to generate a 4-player padel court.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setExcludedIds([]);
                    setPreviewSession(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold border border-slate-700 transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExcludedIds(players.map((p) => p.id));
                    setPreviewSession(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Player Toggle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {players.map((player) => {
                const isSelected = !excludedIds.includes(player.id);
                const isEditing = editingPlayerId === player.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between gap-1.5 p-2 rounded-xl border transition ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400/60 text-white shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          commitInlineRename(player.id);
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
                          title="Save name"
                          className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlayerId(null)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => togglePlayer(player.id)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-sky-400 text-slate-950'
                                : 'bg-slate-800 border border-slate-600 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                          <PlayerAvatar
                            name={player.name}
                            className="w-6 h-6 rounded-full text-[10px]"
                          />
                          <span className="text-xs font-bold truncate" title={player.name}>
                            {player.name}
                          </span>
                        </button>

                        <div className="flex items-center gap-0.5 shrink-0">
                          {onRenamePlayer && (
                            <button
                              type="button"
                              title={`Edit ${player.name}'s name`}
                              onClick={() => {
                                setEditingPlayerId(player.id);
                                setEditingName(player.name);
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-sky-300 hover:bg-slate-800 transition"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}

                          {players.length > 1 && (
                            <button
                              type="button"
                              title={`Remove ${getShortPlayerName(player)} from roster`}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Remove ${player.name} from the TuesSlay player roster?`
                                  )
                                ) {
                                  onRemovePlayer(player.id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate / Shuffle Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Checks <strong>{previousMatches.length}</strong> recorded match{previousMatches.length === 1 ? '' : 'es'} to avoid repeat teammates & balance matchups.
            </div>
            <button
              type="button"
              disabled={selectedPlayers.length < 4}
              onClick={handleGenerate}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pink-500/20 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{previewSession ? 'Re-Shuffle Random Teams' : 'Generate 20-Min Fixtures'}</span>
            </button>
          </div>

          {/* Generated Preview */}
          {previewSession && previewSession.fixtures.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Generated Fixtures Preview {previewSession.date ? `• ${previewSession.date}` : ''}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  20 mins per game
                </span>
              </div>

              <div className="space-y-3">
                {Array.from({ length: previewSession.roundsCount }, (_, i) => i + 1).map(
                  (roundNum) => {
                    const roundFixtures = previewSession.fixtures.filter(
                      (f) => f.roundNumber === roundNum
                    );
                    const resting = previewSession.restingByRound[roundNum] || [];
                    const slotLabel = roundFixtures[0]?.timeSlot || '';

                    return (
                      <div
                        key={roundNum}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-black text-white uppercase">
                            Round {roundNum}{' '}
                            <span className="text-sky-400 font-mono">({slotLabel})</span>
                          </span>
                          {resting.length > 0 && (
                            <span className="text-[11px] text-amber-300 font-medium">
                              Resting: {resting.map(getShortPlayerName).join(', ')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {roundFixtures.map((fix) => {
                            const freshA = (fix.previousPartnerCountA || 0) === 0;
                            const freshB = (fix.previousPartnerCountB || 0) === 0;
                            return (
                              <div
                                key={fix.id}
                                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-sky-400 font-bold">🏟️ {fix.courtName}</span>
                                  {freshA && freshB ? (
                                    <span className="text-emerald-400">✨ Fresh Pairs</span>
                                  ) : (
                                    <span className="text-slate-400">Smart Balanced</span>
                                  )}
                                </div>
                                <div className="font-bold text-white truncate">
                                  {getShortPlayerName(fix.teamA.player1)} &{' '}
                                  {getShortPlayerName(fix.teamA.player2)}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase">
                                  vs
                                </div>
                                <div className="font-bold text-sky-300 truncate">
                                  {getShortPlayerName(fix.teamB.player1)} &{' '}
                                  {getShortPlayerName(fix.teamB.player2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Saving populates the <strong>Next Games</strong> view with all 20-minute fixtures.
          </span>
          <button
            type="button"
            disabled={selectedPlayers.length < 4}
            onClick={handleConfirmSave}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Fixtures to Next Games</span>
          </button>
        </div>
      </div>
    </div>
  );
};
