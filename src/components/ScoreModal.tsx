import React, { useState, useMemo } from 'react';
import {
  X,
  Trophy,
  Sparkles,
  CheckCircle,
  Calculator,
  Mic,
  MicOff,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Player, League, RecordedMatch } from '../types/padel';
import { calculateMatchScoring } from '../utils/scoringEngine';
import {
  parseGeneralVoiceMatch,
  isBrowserSpeechSupported,
} from '../utils/voiceScoreParser';
import { getShortPlayerName } from '../utils/teamGenerator';

export interface ScoreModalSubmitParams {
  leagueId: string;
  gameId?: string;
  date?: string;
  round?: string;
  timeSlot?: string;
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
  winnerTeam: 'A' | 'B' | 'Tie';
}

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
  editingMatch?: RecordedMatch | null;
  onRecordScore: (params: ScoreModalSubmitParams) => void;
  onUpdateScore?: (matchId: string, params: ScoreModalSubmitParams) => void;
  onDeleteMatch?: (matchId: string) => void;
}

function parseInitialSetPair(raw: string | undefined, fallbackA: number, fallbackB: number): [string, string] {
  if (!raw) return [String(fallbackA), String(fallbackB)];
  const parts = raw.split('-');
  if (parts.length === 2) {
    return [parts[0].trim() || '0', parts[1].trim() || '0'];
  }
  return [String(fallbackA), String(fallbackB)];
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
  editingMatch,
  onRecordScore,
  onUpdateScore,
  onDeleteMatch,
}) => {
  const isEditing = Boolean(editingMatch);
  const [leagueId, setLeagueId] = useState(
    editingMatch?.leagueId || preselectedLeagueId || leagues[0]?.id || ''
  );
  const [date, setDate] = useState(editingMatch?.date || '');
  const [round, setRound] = useState(editingMatch?.round || 'Round 1');
  const [timeSlot, setTimeSlot] = useState(editingMatch?.timeSlot || '');
  const [courtName, setCourtName] = useState(editingMatch?.courtName || 'Court 1');
  const [scoreMode, setScoreMode] = useState<'quick' | 'sets'>(
    editingMatch && editingMatch.setScores.length > 1 ? 'sets' : 'quick'
  );

  // Player selection
  const [teamAPlayer1Id, setTeamAPlayer1Id] = useState(
    editingMatch?.teamA.player1.id ||
      preselectedPlayers?.slot1?.id ||
      players[0]?.id ||
      activePlayer.id
  );
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState(
    editingMatch?.teamA.player2.id ||
      preselectedPlayers?.slot2?.id ||
      players[1]?.id ||
      activePlayer.id
  );
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState(
    editingMatch?.teamB.player1.id ||
      preselectedPlayers?.slot3?.id ||
      players[2]?.id ||
      activePlayer.id
  );
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState(
    editingMatch?.teamB.player2.id ||
      preselectedPlayers?.slot4?.id ||
      players[3]?.id ||
      activePlayer.id
  );

  // Quick 20-min game scores
  const [quickScoreA, setQuickScoreA] = useState<number>(
    editingMatch ? editingMatch.teamA.pointsWon : 6
  );
  const [quickScoreB, setQuickScoreB] = useState<number>(
    editingMatch ? editingMatch.teamB.pointsWon : 2
  );

  // Multi-set scores
  const initS1 = parseInitialSetPair(editingMatch?.setScores[0], 6, 4);
  const initS2 = parseInitialSetPair(editingMatch?.setScores[1], 4, 6);
  const initS3 = parseInitialSetPair(editingMatch?.setScores[2], 6, 3);
  const [set1A, setSet1A] = useState(initS1[0]);
  const [set1B, setSet1B] = useState(initS1[1]);
  const [set2A, setSet2A] = useState(initS2[0]);
  const [set2B, setSet2B] = useState(initS2[1]);
  const [set3A, setSet3A] = useState(initS3[0]);
  const [set3B, setSet3B] = useState(initS3[1]);
  const [hasThirdSet, setHasThirdSet] = useState(
    editingMatch ? editingMatch.setScores.length >= 3 : true
  );

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [voiceInputText, setVoiceInputText] = useState('');

  const pA1 = players.find((p) => p.id === teamAPlayer1Id) || players[0] || activePlayer;
  const pA2 = players.find((p) => p.id === teamAPlayer2Id) || players[1] || pA1;
  const pB1 = players.find((p) => p.id === teamBPlayer1Id) || players[2] || pA1;
  const pB2 = players.find((p) => p.id === teamBPlayer2Id) || players[3] || pA1;

  // Calculate games & sets
  const num1A = parseInt(set1A || '0', 10);
  const num1B = parseInt(set1B || '0', 10);
  const num2A = parseInt(set2A || '0', 10);
  const num2B = parseInt(set2B || '0', 10);
  const num3A = hasThirdSet ? parseInt(set3A || '0', 10) : 0;
  const num3B = hasThirdSet ? parseInt(set3B || '0', 10) : 0;

  const totalPointsA = scoreMode === 'quick' ? quickScoreA : num1A + num2A + num3A;
  const totalPointsB = scoreMode === 'quick' ? quickScoreB : num1B + num2B + num3B;

  let setsWonA = 0;
  let setsWonB = 0;
  if (scoreMode === 'quick') {
    if (quickScoreA > quickScoreB) setsWonA = 1;
    else if (quickScoreB > quickScoreA) setsWonB = 1;
  } else {
    if (num1A > num1B) setsWonA++;
    else if (num1B > num1A) setsWonB++;

    if (num2A > num2B) setsWonA++;
    else if (num2B > num2A) setsWonB++;

    if (hasThirdSet) {
      if (num3A > num3B) setsWonA++;
      else if (num3B > num3A) setsWonB++;
    }
  }

  const winnerTeam: 'A' | 'B' | 'Tie' =
    setsWonA > setsWonB
      ? 'A'
      : setsWonB > setsWonA
      ? 'B'
      : totalPointsA > totalPointsB
      ? 'A'
      : totalPointsB > totalPointsA
      ? 'B'
      : 'Tie';

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

  if (!isOpen) return null;

  const applyTranscript = (transcript: string) => {
    const parsed = parseGeneralVoiceMatch(transcript, players);
    if (parsed.matchedPlayers.length >= 4) {
      setTeamAPlayer1Id(parsed.matchedPlayers[0].id);
      setTeamAPlayer2Id(parsed.matchedPlayers[1].id);
      setTeamBPlayer1Id(parsed.matchedPlayers[2].id);
      setTeamBPlayer2Id(parsed.matchedPlayers[3].id);
    }
    if (parsed.scores.length >= 2) {
      setScoreMode('quick');
      setQuickScoreA(parsed.scores[0]);
      setQuickScoreB(parsed.scores[1]);
    }

    if (parsed.matchedPlayers.length >= 4 || parsed.scores.length >= 2) {
      const namesInfo =
        parsed.matchedPlayers.length >= 4
          ? `${getShortPlayerName(parsed.matchedPlayers[0])} & ${getShortPlayerName(parsed.matchedPlayers[1])} vs ${getShortPlayerName(parsed.matchedPlayers[2])} & ${getShortPlayerName(parsed.matchedPlayers[3])}`
          : 'current teams';
      const scoresInfo =
        parsed.scores.length >= 2 ? ` (${parsed.scores[0]} - ${parsed.scores[1]})` : '';
      setVoiceNote(`Parsed "${transcript}" → ${namesInfo}${scoresInfo}`);
    } else {
      setVoiceNote(
        `Heard "${transcript}" — say 4 player names + score (e.g. "Katie Gabor 6 Olive Anna 2") or just the score ("6 to 2").`
      );
    }
  };

  const handleVoiceMic = () => {
    if (!isBrowserSpeechSupported()) {
      setVoiceNote(
        'Direct browser mic not supported in this browser — dictate or type in the box below and click Parse!'
      );
      return;
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };

    const SpeechCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechCtor) return;

    const recognition = new SpeechCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setVoiceNote('Listening... say e.g. "Katie and Gabor 6, Olive and Anna 2" or "6 to 2"');

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      applyTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceNote('Could not capture voice — try again or type below.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedSets =
      scoreMode === 'quick'
        ? [`${quickScoreA}-${quickScoreB}`]
        : hasThirdSet
        ? [`${num1A}-${num1B}`, `${num2A}-${num2B}`, `${num3A}-${num3B}`]
        : [`${num1A}-${num1B}`, `${num2A}-${num2B}`];

    const payload: ScoreModalSubmitParams = {
      leagueId,
      gameId: editingMatch?.gameId ?? preselectedGameId,
      date,
      round,
      timeSlot: timeSlot || undefined,
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
    };

    if (editingMatch && onUpdateScore) {
      onUpdateScore(editingMatch.id, payload);
    } else {
      onRecordScore(payload);
    }

    onClose();
  };

  const standardRounds = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6', 'League Match'];
  const standardCourts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-400 text-slate-950">
              <Trophy className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                {isEditing ? 'Edit Recorded Match Score' : 'Easy & Voice Match Score Entry'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update score, teams, or details — League Table recalculates automatically'
                  : 'Speak score or tap numbers to update Top 3 & Full League Standings'}
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Voice Input Assistant */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-950 to-sky-950/50 border border-indigo-500/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-sky-400" />
                Voice Score Input
              </span>
              <button
                type="button"
                onClick={handleVoiceMic}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Speak Score</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={voiceInputText}
                onChange={(e) => setVoiceInputText(e.target.value)}
                placeholder='Say or type e.g. "Katie and Gabor 6, Olive and Anna 2"'
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (!voiceInputText.trim()) return;
                  applyTranscript(voiceInputText.trim());
                  setVoiceInputText('');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold transition"
              >
                Parse
              </button>
            </div>

            {voiceNote && (
              <p className="text-[11px] text-sky-300 font-medium">🎙️ {voiceNote}</p>
            )}
          </div>

          {/* Date, League, Round, Court */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 mb-1">
                <Calendar className="w-3 h-3 text-sky-400" />
                Date (Optional)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Round
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              >
                {!standardRounds.includes(round) && round && (
                  <option value={round}>{round}</option>
                )}
                <option value="Round 1">Round 1</option>
                <option value="Round 2">Round 2</option>
                <option value="Round 3">Round 3</option>
                <option value="Round 4">Round 4</option>
                <option value="Round 5">Round 5</option>
                <option value="Round 6">Round 6</option>
                <option value="League Match">Single Match</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Court
              </label>
              <select
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              >
                {!standardCourts.includes(courtName) && courtName && (
                  <option value={courtName}>{courtName}</option>
                )}
                <option value="Court 1">Court 1</option>
                <option value="Court 2">Court 2</option>
                <option value="Court 3">Court 3</option>
                <option value="Court 4">Court 4</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                League
              </label>
              <select
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              >
                {leagues.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Time Slot (Optional)
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g. 18:00–18:20"
                className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          {/* Teams Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Team A */}
            <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-400/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-pink-400 uppercase tracking-wider">
                  Team 1
                </span>
                <span className="text-[11px] font-mono text-pink-300">
                  Avg {((pA1.rankingScore + pA2.rankingScore) / 2).toFixed(2)}
                </span>
              </div>

              <select
                value={teamAPlayer1Id}
                onChange={(e) => setTeamAPlayer1Id(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={teamAPlayer2Id}
                onChange={(e) => setTeamAPlayer2Id(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team B */}
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
                  Team 2
                </span>
                <span className="text-[11px] font-mono text-sky-300">
                  Avg {((pB1.rankingScore + pB2.rankingScore) / 2).toFixed(2)}
                </span>
              </div>

              <select
                value={teamBPlayer1Id}
                onChange={(e) => setTeamBPlayer1Id(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={teamBPlayer2Id}
                onChange={(e) => setTeamBPlayer2Id(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Easy Score Entry */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-400" />
                Easy Tap Score Input
              </span>

              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setScoreMode('quick')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    scoreMode === 'quick'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  20-Min Game
                </button>
                <button
                  type="button"
                  onClick={() => setScoreMode('sets')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    scoreMode === 'sets'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Set
                </button>
              </div>
            </div>

            {scoreMode === 'quick' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Team 1 Tapper */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-300 truncate">
                      {getShortPlayerName(pA1)} & {getShortPlayerName(pA2)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickScoreA(Math.max(0, quickScoreA - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 rounded-lg bg-slate-950 border border-pink-500/40 flex items-center justify-center font-mono font-black text-lg text-white">
                        {quickScoreA}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuickScoreA(quickScoreA + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuickScoreA(n)}
                        className={`w-6 h-6 rounded text-xs font-mono font-bold transition ${
                          quickScoreA === n
                            ? 'bg-pink-500 text-white font-black'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team 2 Tapper */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 truncate">
                      {getShortPlayerName(pB1)} & {getShortPlayerName(pB2)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickScoreB(Math.max(0, quickScoreB - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 rounded-lg bg-slate-950 border border-sky-500/40 flex items-center justify-center font-mono font-black text-lg text-white">
                        {quickScoreB}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuickScoreB(quickScoreB + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuickScoreB(n)}
                        className={`w-6 h-6 rounded text-xs font-mono font-bold transition ${
                          quickScoreB === n
                            ? 'bg-sky-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setHasThirdSet(!hasThirdSet)}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    {hasThirdSet ? 'Remove 3rd Set' : '+ Add 3rd Set'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="block text-[11px] font-bold text-slate-400 mb-1.5">SET 1</span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={set1A}
                        onChange={(e) => setSet1A(e.target.value)}
                        className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-pink-500/50 rounded-lg text-pink-300 focus:outline-none"
                      />
                      <span className="text-slate-500 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={set1B}
                        onChange={(e) => setSet1B(e.target.value)}
                        className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-sky-500/50 rounded-lg text-sky-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="block text-[11px] font-bold text-slate-400 mb-1.5">SET 2</span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={set2A}
                        onChange={(e) => setSet2A(e.target.value)}
                        className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-pink-500/50 rounded-lg text-pink-300 focus:outline-none"
                      />
                      <span className="text-slate-500 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={set2B}
                        onChange={(e) => setSet2B(e.target.value)}
                        className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-sky-500/50 rounded-lg text-sky-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="block text-[11px] font-bold text-slate-400 mb-1.5">SET 3</span>
                    {hasThirdSet ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={set3A}
                          onChange={(e) => setSet3A(e.target.value)}
                          className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-pink-500/50 rounded-lg text-pink-300 focus:outline-none"
                        />
                        <span className="text-slate-500 font-bold">-</span>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={set3B}
                          onChange={(e) => setSet3B(e.target.value)}
                          className="w-11 py-1 text-center font-bold font-mono bg-slate-800 border border-sky-500/50 rounded-lg text-sky-300 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic block py-1.5">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Points Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800 to-slate-900 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                League Points Award Preview
              </span>
              <span className="text-[10px] font-mono text-amber-300">
                {date} • {courtName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  winnerTeam === 'A'
                    ? 'bg-sky-950/60 border-sky-400/60'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold text-pink-300 block">
                  Team 1: +{previewBreakdown.totalTeamAPoints} league pts
                </span>
              </div>
              <div
                className={`p-2.5 rounded-xl border ${
                  winnerTeam === 'B'
                    ? 'bg-sky-950/60 border-sky-400/60'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold text-sky-300 block">
                  Team 2: +{previewBreakdown.totalTeamBPoints} league pts
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {isEditing && editingMatch && onDeleteMatch && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this recorded match score from the league?')) {
                    onDeleteMatch(editingMatch.id);
                    onClose();
                  }
                }}
                className="px-4 py-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5 font-bold" />
              <span>
                {isEditing
                  ? 'Save Updated Score & Recalculate League'
                  : 'Save Score & Update Standings'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
