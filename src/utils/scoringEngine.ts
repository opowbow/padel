import { Player, RecordedMatch, ScoreBreakdown } from '../types/padel';

export function sortMatchesChronologically(matches: RecordedMatch[]): RecordedMatch[] {
  return matches
    .map((m, index) => {
      let sortDate = m.date || '';
      if (!sortDate) {
        const tsMatch = /^match-(\d{13})/.exec(m.id);
        if (tsMatch) {
          sortDate = new Date(Number(tsMatch[1])).toISOString().split('T')[0];
        } else {
          sortDate = '0000-00-00';
        }
      }
      return { m, sortDate, index };
    })
    .sort((a, b) => {
      if (a.sortDate !== b.sortDate) {
        return a.sortDate.localeCompare(b.sortDate);
      }
      return a.index - b.index;
    })
    .map((item) => item.m);
}

export interface CalculateMatchPointsParams {
  teamAPlayer1: Player;
  teamAPlayer2: Player;
  teamBPlayer1: Player;
  teamBPlayer2: Player;
  teamAPointsWon: number;
  teamBPointsWon: number;
  winnerTeam: 'A' | 'B' | 'Tie';
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

  const teamAPointDiff = teamAPointsWon - teamBPointsWon;
  const teamBPointDiff = teamBPointsWon - teamAPointsWon;

  const teamAAvgRank = (teamAPlayer1.rankingScore + teamAPlayer2.rankingScore) / 2;
  const teamBAvgRank = (teamBPlayer1.rankingScore + teamBPlayer2.rankingScore) / 2;

  let teamAOpponentBonus = 0;
  let teamBOpponentBonus = 0;
  let teamAPartnerCarryBonus = 0;
  let teamBPartnerCarryBonus = 0;

  const formulaExplanation: string[] = [];

  if (winnerTeam === 'A') {
    formulaExplanation.push(
      `🏆 Team 1 Win (${teamAPointsWon}-${teamBPointsWon}): +${teamAPointsWon} pts to Team 1, +${teamBPointsWon} pts to Team 2`
    );
  } else if (winnerTeam === 'B') {
    formulaExplanation.push(
      `🏆 Team 2 Win (${teamBPointsWon}-${teamAPointsWon}): +${teamBPointsWon} pts to Team 2, +${teamAPointsWon} pts to Team 1`
    );
  } else {
    formulaExplanation.push(
      `🤝 Timed Draw (${teamAPointsWon}-${teamBPointsWon}): +${teamAPointsWon} pts each`
    );
  }

  if (useWeighting && winnerTeam !== 'Tie') {
    if (winnerTeam === 'A' && teamBAvgRank > teamAAvgRank) {
      const diff = teamBAvgRank - teamAAvgRank;
      teamAOpponentBonus = Math.round(diff * 4);
      if (teamAOpponentBonus > 0) {
        formulaExplanation.push(
          `⚡ Team 1 Upset Bonus: +${teamAOpponentBonus} pts (vs +${diff.toFixed(2)} higher avg rating)`
        );
      }
    } else if (winnerTeam === 'B' && teamAAvgRank > teamBAvgRank) {
      const diff = teamAAvgRank - teamBAvgRank;
      teamBOpponentBonus = Math.round(diff * 4);
      if (teamBOpponentBonus > 0) {
        formulaExplanation.push(
          `⚡ Team 2 Upset Bonus: +${teamBOpponentBonus} pts (vs +${diff.toFixed(2)} higher avg rating)`
        );
      }
    }

    const teamARankDiff = Math.abs(teamAPlayer1.rankingScore - teamAPlayer2.rankingScore);
    const teamBRankDiff = Math.abs(teamBPlayer1.rankingScore - teamBPlayer2.rankingScore);

    if (winnerTeam === 'A' && teamARankDiff >= 0.5) {
      teamAPartnerCarryBonus = Math.round(teamARankDiff * 3);
      if (teamAPartnerCarryBonus > 0) {
        formulaExplanation.push(`🤝 Team 1 Partner Carry Bonus: +${teamAPartnerCarryBonus} pts`);
      }
    }

    if (winnerTeam === 'B' && teamBRankDiff >= 0.5) {
      teamBPartnerCarryBonus = Math.round(teamBRankDiff * 3);
      if (teamBPartnerCarryBonus > 0) {
        formulaExplanation.push(`🤝 Team 2 Partner Carry Bonus: +${teamBPartnerCarryBonus} pts`);
      }
    }
  }

  const totalTeamAPoints = teamAPointsWon + teamAOpponentBonus + teamAPartnerCarryBonus;
  const totalTeamBPoints = teamBPointsWon + teamBOpponentBonus + teamBPartnerCarryBonus;

  return {
    basePoints: winnerTeam === 'A' ? teamAPointsWon : teamBPointsWon,
    pointDiffBonus: winnerTeam === 'Tie' ? 0 : winnerTeam === 'A' ? teamAPointDiff : teamBPointDiff,
    opponentWeightBonus: winnerTeam === 'A' ? teamAOpponentBonus : teamBOpponentBonus,
    partnerHandicapBonus: winnerTeam === 'A' ? teamAPartnerCarryBonus : teamBPartnerCarryBonus,
    totalTeamAPoints,
    totalTeamBPoints,
    formulaExplanation,
  };
}

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
