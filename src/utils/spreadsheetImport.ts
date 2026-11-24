import {
  Player,
  RecordedMatch,
  ScheduledFixture,
  NextGameSession,
} from '../types/padel';
import {
  buildMatchHistoryCounts,
  generateSmartGameSession,
  getShortPlayerName,
} from './teamGenerator';

export interface SpreadsheetParseResult {
  mode: 'fixtures' | 'players';
  session: NextGameSession;
  matchedPlayers: Player[];
  newPlayers: Player[];
  importedPlayersList?: Player[];
  warnings: string[];
  summary: string;
}

export interface ParseSpreadsheetParams {
  rawText: string;
  leagueId: string;
  existingPlayers: Player[];
  previousMatches: RecordedMatch[];
  overrideDate?: string;
  overrideStartTime?: string;
  roundsCountForPlayerList?: number;
  durationPerRoundMinutes?: number;
}

function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}::${id2}` : `${id2}::${id1}`;
}

function formatTimeRange(
  startTime: string,
  offsetMinutes: number,
  durationMinutes: number
): string {
  const [hhStr, mmStr] = (startTime || '18:00').split(':');
  const baseMinutes =
    parseInt(hhStr || '18', 10) * 60 + parseInt(mmStr || '0', 10);
  const startTotal = baseMinutes + offsetMinutes;
  const endTotal = startTotal + durationMinutes;

  const fmt = (mins: number) => {
    const normalized = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return `${fmt(startTotal)}–${fmt(endTotal)}`;
}

/**
 * Converts a Google Sheets browser/share/publish link into CSV export URLs.
 */
export function buildGoogleSheetCsvUrls(
  rawUrl: string
): { urls: string[] } | { error: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { error: 'Please paste a Google Sheets link.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      error:
        'Invalid URL. Paste a full https://docs.google.com/spreadsheets/... link.',
    };
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'docs.google.com') {
    return {
      error:
        'Please enter a Google Sheets URL starting with https://docs.google.com/spreadsheets/.',
    };
  }

  if (!parsed.pathname.startsWith('/spreadsheets/')) {
    return {
      error: 'URL must be a Google Sheets document (/spreadsheets/...).',
    };
  }

  let gid = parsed.searchParams.get('gid') || '';
  if (!gid && parsed.hash) {
    const hashMatch = /gid=(\d+)/.exec(parsed.hash);
    if (hashMatch) {
      gid = hashMatch[1];
    }
  }

  const pubMatch = /^\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/.exec(
    parsed.pathname
  );
  if (pubMatch) {
    const pubId = pubMatch[1];
    const params = new URLSearchParams();
    params.set('output', 'csv');
    if (gid) {
      params.set('gid', gid);
      params.set('single', 'true');
    }
    return {
      urls: [
        `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?${params.toString()}`,
      ],
    };
  }

  const sheetMatch = /^\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(
    parsed.pathname
  );
  if (sheetMatch) {
    const sheetId = sheetMatch[1];
    const gidSuffix = gid ? `&gid=${encodeURIComponent(gid)}` : '';
    return {
      urls: [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidSuffix}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidSuffix}`,
      ],
    };
  }

  return { error: 'Could not extract a Google Sheet ID from that link.' };
}

/**
 * Fetches CSV text from a Google Sheet URL via the local/Cloud Run server proxy
 * (falling back to direct browser fetch if running without the backend route).
 */
export async function fetchGoogleSheetCsv(rawUrl: string): Promise<string> {
  const check = buildGoogleSheetCsvUrls(rawUrl);
  if ('error' in check) {
    throw new Error(check.error);
  }

  // 1. Try backend proxy (/api/sheet-csv) to bypass CORS redirects cleanly
  try {
    const proxyRes = await fetch(
      `/api/sheet-csv?url=${encodeURIComponent(rawUrl.trim())}`,
      { cache: 'no-store' }
    );
    const contentType = (proxyRes.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      const payload = (await proxyRes.json()) as {
        ok?: boolean;
        csv?: string;
        error?: string;
      };
      if (proxyRes.ok && payload.csv) {
        return payload.csv;
      }
      if (payload.error) {
        throw new Error(payload.error);
      }
    }
  } catch (err) {
    // Re-throw explicit sheet permission / validation errors from proxy
    if (
      err instanceof Error &&
      (err.message.includes('Google Sheet') ||
        err.message.includes('Access denied') ||
        err.message.includes('private') ||
        err.message.includes('Invalid URL'))
    ) {
      throw err;
    }
  }

  // 2. Fallback: direct browser fetch
  for (const url of check.urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const text = await res.text();
      const head = text.trimStart().slice(0, 200).toLowerCase();
      if (head.startsWith('<!doctype html') || head.startsWith('<html')) {
        throw new Error(
          'This Google Sheet requires sign-in. Set sharing to "Anyone with the link (Viewer)" or File → Share → Publish to web, or copy & paste cells directly.'
        );
      }
      if (text.trim()) {
        return text;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Google Sheet')) {
        throw err;
      }
    }
  }

  throw new Error(
    'Could not load Google Sheet. Ensure General access is set to "Anyone with the link can view" (or Publish to web), or copy & paste the cells directly.'
  );
}

