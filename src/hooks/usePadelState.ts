import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Player,
  PadelGame,
  League,
  RecordedMatch,
  WeeklyAward,
  LeagueStanding,
  InterestedMember,
  SignUpOption,
  MemberStatus,
} from '../types/padel';
import {
  INITIAL_PLAYERS,
  INITIAL_GAMES,
  INITIAL_LEAGUES,
  INITIAL_RECORDED_MATCHES,
  INITIAL_WEEKLY_AWARDS,
  INITIAL_MEMBERS,
} from '../utils/initialData';
import { calculateMatchScoring } from '../utils/scoringEngine';

const STORAGE_KEYS = {
  PLAYERS: 'playslay_players_v2',
  GAMES: 'playslay_games_v2',
  LEAGUES: 'playslay_leagues_v2',
  MATCHES: 'playslay_matches_v2',
  WEEKLY_AWARDS: 'playslay_weekly_v2',
  MEMBERS: 'playslay_members_v2',
  CURRENT_PLAYER_ID: 'playslay_current_user_v2',
  VIEW_MODE: 'playslay_view_mode_v2',
  WEIGHTED_SCORING: 'playslay_weighted_scoring_v2',
  SIGNUP_PLANS: 'padelslay_signup_plans_v1',
};

export function usePadelState() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [games, setGames] = useState<PadelGame[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAMES);
    return saved ? JSON.parse(saved) : INITIAL_GAMES;
  });

  const [leagues, setLeagues] = useState<League[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAGUES);
    return saved ? JSON.parse(saved) : INITIAL_LEAGUES;
  });

  const [matches, setMatches] = useState<RecordedMatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
    return saved ? JSON.parse(saved) : INITIAL_RECORDED_MATCHES;
  });

  const [weeklyAwards, setWeeklyAwards] = useState<WeeklyAward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_AWARDS);
    return saved ? JSON.parse(saved) : INITIAL_WEEKLY_AWARDS;
  });

  const [members, setMembers] = useState<InterestedMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [currentPlayerId, setCurrentPlayerId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER_ID);
    return saved || INITIAL_PLAYERS[0].id;
  });

  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');

  const [weightedScoringEnabled, setWeightedScoringEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEIGHTED_SCORING);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [userSignUpPlans, setUserSignUpPlans] = useState<{ [playerId: string]: SignUpOption }>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SIGNUP_PLANS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      'p-franny': 'both',
      'p-olive': 'both',
      'p-anna': 'both',
      'p-annika': 'both',
      'p-mateo': 'mixin',
      'p-sofia': 'league',
      'p-lucas': 'casual',
      'p-elena': 'both',
    };
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIGNUP_PLANS, JSON.stringify(userSignUpPlans));
  }, [userSignUpPlans]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(leagues));
  }, [leagues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_AWARDS, JSON.stringify(weeklyAwards));
  }, [weeklyAwards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER_ID, currentPlayerId);
  }, [currentPlayerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEIGHTED_SCORING, JSON.stringify(weightedScoringEnabled));
  }, [weightedScoringEnabled]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId) || players[0];

  // Action: Add new player signup
  const registerPlayer = (newPlayerData: Omit<Player, 'id' | 'matchesPlayed' | 'matchesWon' | 'currentStreak' | 'weeklyPointsGained' | 'weeklyRankDelta' | 'joinedDate'>) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p-${Date.now()}`,
      matchesPlayed: 0,
      matchesWon: 0,
      currentStreak: 0,
      weeklyPointsGained: 25,
      weeklyRankDelta: 0.0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setPlayers((prev) => [newPlayer, ...prev]);
    setCurrentPlayerId(newPlayer.id);

    // Also auto-add to interested members list
    const newMember: InterestedMember = {
      id: `mem-${Date.now()}`,
      name: newPlayer.name,
      email: newPlayer.email,
      avatar: newPlayer.avatar,
      rankingText: newPlayer.rankingText,
      rankingScore: newPlayer.rankingScore,
      status: 'Active League Player',
      preferredDays: 'Evenings & Weekends',
      notes: newPlayer.bio || 'New member joined through PadelSlay sign-up',
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setMembers((prev) => [newMember, ...prev]);

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2d78', '#ff7a00', '#38bdf8', '#ff3b30'],
      });
    } catch {
      // ignore
    }

    return newPlayer;
  };

  // Action: Add interested member (Express Interest)
  const addInterestedMember = (memberData: Omit<InterestedMember, 'id' | 'joinedDate'>) => {
    const newMember: InterestedMember = {
      ...memberData,
      id: `mem-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setMembers((prev) => [newMember, ...prev]);

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#ff2d78', '#ff7a00', '#38bdf8'],
      });
    } catch {
      // ignore
    }

    return newMember;
  };

  // Action: Update player profile
  const updatePlayer = (updated: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Action: Join Game slot
  const joinGameSlot = (gameId: string, slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4', player: Player) => {
    setGames((prev) =>
      prev.map((game) => {
        if (game.id !== gameId) return game;

        const updatedPlayers = { ...game.players, [slotKey]: player };
        const filledCount = Object.values(updatedPlayers).filter(Boolean).length;
        const status = filledCount >= 4 ? 'full' : 'open';

        return {
          ...game,
          players: updatedPlayers,
          status,
        };
      })
    );

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#ff2d78', '#38bdf8', '#ff7a00'],
      });
    } catch {
      // ignore
    }
  };

  // Action: Leave Game slot
  const leaveGameSlot = (gameId: string, slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4') => {
    setGames((prev) =>
      prev.map((game) => {
        if (game.id !== gameId) return game;

        const updatedPlayers = { ...game.players, [slotKey]: undefined };
        return {
          ...game,
          players: updatedPlayers,
          status: 'open',
        };
      })
    );
  };

  // Action: Create Game
  const createGame = (gameData: Omit<PadelGame, 'id' | 'status' | 'hostId' | 'hostName' | 'maxPlayers'>) => {
    const newGame: PadelGame = {
      ...gameData,
      id: `game-${Date.now()}`,
      hostId: currentPlayer.id,
      hostName: currentPlayer.name,
      maxPlayers: 4,
      status: 'open',
    };

    setGames((prev) => [newGame, ...prev]);
    return newGame;
  };

  // Action: Sign up / Join a League
  const registerForLeague = (leagueId: string, playerId: string) => {
    setLeagues((prev) =>
      prev.map((l) => {
        if (l.id !== leagueId) return l;
        if (l.registeredPlayerIds.includes(playerId)) return l;
        return {
          ...l,
          registeredPlayerIds: [...l.registeredPlayerIds, playerId],
          isRegistered: playerId === currentPlayerId ? true : l.isRegistered,
        };
      })
    );

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2d78', '#ff7a00', '#38bdf8'],
      });
    } catch {
      // ignore
    }
  };

  // Action: Choose Sign-Up Option (Mixin, League, Both, Casual)
  const selectSignUpOption = (
    option: SignUpOption,
    playerId: string = currentPlayerId,
    notes?: string
  ) => {
    setUserSignUpPlans((prev) => ({ ...prev, [playerId]: option }));

    const targetPlayer = players.find((p) => p.id === playerId) || currentPlayer;

    let memberStatus: MemberStatus = 'Looking for Mixin Group';
    if (option === 'league' || option === 'both') {
      memberStatus = 'Active League Player';
      registerForLeague('league-winter-slay', playerId);
    } else if (option === 'casual') {
      memberStatus = 'Weekend Social';
    } else if (option === 'mixin') {
      memberStatus = 'Looking for Mixin Group';
    }

    setMembers((prev) => {
      const existingIndex = prev.findIndex(
        (m) => m.name.toLowerCase() === targetPlayer.name.toLowerCase() || m.id === targetPlayer.id
      );

      const optionLabels: Record<SignUpOption, string> = {
        mixin: 'Sign up for mixin',
        league: 'Sign up for League',
        both: 'Sign up for both',
        casual: 'Sign up as casual member',
      };

      const finalNote = notes
        ? `${notes} • [${optionLabels[option]}]`
        : `Registered: ${optionLabels[option]}`;

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          status: memberStatus,
          notes: finalNote,
        };
        return copy;
      } else {
        const newMember: InterestedMember = {
          id: `mem-${Date.now()}`,
          name: targetPlayer.name,
          email: targetPlayer.email,
          avatar: targetPlayer.avatar,
          rankingText: targetPlayer.rankingText,
          rankingScore: targetPlayer.rankingScore,
          status: memberStatus,
          preferredDays: 'Evenings & Weekends',
          notes: finalNote,
          joinedDate: new Date().toISOString().split('T')[0],
        };
        return [newMember, ...prev];
      }
    });

    try {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#38bdf8', '#06b6d4', '#ff2d78', '#ff7a00'],
      });
    } catch {
      // ignore
    }
  };

  // Action: Record Match Score
  const recordMatchScore = (params: {
    leagueId: string;
    gameId?: string;
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
    winnerTeam: 'A' | 'B';
  }) => {
    const breakdown = calculateMatchScoring({
      teamAPlayer1: params.teamAPlayer1,
      teamAPlayer2: params.teamAPlayer2,
      teamBPlayer1: params.teamBPlayer1,
      teamBPlayer2: params.teamBPlayer2,
      teamAPointsWon: params.teamAPointsWon,
      teamBPointsWon: params.teamBPointsWon,
      winnerTeam: params.winnerTeam,
      useWeighting: weightedScoringEnabled,
    });

    const newMatch: RecordedMatch = {
      id: `match-${Date.now()}`,
      gameId: params.gameId,
      leagueId: params.leagueId,
      date: new Date().toISOString().split('T')[0],
      courtName: params.courtName,
      teamA: {
        player1: params.teamAPlayer1,
        player2: params.teamAPlayer2,
        setsWon: params.teamASetsWon,
        pointsWon: params.teamAPointsWon,
      },
      teamB: {
        player1: params.teamBPlayer1,
        player2: params.teamBPlayer2,
        setsWon: params.teamBSetsWon,
        pointsWon: params.teamBPointsWon,
      },
      setScores: params.setScores,
      winnerTeam: params.winnerTeam,
      weightedBonusApplied: weightedScoringEnabled,
      scoringBreakdown: breakdown,
    };

    setMatches((prev) => [newMatch, ...prev]);

    // Update players' stats and improvement metrics
    setPlayers((prev) =>
      prev.map((player) => {
        const isTeamA = player.id === params.teamAPlayer1.id || player.id === params.teamAPlayer2.id;
        const isTeamB = player.id === params.teamBPlayer1.id || player.id === params.teamBPlayer2.id;

        if (!isTeamA && !isTeamB) return player;

        const isWinner = (isTeamA && params.winnerTeam === 'A') || (isTeamB && params.winnerTeam === 'B');
        const pointsAwarded = isTeamA ? breakdown.totalTeamAPoints : breakdown.totalTeamBPoints;

        const rankGain = isWinner ? 0.05 : -0.02;
        const newScore = Math.max(1.0, Math.min(7.0, parseFloat((player.rankingScore + rankGain).toFixed(2))));

        return {
          ...player,
          rankingScore: newScore,
          matchesPlayed: player.matchesPlayed + 1,
          matchesWon: isWinner ? player.matchesWon + 1 : player.matchesWon,
          currentStreak: isWinner ? player.currentStreak + 1 : 0,
          weeklyPointsGained: player.weeklyPointsGained + pointsAwarded,
          weeklyRankDelta: parseFloat((player.weeklyRankDelta + (isWinner ? 0.1 : 0.02)).toFixed(2)),
        };
      })
    );

    if (params.gameId) {
      setGames((prev) =>
        prev.map((g) => (g.id === params.gameId ? { ...g, status: 'completed' } : g))
      );
    }

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#ff2d78', '#ff7a00', '#38bdf8', '#ff3b30'],
      });
    } catch {
      // ignore
    }

    return newMatch;
  };

  // Calculate dynamic league standings for any league
  const getLeagueStandings = (leagueId: string): LeagueStanding[] => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return [];

    const leagueMatches = matches.filter((m) => m.leagueId === leagueId);

    const standingsMap = new Map<string, {
      player: Player;
      played: number;
      won: number;
      lost: number;
      pointsWon: number;
      pointsLost: number;
      leaguePoints: number;
      form: ('W' | 'L')[];
      streak: number;
    }>();

    league.registeredPlayerIds.forEach((pid) => {
      const p = players.find((pl) => pl.id === pid);
      if (p) {
        standingsMap.set(pid, {
          player: p,
          played: 0,
          won: 0,
          lost: 0,
          pointsWon: 0,
          pointsLost: 0,
          leaguePoints: 0,
          form: [],
          streak: 0,
        });
      }
    });

    const sortedMatches = [...leagueMatches].reverse();

    sortedMatches.forEach((m) => {
      const teamAPlayerIds = [m.teamA.player1.id, m.teamA.player2.id];
      const teamBPlayerIds = [m.teamB.player1.id, m.teamB.player2.id];

      teamAPlayerIds.forEach((pid) => {
        let entry = standingsMap.get(pid);
        if (!entry) {
          const p = players.find((pl) => pl.id === pid) || m.teamA.player1;
          entry = { player: p, played: 0, won: 0, lost: 0, pointsWon: 0, pointsLost: 0, leaguePoints: 0, form: [], streak: 0 };
          standingsMap.set(pid, entry);
        }

        entry.played += 1;
        entry.pointsWon += m.teamA.pointsWon;
        entry.pointsLost += m.teamB.pointsWon;
        entry.leaguePoints += m.scoringBreakdown.totalTeamAPoints;

        if (m.winnerTeam === 'A') {
          entry.won += 1;
          entry.form.push('W');
          entry.streak = entry.streak >= 0 ? entry.streak + 1 : 1;
        } else {
          entry.lost += 1;
          entry.form.push('L');
          entry.streak = entry.streak <= 0 ? entry.streak - 1 : -1;
        }
      });

      teamBPlayerIds.forEach((pid) => {
        let entry = standingsMap.get(pid);
        if (!entry) {
          const p = players.find((pl) => pl.id === pid) || m.teamB.player1;
          entry = { player: p, played: 0, won: 0, lost: 0, pointsWon: 0, pointsLost: 0, leaguePoints: 0, form: [], streak: 0 };
          standingsMap.set(pid, entry);
        }

        entry.played += 1;
        entry.pointsWon += m.teamB.pointsWon;
        entry.pointsLost += m.teamA.pointsWon;
        entry.leaguePoints += m.scoringBreakdown.totalTeamBPoints;

        if (m.winnerTeam === 'B') {
          entry.won += 1;
          entry.form.push('W');
          entry.streak = entry.streak >= 0 ? entry.streak + 1 : 1;
        } else {
          entry.lost += 1;
          entry.form.push('L');
          entry.streak = entry.streak <= 0 ? entry.streak - 1 : -1;
        }
      });
    });

    const result: LeagueStanding[] = Array.from(standingsMap.values()).map((val) => ({
      playerId: val.player.id,
      player: val.player,
      played: val.played,
      won: val.won,
      lost: val.lost,
      pointsWon: val.pointsWon,
      pointsLost: val.pointsLost,
      pointDiff: val.pointsWon - val.pointsLost,
      leaguePoints: val.leaguePoints,
      form: val.form.slice(-5),
      streak: val.streak,
      rank: 1,
    }));

    // Ensure the top 4 are ranked in proper order if specified
    result.sort((a, b) => {
      if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return b.pointsWon - a.pointsWon;
    });

    return result.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  };

  const getMostImprovedPlayer = () => {
    const sorted = [...players].sort((a, b) => {
      const scoreA = a.weeklyPointsGained * 0.7 + a.weeklyRankDelta * 150;
      const scoreB = b.weeklyPointsGained * 0.7 + b.weeklyRankDelta * 150;
      return scoreB - scoreA;
    });

    const top = sorted[0] || players[0];
    const winRate = top.matchesPlayed > 0 ? Math.round((top.matchesWon / top.matchesPlayed) * 100) : 100;

    return {
      player: top,
      pointsGained: top.weeklyPointsGained,
      rankDelta: top.weeklyRankDelta,
      winRate,
      streak: top.currentStreak,
      commentary: `${top.name} is dominating PadelSlay this week with +${top.weeklyPointsGained} points gained and a stellar +${top.weeklyRankDelta} rating elevation!`,
      runnerUps: sorted.slice(1, 4).map((p) => ({
        player: p,
        pointsGained: p.weeklyPointsGained,
        rankDelta: p.weeklyRankDelta,
      })),
    };
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setPlayers(INITIAL_PLAYERS);
    setGames(INITIAL_GAMES);
    setLeagues(INITIAL_LEAGUES);
    setMatches(INITIAL_RECORDED_MATCHES);
    setWeeklyAwards(INITIAL_WEEKLY_AWARDS);
    setMembers(INITIAL_MEMBERS);
    setCurrentPlayerId(INITIAL_PLAYERS[0].id);
    setUserSignUpPlans({
      'p-franny': 'both',
      'p-olive': 'both',
      'p-anna': 'both',
      'p-annika': 'both',
      'p-mateo': 'mixin',
      'p-sofia': 'league',
      'p-lucas': 'casual',
      'p-elena': 'both',
    });
    setViewMode('web');
    setWeightedScoringEnabled(true);
  };

  return {
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    members,
    currentPlayer,
    currentPlayerId,
    setCurrentPlayerId,
    userSignUpPlans,
    selectSignUpOption,
    viewMode,
    setViewMode,
    weightedScoringEnabled,
    setWeightedScoringEnabled,
    registerPlayer,
    addInterestedMember,
    updatePlayer,
    joinGameSlot,
    leaveGameSlot,
    createGame,
    registerForLeague,
    recordMatchScore,
    getLeagueStandings,
    getMostImprovedPlayer,
    resetToDefaults,
  };
}
