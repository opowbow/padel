import { Player, ScoreBreakdown } from '../types/padel';

export interface CalculateMatchPointsParams {
  teamAPlayer1: Player;
  teamAPlayer2: Player;
  teamBPlayer1: Player;
  teamBPlayer2: Player;
  teamAPointsWon: number;
  teamBPointsWon: number;
  winnerTeam: 'A' | 'B';
  useWeighting: boolean;
}

export function calculateMatchScoring(params: CalculateMatchPointsParams): ScoreBreakdown {
  const {
    teamAPlayer1,
    teamAPlayer2,
    teamBPlayer1,
    teamBPlayer2,
    teamAPointsWon,
    teamBPointsWon,
    winnerTeam,
    useWeighting,
  } = params;

  // Base points
  const baseWin = 20;
  const baseLoss = 6; // Participation baseline

  // Net point/game difference bonus
  const teamAPointDiff = teamAPointsWon - teamBPointsWon;
  const teamBPointDiff = teamBPointsWon - teamAPointsWon;

  // Rating averages
  const teamAAvgRank = (teamAPlayer1.rankingScore + teamAPlayer2.rankingScore) / 2;
  const teamBAvgRank = (teamBPlayer1.rankingScore + teamBPlayer2.rankingScore) / 2;

  let teamAOpponentBonus = 0;
  let teamBOpponentBonus = 0;
  let teamAPartnerCarryBonus = 0;
  let teamBPartnerCarryBonus = 0;

  const formulaExplanation: string[] = [];

  if (winnerTeam === 'A') {
    formulaExplanation.push(`🏆 Team A Victory: +${baseWin} Base Win Points`);
    formulaExplanation.push(`🎾 Team B Participation: +${baseLoss} Base Points`);
  } else {
    formulaExplanation.push(`🏆 Team B Victory: +${baseWin} Base Win Points`);
    formulaExplanation.push(`🎾 Team A Participation: +${baseLoss} Base Points`);
  }

  // Games/Points won and lost contribution
  const teamAGamesBonus = Math.max(0, Math.round(teamAPointsWon * 0.5));
  const teamBGamesBonus = Math.max(0, Math.round(teamBPointsWon * 0.5));
  formulaExplanation.push(`📊 Game Score Bonus: Team A (+${teamAGamesBonus} pts for ${teamAPointsWon} won), Team B (+${teamBGamesBonus} pts for ${teamBPointsWon} won)`);

  if (useWeighting) {
    // 1. Opponent Rank Differential (Beating higher ranked team)
    if (winnerTeam === 'A' && teamBAvgRank > teamAAvgRank) {
      const diff = teamBAvgRank - teamAAvgRank;
      teamAOpponentBonus = Math.round(diff * 10);
      formulaExplanation.push(`⚡ Team A Giant-Killer Bonus: +${teamAOpponentBonus} pts (Beating opponents rated +${diff.toFixed(2)} higher)`);
    } else if (winnerTeam === 'B' && teamAAvgRank > teamBAvgRank) {
      const diff = teamAAvgRank - teamBAvgRank;
      teamBOpponentBonus = Math.round(diff * 10);
      formulaExplanation.push(`⚡ Team B Giant-Killer Bonus: +${teamBOpponentBonus} pts (Beating opponents rated +${diff.toFixed(2)} higher)`);
    }

    // 2. Weaker Partner Weighting (Carrying a lower-ranked partner against high-ranked opposition)
    const teamARankDiff = Math.abs(teamAPlayer1.rankingScore - teamAPlayer2.rankingScore);
    const teamBRankDiff = Math.abs(teamBPlayer1.rankingScore - teamBPlayer2.rankingScore);

    if (winnerTeam === 'A' && teamARankDiff >= 0.5) {
      teamAPartnerCarryBonus = Math.round(teamARankDiff * 6);
      formulaExplanation.push(`🤝 Team A Partner Handicap Bonus: +${teamAPartnerCarryBonus} pts (Level difference between partners: ${teamARankDiff.toFixed(1)})`);
    }

    if (winnerTeam === 'B' && teamBRankDiff >= 0.5) {
      teamBPartnerCarryBonus = Math.round(teamBRankDiff * 6);
      formulaExplanation.push(`🤝 Team B Partner Handicap Bonus: +${teamBPartnerCarryBonus} pts (Level difference between partners: ${teamBRankDiff.toFixed(1)})`);
    }
  }

  let totalTeamAPoints = 0;
  let totalTeamBPoints = 0;

  if (winnerTeam === 'A') {
    totalTeamAPoints = baseWin + Math.max(0, teamAPointDiff) + teamAOpponentBonus + teamAPartnerCarryBonus;
    totalTeamBPoints = baseLoss + Math.max(1, teamBGamesBonus);
  } else {
    totalTeamBPoints = baseWin + Math.max(0, teamBPointDiff) + teamBOpponentBonus + teamBPartnerCarryBonus;
    totalTeamAPoints = baseLoss + Math.max(1, teamAGamesBonus);
  }

  return {
    basePoints: winnerTeam === 'A' ? baseWin : baseLoss,
    pointDiffBonus: winnerTeam === 'A' ? teamAPointDiff : teamBPointDiff,
    opponentWeightBonus: winnerTeam === 'A' ? teamAOpponentBonus : teamBOpponentBonus,
    partnerHandicapBonus: winnerTeam === 'A' ? teamAPartnerCarryBonus : teamBPartnerCarryBonus,
    totalTeamAPoints,
    totalTeamBPoints,
    formulaExplanation,
  };
}

/**
 * Parses set score strings like ["6-4", "3-6", "7-5"] into total games/points won and lost
 */
export function parseSetScores(sets: string[]): {
  teamAPoints: number;
  teamBPoints: number;
  teamASets: number;
  teamBSets: number;
} {
  let teamAPoints = 0;
  let teamBPoints = 0;
  let teamASets = 0;
  let teamBSets = 0;

  for (const set of sets) {
    const parts = set.trim().split('-');
    if (parts.length === 2) {
      const a = parseInt(parts[0], 10);
      const b = parseInt(parts[1], 10);
      if (!isNaN(a) && !isNaN(b)) {
        teamAPoints += a;
        teamBPoints += b;
        if (a > b) teamASets++;
        else if (b > a) teamBSets++;
      }
    }
  }

  return { teamAPoints, teamBPoints, teamASets, teamBSets };
}
