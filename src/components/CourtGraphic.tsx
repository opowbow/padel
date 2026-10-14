import React from 'react';
import { User, Plus } from 'lucide-react';
import { Player } from '../types/padel';

interface CourtGraphicProps {
  players: {
    slot1?: Player; // Team A Left
    slot2?: Player; // Team A Right
    slot3?: Player; // Team B Left
    slot4?: Player; // Team B Right
  };
  onSlotClick?: (slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4') => void;
  interactive?: boolean;
}

export const CourtGraphic: React.FC<CourtGraphicProps> = ({
  players,
  onSlotClick,
  interactive = true,
}) => {
  const renderPlayerSlot = (
    player: Player | undefined,
    slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4',
    positionLabel: string,
    teamLabel: string,
    isTeamA: boolean
  ) => {
    return (
      <div className="flex flex-col items-center justify-center p-1 relative z-10">
        {player ? (
          <div
            onClick={() => interactive && onSlotClick && onSlotClick(slotKey)}
            className={`group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-105`}
            title={`${player.name} (${player.rankingText}) - Click to manage`}
          >
            <div className="relative">
              <img
                src={player.avatar}
                alt={player.name}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 shadow-lg ${
                  isTeamA ? 'border-lime-400 ring-2 ring-lime-400/30' : 'border-cyan-400 ring-2 ring-cyan-400/30'
                }`}
              />
              <span className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-white">
                {player.rankingScore.toFixed(1)}
              </span>
            </div>
            <span className="mt-1 text-[11px] font-bold text-white truncate max-w-[80px] text-center drop-shadow-md">
              {player.name.split(' ')[0]}
            </span>
            <span className="text-[9px] text-slate-300 font-mono">
              {positionLabel}
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onSlotClick && onSlotClick(slotKey)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              interactive
                ? isTeamA
                  ? 'border-lime-400/60 bg-lime-400/10 hover:bg-lime-400/25 hover:border-lime-300 text-lime-300'
                  : 'border-cyan-400/60 bg-cyan-400/10 hover:bg-cyan-400/25 hover:border-cyan-300 text-cyan-300'
                : 'border-slate-600 bg-slate-800/40 text-slate-500'
            }`}
            title={`Join ${teamLabel} - ${positionLabel}`}
          >
            {interactive ? <Plus className="w-4 h-4 animate-pulse" /> : <User className="w-4 h-4" />}
          </button>
        )}
        {!player && (
          <span className="mt-1 text-[10px] font-medium text-slate-400 text-center">
            {interactive ? 'Open Spot' : positionLabel}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-sky-950 via-blue-900 to-sky-950 border border-sky-700/50 p-3 shadow-xl">
      {/* Court Glass Walls Accent */}
      <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-2xl pointer-events-none"></div>

      {/* Court Lines */}
      <div className="relative border-2 border-white/60 rounded-xl p-2 bg-sky-900/40 min-h-[190px] flex flex-col justify-between">
        {/* Top Side: Team A */}
        <div>
          <div className="flex justify-between items-center px-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-lime-400"></span> Team A (North)
            </span>
            <span className="text-[9px] text-slate-400 font-mono">Service Box A</span>
          </div>
          <div className="grid grid-cols-2 gap-4 py-1">
            {renderPlayerSlot(players.slot1, 'slot1', 'Left (Drive)', 'Team A', true)}
            {renderPlayerSlot(players.slot2, 'slot2', 'Right (Revés)', 'Team A', true)}
          </div>
        </div>

        {/* Center Net */}
        <div className="relative my-2 py-1 flex items-center justify-center">
          <div className="w-full border-t-2 border-dashed border-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
          <span className="absolute px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-300">
            NET / RED
          </span>
        </div>

        {/* Bottom Side: Team B */}
        <div>
          <div className="grid grid-cols-2 gap-4 py-1">
            {renderPlayerSlot(players.slot3, 'slot3', 'Left (Drive)', 'Team B', false)}
            {renderPlayerSlot(players.slot4, 'slot4', 'Right (Revés)', 'Team B', false)}
          </div>
          <div className="flex justify-between items-center px-2 mt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Team B (South)
            </span>
            <span className="text-[9px] text-slate-400 font-mono">Service Box B</span>
          </div>
        </div>
      </div>
    </div>
  );
};
