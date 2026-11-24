import React, { useState, useMemo } from 'react';
import {
  History,
  CalendarClock,
  Calendar,
  Mic,
  MicOff,
  CheckCircle2,
  PlusCircle,
  Shuffle,
  X,
  Trophy,
  Sparkles,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { RecordedMatch, NextGameSession, ScheduledFixture } from '../types/padel';
import { getShortPlayerName } from '../utils/teamGenerator';
import {
  parseFixtureVoiceScore,
  parseGeneralVoiceMatch,
  isBrowserSpeechSupported,
} from '../utils/voiceScoreParser';

interface LeagueGamesPanelProps {
  mode: 'last' | 'next';
  onClose: () => void;
  matches: RecordedMatch[];
  nextGameSession: NextGameSession | null;
  onOpenCreateGame: () => void;
  onOpenImportNextGames?: () => void;
  onUpdateFixtureDraftScore: (
    fixtureId: string,
    teamAScore: number | undefined,
    teamBScore: number | undefined
  ) => void;
  onUpdateNextSessionDate: (newDate: string) => void;
  onRecordSingleFixture: (
    fixtureId: string,
    overrideScores?: { teamAScore: number; teamBScore: number }
  ) => void;
  onRecordAllScoredFixtures: () => number;
  onUpdateRecordedSessionDate: (sessionKey: string, newDate: string) => void;
}

export const LeagueGamesPanel: React.FC<LeagueGamesPanelProps> = ({
  mode,
  onClose,
  matches,
  nextGameSession,
  onOpenCreateGame,
  onOpenImportNextGames,
  onUpdateFixtureDraftScore,
  onUpdateNextSessionDate,
  onRecordSingleFixture,
  onRecordAllScoredFixtures,
  onUpdateRecordedSessionDate,
}) => {
  // Group recorded matches into sessions (latest session first)
  const sessions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; date: string; matches: RecordedMatch[] }
    >();
    for (const m of matches) {
      const key = m.sessionId || m.date;
      const existing = map.get(key);
      if (existing) {
        existing.matches.push(m);
      } else {
        map.set(key, { key, date: m.date, matches: [m] });
      }
    }
    const list = Array.from(map.values()).reverse();
    list.sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
      return 0;
    });
    return list;
  }, [matches]);

  const [selectedSessionKey, setSelectedSessionKey] = useState<string>('');
  const activeSession =
    sessions.find((s) => s.key === selectedSessionKey) || sessions[0] || null;

  // Voice recognition state for Next Games
  const [listeningTarget, setListeningTarget] = useState<string | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');
  const [quickVoiceText, setQuickVoiceText] = useState<string>('');

  const startVoiceCapture = (fixture?: ScheduledFixture) => {
    if (!isBrowserSpeechSupported()) {
      setVoiceFeedback(
        'Browser speech mic unavailable here — type or use keyboard dictation in the quick voice box below!'
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

    const targetId = fixture ? fixture.id : 'global';
    setListeningTarget(targetId);
    setVoiceFeedback(
      fixture
        ? `Listening for ${fixture.courtName} (${getShortPlayerName(fixture.teamA.player1)} & ${getShortPlayerName(fixture.teamA.player2)} vs ${getShortPlayerName(fixture.teamB.player1)} & ${getShortPlayerName(fixture.teamB.player2)})... say e.g. "6 to 2"`
        : 'Listening... say player names & score (e.g. "Katie and Gabor 6, Olive and Anna 2")'
    );

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      applyVoiceTranscript(transcript, fixture);
    };

    recognition.onerror = () => {
      setListeningTarget(null);
      setVoiceFeedback('Could not hear clearly — try again or use the quick voice/text box.');
    };

    recognition.onend = () => {
      setListeningTarget(null);
    };

    recognition.start();
  };

  const applyVoiceTranscript = (transcript: string, fixture?: ScheduledFixture) => {
    if (!nextGameSession) return;

    if (fixture) {
      const parsed = parseFixtureVoiceScore(transcript, fixture);
      if (parsed) {
        onUpdateFixtureDraftScore(fixture.id, parsed.teamAScore, parsed.teamBScore);
        setVoiceFeedback(
          `Heard "${transcript}" → Set ${fixture.courtName} score to ${parsed.teamAScore} - ${parsed.teamBScore}`
        );
      } else {
        setVoiceFeedback(
          `Heard "${transcript}" — please say two numbers like "6 to 2".`
        );
      }
      return;
    }

    // Global match across open Next Games fixtures
    const allSessionPlayers = Array.from(
      new Map(
        nextGameSession.fixtures.flatMap((f) => [
          [f.teamA.player1.id, f.teamA.player1],
          [f.teamA.player2.id, f.teamA.player2],
          [f.teamB.player1.id, f.teamB.player1],
          [f.teamB.player2.id, f.teamB.player2],
        ])
      ).values()
    );

    const result = parseGeneralVoiceMatch(
      transcript,
      allSessionPlayers,
      nextGameSession.fixtures
    );

    if (result.matchedFixture && result.scores.length >= 2) {
      const parsedForFix = parseFixtureVoiceScore(transcript, result.matchedFixture);
      const sA = parsedForFix ? parsedForFix.teamAScore : result.scores[0];
      const sB = parsedForFix ? parsedForFix.teamBScore : result.scores[1];
      onUpdateFixtureDraftScore(result.matchedFixture.id, sA, sB);
      setVoiceFeedback(
        `Heard "${transcript}" → Updated ${result.matchedFixture.roundLabel} ${result.matchedFixture.courtName}: ${sA} - ${sB}`
      );
    } else {
      setVoiceFeedback(
        `Heard "${transcript}" — mention at least two players in an open fixture plus both scores (e.g. "Olive Anna 2 Katie Gabor 6").`
      );
    }
  };

  if (mode === 'last') {
    // Group activeSession matches by round
    const groupedRounds = new Map<string, RecordedMatch[]>();
    if (activeSession) {
      for (const m of activeSession.matches) {
        const label = m.round
          ? `${m.round}${m.timeSlot ? ` • ${m.timeSlot}` : ''}`
          : m.date
          ? `Matches on ${m.date}`
          : 'Recorded Session Matches';
        const list = groupedRounds.get(label) || [];
        list.push(m);
        groupedRounds.set(label, list);
      }
    }

    return (
      <div className="rounded-3xl border-2 border-sky-500/40 bg-slate-900/95 p-3.5 @xl:p-6 shadow-2xl space-y-4 animate-in fade-in">
        {/* Top Back to League Table Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Back to League Table</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Last Games"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col @xl:flex-row @xl:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm @xl:text-lg font-black text-white uppercase tracking-tight">
                Last Games — Session Results
              </h3>
              <p className="text-xs text-slate-400">
                {activeSession
                  ? `${activeSession.matches.length} recorded 20-min matches`
                  : 'No recorded games yet'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sessions.length > 1 && activeSession && (
              <select
                value={activeSession.key}
                onChange={(e) => setSelectedSessionKey(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
              >
                {sessions.map((s, idx) => {
                  const dateText = s.date || 'Spreadsheet Session';
                  return (
                    <option key={s.key} value={s.key}>
                      {idx === 0 ? `Latest (${dateText})` : dateText} • {s.matches.length} games
                    </option>
                  );
                })}
              </select>
            )}

            {activeSession && (
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                {!activeSession.date && (
                  <span className="text-[10px] font-bold text-slate-400">Set Date:</span>
                )}
                <input
                  type="date"
                  value={activeSession.date}
                  onChange={(e) =>
                    onUpdateRecordedSessionDate(activeSession.key, e.target.value)
                  }
                  title="Set or edit session date"
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {activeSession ? (
          <div className="space-y-4">
            {Array.from(groupedRounds.entries()).map(([roundHeader, roundMatches]) => (
              <div key={roundHeader} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                    {roundHeader}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {roundMatches.length} Court{roundMatches.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-3">
                  {roundMatches.map((m) => {
                    const aWon = m.winnerTeam === 'A';
                    const bWon = m.winnerTeam === 'B';
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-sky-300">🏟️ {m.courtName}</span>
                          {m.date ? (
                            <span className="text-slate-400">{m.date}</span>
                          ) : m.timeSlot ? (
                            <span className="text-slate-500">{m.timeSlot}</span>
                          ) : null}
                        </div>

                        {/* Team 1 Row */}
                        <div
                          className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${
                            aWon
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                              : 'bg-slate-900/70 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-1.5">
                            {aWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="text-xs font-bold truncate">
                              {getShortPlayerName(m.teamA.player1)} &{' '}
                              {getShortPlayerName(m.teamA.player2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-sky-400">
                              +{m.scoringBreakdown.totalTeamAPoints}p
                            </span>
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-sm ${
                                aWon
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {m.teamA.pointsWon}
                            </span>
                          </div>
                        </div>

                        {/* Team 2 Row */}
                        <div
                          className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${
                            bWon
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                              : 'bg-slate-900/70 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-1.5">
                            {bWon && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="text-xs font-bold truncate">
                              {getShortPlayerName(m.teamB.player1)} &{' '}
                              {getShortPlayerName(m.teamB.player2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-sky-400">
                              +{m.scoringBreakdown.totalTeamBPoints}p
                            </span>
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-sm ${
                                bWon
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {m.teamB.pointsWon}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            No recorded matches found yet.
          </p>
        )}

        {/* Bottom Back to League Table Button */}
        <div className="pt-3 border-t border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full @xl:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Back to League Table</span>
          </button>
        </div>
      </div>
    );
  }

  // MODE === 'next' (Next Games Fixtures + Voice & Easy Score Input)
  const readyToSaveCount = nextGameSession
    ? nextGameSession.fixtures.filter(
        (f) => !f.completed && f.teamAScore !== undefined && f.teamBScore !== undefined
      ).length
    : 0;

  return (
    <div className="rounded-3xl border-2 border-orange-500/40 bg-slate-900/95 p-3.5 @xl:p-6 shadow-2xl space-y-4 animate-in fade-in">
      {/* Top Back to League Table Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Back to League Table</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          title="Close Next Games"
          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col @xl:flex-row @xl:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm @xl:text-lg font-black text-white uppercase tracking-tight">
              Next Games — 20-Min Fixtures
            </h3>
            <p className="text-xs text-slate-400">
              {nextGameSession
                ? `${nextGameSession.fixtures.length} matches (${nextGameSession.durationPerRoundMinutes} mins each)`
                : 'Generate your next 20-minute round fixtures using Create Game'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {nextGameSession && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {!nextGameSession.date && (
                <span className="text-[10px] font-bold text-slate-400">Set Date:</span>
              )}
              <input
                type="date"
                value={nextGameSession.date}
                onChange={(e) => onUpdateNextSessionDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>
          )}

          {onOpenImportNextGames && (
            <button
              type="button"
              onClick={onOpenImportNextGames}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload CSV / Sheet</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateGame}
            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{nextGameSession ? 'Re-Create' : 'Create Game'}</span>
          </button>
        </div>
      </div>

      {!nextGameSession || nextGameSession.fixtures.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
          <Sparkles className="w-8 h-8 text-orange-400 mx-auto" />
          <h4 className="text-sm font-black text-white uppercase">
            No Upcoming Fixtures Generated Yet
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>Create Game</strong> to auto-generate smart 20-minute rounds, or <strong>Upload CSV / Google Sheet</strong> to import your next games directly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onOpenCreateGame}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Game (20-Min Rounds)</span>
            </button>

            {onOpenImportNextGames && (
              <button
                type="button"
                onClick={onOpenImportNextGames}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload CSV / Google Sheet</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Voice & Quick Dictation Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-950 to-sky-950/50 border border-indigo-500/30 space-y-2.5">
            <div className="flex flex-col @xl:flex-row @xl:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startVoiceCapture()}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow ${
                    listeningTarget === 'global'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                  }`}
                >
                  {listeningTarget === 'global' ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Voice Score</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-300">
                  Speak players & score, or tap <Mic className="w-3 h-3 inline text-sky-400" /> on a court!
                </span>
              </div>

              {readyToSaveCount > 0 && (
                <button
                  type="button"
                  onClick={() => onRecordAllScoredFixtures()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save All {readyToSaveCount} Score{readyToSaveCount > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>

            {/* Quick natural text / keyboard voice dictation fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickVoiceText.trim()) return;
                applyVoiceTranscript(quickVoiceText.trim());
                setQuickVoiceText('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={quickVoiceText}
                onChange={(e) => setQuickVoiceText(e.target.value)}
                placeholder='e.g. "Katie and Gabor 6 Olive and Anna 2"'
                className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold transition shrink-0"
              >
                Apply
              </button>
            </form>

            {voiceFeedback && (
              <p className="text-[11px] text-sky-300 font-medium bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                🎙️ {voiceFeedback}
              </p>
            )}
          </div>

          {/* Rounds & 20-Minute Court Cards */}
          {Array.from({ length: nextGameSession.roundsCount }, (_, i) => i + 1).map(
            (roundNum) => {
              const roundFixtures = nextGameSession.fixtures.filter(
                (f) => f.roundNumber === roundNum
              );
              const resting = nextGameSession.restingByRound[roundNum] || [];
              const timeSlot = roundFixtures[0]?.timeSlot || '';

              return (
                <div key={roundNum} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                      Round {roundNum} • {timeSlot} (20 mins)
                    </span>
                    {resting.length > 0 && (
                      <span className="text-[11px] text-amber-300">
                        Sit-out: {resting.map(getShortPlayerName).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-3">
                    {roundFixtures.map((fix) => {
                      const sA = fix.teamAScore;
                      const sB = fix.teamBScore;
                      const canSave = !fix.completed && sA !== undefined && sB !== undefined;

                      return (
                        <div
                          key={fix.id}
                          className={`p-3.5 rounded-2xl border space-y-2.5 transition ${
                            fix.completed
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : 'bg-slate-950/85 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-sky-400">
                              🏟️ {fix.courtName}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {fix.completed ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                                  ✓ Recorded
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startVoiceCapture(fix)}
                                  title="Speak score for this match (e.g. '6 to 2')"
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition ${
                                    listeningTarget === fix.id
                                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                                      : 'bg-slate-900 hover:bg-slate-800 text-sky-300 border-slate-700'
                                  }`}
                                >
                                  <Mic className="w-3 h-3" />
                                  <span>Voice</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Team A Stepper */}
                          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white truncate">
                                {getShortPlayerName(fix.teamA.player1)} &{' '}
                                {getShortPlayerName(fix.teamA.player2)}
                              </span>

                              <div className="flex items-center gap-1 shrink-0">
                                {!fix.completed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateFixtureDraftScore(
                                        fix.id,
                                        Math.max(0, (sA ?? 0) - 1),
                                        sB ?? 0
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                  >
                                    -
                                  </button>
                                )}
                                <span className="w-8 h-7 rounded-lg bg-slate-950 border border-sky-500/40 flex items-center justify-center font-mono font-black text-sm text-sky-300">
                                  {sA !== undefined ? sA : '–'}
                                </span>
                                {!fix.completed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateFixtureDraftScore(fix.id, (sA ?? 0) + 1, sB ?? 0)
                                    }
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                  >
                                    +
                                  </button>
                                )}
                              </div>
                            </div>

                            {!fix.completed && (
                              <div className="flex items-center gap-1 justify-end">
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() =>
                                      onUpdateFixtureDraftScore(fix.id, n, sB ?? 0)
                                    }
                                    className={`w-5 h-5 rounded text-[10px] font-mono font-bold transition ${
                                      sA === n
                                        ? 'bg-sky-500 text-slate-950 font-black'
                                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Team B Stepper */}
                          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white truncate">
                                {getShortPlayerName(fix.teamB.player1)} &{' '}
                                {getShortPlayerName(fix.teamB.player2)}
                              </span>

                              <div className="flex items-center gap-1 shrink-0">
                                {!fix.completed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateFixtureDraftScore(
                                        fix.id,
                                        sA ?? 0,
                                        Math.max(0, (sB ?? 0) - 1)
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                  >
                                    -
                                  </button>
                                )}
                                <span className="w-8 h-7 rounded-lg bg-slate-950 border border-orange-500/40 flex items-center justify-center font-mono font-black text-sm text-orange-300">
                                  {sB !== undefined ? sB : '–'}
                                </span>
                                {!fix.completed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateFixtureDraftScore(fix.id, sA ?? 0, (sB ?? 0) + 1)
                                    }
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
                                  >
                                    +
                                  </button>
                                )}
                              </div>
                            </div>

                            {!fix.completed && (
                              <div className="flex items-center gap-1 justify-end">
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() =>
                                      onUpdateFixtureDraftScore(fix.id, sA ?? 0, n)
                                    }
                                    className={`w-5 h-5 rounded text-[10px] font-mono font-bold transition ${
                                      sB === n
                                        ? 'bg-orange-500 text-slate-950 font-black'
                                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {canSave && (
                            <button
                              type="button"
                              onClick={() => onRecordSingleFixture(fix.id)}
                              className="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Save Match Score ({sA}-{sB})</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Bottom Back to League Table Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="w-full @xl:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>Back to League Table</span>
        </button>
      </div>
    </div>
  );
};
