import React from 'react';
import { Plus } from 'lucide-react';
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
                  isTeamA ? 'border-sky-400 ring-2 ring-sky-400/40' : 'border-blue-500 ring-2 ring-blue-500/40'
                }`}
              />
              <span className="absolute -bottom-1 -right-1 px-1 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-white">
                {player.rankingScore.toFixed(1)}
              </span>
            </div>
            <span className="mt-1 text-[11px] font-bold text-white truncate max-w-[85px] text-center drop-shadow-md">
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
                  ? 'border-sky-400/60 bg-sky-500/10 hover:bg-sky-500/25 hover:border-sky-300 text-sky-400 cursor-pointer shadow-sm hover:scale-110'
                  : 'border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/25 hover:border-blue-400 text-blue-400 cursor-pointer shadow-sm hover:scale-110'
                : 'border-slate-700 bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[8px] font-bold font-mono">OPEN</span>
          </button>
        )}
        <span className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
          {teamLabel}
        </span>
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] min-h-[180px] max-h-[240px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border border-slate-700/80 p-2 overflow-hidden shadow-inner flex flex-col justify-between">
      {/* Back Glass Wall Indicators */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"></div>
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

      {/* Side Wire Mesh Visuals */}
      <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 opacity-60"></div>
      <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 opacity-60"></div>

      {/* Service Boxes & Lines (White Padel Markings) */}
      <div className="absolute inset-x-4 top-1/4 h-[0.5px] bg-white/20"></div>
      <div className="absolute inset-x-4 bottom-1/4 h-[0.5px] bg-white/20"></div>
      <div className="absolute top-1/4 bottom-1/4 left-1/2 w-[0.5px] bg-white/20 -translate-x-1/2"></div>

      {/* Team A (Top / North Court Side) */}
      <div className="relative z-10 flex items-center justify-around w-full">
        {renderPlayerSlot(players.slot1, 'slot1', 'Drive', 'Team A (Drive)', true)}
        {renderPlayerSlot(players.slot2, 'slot2', 'Revés', 'Team A (Revés)', true)}
      </div>

      {/* Center Net (Padel Mesh with White Top Band) */}
      <div className="relative z-20 my-1 w-full flex items-center justify-center">
        <div className="w-full h-1 bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-md flex items-center justify-between px-1">
          <div className="w-2 h-2.5 bg-slate-400 rounded-sm"></div>
          <span className="text-[7px] font-black uppercase tracking-widest text-slate-950 bg-sky-200 px-1.5 rounded font-mono font-bold">
            NET
          </span>
          <div className="w-2 h-2.5 bg-slate-400 rounded-sm"></div>
        </div>
      </div>

      {/* Team B (Bottom / South Court Side) */}
      <div className="relative z-10 flex items-center justify-around w-full">
        {renderPlayerSlot(players.slot3, 'slot3', 'Drive', 'Team B (Drive)', false)}
        {renderPlayerSlot(players.slot4, 'slot4', 'Revés', 'Team B (Revés)', false)}
      </div>
    </div>
  );
};