function detectDelimiter(text: string): string {
  const sampleLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);

  const candidates = ['\t', ',', ';'];
  let best = ',';
  let bestCount = 0;

  for (const delim of candidates) {
    let total = 0;
    for (const line of sampleLines) {
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (!inQuotes && ch === delim) {
          total++;
        }
      }
    }
    if (total > bestCount) {
      bestCount = total;
      best = delim;
    }
  }

  return best;
}

/**
 * RFC-4180 compliant delimited text parser supporting CSV, semicolon-CSV, and TSV.
 */
export function parseDelimitedText(rawText: string): string[][] {
  const cleaned = rawText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!cleaned.trim()) return [];

  const delimiter = detectDelimiter(cleaned);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (ch === '\n') {
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += ch;
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeDateString(raw: string): string {
  const val = raw.trim();
  if (!val) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }

  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(val);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const yyyy = slashMatch[3];
    // Prefer DD/MM/YYYY unless second number > 12 (MM/DD/YYYY)
    const day = p2 > 12 && p1 <= 12 ? p2 : p1;
    const month = p2 > 12 && p1 <= 12 ? p1 : p2;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${yyyy}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return '';
}

function normalizeTimeSlot(
  raw: string,
  roundNum: number,
  defaultStartTime: string,
  durationMinutes: number
): { timeSlot: string; inferredStartTime?: string } {
  const val = raw.trim();
  if (!val) {
    return {
      timeSlot: formatTimeRange(
        defaultStartTime,
        (roundNum - 1) * durationMinutes,
        durationMinutes
      ),
    };
  }

  // Range like "18:00-18:20" or "18:00 – 18:20"
  const rangeMatch = /^(\d{1,2}:\d{2})\s*[-–—to]+\s*(\d{1,2}:\d{2})$/i.exec(
    val
  );
  if (rangeMatch) {
    const padTime = (t: string) => {
      const [h, m] = t.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    };
    const start = padTime(rangeMatch[1]);
    const end = padTime(rangeMatch[2]);
    return { timeSlot: `${start}–${end}`, inferredStartTime: start };
  }

  // Single start time like "18:00" or "6:00"
  const singleMatch = /^(\d{1,2}):(\d{2})$/.exec(val);
  if (singleMatch) {
    const start = `${singleMatch[1].padStart(2, '0')}:${singleMatch[2]}`;
    return {
      timeSlot: formatTimeRange(start, 0, durationMinutes),
      inferredStartTime: start,
    };
  }

  return { timeSlot: val };
}

function normalizeCourtName(raw: string, fallbackIndex: number): string {
  const val = raw.trim();
  if (!val) return `Court ${fallbackIndex}`;
  if (/^\d+$/.test(val)) return `Court ${val}`;
  const cMatch = /^c(?:ourt)?\s*(\d+)$/i.exec(val);
  if (cMatch) return `Court ${cMatch[1]}`;
  return val;
}

function parseRoundCell(
  raw: string,
  fallbackRound: number
): { roundNumber: number; roundLabel: string } {
  const val = raw.trim();
  if (!val) {
    return { roundNumber: fallbackRound, roundLabel: `Round ${fallbackRound}` };
  }
  if (/^\d+$/.test(val)) {
    const n = Math.max(1, parseInt(val, 10));
    return { roundNumber: n, roundLabel: `Round ${n}` };
  }
  const rMatch = /^(?:round|rnd|r|game|set)\s*(\d+)$/i.exec(val);
  if (rMatch) {
    const n = Math.max(1, parseInt(rMatch[1], 10));
    return { roundNumber: n, roundLabel: `Round ${n}` };
  }
  const anyNum = /(\d+)/.exec(val);
  if (anyNum) {
    const n = Math.max(1, parseInt(anyNum[1], 10));
    return { roundNumber: n, roundLabel: val };
  }
  return { roundNumber: fallbackRound, roundLabel: val };
}

function splitPairNames(raw: string): [string, string] | null {
  const val = raw.trim();
  if (!val) return null;

  // Never split on '-' because nicknames use ' - ' (e.g. "Olive - fighting Irish - Power")
  const parts = val
    .split(/\s*(?:&|\/|\+|\band\b|,)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }
  return null;
}

function splitMatchupCell(raw: string): {
  a1: string;
  a2: string;
  b1: string;
  b2: string;
  scoreA?: number;
  scoreB?: number;
} | null {
  let val = raw.trim();
  if (!val) return null;

  let scoreA: number | undefined;
  let scoreB: number | undefined;

  // Check optional trailing score e.g. "(6-2)" or "[6-2]" or "6-2" at end
  const trailingScore = /(?:\(|\[|\s)(\d{1,2})\s*[-–:]\s*(\d{1,2})(?:\)|\])?\s*$/.exec(
    val
  );
  if (trailingScore) {
    scoreA = parseInt(trailingScore[1], 10);
    scoreB = parseInt(trailingScore[2], 10);
    val = val.slice(0, trailingScore.index).trim();
  }

  const sides = val.split(/\s+(?:vs\.?|v\.?|versus)\s+/i);
  if (sides.length !== 2) return null;

  const pairA = splitPairNames(sides[0]);
  const pairB = splitPairNames(sides[1]);
  if (!pairA || !pairB) return null;

  return {
    a1: pairA[0],
    a2: pairA[1],
    b1: pairB[0],
    b2: pairB[1],
    scoreA,
    scoreB,
  };
}

