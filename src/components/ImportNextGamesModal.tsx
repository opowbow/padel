import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Link2,
  ClipboardPaste,
  Download,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Player, RecordedMatch, NextGameSession } from '../types/padel';
import {
  parseSpreadsheetForNextGames,
  fetchGoogleSheetCsv,
  buildSampleFixturesCsv,
  buildSamplePlayersCsv,
  SpreadsheetParseResult,
} from '../utils/spreadsheetImport';
import { getShortPlayerName } from '../utils/teamGenerator';

type ImportSourceTab = 'csv-file' | 'google-sheet' | 'paste';

interface ImportNextGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: string;
  players: Player[];
  previousMatches: RecordedMatch[];
  defaultAlsoCreateBookings?: boolean;
  onImportSession: (params: {
    session: NextGameSession;
    newPlayers: Player[];
    alsoCreateCourtBookings: boolean;
  }) => void;
}

export const ImportNextGamesModal: React.FC<ImportNextGamesModalProps> = ({
  isOpen,
  onClose,
  leagueId,
  players,
  previousMatches,
  defaultAlsoCreateBookings = false,
  onImportSession,
}) => {
  const [activeSource, setActiveSource] = useState<ImportSourceTab>('csv-file');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const [rawLoadedText, setRawLoadedText] = useState('');
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideStartTime, setOverrideStartTime] = useState('18:00');
  const [roundsCount, setRoundsCount] = useState(4);
  const [alsoCreateBookings, setAlsoCreateBookings] = useState(
    defaultAlsoCreateBookings
  );

  const [parseResult, setParseResult] = useState<SpreadsheetParseResult | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const runParse = (
    text: string,
    opts?: {
      date?: string;
      startTime?: string;
      rounds?: number;
      preserveInferredDate?: boolean;
    }
  ) => {
    if (!text.trim()) {
      setParseResult(null);
      setErrorMessage('');
      return;
    }

    try {
      const nextDate = opts?.date !== undefined ? opts.date : overrideDate;
      const nextStart =
        opts?.startTime !== undefined ? opts.startTime : overrideStartTime;
      const nextRounds = opts?.rounds !== undefined ? opts.rounds : roundsCount;

      const res = parseSpreadsheetForNextGames({
        rawText: text,
        leagueId,
        existingPlayers: players,
        previousMatches,
        overrideDate: opts?.preserveInferredDate ? undefined : nextDate,
        overrideStartTime: opts?.preserveInferredDate ? undefined : nextStart,
        roundsCountForPlayerList: nextRounds,
        durationPerRoundMinutes: 20,
      });

      if (opts?.preserveInferredDate) {
        if (res.session.date) {
          setOverrideDate(res.session.date);
        }
        if (res.session.startTime) {
          setOverrideStartTime(res.session.startTime);
        }
      }

      setParseResult(res);
      setErrorMessage('');
    } catch (err) {
      setParseResult(null);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to parse spreadsheet content.'
      );
    }
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setErrorMessage('');
    setUploadedFileName(file.name);

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      setParseResult(null);
      setErrorMessage(
        'Binary Excel (.xlsx/.xls) detected. Please export/save as .csv, paste a Google Sheet link, or copy & paste the cells directly in the "Paste Cells" tab.'
      );
      return;
    }

    try {
      const text = await file.text();
      setRawLoadedText(text);
      runParse(text, { preserveInferredDate: true });
    } catch {
      setErrorMessage('Could not read the selected file.');
    }
  };

  const handleFetchGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setIsFetchingSheet(true);
    setErrorMessage('');

    try {
      const csv = await fetchGoogleSheetCsv(sheetUrl.trim());
      setRawLoadedText(csv);
      runParse(csv, { preserveInferredDate: true });
    } catch (err) {
      setParseResult(null);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not fetch Google Sheet content.'
      );
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleDownloadSample = (kind: 'fixtures' | 'players') => {
    const csvContent =
      kind === 'fixtures'
        ? buildSampleFixturesCsv(players)
        : buildSamplePlayersCsv(players);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      kind === 'fixtures'
        ? 'tuesslay-next-games-template.csv'
        : 'tuesslay-player-signup-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDateChange = (newDate: string) => {
    setOverrideDate(newDate);
    if (!rawLoadedText.trim()) return;
    if (parseResult && parseResult.mode === 'fixtures') {
      setParseResult({
        ...parseResult,
        session: {
          ...parseResult.session,
          date: newDate,
          fixtures: parseResult.session.fixtures.map((f) => ({
            ...f,
            date: newDate,
          })),
        },
      });
    } else {
      runParse(rawLoadedText, { date: newDate });
    }
  };

  const handleStartTimeChange = (newStart: string) => {
    setOverrideStartTime(newStart);
    if (rawLoadedText.trim()) {
      runParse(rawLoadedText, { startTime: newStart });
    }
  };

  const handleRoundsChange = (newRounds: number) => {
    setRoundsCount(newRounds);
    if (rawLoadedText.trim()) {
      runParse(rawLoadedText, { rounds: newRounds });
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.session.fixtures.length === 0) return;
    onImportSession({
      session: parseResult.session,
      newPlayers: parseResult.newPlayers,
      alsoCreateCourtBookings: alsoCreateBookings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-sky-950/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight truncate">
                Import Next Games (CSV or Google Sheet)
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Upload match fixtures or a player sign-up sheet directly into Next Games
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close Import Modal"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* Source Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveSource('csv-file');
                setErrorMessage('');
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSource === 'csv-file'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Upload CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSource('google-sheet');
                setErrorMessage('');
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSource === 'google-sheet'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Google Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSource('paste');
                setErrorMessage('');
              }}
              className={`py-2 px-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSource === 'paste'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Paste Cells</span>
            </button>
          </div>

          {/* TAB 1: CSV File Upload */}
          {activeSource === 'csv-file' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  handleFileSelected(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition space-y-2 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/15'
                    : 'border-slate-700 hover:border-emerald-400/70 bg-slate-950/60 hover:bg-slate-950/90'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  className="hidden"
                />
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-white">
                    {uploadedFileName
                      ? `Loaded: ${uploadedFileName}`
                      : 'Drop your .CSV file here or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports fixture schedules (Round, Time, Court, Players/Teams) or player sign-up lists
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="text-[11px] text-slate-400">
                  Need a ready-to-fill CSV template?
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('fixtures')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Fixtures CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('players')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Player Sign-Up Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Google Sheet URL */}
          {activeSource === 'google-sheet' && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <form
                onSubmit={handleFetchGoogleSheet}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  type="url"
                  required
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  disabled={isFetchingSheet || !sheetUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-sky-500/20 transition cursor-pointer"
                >
                  {isFetchingSheet ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Load Google Sheet</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
                <p>
                  • Paste any Google Sheets link (supports specific sheet tabs via{' '}
                  <code className="text-sky-300 font-mono">#gid=...</code>).
                </p>
                <p>
                  • In Google Sheets, set <strong>Share → Anyone with the link (Viewer)</strong> or{' '}
                  <strong>File → Share → Publish to web</strong>. For locked private sheets, copy the cells and use{' '}
                  <button
                    type="button"
                    onClick={() => setActiveSource('paste')}
                    className="text-orange-400 hover:underline font-bold cursor-pointer"
                  >
                    Paste Cells
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Paste Spreadsheet Cells / CSV */}
          {activeSource === 'paste' && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Paste Copied Google Sheet Cells or CSV Text
                </label>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText('');
                      setRawLoadedText('');
                      setParseResult(null);
                      setErrorMessage('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => {
                  const val = e.target.value;
                  setPastedText(val);
                  setRawLoadedText(val);
                  runParse(val, { preserveInferredDate: true });
                }}
                placeholder={`Round,Time,Court,Team A,Team B\nRound 1,18:00-18:20,Court 1,Olive & Anna,Katie & Gabor\nRound 1,18:00-18:20,Court 2,Natalia & Annika,Franny & Sooz`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-orange-400"
              />
            </div>
          )}

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-300">Could not import sheet</p>
                <p className="text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Parsed Result Controls & Live Preview */}
          {parseResult && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/35 border border-emerald-500/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-emerald-300">
                      {parseResult.summary}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-sky-300 border border-sky-500/30">
                    {parseResult.mode === 'fixtures'
                      ? 'Explicit Match Fixtures'
                      : 'Player Sign-Up Roster → Smart Teams'}
                  </span>
                </div>

                {parseResult.newPlayers.length > 0 && (
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-sky-200">
                    <UserPlus className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>+{parseResult.newPlayers.length} new player{parseResult.newPlayers.length > 1 ? 's' : ''}</strong>{' '}
                      will be added to the league roster:{' '}
                      <span className="text-white font-semibold">
                        {parseResult.newPlayers.map((p) => p.name).join(', ')}
                      </span>
                    </span>
                  </div>
                )}

                {parseResult.warnings.length > 0 && (
                  <div className="pt-1 space-y-0.5 text-[11px] text-amber-300">
                    {parseResult.warnings.slice(0, 3).map((w, i) => (
                      <p key={i}>⚠ {w}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Session Date / Start Time / Rounds Adjustments */}
              <div
                className={`grid grid-cols-1 ${
                  parseResult.mode === 'players' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                } gap-3`}
              >
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    Next Games Date
                  </label>
                  <input
                    type="date"
                    value={overrideDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={overrideStartTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                  />
                </div>

                {parseResult.mode === 'players' && (
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      20-Min Rounds
                    </label>
                    <select
                      value={roundsCount}
                      onChange={(e) => handleRoundsChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                    >
                      <option value={2}>2 Rounds (40m)</option>
                      <option value={3}>3 Rounds (60m)</option>
                      <option value={4}>4 Rounds (80m)</option>
                      <option value={5}>5 Rounds (100m)</option>
                      <option value={6}>6 Rounds (120m)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Optional Mixin Court Bookings Sync + Re-Shuffle for Player Roster */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoCreateBookings}
                    onChange={(e) => setAlsoCreateBookings(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                  />
                  <span>Also publish courts to Mixin Magic Court Bookings</span>
                </label>

                {parseResult.mode === 'players' && (
                  <button
                    type="button"
                    onClick={() => runParse(rawLoadedText)}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Shuffle Teams</span>
                  </button>
                )}
              </div>

              {/* Fixtures Preview */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Next Games Preview
                    {parseResult.session.date ? ` • ${parseResult.session.date}` : ''}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {parseResult.session.fixtures.length} matches
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {Array.from(
                    { length: parseResult.session.roundsCount },
                    (_, i) => i + 1
                  ).map((roundNum) => {
                    const roundFixtures = parseResult.session.fixtures.filter(
                      (f) => f.roundNumber === roundNum
                    );
                    const resting =
                      parseResult.session.restingByRound[roundNum] || [];
                    const roundTitle =
                      roundFixtures[0]?.roundLabel || `Round ${roundNum}`;
                    const slotLabel = roundFixtures[0]?.timeSlot || '';

                    return (
                      <div
                        key={roundNum}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-black text-white uppercase">
                            {roundTitle}{' '}
                            {slotLabel && (
                              <span className="text-sky-400 font-mono">
                                ({slotLabel})
                              </span>
                            )}
                          </span>
                          {resting.length > 0 && (
                            <span className="text-[11px] text-amber-300 font-medium">
                              Resting: {resting.map(getShortPlayerName).join(', ')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {roundFixtures.map((fix) => (
                            <div
                              key={fix.id}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-sky-400 font-bold">
                                  🏟️ {fix.courtName}
                                </span>
                                {fix.teamAScore !== undefined &&
                                fix.teamBScore !== undefined ? (
                                  <span className="text-emerald-400 font-bold">
                                    Draft: {fix.teamAScore}-{fix.teamBScore}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    {fix.durationMinutes}m
                                  </span>
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
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Imports directly into <strong>Next Games</strong> for live scoring & voice updates.
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.session.fixtures.length === 0}
              onClick={handleConfirmImport}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save to Next Games</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
