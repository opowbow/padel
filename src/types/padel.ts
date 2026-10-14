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