function parseCombinedScore(
  raw: string
): { scoreA?: number; scoreB?: number } {
  const val = raw.trim();
  if (!val) return {};
  const m = /^(\d{1,2})\s*[-–:/]\s*(\d{1,2})$/.exec(val);
  if (!m) return {};
  return {
    scoreA: parseInt(m[1], 10),
    scoreB: parseInt(m[2], 10),
  };
}

function parseOptionalScoreNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed || !/^\d{1,2}$/.test(trimmed)) return undefined;
  return parseInt(trimmed, 10);
}

class PlayerResolver {
  private existingPlayers: Player[];
  private matchedById = new Map<string, Player>();
  private createdByKey = new Map<string, Player>();
  private batchStamp = Date.now();

  constructor(existingPlayers: Player[]) {
    this.existingPlayers = existingPlayers;
  }

  resolve(rawName: string, skillScore = 4.0): Player | null {
    const cleaned = rawName.trim().replace(/^["']+|["']+$/g, '').trim();
    if (!cleaned) return null;

    const lower = cleaned.toLowerCase();

    // 1. Exact full name, short name, or email match
    for (const p of this.existingPlayers) {
      const short = getShortPlayerName(p).toLowerCase();
      if (
        p.name.toLowerCase() === lower ||
        short === lower ||
        p.email.toLowerCase() === lower
      ) {
        this.matchedById.set(p.id, p);
        return p;
      }
    }

    // 2. First + Last segment without middle nickname (e.g. "Olive Power" -> "Olive - fighting Irish - Power")
    for (const p of this.existingPlayers) {
      const segments = p.name
        .split(' - ')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (segments.length >= 2) {
        const firstLast = `${segments[0]} ${segments[segments.length - 1]}`;
        if (firstLast === lower) {
          this.matchedById.set(p.id, p);
          return p;
        }
      }
    }

    // 3. Unique first-word match if unambiguous
    const firstWordMatches = this.existingPlayers.filter((p) => {
      const firstWord = p.name.trim().split(/[\s-]+/)[0]?.toLowerCase();
      return firstWord === lower;
    });
    if (firstWordMatches.length === 1) {
      const matched = firstWordMatches[0];
      this.matchedById.set(matched.id, matched);
      return matched;
    }

    // 4. Reuse or create new player
    const existingNew = this.createdByKey.get(lower);
    if (existingNew) {
      return existingNew;
    }

    const boundedSkill = Math.max(1.0, Math.min(7.0, skillScore || 4.0));
    const slug =
      lower.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'player';

    const created: Player = {
      id: `p-csv-${this.batchStamp}-${this.createdByKey.size + 1}`,
      name: cleaned,
      email: `${slug}@playslay.io`,
      avatar: '',
      rankingText: `Level ${boundedSkill.toFixed(1)} - League Competitor`,
      rankingScore: boundedSkill,
      rankingType: 'preset',
      playSide: 'Both Sides',
      dominantHand: 'Right',
      bio: 'Imported into Winter Padel Slay League.',
      joinedDate: new Date().toISOString().split('T')[0],
      matchesPlayed: 0,
      matchesWon: 0,
      currentStreak: 0,
      weeklyPointsGained: 0,
      weeklyRankDelta: 0.0,
    };

    this.createdByKey.set(lower, created);
    return created;
  }

  getMatchedPlayers(): Player[] {
    return Array.from(this.matchedById.values());
  }

  getNewPlayers(): Player[] {
    return Array.from(this.createdByKey.values());
  }
}

interface RawFixtureCandidate {
  date?: string;
  roundRaw?: string;
  timeRaw?: string;
  durationRaw?: string;
  courtRaw?: string;
  a1: string;
  a2: string;
  b1: string;
  b2: string;
  scoreA?: number;
  scoreB?: number;
  restingRaw?: string;
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tryExtractFixturesFromTable(rows: string[][]): {
  candidates: RawFixtureCandidate[];
  warnings: string[];
} | null {
  if (rows.length === 0) return null;

  const firstRowNorm = rows[0].map(normalizeHeader);

  const findCol = (pred: (h: string, idx: number) => boolean): number =>
    firstRowNorm.findIndex(pred);

  const roundCol = findCol((h) =>
    ['round', 'rnd', 'round number', 'round label'].includes(h)
  );
  const dateCol = findCol((h) =>
    ['date', 'match date', 'game date', 'session date', 'day'].includes(h)
  );
  const timeCol = findCol((h) =>
    ['time', 'time slot', 'timeslot', 'slot', 'start time', 'start'].includes(h)
  );
  const durationCol = findCol((h) =>
    ['duration', 'duration minutes', 'minutes', 'mins'].includes(h)
  );
  const courtCol = findCol((h) =>
    ['court', 'court name', 'court number', 'arena', 'pitch'].includes(h)
  );
  const restingCol = findCol((h) =>
    ['resting', 'sit out', 'sitout', 'bye', 'byes', 'bench'].includes(h)
  );

  // Check for Court Matrix layout: columns named "Court 1", "Court 2", "Court 3"...
  const courtMatrixCols: { colIdx: number; courtLabel: string }[] = [];
  rows[0].forEach((rawHeader, idx) => {
    const m = /^court\s*(\d+.*)$/i.exec(rawHeader.trim());
    if (m) {
      courtMatrixCols.push({ colIdx: idx, courtLabel: rawHeader.trim() });
    }
  });

  if (courtMatrixCols.length >= 1 && rows.length >= 2) {
    const candidates: RawFixtureCandidate[] = [];
    const warnings: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      for (const cm of courtMatrixCols) {
        const cell = row[cm.colIdx] || '';
        if (!cell.trim()) continue;
        const parsedMatchup = splitMatchupCell(cell);
        if (parsedMatchup) {
          candidates.push({
            date: dateCol >= 0 ? row[dateCol] : undefined,
            roundRaw: roundCol >= 0 ? row[roundCol] : String(r),
            timeRaw: timeCol >= 0 ? row[timeCol] : undefined,
            durationRaw: durationCol >= 0 ? row[durationCol] : undefined,
            courtRaw: cm.courtLabel,
            a1: parsedMatchup.a1,
            a2: parsedMatchup.a2,
            b1: parsedMatchup.b1,
            b2: parsedMatchup.b2,
            scoreA: parsedMatchup.scoreA,
            scoreB: parsedMatchup.scoreB,
            restingRaw: restingCol >= 0 ? row[restingCol] : undefined,
          });
        } else {
          warnings.push(
            `Row ${r + 1} (${cm.courtLabel}): Could not parse matchup "${cell}" (expected "Player 1 & Player 2 vs Player 3 & Player 4").`
          );
        }
      }
    }

    if (candidates.length > 0) {
      return { candidates, warnings };
    }
  }

  // Check for 4 separate player columns
  const a1Col = findCol((h) =>
    [
      'team a player 1',
      'team 1 player 1',
      'teama player1',
      'team a p1',
      'a1',
      'p1',
      'player 1',
      'player1',
      'team a 1',
      'pair 1 player 1',
    ].includes(h)
  );
  const a2Col = findCol((h) =>
    [
      'team a player 2',
      'team 1 player 2',
      'teama player2',
      'team a p2',
      'a2',
      'p2',
      'player 2',
      'player2',
      'team a 2',
      'pair 1 player 2',
    ].includes(h)
  );
  const b1Col = findCol((h) =>
    [
      'team b player 1',
      'team 2 player 1',
      'teamb player1',
      'team b p1',
      'b1',
      'p3',
      'player 3',
      'player3',
      'team b 1',
      'pair 2 player 1',
    ].includes(h)
  );
  const b2Col = findCol((h) =>
    [
      'team b player 2',
      'team 2 player 2',
      'teamb player2',
      'team b p2',
      'b2',
      'p4',
      'player 4',
      'player4',
      'team b 2',
      'pair 2 player 2',
    ].includes(h)
  );

  // Check for 2 pair columns
  const teamACol = findCol((h) =>
    ['team a', 'team 1', 'teama', 'team1', 'pair a', 'pair 1', 'side a', 'home'].includes(
      h
    )
  );
  const teamBCol = findCol((h) =>
    [
      'team b',
      'team 2',
      'teamb',
      'team2',
      'pair b',
      'pair 2',
      'side b',
      'away',
      'opponents',
    ].includes(h)
  );

  // Check for 1 combined matchup column
  const matchupCol = findCol((h) =>
    ['match', 'matchup', 'fixture', 'fixtures', 'teams', 'game', 'players'].includes(
      h
    )
  );

  const scoreACol = findCol((h) =>
    [
      'score a',
      'team a score',
      'team 1 score',
      'pts a',
      'points a',
      'games a',
      'score 1',
    ].includes(h)
  );
  const scoreBCol = findCol((h) =>
    [
      'score b',
      'team b score',
      'team 2 score',
      'pts b',
      'points b',
      'games b',
      'score 2',
    ].includes(h)
  );
  const combinedScoreCol = findCol((h) => ['score', 'result', 'scores'].includes(h));

  const has4PlayerHeaders = a1Col >= 0 && a2Col >= 0 && b1Col >= 0 && b2Col >= 0;
  const has2TeamHeaders = teamACol >= 0 && teamBCol >= 0;
  const hasMatchupHeader = matchupCol >= 0;

  if (has4PlayerHeaders || has2TeamHeaders || hasMatchupHeader) {
    const candidates: RawFixtureCandidate[] = [];
    const warnings: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      let a1 = '';
      let a2 = '';
      let b1 = '';
      let b2 = '';
      let scoreA =
        scoreACol >= 0 ? parseOptionalScoreNumber(row[scoreACol]) : undefined;
      let scoreB =
        scoreBCol >= 0 ? parseOptionalScoreNumber(row[scoreBCol]) : undefined;

      if (combinedScoreCol >= 0 && scoreA === undefined && scoreB === undefined) {
        const comb = parseCombinedScore(row[combinedScoreCol] || '');
        scoreA = comb.scoreA;
        scoreB = comb.scoreB;
      }

      if (has4PlayerHeaders) {
        a1 = (row[a1Col] || '').trim();
        a2 = (row[a2Col] || '').trim();
        b1 = (row[b1Col] || '').trim();
        b2 = (row[b2Col] || '').trim();
      } else if (has2TeamHeaders) {
        const pA = splitPairNames(row[teamACol] || '');
        const pB = splitPairNames(row[teamBCol] || '');
        if (!pA || !pB) {
          warnings.push(
            `Row ${r + 1}: Expected two players per team separated by "&" or "/" (got "${row[teamACol] || ''}" vs "${row[teamBCol] || ''}").`
          );
          continue;
        }
        [a1, a2] = pA;
        [b1, b2] = pB;
      } else if (hasMatchupHeader) {
        const m = splitMatchupCell(row[matchupCol] || '');
        if (!m) {
          warnings.push(
            `Row ${r + 1}: Expected matchup like "Player 1 & Player 2 vs Player 3 & Player 4".`
          );
          continue;
        }
        a1 = m.a1;
        a2 = m.a2;
        b1 = m.b1;
        b2 = m.b2;
        if (scoreA === undefined && m.scoreA !== undefined) scoreA = m.scoreA;
        if (scoreB === undefined && m.scoreB !== undefined) scoreB = m.scoreB;
      }

      if (!a1 || !a2 || !b1 || !b2) {
        if (a1 || a2 || b1 || b2) {
          warnings.push(`Row ${r + 1}: Skipped incomplete match (needs 4 players).`);
        }
        continue;
      }

      candidates.push({
        date: dateCol >= 0 ? row[dateCol] : undefined,
        roundRaw: roundCol >= 0 ? row[roundCol] : undefined,
        timeRaw: timeCol >= 0 ? row[timeCol] : undefined,
        durationRaw: durationCol >= 0 ? row[durationCol] : undefined,
        courtRaw: courtCol >= 0 ? row[courtCol] : undefined,
        a1,
        a2,
        b1,
        b2,
        scoreA,
        scoreB,
        restingRaw: restingCol >= 0 ? row[restingCol] : undefined,
      });
    }

    if (candidates.length > 0) {
      return { candidates, warnings };
    }
  }

  // Fallback: Headerless / Sectioned fixture rows!
  // Supports e.g.:
  // - Section line: "Round 1, 18:00-18:20"
  // - Row: "Court 1, Olive & Anna, Katie & Gabor"
  // - Row: "Round 1, 18:00-18:20, Court 1, Olive, Anna, Katie, Gabor"
  const headerlessCandidates: RawFixtureCandidate[] = [];
  let activeRoundContext = '';
  let activeTimeContext = '';
  let activeDateContext = '';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r].map((c) => c.trim()).filter(Boolean);
    if (row.length === 0) continue;

