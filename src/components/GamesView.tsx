import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Filter,
  Plus,
  Sparkles,
  Users,
  CheckCircle2,
  X,
  UserPlus,
} from 'lucide-react';
import { Player, PadelGame, GameFormat, SignUpOption } from '../types/padel';
import { CourtGraphic } from './CourtGraphic';

interface GamesViewProps {
  games: PadelGame[];
  currentPlayer: Player;
  onJoinSlot: (gameId: string, slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4', player: Player) => void;
  onLeaveSlot: (gameId: string, slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4') => void;
  onCreateGame: (gameData: Omit<PadelGame, 'id' | 'status' | 'hostId' | 'hostName' | 'maxPlayers'>) => void;
  onOpenRecordScore: (game: PadelGame) => void;
  onOpenSignUpOptions?: () => void;
  currentPlan?: SignUpOption;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  currentPlayer,
  onJoinSlot,
  onLeaveSlot,
  onCreateGame,
  onOpenRecordScore,
  onOpenSignUpOptions,
  currentPlan,
}) => {
  const [filter, setFilter] = useState<'all' | 'mixin' | 'open' | 'my-games' | 'league'>('all');
  const [courtFilter, setCourtFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New game form state
  const [courtName, setCourtName] = useState('Court 1 - Pink Glass Arena (Indoor)');
  const [location, setLocation] = useState('PadelSlay Central Hub, Court 1');
  const [isIndoor, setIsIndoor] = useState(true);
  const [date, setDate] = useState('2026-10-16');
  const [time, setTime] = useState('18:30');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [format, setFormat] = useState<GameFormat>('Casual 4-Player');
  const [targetLevel, setTargetLevel] = useState('3.5 - 4.5');
  const [pricePerPlayer, setPricePerPlayer] = useState(14);
  const [notes, setNotes] = useState('Mixin Magic session! Bring your best energy.');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame({
      courtName,
      location,
      isIndoor,
      date,
      time,
      durationMinutes,
      format,
      targetLevel,
      pricePerPlayer,
      players: {
        slot1: currentPlayer, // Host joins slot 1 by default
      },
      notes,
    });
    setShowCreateModal(false);
  };

  const isPlayerInGame = (game: PadelGame, playerId: string) => {
    return Object.values(game.players).some((p) => p?.id === playerId);
  };

  const getSlotKeyForPlayer = (game: PadelGame, playerId: string): ('slot1' | 'slot2' | 'slot3' | 'slot4') | null => {
    if (game.players.slot1?.id === playerId) return 'slot1';
    if (game.players.slot2?.id === playerId) return 'slot2';
    if (game.players.slot3?.id === playerId) return 'slot3';
    if (game.players.slot4?.id === playerId) return 'slot4';
    return null;
  };

  const filteredGames = games.filter((game) => {
    // Format / Status filter
    if (filter === 'open' && game.status === 'full') return false;
    if (filter === 'my-games' && !isPlayerInGame(game, currentPlayer.id)) return false;
    if (filter === 'league' && (!game.leagueId || game.format !== 'League Ranked Match')) return false;
    if (filter === 'mixin' && game.format !== 'Casual 4-Player' && game.format !== 'Americano') return false;

    // Court filter
    if (courtFilter !== 'all' && !game.courtName.toLowerCase().includes(courtFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Hero Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Mixin Magic
            </span>
            <span className="text-xs font-bold text-slate-400">
              4-Player Court Group Booking
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Court Bookings & Mixin Sessions
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Pick a court, sign up for open Drive & Revés slots, or host your own 4-player social or league match.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenSignUpOptions}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 font-bold" />
            <span>Sign Up</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 font-bold text-sky-400" />
            <span>+ Host Game Session</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Court Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'mixin', label: 'Mixin Magic' },
            { id: 'open', label: 'Open Spots' },
            { id: 'my-games', label: 'My Games' },
            { id: 'league', label: 'Winter League' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Court Specific Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold shrink-0">Court:</span>
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="bg-slate-950 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-400"
          >
            <option value="all">🏟️ All Courts</option>
            <option value="Court 1">Court 1 - Pink Glass Arena</option>
            <option value="Court 2">Court 2 - Sunset Court</option>
            <option value="Court 3">Court 3 - Electric Blue Skyline</option>
            <option value="Court 4">Court 4 - Center Court Pro</option>
          </select>
        </div>
      </div>

      {/* Games List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredGames.map((game) => {
          const filledSlotsCount = Object.values(game.players).filter(Boolean).length;
          const userIsInGame = isPlayerInGame(game, currentPlayer.id);
          const userSlotKey = getSlotKeyForPlayer(game, currentPlayer.id);

          return (
            <div
              key={game.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 shadow-2xl flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition"
            >
              {/* Game Card Header with Prominent Court Name */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Court Badge */}
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                      <span>🏟️</span>
                      <span>{game.courtName}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {game.format}
                    </span>

                    {game.leagueId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        Winter League
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase font-mono shrink-0 ${
                      game.status === 'full'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {filledSlotsCount}/4 Players
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1 text-slate-200 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    {game.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-200 font-bold">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    {game.time} ({game.durationMinutes}m)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    {game.location}
                  </span>
                </div>

                {game.notes && (
                  <p className="text-xs text-slate-300 italic mt-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                    "{game.notes}"
                  </p>
                )}
              </div>

              {/* 2D Padel Court Graphic with Team A & Team B Slots */}
              <div className="my-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1 px-1">
                  <span>Interactive Court Positions</span>
                  <span className="text-sky-400">Tap open slot to sign up</span>
                </div>

                <CourtGraphic
                  players={game.players}
                  onSlotClick={(slotKey) => {
                    if (game.players[slotKey]) {
                      if (game.players[slotKey]?.id === currentPlayer.id) {
                        onLeaveSlot(game.id, slotKey);
                      }
                    } else {
                      onJoinSlot(game.id, slotKey, currentPlayer);
                    }
                  }}
                />
              </div>

              {/* Bottom Actions & User Status */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-slate-400">Target Level: </span>
                  <span className="font-bold text-white font-mono">{game.targetLevel}</span>
                  <span className="mx-2 text-slate-600">•</span>
                  <span className="text-slate-400">Price: </span>
                  <span className="font-bold text-sky-400 font-mono">€{game.pricePerPlayer}</span>
                </div>

                <div className="flex items-center gap-2">
                  {userIsInGame && userSlotKey ? (
                    <button
                      onClick={() => onLeaveSlot(game.id, userSlotKey)}
                      className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
                    >
                      Leave Slot
                    </button>
                  ) : filledSlotsCount < 4 ? (
                    <button
                      onClick={() => {
                        const firstOpen = !game.players.slot1
                          ? 'slot1'
                          : !game.players.slot2
                          ? 'slot2'
                          : !game.players.slot3
                          ? 'slot3'
                          : 'slot4';
                        onJoinSlot(game.id, firstOpen, currentPlayer);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/25 transition hover:scale-105 active:scale-95"
                    >
                      Quick Join Slot
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                      Match Full
                    </span>
                  )}

                  {/* Record Score Button if filled */}
                  {filledSlotsCount === 4 && (
                    <button
                      onClick={() => onOpenRecordScore(game)}
                      className="px-3.5 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Record Score</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host New Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-950/40 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Plus className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Host New Padel Game Session
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set up court, format, and open up 4 player slots
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Court Name</label>
                  <select
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  >
                    <option value="Court 1 - Pink Glass Arena (Indoor)">Court 1 - Pink Glass Arena (Indoor)</option>
                    <option value="Court 2 - Sunset Court (Indoor)">Court 2 - Sunset Court (Indoor)</option>
                    <option value="Court 3 - Electric Blue Skyline (Outdoor)">Court 3 - Electric Blue Skyline (Outdoor)</option>
                    <option value="Court 4 - Center Court Pro (Indoor)">Court 4 - Center Court Pro (Indoor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Club</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndoor}
                    onChange={(e) => setIsIndoor(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-700 focus:ring-sky-500"
                  />
                  <span>Indoor Court (Glass & Roof)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as GameFormat)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  >
                    <option value="Casual 4-Player">Casual 4-Player (Mixin)</option>
                    <option value="League Ranked Match">Winter Padel Slay League</option>
                    <option value="Americano">Americano Rotations</option>
                    <option value="Competitive Open">Competitive Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                  >
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes (Standard)</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Skill Level</label>
                  <input
                    type="text"
                    required
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    placeholder="e.g. 3.5 - 4.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price / Player (€)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pricePerPlayer}
                    onChange={(e) => setPricePerPlayer(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Match Vibes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 mt-2"
              >
                <CheckCircle2 className="w-4 h-4 font-bold" />
                <span>Publish Game & Open Slots</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
