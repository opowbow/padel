import { Player, ScheduledFixture } from '../types/padel';
import { getShortPlayerName } from './teamGenerator';

const SPOKEN_NUMBERS: Record<string, number> = {
  zero: 0,
  nil: 0,
  love: 0,
  none: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  for: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

// Common speech-to-text phonetic aliases for player names
const PHONETIC_ALIASES: Record<string, string[]> = {
  sooz: ['sooz', 'suze', 'susan', 'suzy', 'susie', 'shoes', 'zeus'],
  kristina: ['kristina', 'christina', 'kristine', 'christine'],
  alena: ['alena', 'elena', 'allena', 'alina'],
  nellie: ['nellie', 'nelly', 'neli'],
  annika: ['annika', 'anika', 'danica'],
  franny: ['franny', 'frannie', 'fran'],
  gabor: ['gabor', 'gabour', 'gaber'],
  katie: ['katie', 'katy', 'kate'],
  natalia: ['natalia', 'natalya', 'natalie'],
  fenton: ['fenton', 'finton', 'phantom'],
  olive: ['olive', 'olivia'],
  anna: ['anna', 'ana', 'hannah'],
};

function getTokensForPlayer(player: Player): string[] {
  const short = getShortPlayerName(player).toLowerCase();
  const baseTokens = [
    short,
    ...player.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && w !== 'the' && w !== 'and'),
  ];
  const aliases = PHONETIC_ALIASES[short] || [];
  return Array.from(new Set([...baseTokens, ...aliases]));
}

export function extractScoresFromTranscript(transcript: string): number[] {
  // Remove "court X" or "round X" numbers first so "Court 1: 6 to 2" doesn't treat 1 as a score
  const cleaned = transcript
    .toLowerCase()
    .replace(/\b(court|round|set|match|game)\s+(\d+|one|two|three|four)\b/g, ' ')
    .replace(/[-–:]/g, ' ');

  const words = cleaned.split(/[^a-z0-9]+/).filter(Boolean);
  const scores: number[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (/^\d+$/.test(w)) {
      const n = parseInt(w, 10);
      if (n >= 0 && n <= 30) {
        scores.push(n);
      }
      continue;
    }
    // Avoid treating "6 to 2" as [6, 2, 2] where "to" is between two numbers
    if ((w === 'to' || w === 'for') && scores.length === 1 && i + 1 < words.length) {
      const next = words[i + 1];
      if (/^\d+$/.test(next) || (SPOKEN_NUMBERS[next] !== undefined && next !== 'to' && next !== 'for')) {
        continue;
      }
    }
    if (SPOKEN_NUMBERS[w] !== undefined) {
      scores.push(SPOKEN_NUMBERS[w]);
    }
  }

  return scores;
}

export function parseFixtureVoiceScore(
  transcript: string,
  fixture: ScheduledFixture
): { teamAScore: number; teamBScore: number } | null {
  const lower = transcript.toLowerCase();
  const scores = extractScoresFromTranscript(transcript);
  if (scores.length < 2) return null;

  const teamATokens = [
    ...getTokensForPlayer(fixture.teamA.player1),
    ...getTokensForPlayer(fixture.teamA.player2),
  ];
  const teamBTokens = [
    ...getTokensForPlayer(fixture.teamB.player1),
    ...getTokensForPlayer(fixture.teamB.player2),
  ];

  const firstIndexOfAny = (tokens: string[]) => {
    let minIdx = Number.POSITIVE_INFINITY;
    for (const t of tokens) {
      const idx = lower.indexOf(t);
      if (idx !== -1 && idx < minIdx) minIdx = idx;
    }
    return minIdx;
  };

  const posA = firstIndexOfAny(teamATokens);
  const posB = firstIndexOfAny(teamBTokens);

  // If Team B was spoken before Team A (e.g. "Katie and Gabor 6, Olive and Anna 2"), flip order
  if (posB < posA) {
    return { teamAScore: scores[1], teamBScore: scores[0] };
  }

  return { teamAScore: scores[0], teamBScore: scores[1] };
}

export interface ParsedVoiceMatchResult {
  matchedPlayers: Player[];
  scores: number[];
  matchedFixture?: ScheduledFixture;
}

export function parseGeneralVoiceMatch(
  transcript: string,
  players: Player[],
  openFixtures: ScheduledFixture[] = []
): ParsedVoiceMatchResult {
  const lower = transcript.toLowerCase();
  const found: { player: Player; pos: number }[] = [];

  for (const player of players) {
    const tokens = getTokensForPlayer(player);
    let earliest = Number.POSITIVE_INFINITY;
    for (const token of tokens) {
      const regex = new RegExp(`\\b${token}\\b`, 'i');
      const match = regex.exec(lower);
      if (match && match.index < earliest) {
        earliest = match.index;
      }
    }
    if (earliest < Number.POSITIVE_INFINITY) {
      found.push({ player, pos: earliest });
    }
  }

  found.sort((a, b) => a.pos - b.pos);
  const matchedPlayers = found.map((f) => f.player);
  const scores = extractScoresFromTranscript(transcript);

  // Check if these players match an uncompleted fixture in Next Games
  let matchedFixture: ScheduledFixture | undefined;
  if (openFixtures.length > 0 && matchedPlayers.length >= 2) {
    const spokenIds = new Set(matchedPlayers.slice(0, 4).map((p) => p.id));
    let bestOverlap = 0;
    for (const fix of openFixtures) {
      if (fix.completed) continue;
      const fixIds = [
        fix.teamA.player1.id,
        fix.teamA.player2.id,
        fix.teamB.player1.id,
        fix.teamB.player2.id,
      ];
      const overlap = fixIds.filter((id) => spokenIds.has(id)).length;
      if (overlap > bestOverlap && overlap >= 2) {
        bestOverlap = overlap;
        matchedFixture = fix;
      }
    }
  }

  return {
    matchedPlayers: matchedPlayers.slice(0, 4),
    scores: scores.slice(0, 2),
    matchedFixture,
  };
}

export function isBrowserSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
