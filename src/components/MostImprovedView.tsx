import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  Star,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  Player,
  WeeklyAward,
  WeeklyMvpResult,
  StarOfTheNight,
} from '../types/padel';
import { getRankingBadge } from '../utils/rankingData';
import { PlayerAvatar } from './PlayerAvatar';

interface MostImprovedViewProps {
  weeklyMvp: WeeklyMvpResult;
  starOfTheNight: StarOfTheNight;
  players: Player[];
  currentPlayer: Player;
  onUpdateStarOfTheNight: (params: {
    playerId: string;
    reason: string;
    nominatedBy?: string;
  }) => void;
  historicalAwards: WeeklyAward[];
}

export const MostImprovedView: React.FC<MostImprovedViewProps> = ({
  weeklyMvp,
  starOfTheNight,
  players,
  currentPlayer,
  onUpdateStarOfTheNight,
  historicalAwards,
}) => {
  const {
    player,
    weekPoints,
    pointDiff,
    played,
    won,
    lost,
    winRate,
    sessionLabel,
    commentary,
    runnerUps,
  } = weeklyMvp;
  const badge = getRankingBadge(player.rankingScore, player.rankingText);

  const starPlayer =
    players.find((p) => p.id === starOfTheNight.playerId) ||
    players.find((p) => p.name.toLowerCase().includes('franny')) ||
    players[0];
  const starDisplayName = starPlayer?.name || starOfTheNight.playerName;

  const canEditStarOfNight =
    currentPlayer.id === 'p-olive' ||
    currentPlayer.name.toLowerCase().includes('olive');

  const [isEditingStar, setIsEditingStar] = useState(false);
  const [draftPlayerId, setDraftPlayerId] = useState(starOfTheNight.playerId);
  const [draftReason, setDraftReason] = useState(starOfTheNight.reason);
  const [draftNominatedBy, setDraftNominatedBy] = useState(
    starOfTheNight.nominatedBy || 'Folks who were there'
  );

  const handleSaveStar = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStarOfTheNight({
      playerId: draftPlayerId,
      reason: draftReason,
      nominatedBy: draftNominatedBy,
    });
    setIsEditingStar(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Spotlight Card: MVP of the Week (Last 4 Games / Last Games) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/20 via-slate-900 to-indigo-950/40 border-2 border-sky-400/40 p-4 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col @2xl:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar & Trophy */}
          <div className="relative flex-shrink-0 text-center">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30">
                <Trophy className="w-6 h-6 fill-white" />
              </div>
            </div>

            <div className="relative mt-2">
              <PlayerAvatar
                name={player.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl text-5xl sm:text-6xl border-4 border-sky-400 ring-4 ring-sky-400/30 shadow-2xl"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950 border border-sky-400 text-sky-300 text-[11px] font-black uppercase tracking-wider font-mono shadow-md">
                WEEK MVP
              </span>
            </div>
          </div>

          {/* Details & Stats */}
          <div className="flex-1 text-center @2xl:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center @2xl:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                MVP of the Week • {sessionLabel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeColor}`}
              >
                {player.rankingText}
              </span>
            </div>

            <h2 className="text-2xl @xl:text-4xl font-black text-white uppercase tracking-tight">
              {player.name}
            </h2>

            <p className="text-xs @xl:text-sm text-slate-300 italic leading-relaxed max-w-2xl bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              “{commentary}”
            </p>

            {/* Weekly Stat Badges */}
            <div className="grid grid-cols-2 @xl:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Last {played || 4} Games Pts
                </span>
                <span className="text-xl font-black font-mono text-sky-400 flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {weekPoints} pts
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Week Record
                </span>
                <span className="text-xl font-black font-mono text-emerald-400 flex items-center justify-center gap-1">
                  {won}W - {lost}L
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Net Point Diff
                </span>
                <span className="text-xl font-black font-mono text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4" />
                  {pointDiff >= 0 ? `+${pointDiff}` : pointDiff}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Week Win Rate
                </span>
                <span className="text-xl font-black font-mono text-sky-400 flex items-center justify-center gap-1">
                  {winRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Star of the Night Spotlight Card */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-500/20 via-slate-900 to-rose-950/30 border-2 border-pink-400/50 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-400/40">
              <Star className="w-5 h-5 fill-pink-400 text-pink-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                🌟 Star of the Night
              </h3>
              <p className="text-xs text-slate-400">
                Nominated by folks who were there • Curated by Olive - fighting Irish
              </p>
            </div>
          </div>

          {canEditStarOfNight && !isEditingStar && (
            <button
              type="button"
              onClick={() => {
                setDraftPlayerId(starPlayer?.id || starOfTheNight.playerId);
                setDraftReason(starOfTheNight.reason);
                setDraftNominatedBy(starOfTheNight.nominatedBy || 'Folks who were there');
                setIsEditingStar(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Star of the Night</span>
            </button>
          )}
        </div>

        {isEditingStar && canEditStarOfNight ? (
          <form
            onSubmit={handleSaveStar}
            className="p-4 rounded-2xl bg-slate-950/80 border border-pink-500/40 space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Star Player
                </label>
                <select
                  value={draftPlayerId}
                  onChange={(e) => setDraftPlayerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-pink-400"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nominated By
                </label>
                <input
                  type="text"
                  value={draftNominatedBy}
                  onChange={(e) => setDraftNominatedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Citation / Reason
              </label>
              <input
                type="text"
                required
                value={draftReason}
                onChange={(e) => setDraftReason(e.target.value)}
                placeholder="e.g. For her padel cat walk"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingStar(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black uppercase flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Star of the Night</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <PlayerAvatar
              name={starDisplayName}
              className="w-16 h-16 rounded-2xl text-2xl ring-2 ring-pink-400 shrink-0"
            />
            <div className="text-center sm:text-left space-y-1 min-w-0">
              <h4 className="text-lg font-black text-white">{starDisplayName}</h4>
              <p className="text-sm font-bold text-pink-300 italic">
                “{starOfTheNight.reason}”
              </p>
              <p className="text-xs text-slate-400">
                Nominated by {starOfTheNight.nominatedBy || 'folks who were there'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Runner-Ups / Contenders from Last Games */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-400" />
            Current Week MVP Contenders (Last 4 Games)
          </h3>
          <p className="text-xs text-slate-400">
            Top scorers evaluated from the latest session’s games ({sessionLabel})
          </p>
        </div>

        <div className="grid grid-cols-1 @xl:grid-cols-3 gap-3.5">
          {runnerUps.slice(0, 3).map((r, i) => (
            <div
              key={r.player.id}
              className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5 hover:border-slate-600 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-slate-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-800 shrink-0">
                #{i + 2}
              </div>
              <PlayerAvatar
                name={r.player.name}
                className="w-11 h-11 rounded-xl text-sm ring-2 ring-slate-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{r.player.name}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                  <span className="text-sky-400 font-bold">{r.weekPoints} pts</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400">
                    {r.won}W-{r.lost}L ({r.pointDiff >= 0 ? `+${r.pointDiff}` : r.pointDiff})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Hall of Fame (shown only when past awards exist) */}
      {historicalAwards.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              Past Weekly MVP Champions
            </h3>
            <span className="text-xs font-mono text-slate-400">Season Archive</span>
          </div>

          <div className="grid grid-cols-1 @xl:grid-cols-3 gap-3.5">
            {historicalAwards.map((item) => (
              <div
                key={`${item.year}-W${item.weekNumber}-${item.player.id}`}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
              >
                <PlayerAvatar
                  name={item.player.name}
                  className="w-10 h-10 rounded-xl text-xs ring-1 ring-slate-700"
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
      )}
    </div>
  );
};
