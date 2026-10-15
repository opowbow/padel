export type PlaySide = 'Left (Drive)' | 'Right (Revés)' | 'Both Sides';
export type DominantHand = 'Right' | 'Left';

export interface Player {
  id: string;
  name: string;
  email: string;
  avatar: string;
  rankingText: string;
  rankingScore: number; // Numeric equivalent (e.g., 3.5, 4.2) for calculations
  rankingType: 'preset' | 'manual';
  playSide: PlaySide;
  dominantHand: DominantHand;
  bio?: string;
  joinedDate: string;
  matchesPlayed: number;
  matchesWon: number;
  currentStreak: number;
  weeklyPointsGained: number;
  weeklyRankDelta: number;
}

export type GameFormat = 'Casual 4-Player' | 'League Ranked Match' | 'Americano' | 'Competitive Open';

export interface CourtSlot {
  player?: Player;
  team: 'A' | 'B';
  position: 'Left' | 'Right';
}

export interface PadelGame {
  id: string;
  courtName: string;
  location: string;
  isIndoor: boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  format: GameFormat;
  leagueId?: string; // Optional if linked to a league
  targetLevel: string; // e.g. "3.0 - 4.5"
  pricePerPlayer: number; // e.g. €12
  hostId: string;
  hostName: string;
  players: {
    slot1?: Player; // Team A - Left
    slot2?: Player; // Team A - Right
    slot3?: Player; // Team B - Left
    slot4?: Player; // Team B - Right
  };
  maxPlayers: 4;
  status: 'open' | 'full' | 'completed' | 'in-progress';
  notes?: string;
}

export interface ScoreBreakdown {
  basePoints: number;
  pointDiffBonus: number;
  opponentWeightBonus: number;
  partnerHandicapBonus: number;
  totalTeamAPoints: number;
  totalTeamBPoints: number;
  formulaExplanation: string[];
}

export interface RecordedMatch {
  id: string;
  gameId?: string;
  leagueId: string;
  date: string;
  courtName: string;
  teamA: {
    player1: Player;
    player2: Player;
    setsWon: number;
    pointsWon: number;
  };
  teamB: {
    player1: Player;
    player2: Player;
    setsWon: number;
    pointsWon: number;
  };
  setScores: string[]; // e.g. ["6-4", "3-6", "7-5"]
  winnerTeam: 'A' | 'B';
  weightedBonusApplied: boolean;
  scoringBreakdown: ScoreBreakdown;
}

export interface LeagueStanding {
  playerId: string;
  player: Player;
  played: number;
  won: number;
  lost: number;
  pointsWon: number; // Total games/points won across matches
  pointsLost: number; // Total games/points lost
  pointDiff: number;
  leaguePoints: number; // Total league ranking points
  form: ('W' | 'L')[]; // Last 5 results
  streak: number;
  rank: number;
}

export interface League {
  id: string;
  name: string;
  season: string;
  description: string;
  rules: string;
  isRegistered: boolean; // For current active player
  registeredPlayerIds: string[];
  matchesCount: number;
  activeUntil: string;
}

export interface WeeklyAward {
  weekNumber: number;
  year: number;
  player: Player;
  pointsGained: number;
  rankDelta: number;
  matchesPlayed: number;
  winRate: number;
  headline: string;
  commentary: string;
  badge: string;
}

export type MemberStatus = 'Active League Player' | 'Interested in Winter League' | 'Looking for Mixin Group' | 'Weekend Social';

export interface InterestedMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  rankingText: string;
  rankingScore: number;
  status: MemberStatus;
  preferredDays: string;
  notes?: string;
  joinedDate: string;
}

export type SignUpOption = 'mixin' | 'league' | 'both' | 'casual';

export interface SignUpOptionConfig {
  id: SignUpOption;
  label: string;
  badge: string;
  tagline: string;
  description: string;
  gradient: string;
  borderActive: string;
  memberStatus: MemberStatus;
  includesLeague: boolean;
  includesMixin: boolean;
}

export const SIGN_UP_OPTIONS: SignUpOptionConfig[] = [
  {
    id: 'mixin',
    label: 'Sign up for mixin',
    badge: 'Social & Americanos',
    tagline: 'Casual Sessions & Swaps',
    description: 'Get matched into fast-paced 4-player social games, partner rotations, and Americanos. Perfect for flexible play.',
    gradient: 'from-sky-500/15 via-blue-900/30 to-indigo-900/20',
    borderActive: 'border-sky-400 ring-2 ring-sky-400/40',
    memberStatus: 'Looking for Mixin Group',
    includesLeague: false,
    includesMixin: true,
  },
  {
    id: 'league',
    label: 'Sign up for League',
    badge: 'Championship Division',
    tagline: 'Winter Padel Slay League',
    description: 'Enter the official competitive ladder with points won/lost tracking, upset multipliers, and weekly leaderboard rankings.',
    gradient: 'from-orange-500/15 via-red-900/30 to-amber-900/20',
    borderActive: 'border-orange-400 ring-2 ring-orange-400/40',
    memberStatus: 'Active League Player',
    includesLeague: true,
    includesMixin: false,
  },
  {
    id: 'both',
    label: 'Sign up for both',
    badge: 'All-Access Pass • Most Popular',
    tagline: 'Mixin Magic + Winter League',
    description: 'Full all-access pass: play in daily Mixin Magic sessions and compete in the Winter Padel Slay League for maximum court action.',
    gradient: 'from-sky-500/20 via-blue-600/20 to-pink-500/20',
    borderActive: 'border-sky-400 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/20',
    memberStatus: 'Active League Player',
    includesLeague: true,
    includesMixin: true,
  },
  {
    id: 'casual',
    label: 'Sign up as casual member',
    badge: 'Community Roster',
    tagline: 'Weekend Social & Standby',
    description: 'Join the PadelSlay community directory for weekend drop-ins, socials, last-minute replacement spots, and club updates.',
    gradient: 'from-slate-800 via-slate-850 to-slate-900',
    borderActive: 'border-slate-400 ring-2 ring-slate-400/40',
    memberStatus: 'Weekend Social',
    includesLeague: false,
    includesMixin: false,
  },
];
