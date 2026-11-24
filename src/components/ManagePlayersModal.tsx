import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, Sparkles, Pencil, Check } from 'lucide-react';
import { Player } from '../types/padel';
import { getShortPlayerName } from '../utils/teamGenerator';
import { PlayerAvatar } from './PlayerAvatar';

interface ManagePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onQuickAddPlayer: (name: string, rankingScore?: number) => Player | null;
  onRenamePlayer: (playerId: string, newName: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onOpenFullSignUp: () => void;
}

export const ManagePlayersModal: React.FC<ManagePlayersModalProps> = ({
  isOpen,
  onClose,
  players,
  onQuickAddPlayer,
  onRenamePlayer,
  onRemovePlayer,
  onOpenFullSignUp,
}) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState('4.0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsed = parseFloat(rating) || 4.0;
    onQuickAddPlayer(name.trim(), Math.max(1.0, Math.min(7.0, parsed)));
    setName('');
  };

  const startEditing = (p: Player) => {
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const commitRename = (playerId: string) => {
    if (editingName.trim()) {
      onRenamePlayer(playerId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                Manage Players ({players.length})
              </h3>
              <p className="text-xs text-slate-400">
                Add, rename, or remove players in the league roster
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick Add Form */}
          <form
            onSubmit={handleQuickAdd}
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Quick Add Player to League
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullSignUp();
                }}
                className="text-[11px] font-bold text-pink-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Full Sign-Up →
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Player name (e.g. Katie, Gabor, Sam)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              />
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-sky-400"
              >
                <option value="3.0">Lvl 3.0</option>
                <option value="3.5">Lvl 3.5</option>
                <option value="4.0">Lvl 4.0</option>
                <option value="4.5">Lvl 4.5</option>
                <option value="5.0">Lvl 5.0</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition shrink-0"
              >
                + Add
              </button>
            </div>
          </form>

          {/* Current Roster List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active League Players (Tap Pencil to Edit Name)
            </span>

            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              {players.map((p) => {
                const isEditing = editingId === p.id;

                return (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between gap-2.5 hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <PlayerAvatar
                        name={isEditing && editingName.trim() ? editingName : p.name}
                        className="w-9 h-9 rounded-xl text-sm"
                      />

                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            commitRename(p.id);
                          }}
                          className="flex items-center gap-1.5 flex-1 min-w-0"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-sky-400 text-xs font-bold text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            title="Save name"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {p.name}
                            </span>
                            {getShortPlayerName(p) !== p.name && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 shrink-0">
                                {getShortPlayerName(p)}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {p.matchesWon}W / {Math.max(0, p.matchesPlayed - p.matchesWon)}L
                          </span>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(p)}
                          title={`Edit ${p.name}'s name`}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Pencil className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={players.length <= 1}
                          onClick={() => {
                            if (
                              confirm(`Remove ${p.name} from the league and player roster?`)
                            ) {
                              onRemovePlayer(p.id);
                            }
                          }}
                          title={`Remove ${p.name}`}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
