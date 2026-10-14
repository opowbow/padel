import React, { useState, useMemo } from 'react';
import { X, Trophy, Sparkles, CheckCircle, Calculator } from 'lucide-react';
import { Player, League } from '../types/padel';
import { calculateMatchScoring } from '../utils/scoringEngine';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: League[];
  players: Player[];
  activePlayer: Player;
  weightedScoring: boolean;
  preselectedLeagueId?: string;
  preselectedGameId?: string;
  preselectedPlayers?: {
    slot1?: Player;
    slot2?: Player;
    slot3?: Player;
    slot4?: Player;
  };
  onRecordScore: (params: {
    leagueId: string;
    gameId?: string;
    courtName: string;
    teamAPlayer1: Player;
    teamAPlayer2: Player;
    teamBPlayer1: Player;
    teamBPlayer2: Player;
    setScores: string[];
    teamASetsWon: number;
    teamBSetsWon: number;
    teamAPointsWon: number;
    teamBPointsWon: number;
    winnerTeam: 'A' | 'B';
  }) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  leagues,
  players,
  activePlayer,
  weightedScoring,
  preselectedLeagueId,
  preselectedGameId,
  preselectedPlayers,
  onRecordScore,
}) => {
  const [leagueId, setLeagueId] = useState(preselectedLeagueId || leagues[0]?.id || '');
  const [courtName, setCourtName] = useState('Court 1 - Panoramic Glass');

  // Player selection
  const [teamAPlayer1Id, setTeamAPlayer1Id] = useState(
    preselectedPlayers?.slot1?.id || activePlayer.id
  );
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState(
    preselectedPlayers?.slot2?.id || (players[1] ? players[1].id : '')
  );
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState(
    preselectedPlayers?.slot3?.id || (players[2] ? players[2].id : '')
  );
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState(
    preselectedPlayers?.slot4?.id || (players[6] ? players[6].id : '')
  );

  // Set scores
  const [set1A, setSet1A] = useState('6');
  const [set1B, setSet1B] = useState('4');
  const [set2A, setSet2A] = useState('4');
  const [set2B, setSet2B] = useState('6');
  const [set3A, setSet3A] = useState('6');
  const [set3B, setSet3B] = useState('3');
  const [hasThirdSet, setHasThirdSet] = useState(true);

  if (!isOpen) return null;

  const pA1 = players.find((p) => p.id === teamAPlayer1Id) || players[0];
  const pA2 = players.find((p) => p.id === teamAPlayer2Id) || players[1] || players[0];
  const pB1 = players.find((p) => p.id === teamBPlayer1Id) || players[2] || players[0];
  const pB2 = players.find((p) => p.id === teamBPlayer2Id) || players[3] || players[0];

  // Calculate games & sets
  const num1A = parseInt(set1A || '0', 10);
  const num1B = parseInt(set1B || '0', 10);
  const num2A = parseInt(set2A || '0', 10);
  const num2B = parseInt(set2B || '0', 10);
  const num3A = hasThirdSet ? parseInt(set3A || '0', 10) : 0;
  const num3B = hasThirdSet ? parseInt(set3B || '0', 10) : 0;

  const totalPointsA = num1A + num2A + num3A;
  const totalPointsB = num1B + num2B + num3B;

  let setsWonA = 0;
  let setsWonB = 0;
  if (num1A > num1B) setsWonA++;
  else if (num1B > num1A) setsWonB++;

  if (num2A > num2B) setsWonA++;
  else if (num2B > num2A) setsWonB++;

  if (hasThirdSet) {
    if (num3A > num3B) setsWonA++;
    else if (num3B > num3A) setsWonB++;
  }

  const winnerTeam: 'A' | 'B' = setsWonA >= setsWonB ? 'A' : 'B';

  // Live calculation preview
  const previewBreakdown = useMemo(() => {
    return calculateMatchScoring({
      teamAPlayer1: pA1,
      teamAPlayer2: pA2,
      teamBPlayer1: pB1,
      teamBPlayer2: pB2,
      teamAPointsWon: totalPointsA,
      teamBPointsWon: totalPointsB,
      winnerTeam,
      useWeighting: weightedScoring,
    });
  }, [pA1, pA2, pB1, pB2, totalPointsA, totalPointsB, winnerTeam, weightedScoring]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedSets = [`${num1A}-${num1B}`, `${num2A}-${num2B}`];
    if (hasThirdSet) {
      formattedSets.push(`${num3A}-${num3B}`);
    }

    onRecordScore({
      leagueId,
      gameId: preselectedGameId,
      courtName,
      teamAPlayer1: pA1,
      teamAPlayer2: pA2,
      teamBPlayer1: pB1,
      teamBPlayer2: pB2,
      setScores: formattedSets,
      teamASetsWon: setsWonA,
      teamBSetsWon: setsWonB,
      teamAPointsWon: totalPointsA,
      teamBPointsWon: totalPointsB,
      winnerTeam,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-lime-400 text-slate-950">
              <Trophy className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">
                Record League Match Score
              </h3>
              <p className="text-xs text-slate-400">
                Enter points won & lost with automatic weighted win calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* League and Court Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select League
              </label>
              <select
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
              >
                {leagues.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Court Location
              </label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          {/* Teams Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team A */}
            <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-400/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400"></span> Team A (North)
                </span>
                <span className="text-xs font-mono text-lime-300">
                  Avg: {(((pA1.rankingScore + pA2.rankingScore) / 2)).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Player 1 (Drive)</label>
                <select
                  value={teamAPlayer1Id}
                  onChange={(e) => setTeamAPlayer1Id(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-lime-400"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.rankingScore.toFixed(1)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Player 2 (Revés)</label>
                <select
                  value={teamAPlayer2Id}
                  onChange={(e) => setTeamAPlayer2Id(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-lime-400"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.rankingScore.toFixed(1)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team B */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Team B (South)
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  Avg: {(((pB1.rankingScore + pB2.rankingScore) / 2)).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Player 1 (Drive)</label>
                <select
                  value={teamBPlayer1Id}
                  onChange={(e) => setTeamBPlayer1Id(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.rankingScore.toFixed(1)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Player 2 (Revés)</label>
                <select
                  value={teamBPlayer2Id}
                  onChange={(e) => setTeamBPlayer2Id(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.rankingScore.toFixed(1)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scores Entry (Sets & Points) */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-lime-400" />
                Score & Points Won/Lost
              </span>
              <button
                type="button"
                onClick={() => setHasThirdSet(!hasThirdSet)}
                className="text-xs text-lime-400 hover:underline"
              >
                {hasThirdSet ? 'Remove 3rd Set' : '+ Add 3rd Set'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Set 1 */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="block text-[11px] font-bold text-slate-400 mb-1.5">SET 1</span>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={set1A}
                    onChange={(e) => setSet1A(e.target.value)}
                    className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-lime-500/50 rounded-lg text-lime-400 focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={set1B}
                    onChange={(e) => setSet1B(e.target.value)}
                    className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-cyan-500/50 rounded-lg text-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Set 2 */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="block text-[11px] font-bold text-slate-400 mb-1.5">SET 2</span>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={set2A}
                    onChange={(e) => setSet2A(e.target.value)}
                    className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-lime-500/50 rounded-lg text-lime-400 focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={set2B}
                    onChange={(e) => setSet2B(e.target.value)}
                    className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-cyan-500/50 rounded-lg text-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Set 3 */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="block text-[11px] font-bold text-slate-400 mb-1.5">SET 3 (Tiebreak)</span>
                {hasThirdSet ? (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={set3A}
                      onChange={(e) => setSet3A(e.target.value)}
                      className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-lime-500/50 rounded-lg text-lime-400 focus:outline-none"
                    />
                    <span className="text-slate-500 font-bold">-</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={set3B}
                      onChange={(e) => setSet3B(e.target.value)}
                      className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-cyan-500/50 rounded-lg text-cyan-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic block py-1.5">N/A</span>
                )}
              </div>
            </div>

            {/* Total Points Won & Lost Summary */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Team A Points Won: </span>
                <span className="font-bold text-lime-400 font-mono text-sm">{totalPointsA}</span>
                <span className="text-slate-500 ml-1">({setsWonA} sets)</span>
              </div>
              <div className="text-slate-500 font-bold">vs</div>
              <div>
                <span className="text-slate-400">Team B Points Won: </span>
                <span className="font-bold text-cyan-400 font-mono text-sm">{totalPointsB}</span>
                <span className="text-slate-500 ml-1">({setsWonB} sets)</span>
              </div>
            </div>
          </div>

          {/* LIVE WEIGHTED WIN CALCULATION PREVIEW */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800 to-slate-900 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live League Points Calculation Preview
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                {weightedScoring ? 'Weighted Wins Active' : 'Standard Baseline'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${winnerTeam === 'A' ? 'bg-lime-950/60 border-lime-400/60 ring-1 ring-lime-400/30' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-lime-400">Team A Award</span>
                  {winnerTeam === 'A' && <span className="text-[10px] font-black bg-lime-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">WIN</span>}
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  +{previewBreakdown.totalTeamAPoints} <span className="text-xs font-sans text-slate-400">league pts</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${winnerTeam === 'B' ? 'bg-cyan-950/60 border-cyan-400/60 ring-1 ring-cyan-400/30' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-cyan-400">Team B Award</span>
                  {winnerTeam === 'B' && <span className="text-[10px] font-black bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">WIN</span>}
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  +{previewBreakdown.totalTeamBPoints} <span className="text-xs font-sans text-slate-400">league pts</span>
                </div>
              </div>
            </div>

            {/* Formula Explanations */}
            <div className="space-y-1 pt-1 text-[11px] text-slate-300">
              {previewBreakdown.formulaExplanation.map((line, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-400">
                  <span>•</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-lime-500/20 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Record Score & Update Standings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
