import { Player, RecordedMatch, ScheduledFixture, NextGameSession } from '../types/padel';

function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}::${id2}` : `${id2}::${id1}`;
}

export function getShortPlayerName(player: Player): string {
  // Handle nicknames formatted like "Franny - the OG - JZ" -> "Franny"
  const dashSplit = player.name.split(' - ');
  if (dashSplit.length > 1) {
    return dashSplit[0].trim();
  }
  return player.name.trim();
}

export function buildMatchHistoryCounts(matches: RecordedMatch[]) {
  const partnerCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();

  for (const m of matches) {
    const a1 = m.teamA.player1.id;
    const a2 = m.teamA.player2.id;
    const b1 = m.teamB.player1.id;
    const b2 = m.teamB.player2.id;

    const pKeyA = pairKey(a1, a2);
    const pKeyB = pairKey(b1, b2);
    partnerCounts.set(pKeyA, (partnerCounts.get(pKeyA) || 0) + 1);
    partnerCounts.set(pKeyB, (partnerCounts.get(pKeyB) || 0) + 1);

    for (const pa of [a1, a2]) {
      for (const pb of [b1, b2]) {
        const oKey = pairKey(pa, pb);
        opponentCounts.set(oKey, (opponentCounts.get(oKey) || 0) + 1);
      }
    }
  }

  return { partnerCounts, opponentCounts };
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function formatTimeRange(startTime: string, offsetMinutes: number, durationMinutes: number): string {
  const [hhStr, mmStr] = startTime.split(':');
  const baseMinutes = (parseInt(hhStr || '18', 10) * 60) + parseInt(mmStr || '0', 10);
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

export interface GenerateSmartSessionParams {
  leagueId: string;
  date: string;
  startTime: string;
  roundsCount: number;
  durationPerRoundMinutes?: number;
  selectedPlayers: Player[];
  previousMatches: RecordedMatch[];
}

/**
 * Generates 20-minute round fixtures for the selected players.
 * Randomly assigns partners and opponents while penalizing repeated partnerships
 * and matchups from both previous recorded matches and earlier rounds in the session.
 */
export function generateSmartGameSession(params: GenerateSmartSessionParams): NextGameSession {
  const {
    leagueId,
    date,
    startTime,
    roundsCount,
    durationPerRoundMinutes = 20,
    selectedPlayers,
    previousMatches,
  } = params;

  const sessionId = `session-${date}-${Date.now()}`;
  const { partnerCounts: histPartners, opponentCounts: histOpponents } =
    buildMatchHistoryCounts(previousMatches);

  const sessionPartners = new Map<string, number>();
  const sessionOpponents = new Map<string, number>();
  const sitOutCounts = new Map<string, number>();
  for (const p of selectedPlayers) {
    sitOutCounts.set(p.id, 0);
  }

  const courtsPerRound = Math.floor(selectedPlayers.length / 4);
  const activeCount = courtsPerRound * 4;
  const fixtures: ScheduledFixture[] = [];
  const restingByRound: { [roundNumber: number]: Player[] } = {};

  if (courtsPerRound === 0) {
    return {
      id: sessionId,
      leagueId,
      date,
      startTime,
      durationPerRoundMinutes,
      roundsCount,
      selectedPlayerIds: selectedPlayers.map((p) => p.id),
      restingByRound,
      fixtures,
      createdAt: new Date().toISOString(),
    };
  }

  for (let round = 1; round <= roundsCount; round++) {
    // Pick who plays vs sits out (if player count is not divisible by 4)
    let activePlayers: Player[];
    let restingPlayers: Player[] = [];

    if (selectedPlayers.length === activeCount) {
      activePlayers = [...selectedPlayers];
    } else {
      const sitOutNeeded = selectedPlayers.length - activeCount;
      // Sort shuffled players by fewest sit-outs so byes rotate fairly
      const shuffledAll = shuffleArray(selectedPlayers).sort(
        (a, b) => (sitOutCounts.get(a.id) || 0) - (sitOutCounts.get(b.id) || 0)
      );
      restingPlayers = shuffledAll.slice(0, sitOutNeeded);
      activePlayers = shuffledAll.slice(sitOutNeeded);
      for (const rp of restingPlayers) {
        sitOutCounts.set(rp.id, (sitOutCounts.get(rp.id) || 0) + 1);
      }
    }

    restingByRound[round] = restingPlayers;

    // Sample randomized candidate arrangements and pick the lowest-penalty lineup
    let bestArrangement: Player[] = activePlayers;
    let bestScore = Number.POSITIVE_INFINITY;
    const candidateIterations = 450;

    for (let iter = 0; iter < candidateIterations; iter++) {
      const candidate = shuffleArray(activePlayers);
      let penalty = Math.random() * 4; // Jitter keeps equally fresh pairings truly random

      for (let c = 0; c < courtsPerRound; c++) {
        const idx = c * 4;
        const p1 = candidate[idx];
        const p2 = candidate[idx + 1];
        const p3 = candidate[idx + 2];
        const p4 = candidate[idx + 3];

        const pkA = pairKey(p1.id, p2.id);
        const pkB = pairKey(p3.id, p4.id);

        // Strongly avoid repeating partners in the same session
        penalty += (sessionPartners.get(pkA) || 0) * 10000;
        penalty += (sessionPartners.get(pkB) || 0) * 10000;

        // Avoid repeating partners from previous league sessions
        penalty += (histPartners.get(pkA) || 0) * 260;
        penalty += (histPartners.get(pkB) || 0) * 260;

        // Also spread out opponents across rounds and history
        for (const pa of [p1.id, p2.id]) {
          for (const pb of [p3.id, p4.id]) {
            const ok = pairKey(pa, pb);
            penalty += (sessionOpponents.get(ok) || 0) * 90;
            penalty += (histOpponents.get(ok) || 0) * 22;
          }
        }
      }

      if (penalty < bestScore) {
        bestScore = penalty;
        bestArrangement = candidate;
      }
    }

    const timeSlot = formatTimeRange(
      startTime,
      (round - 1) * durationPerRoundMinutes,
      durationPerRoundMinutes
    );

    for (let c = 0; c < courtsPerRound; c++) {
      const idx = c * 4;
      const a1 = bestArrangement[idx];
      const a2 = bestArrangement[idx + 1];
      const b1 = bestArrangement[idx + 2];
      const b2 = bestArrangement[idx + 3];

      const pkA = pairKey(a1.id, a2.id);
      const pkB = pairKey(b1.id, b2.id);

      const prevCountA = (histPartners.get(pkA) || 0) + (sessionPartners.get(pkA) || 0);
      const prevCountB = (histPartners.get(pkB) || 0) + (sessionPartners.get(pkB) || 0);

      sessionPartners.set(pkA, (sessionPartners.get(pkA) || 0) + 1);
      sessionPartners.set(pkB, (sessionPartners.get(pkB) || 0) + 1);

      for (const pa of [a1.id, a2.id]) {
        for (const pb of [b1.id, b2.id]) {
          const ok = pairKey(pa, pb);
          sessionOpponents.set(ok, (sessionOpponents.get(ok) || 0) + 1);
        }
      }

      fixtures.push({
        id: `fix-${sessionId}-r${round}-c${c + 1}`,
        sessionId,
        leagueId,
        date,
        roundNumber: round,
        roundLabel: `Round ${round}`,
        timeSlot,
        durationMinutes: durationPerRoundMinutes,
        courtName: `Court ${c + 1}`,
        teamA: { player1: a1, player2: a2 },
        teamB: { player1: b1, player2: b2 },
        completed: false,
        previousPartnerCountA: prevCountA,
        previousPartnerCountB: prevCountB,
      });
    }
  }

  return {
    id: sessionId,
    leagueId,
    date,
    startTime,
    durationPerRoundMinutes,
    roundsCount,
    selectedPlayerIds: selectedPlayers.map((p) => p.id),
    restingByRound,
    fixtures,
    createdAt: new Date().toISOString(),
  };
}
