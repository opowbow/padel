import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Trophy,
  Euro,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Player, PadelGame, GameFormat } from '../types/padel';
import { CourtGraphic } from './CourtGraphic';

interface GamesViewProps {
  games: PadelGame[];
  currentPlayer: Player;
  onJoinSlot: (gameId: string, slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4', player: Player) => void;
  onLeaveSlot: (gameId: string, slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4') => void;
  onCreateGame: (gameData: Omit<PadelGame, 'id' | 'status' | 'hostId' | 'hostName' | 'maxPlayers'>) => void;
  onOpenRecordScore: (game: PadelGame) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  currentPlayer,
  onJoinSlot,
  onLeaveSlot,
  onCreateGame,
  onOpenRecordScore,
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'my-games' | 'league'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New game form state
  const [courtName, setCourtName] = useState('Court 1 - Panoramic Glass (Indoor)');
  const [location, setLocation] = useState('Metro Padel Club, Central');
  const [isIndoor, setIsIndoor] = useState(true);
  const [date, setDate] = useState('2026-10-16');
  const [time, setTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [format, setFormat] = useState<GameFormat>('League Ranked Match');
  const [targetLevel, setTargetLevel] = useState('3.5 - 4.5');
  const [pricePerPlayer, setPricePerPlayer] = useState(14);
  const [notes, setNotes] = useState('Competitive match. Bring your best vibes!');

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
        slot1: currentPlayer, // Host takes slot 1
        slot2: undefined,
        slot3: undefined,
        slot4: undefined,
      },
      notes,
    });
    setShowCreateModal(false);
  };

  const filteredGames = games.filter((g) => {
    const isPlayerInGame = Object.values(g.players).some((p) => p?.id === currentPlayer.id);
    if (filter === 'open') return g.status === 'open';
    if (filter === 'my-games') return isPlayerInGame;
    if (filter === 'league') return g.format === 'League Ranked Match';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider bg-lime-400/20 text-lime-400 border border-lime-400/30 uppercase">
                Group Match Booking
              </span>
              <span className="text-xs text-slate-400">4-Player Sessions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Sign Up to Open Games
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Lock in your court slot, team up with community players, and earn league points for every match played!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>+ Host New Game</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            All Bookings ({games.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'open'
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Open Spots Only
          </button>
          <button
            onClick={() => setFilter('my-games')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'my-games'
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            My Signed-Up Games
          </button>
          <button
            onClick={() => setFilter('league')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'league'
                ? 'bg-lime-400 text-slate-950'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            🏆 Official League Matches
          </button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGames.map((game) => {
          const filledPlayers = Object.values(game.players).filter(Boolean);
          const spotsLeft = 4 - filledPlayers.length;
          const currentPlayerInGame = Object.entries(game.players).find(
            ([_, p]) => p?.id === currentPlayer.id
          );

          return (
            <div
              key={game.id}
              className={`rounded-3xl border bg-slate-900/90 backdrop-blur-sm p-5 shadow-xl transition-all hover:border-slate-700 flex flex-col justify-between ${
                currentPlayerInGame
                  ? 'border-lime-500/50 ring-1 ring-lime-400/20'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-lime-400">
                        {game.format}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {game.isIndoor ? 'Indoor Glass' : 'Outdoor Panoramic'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">{game.courtName}</h3>
                    <p className="text-xs text-slate-400">{game.location}</p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {spotsLeft === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        Full (4/4)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-lime-400/15 text-lime-400 border border-lime-400/30 flex items-center gap-1 animate-pulse">
                        <Users className="w-3.5 h-3.5" />
                        {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left!
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Details Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 px-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs mb-4">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-lime-400" />
                    <span>{game.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-lime-400" />
                    <span>{game.time} ({game.durationMinutes}m)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lvl: {game.targetLevel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Euro className="w-3.5 h-3.5 text-emerald-400" />
                    <span>€{game.pricePerPlayer} / player</span>
                  </div>
                </div>

                {/* Court Visualization */}
                <div className="mb-4">
                  <CourtGraphic
                    players={game.players}
                    interactive={true}
                    onSlotClick={(slotKey) => {
                      const existingPlayer = game.players[slotKey];
                      if (existingPlayer) {
                        if (existingPlayer.id === currentPlayer.id) {
                          onLeaveSlot(game.id, slotKey);
                        }
                      } else {
                        onJoinSlot(game.id, slotKey, currentPlayer);
                      }
                    }}
                  />
                </div>

                {game.notes && (
                  <p className="text-xs text-slate-400 italic mb-4">
                    💬 "{game.notes}" — <span className="text-slate-300 font-semibold">{game.hostName} (Host)</span>
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {currentPlayerInGame ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-lime-400">
                      <CheckCircle2 className="w-4 h-4 text-lime-400" />
                      You are in this game ({currentPlayerInGame[0]})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Click any open spot on court to join
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentPlayerInGame && (
                    <button
                      onClick={() =>
                        onLeaveSlot(
                          game.id,
                          currentPlayerInGame[0] as 'slot1' | 'slot2' | 'slot3' | 'slot4'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Leave Match</span>
                    </button>
                  )}

                  {/* If match is ready or full, can record scores */}
                  <button
                    onClick={() => onOpenRecordScore(game)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-lime-400 hover:bg-lime-300 text-slate-950 transition flex items-center gap-1.5 shadow-md"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Record Score</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
          <p className="text-base font-bold text-slate-300">No matches found for this filter.</p>
          <p className="text-xs text-slate-500 mt-1">Host a new game to get players on court!</p>
        </div>
      )}

      {/* Host New Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-400" />
                Host New 4-Player Match
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Court Name</label>
                  <input
                    type="text"
                    required
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Club</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndoor}
                    onChange={(e) => setIsIndoor(e.target.checked)}
                    className="w-4 h-4 rounded text-lime-400 bg-slate-800 border-slate-700 focus:ring-lime-400"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as GameFormat)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="League Ranked Match">League Ranked Match</option>
                    <option value="Casual 4-Player">Casual 4-Player</option>
                    <option value="Americano">Americano Tournament</option>
                    <option value="Competitive Open">Competitive Open</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Skill Level</label>
                  <input
                    type="text"
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    placeholder="e.g. 3.0 - 4.2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (mins)</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes (Standard)</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price / Player (€)</label>
                  <input
                    type="number"
                    value={pricePerPlayer}
                    onChange={(e) => setPricePerPlayer(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Host Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Balls provided, warm up 10 mins before start..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-lime-400 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-lime-300 transition"
                >
                  Create & Reserve Court
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