    // Check if single-cell or two-cell round header row
    if (row.length <= 2) {
      const joined = row.join(' ');
      const rMatch = /\b(round\s*\d+)\b/i.exec(joined);
      const tMatch = /(\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?)/.exec(joined);
      const dMatch = /(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4})/.exec(joined);
      if (rMatch) activeRoundContext = rMatch[1];
      if (tMatch) activeTimeContext = tMatch[1];
      if (dMatch) activeDateContext = dMatch[1];
      if (rMatch || tMatch) continue;
    }

    // Check if any cell in the row is a full "A & B vs C & D" matchup
    const matchupIdx = row.findIndex((c) => splitMatchupCell(c) !== null);
    if (matchupIdx >= 0) {
      const m = splitMatchupCell(row[matchupIdx])!;
      const otherCells = row.filter((_, i) => i !== matchupIdx);
      const courtCell = otherCells.find((c) => /^c(?:ourt)?\s*\d+/i.test(c));
      const roundCell = otherCells.find((c) => /^r(?:ound|nd)?\s*\d+/i.test(c));
      const timeCell = otherCells.find((c) => /\d{1,2}:\d{2}/.test(c));
      const dateCell = otherCells.find((c) => normalizeDateString(c) !== '');

      headerlessCandidates.push({
        date: dateCell || activeDateContext || undefined,
        roundRaw: roundCell || activeRoundContext || undefined,
        timeRaw: timeCell || activeTimeContext || undefined,
        courtRaw: courtCell,
        a1: m.a1,
        a2: m.a2,
        b1: m.b1,
        b2: m.b2,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
      });
      continue;
    }

    // Check if two cells in the row are pair strings ("Olive & Anna", "Katie & Gabor")
    const pairIndices: number[] = [];
    row.forEach((c, idx) => {
      if (
        !/^(?:vs\.?|v\.?)$/i.test(c) &&
        !/^round\s*\d+/i.test(c) &&
        !/^court\s*\d+/i.test(c) &&
        splitPairNames(c) !== null
      ) {
        pairIndices.push(idx);
      }
    });
    if (pairIndices.length >= 2) {
      const pA = splitPairNames(row[pairIndices[0]])!;
      const pB = splitPairNames(row[pairIndices[1]])!;
      const otherCells = row.filter(
        (_, i) => i !== pairIndices[0] && i !== pairIndices[1]
      );
      const courtCell = otherCells.find((c) => /^c(?:ourt)?\s*\d+/i.test(c));
      const roundCell = otherCells.find((c) => /^r(?:ound|nd)?\s*\d+/i.test(c));
      const timeCell = otherCells.find((c) => /\d{1,2}:\d{2}/.test(c));
      const dateCell = otherCells.find((c) => normalizeDateString(c) !== '');

      headerlessCandidates.push({
        date: dateCell || activeDateContext || undefined,
        roundRaw: roundCell || activeRoundContext || undefined,
        timeRaw: timeCell || activeTimeContext || undefined,
        courtRaw: courtCell,
        a1: pA[0],
        a2: pA[1],
        b1: pB[0],
        b2: pB[1],
      });
      continue;
    }

    // Check if headerless 7+ column row: [Round, Time, Court, P1, P2, P3, P4, ScoreA?, ScoreB?]
    if (row.length >= 5) {
      let cursor = 0;
      let dateRaw = activeDateContext;
      let roundRaw = activeRoundContext;
      let timeRaw = activeTimeContext;
      let courtRaw = '';

      while (cursor < row.length - 4) {
        const cell = row[cursor];
        if (normalizeDateString(cell)) {
          dateRaw = cell;
          cursor++;
        } else if (/^(?:round|rnd|r)\s*\d+$/i.test(cell)) {
          roundRaw = cell;
          cursor++;
        } else if (/\d{1,2}:\d{2}/.test(cell)) {
          timeRaw = cell;
          cursor++;
        } else if (/^c(?:ourt)?\s*\d+/i.test(cell)) {
          courtRaw = cell;
          cursor++;
        } else {
          break;
        }
      }

      if (row.length - cursor >= 4 && (roundRaw || courtRaw || timeRaw)) {
        const [a1, a2, b1, b2] = row.slice(cursor, cursor + 4);
        const sA = parseOptionalScoreNumber(row[cursor + 4]);
        const sB = parseOptionalScoreNumber(row[cursor + 5]);
        headerlessCandidates.push({
          date: dateRaw || undefined,
          roundRaw: roundRaw || undefined,
          timeRaw: timeRaw || undefined,
          courtRaw: courtRaw || undefined,
          a1,
          a2,
          b1,
          b2,
          scoreA: sA,
          scoreB: sB,
        });
      }
    }
  }

  if (headerlessCandidates.length > 0) {
    return { candidates: headerlessCandidates, warnings: [] };
  }

  return null;
}

function tryExtractPlayerRosterList(
  rows: string[][],
  resolver: PlayerResolver
): { players: Player[]; warnings: string[]; inferredDate?: string } | null {
  if (rows.length === 0) return null;

  const firstRowNorm = rows[0].map(normalizeHeader);
  const nameCol = firstRowNorm.findIndex((h) =>
    [
      'name',
      'player',
      'player name',
      'players',
      'full name',
      'member',
      'nickname',
      'participant',
    ].includes(h)
  );
  const skillCol = firstRowNorm.findIndex((h) =>
    ['skill', 'level', 'rating', 'ranking', 'score', 'skill level'].includes(h)
  );
  const statusCol = firstRowNorm.findIndex((h) =>
    [
      'playing',
      'attending',
      'status',
      'available',
      'in',
      'rsvp',
      'confirmed',
      'playing next tuesday',
    ].includes(h)
  );
  const dateCol = firstRowNorm.findIndex((h) =>
    ['date', 'match date', 'session date'].includes(h)
  );

  const hasHeader = nameCol >= 0;
  const startRow = hasHeader ? 1 : 0;
  const targetNameCol = hasHeader ? nameCol : 0;

  // Avoid misclassifying wide unknown tables unless there is an explicit Name/Player column or 1-3 simple columns
  if (!hasHeader && rows[0].length > 3) {
    return null;
  }

  const resolvedList: Player[] = [];
  const seenIds = new Set<string>();
  const warnings: string[] = [];
  let inferredDate: string | undefined;

  const declinedTokens = new Set([
    'no',
    'n',
    'false',
    '0',
    'out',
    'absent',
    'cancelled',
    'canceled',
    'declined',
    'waitlist',
  ]);

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    const rawName = (row[targetNameCol] || '').trim();
    if (!rawName) continue;

    // Skip accidental header-like first row in headerless check
    if (
      r === 0 &&
      !hasHeader &&
      ['player', 'name', 'players', 'roster'].includes(rawName.toLowerCase())
    ) {
      continue;
    }

    if (statusCol >= 0) {
      const statusVal = (row[statusCol] || '').trim().toLowerCase();
      if (statusVal && declinedTokens.has(statusVal)) {
        continue;
      }
    }

    if (dateCol >= 0 && !inferredDate && row[dateCol]) {
      const d = normalizeDateString(row[dateCol]);
      if (d) inferredDate = d;
    }

    let skill = 4.0;
    if (skillCol >= 0 && row[skillCol]) {
      const parsedSkill = parseFloat(row[skillCol]);
      if (!Number.isNaN(parsedSkill) && parsedSkill >= 1 && parsedSkill <= 7) {
        skill = parsedSkill;
      }
    }

    const player = resolver.resolve(rawName, skill);
    if (player && !seenIds.has(player.id)) {
      seenIds.add(player.id);
      resolvedList.push(player);
    }
  }

  if (resolvedList.length >= 4) {
    return { players: resolvedList, warnings, inferredDate };
  }

  if (resolvedList.length > 0 && resolvedList.length < 4) {
    throw new Error(
      `Found only ${resolvedList.length} player(s) in the sheet (${resolvedList.map((p) => p.name).join(', ')}). At least 4 players are needed for Next Games.`
    );
  }

  return null;
}

export function parseSpreadsheetForNextGames(
  params: ParseSpreadsheetParams
): SpreadsheetParseResult {
  const {
    rawText,
    leagueId,
    existingPlayers,
    previousMatches,
    overrideDate,
    overrideStartTime,
    roundsCountForPlayerList = 4,
    durationPerRoundMinutes = 20,
  } = params;

  const rows = parseDelimitedText(rawText);
  if (rows.length === 0) {
    throw new Error('The uploaded CSV / Google Sheet is empty.');
  }

  const resolver = new PlayerResolver(existingPlayers);

  // 1. Try Fixture Schedule mode first
  const fixtureExtraction = tryExtractFixturesFromTable(rows);
  if (fixtureExtraction && fixtureExtraction.candidates.length > 0) {
    const { candidates, warnings } = fixtureExtraction;
    const { partnerCounts: histPartners } =
      buildMatchHistoryCounts(previousMatches);
    const sessionPartners = new Map<string, number>();

    let inferredDate = '';
    for (const c of candidates) {
      if (c.date) {
        const norm = normalizeDateString(c.date);
        if (norm) {
          inferredDate = norm;
          break;
        }
      }
    }

    const finalDate =
      overrideDate !== undefined && overrideDate !== ''
        ? overrideDate
        : inferredDate;
    let inferredStart = overrideStartTime || '18:00';

    const sessionId = `session-${finalDate || 'imported'}-${Date.now()}`;
    const fixtures: ScheduledFixture[] = [];
    const explicitRestingByRound: { [roundNum: number]: Player[] } = {};
    const allParticipantMap = new Map<string, Player>();

    // Group or assign round numbers cleanly
    // If roundRaw is omitted on all rows, group every 3 courts (or sequential courts) into rounds if Court resets, else Round 1
    let currentAutoRound = 1;
    const seenCourtsInAutoRound = new Set<string>();

    candidates.forEach((cand, idx) => {
      let roundNumber = 1;
      let roundLabel = 'Round 1';

      if (cand.roundRaw) {
        const parsedRound = parseRoundCell(cand.roundRaw, currentAutoRound);
        roundNumber = parsedRound.roundNumber;
        roundLabel = parsedRound.roundLabel;
        currentAutoRound = roundNumber;
      } else {
        const normCourtKey = cand.courtRaw
          ? normalizeCourtName(cand.courtRaw, 1).toLowerCase()
          : '';
        if (normCourtKey && seenCourtsInAutoRound.has(normCourtKey)) {
          currentAutoRound++;
          seenCourtsInAutoRound.clear();
        }
        if (normCourtKey) {
          seenCourtsInAutoRound.add(normCourtKey);
        }
        roundNumber = currentAutoRound;
        roundLabel = `Round ${roundNumber}`;
      }

      const pA1 = resolver.resolve(cand.a1);
      const pA2 = resolver.resolve(cand.a2);
      const pB1 = resolver.resolve(cand.b1);
      const pB2 = resolver.resolve(cand.b2);

      if (!pA1 || !pA2 || !pB1 || !pB2) {
        warnings.push(`Fixture #${idx + 1}: Skipped due to missing player name.`);
        return;
      }

      for (const p of [pA1, pA2, pB1, pB2]) {
        allParticipantMap.set(p.id, p);
      }

      if (cand.restingRaw) {
        const restNames = cand.restingRaw
          .split(/\s*(?:,|&|\/|\+|;)\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
        const existingRest = explicitRestingByRound[roundNumber] || [];
        for (const rn of restNames) {
          const rp = resolver.resolve(rn);
          if (rp) {
            allParticipantMap.set(rp.id, rp);
            if (!existingRest.some((x) => x.id === rp.id)) {
              existingRest.push(rp);
            }
          }
        }
        explicitRestingByRound[roundNumber] = existingRest;
      }

      const dur =
        cand.durationRaw && /^\d+$/.test(cand.durationRaw.trim())
          ? Math.max(5, parseInt(cand.durationRaw.trim(), 10))
          : durationPerRoundMinutes;

      const courtsAlreadyInRound = fixtures.filter(
        (f) => f.roundNumber === roundNumber
      ).length;
      const courtName = normalizeCourtName(
        cand.courtRaw || '',
        courtsAlreadyInRound + 1
      );

      const timeInfo = normalizeTimeSlot(
        cand.timeRaw || '',
        roundNumber,
        inferredStart,
        dur
      );
      if (idx === 0 && timeInfo.inferredStartTime && !overrideStartTime) {
        inferredStart = timeInfo.inferredStartTime;
      }

      const pkA = pairKey(pA1.id, pA2.id);
      const pkB = pairKey(pB1.id, pB2.id);
      const prevA =
        (histPartners.get(pkA) || 0) + (sessionPartners.get(pkA) || 0);
      const prevB =
        (histPartners.get(pkB) || 0) + (sessionPartners.get(pkB) || 0);
      sessionPartners.set(pkA, (sessionPartners.get(pkA) || 0) + 1);
      sessionPartners.set(pkB, (sessionPartners.get(pkB) || 0) + 1);

      fixtures.push({
        id: `fix-${sessionId}-r${roundNumber}-c${courtsAlreadyInRound + 1}-${idx}`,
        sessionId,
        leagueId,
        date: finalDate,
        roundNumber,
        roundLabel,
        timeSlot: timeInfo.timeSlot,
        durationMinutes: dur,
        courtName,
        teamA: { player1: pA1, player2: pA2 },
        teamB: { player1: pB1, player2: pB2 },
        teamAScore: cand.scoreA,
        teamBScore: cand.scoreB,
        completed: false,
        previousPartnerCountA: prevA,
        previousPartnerCountB: prevB,
      });
    });

    if (fixtures.length === 0) {
      throw new Error(
        'No valid 4-player fixtures could be parsed from the sheet.'
      );
    }

    // Normalize roundNumbers to sequential 1..N if sparse while preserving roundLabels
    const distinctRoundNums = Array.from(
      new Set(fixtures.map((f) => f.roundNumber))
    ).sort((a, b) => a - b);
    const roundNumRemap = new Map<number, number>();
    distinctRoundNums.forEach((orig, i) => roundNumRemap.set(orig, i + 1));

    const normalizedFixtures = fixtures.map((f) => ({
      ...f,
      roundNumber: roundNumRemap.get(f.roundNumber) || f.roundNumber,
    }));

    const roundsCount = distinctRoundNums.length;
    const allParticipants = Array.from(allParticipantMap.values());
    const restingByRound: { [roundNumber: number]: Player[] } = {};

    for (let r = 1; r <= roundsCount; r++) {
      const origRound = distinctRoundNums[r - 1];
      const activeIdsInRound = new Set<string>();
      normalizedFixtures
        .filter((f) => f.roundNumber === r)
        .forEach((f) => {
          activeIdsInRound.add(f.teamA.player1.id);
          activeIdsInRound.add(f.teamA.player2.id);
          activeIdsInRound.add(f.teamB.player1.id);
          activeIdsInRound.add(f.teamB.player2.id);
        });

      const explicitRest = explicitRestingByRound[origRound] || [];
      const inferredRest = allParticipants.filter(
        (p) => !activeIdsInRound.has(p.id)
      );
      const mergedMap = new Map<string, Player>();
      for (const p of [...explicitRest, ...inferredRest]) {
        if (!activeIdsInRound.has(p.id)) {
          mergedMap.set(p.id, p);
        }
      }
      restingByRound[r] = Array.from(mergedMap.values());
    }

    const session: NextGameSession = {
      id: sessionId,
      leagueId,
      date: finalDate,
      startTime: overrideStartTime || inferredStart,
      durationPerRoundMinutes,
      roundsCount,
      selectedPlayerIds: allParticipants.map((p) => p.id),
      restingByRound,
      fixtures: normalizedFixtures,
      createdAt: new Date().toISOString(),
    };

    const matchedPlayers = resolver.getMatchedPlayers();
    const newPlayers = resolver.getNewPlayers();

    return {
      mode: 'fixtures',
      session,
      matchedPlayers,
      newPlayers,
      warnings,
      summary: `Parsed ${normalizedFixtures.length} match${normalizedFixtures.length === 1 ? '' : 'es'} across ${roundsCount} round${roundsCount === 1 ? '' : 's'} (${allParticipants.length} players).`,
    };
  }

  // 2. Try Player Roster / Sign-Up List mode
  const rosterExtraction = tryExtractPlayerRosterList(rows, resolver);
  if (rosterExtraction) {
    const finalDate =
      overrideDate !== undefined && overrideDate !== ''
        ? overrideDate
        : rosterExtraction.inferredDate || '';
    const finalStart = overrideStartTime || '18:00';

    const session = generateSmartGameSession({
      leagueId,
      date: finalDate,
      startTime: finalStart,
      roundsCount: roundsCountForPlayerList,
      durationPerRoundMinutes,
      selectedPlayers: rosterExtraction.players,
      previousMatches,
    });

    const matchedPlayers = resolver.getMatchedPlayers();
    const newPlayers = resolver.getNewPlayers();

    return {
      mode: 'players',
      session,
      matchedPlayers,
      newPlayers,
      importedPlayersList: rosterExtraction.players,
      warnings: rosterExtraction.warnings,
      summary: `Imported ${rosterExtraction.players.length} players & generated ${session.fixtures.length} smart 20-min fixtures across ${session.roundsCount} rounds.`,
    };
  }

  throw new Error(
    'Unrecognized CSV / Google Sheet layout. Include columns like "Round, Time, Court, Team A Player 1, Team A Player 2, Team B Player 1, Team B Player 2" (or "Team A, Team B", or a "Player" sign-up column with at least 4 players).'
  );
}

export function buildSampleFixturesCsv(players: Player[]): string {
  const names = players.slice(0, 8).map(getShortPlayerName);
  while (names.length < 8) {
    names.push(`Player ${names.length + 1}`);
  }

  const lines = [
    'Date,Round,Time,Court,Team A Player 1,Team A Player 2,Team B Player 1,Team B Player 2',
    `2026-12-01,Round 1,18:00-18:20,Court 1,"${names[0]}","${names[1]}","${names[2]}","${names[3]}"`,
    `2026-12-01,Round 1,18:00-18:20,Court 2,"${names[4]}","${names[5]}","${names[6]}","${names[7]}"`,
    `2026-12-01,Round 2,18:20-18:40,Court 1,"${names[0]}","${names[2]}","${names[4]}","${names[6]}"`,
    `2026-12-01,Round 2,18:20-18:40,Court 2,"${names[1]}","${names[3]}","${names[5]}","${names[7]}"`,
  ];
  return lines.join('\n');
}

export function buildSamplePlayersCsv(players: Player[]): string {
  const sample = players.slice(0, 8);
  const lines = ['Player,Level,Playing'];
  if (sample.length >= 4) {
    for (const p of sample) {
      lines.push(`"${getShortPlayerName(p)}",${p.rankingScore.toFixed(1)},Yes`);
    }
  } else {
    lines.push('Katie,4.0,Yes', 'Fenton,4.0,Yes', 'Olive,4.0,Yes', 'Anna,4.0,Yes');
  }
  return lines.join('\n');
}
