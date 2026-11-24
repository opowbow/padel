import { useState, useEffect, useRef } from 'react';
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
  NextGameSession,
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
  PLAYERS: 'playslay_players_v6',
  GAMES: 'playslay_games_v6',
  LEAGUES: 'playslay_leagues_v6',
  MATCHES: 'playslay_matches_v6',
  WEEKLY_AWARDS: 'playslay_weekly_v6',
  MEMBERS: 'playslay_members_v6',
  CURRENT_PLAYER_ID: 'playslay_current_user_v6',
  VIEW_MODE: 'playslay_view_mode_v6',
  WEIGHTED_SCORING: 'playslay_weighted_scoring_v6',
  SIGNUP_PLANS: 'padelslay_signup_plans_v6',
  NEXT_SESSION: 'playslay_next_session_v6',
};

const DEFAULT_ACTIVE_PLAYER_ID = 'p-olive';

function buildDefaultPlans(playerList: Player[]): { [playerId: string]: SignUpOption } {
  const map: { [playerId: string]: SignUpOption } = {};
  for (const p of playerList) {
    map[p.id] = 'both';
  }
  return map;
}

export type CloudSyncStatus = 'loading' | 'synced' | 'saving' | 'offline';

interface PersistedCloudState {
  players: Player[];
  games: PadelGame[];
  leagues: League[];
  matches: RecordedMatch[];
  weeklyAwards: WeeklyAward[];
  members: InterestedMember[];
  nextGameSession: NextGameSession | null;
  userSignUpPlans: { [playerId: string]: SignUpOption };
  weightedScoringEnabled: boolean;
}

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

  const [nextGameSession, setNextGameSession] = useState<NextGameSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NEXT_SESSION);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [currentPlayerId, setCurrentPlayerId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER_ID);
    return (
      saved ||
      INITIAL_PLAYERS.find((p) => p.id === DEFAULT_ACTIVE_PLAYER_ID)?.id ||
      INITIAL_PLAYERS[0].id
    );
  });

  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');

  const [weightedScoringEnabled, setWeightedScoringEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEIGHTED_SCORING);
    return saved !== null ? JSON.parse(saved) : false;
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
    return buildDefaultPlans(INITIAL_PLAYERS);
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('loading');
  const hasHydratedFromCloudRef = useRef(false);
  const skipNextCloudPushRef = useRef(false);
  const pendingCloudSaveRef = useRef(false);
  const lastServerUpdatedAtRef = useRef(0);
  const latestStateSnapshotRef = useRef<PersistedCloudState>({
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    members,
    nextGameSession,
    userSignUpPlans,
    weightedScoringEnabled,
  });

  useEffect(() => {
    latestStateSnapshotRef.current = {
      players,
      games,
      leagues,
      matches,
      weeklyAwards,
      members,
      nextGameSession,
      userSignUpPlans,
      weightedScoringEnabled,
    };
  }, [
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    members,
    nextGameSession,
    userSignUpPlans,
    weightedScoringEnabled,
  ]);

  const applyRemoteSnapshot = (remote: PersistedCloudState) => {
    skipNextCloudPushRef.current = true;
    if (Array.isArray(remote.players) && remote.players.length > 0) {
      setPlayers(remote.players);
    }
    if (Array.isArray(remote.games)) {
      setGames(remote.games);
    }
    if (Array.isArray(remote.leagues) && remote.leagues.length > 0) {
      setLeagues(remote.leagues);
    }
    if (Array.isArray(remote.matches)) {
      setMatches(remote.matches);
    }
    if (Array.isArray(remote.weeklyAwards)) {
      setWeeklyAwards(remote.weeklyAwards);
    }
    if (Array.isArray(remote.members)) {
      setMembers(remote.members);
    }
    setNextGameSession(remote.nextGameSession ?? null);
    if (remote.userSignUpPlans && typeof remote.userSignUpPlans === 'object') {
      setUserSignUpPlans(remote.userSignUpPlans);
    }
    if (typeof remote.weightedScoringEnabled === 'boolean') {
      setWeightedScoringEnabled(remote.weightedScoringEnabled);
    }
  };

  // Hydrate shared state from Cloud Storage (/api/state -> gs://op-hack-001/slaypadel/tuesslay-state.json)
  useEffect(() => {
    let cancelled = false;

    const loadFromCloud = async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        if (cancelled) return;

        if (payload?.state && Array.isArray(payload.state.players)) {
          lastServerUpdatedAtRef.current = Number(payload.updatedAt || Date.now());
          applyRemoteSnapshot(payload.state as PersistedCloudState);
          hasHydratedFromCloudRef.current = true;
          setCloudSyncStatus('synced');
        } else {
          // First run: seed the GCS bucket with the current state (preserving any local edits)
          const seedRes = await fetch('/api/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({ state: latestStateSnapshotRef.current }),
          });
          if (!cancelled) {
            if (seedRes.ok) {
              const seedJson = await seedRes.json();
              lastServerUpdatedAtRef.current = Number(seedJson.updatedAt || Date.now());
              setCloudSyncStatus('synced');
            } else {
              setCloudSyncStatus('offline');
            }
            hasHydratedFromCloudRef.current = true;
          }
        }
      } catch {
        if (!cancelled) {
          hasHydratedFromCloudRef.current = true;
          setCloudSyncStatus('offline');
        }
      }
    };

    loadFromCloud();

    // Refresh from Cloud Storage when switching back to the browser tab on mobile/desktop
    const refreshIfNewer = async () => {
      if (!hasHydratedFromCloudRef.current || pendingCloudSaveRef.current) return;
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = await res.json();
        const remoteUpdatedAt = Number(payload?.updatedAt || 0);
        if (
          payload?.state &&
          Array.isArray(payload.state.players) &&
          remoteUpdatedAt > lastServerUpdatedAtRef.current
        ) {
          lastServerUpdatedAtRef.current = remoteUpdatedAt;
          applyRemoteSnapshot(payload.state as PersistedCloudState);
          setCloudSyncStatus('synced');
        }
      } catch {
        // Ignore transient network errors on background focus checks
      }
    };

    window.addEventListener('focus', refreshIfNewer);
    document.addEventListener('visibilitychange', refreshIfNewer);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshIfNewer);
      document.removeEventListener('visibilitychange', refreshIfNewer);
    };
  }, []);

  // Push every shared state change (player names, scores, dates, fixtures) to Cloud Storage
  useEffect(() => {
    if (!hasHydratedFromCloudRef.current) return;
    if (skipNextCloudPushRef.current) {
      skipNextCloudPushRef.current = false;
      return;
    }

    pendingCloudSaveRef.current = true;
    setCloudSyncStatus('saving');

    const snapshot: PersistedCloudState = {
      players,
      games,
      leagues,
      matches,
      weeklyAwards,
      members,
      nextGameSession,
      userSignUpPlans,
      weightedScoringEnabled,
    };

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({ state: snapshot }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        lastServerUpdatedAtRef.current = Number(data?.updatedAt || Date.now());
        pendingCloudSaveRef.current = false;
        setCloudSyncStatus('synced');
      } catch {
        pendingCloudSaveRef.current = false;
        setCloudSyncStatus('offline');
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    members,
    nextGameSession,
    userSignUpPlans,
    weightedScoringEnabled,
  ]);

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
    if (nextGameSession) {
      localStorage.setItem(STORAGE_KEYS.NEXT_SESSION, JSON.stringify(nextGameSession));
    } else {
      localStorage.removeItem(STORAGE_KEYS.NEXT_SESSION);
    }
  }, [nextGameSession]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER_ID, currentPlayerId);
  }, [currentPlayerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEIGHTED_SCORING, JSON.stringify(weightedScoringEnabled));
  }, [weightedScoringEnabled]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId) || players[0];

  const triggerConfetti = (count = 80) => {
    try {
      confetti({
        particleCount: count,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2d78', '#ff7a00', '#38bdf8', '#10b981'],
      });
    } catch {
      // ignore
    }
  };

  // Action: Add new player signup (full profile) & register into active league
  const registerPlayer = (
    newPlayerData: Omit<
      Player,
      | 'id'
      | 'matchesPlayed'
      | 'matchesWon'
      | 'currentStreak'
      | 'weeklyPointsGained'
      | 'weeklyRankDelta'
      | 'joinedDate'
    >,
    leagueIdToJoin = 'league-winter-slay'
  ) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      matchesPlayed: 0,
      matchesWon: 0,
      currentStreak: 0,
      weeklyPointsGained: 0,
      weeklyRankDelta: 0.0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setUserSignUpPlans((prev) => ({ ...prev, [newPlayer.id]: 'both' }));

    setLeagues((prev) =>
      prev.map((l) => {
        if (l.id !== leagueIdToJoin) return l;
        if (l.registeredPlayerIds.includes(newPlayer.id)) return l;
        return {
          ...l,
          registeredPlayerIds: [...l.registeredPlayerIds, newPlayer.id],
        };
      })
    );

    const newMember: InterestedMember = {
      id: `mem-${Date.now()}`,
      name: newPlayer.name,
      email: newPlayer.email,
      avatar: newPlayer.avatar,
      rankingText: newPlayer.rankingText,
      rankingScore: newPlayer.rankingScore,
      status: 'Active League Player',
      preferredDays: 'Evenings & Weekends',
      notes: newPlayer.bio || 'Joined TuesSlay League',
      joinedDate: newPlayer.joinedDate,
    };
    setMembers((prev) => [newMember, ...prev]);

    triggerConfetti(85);
    return newPlayer;
  };

  // Action: Fast 1-step player creation (e.g. from League or Create Game modal)
  const quickAddPlayer = (name: string, rankingScore = 4.0, leagueId = 'league-winter-slay') => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    return registerPlayer(
      {
        name: trimmed,
        email: `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@playslay.io`,
        avatar: '',
        rankingText: `Level ${rankingScore.toFixed(1)} - League Competitor`,
        rankingScore,
        rankingType: 'preset',
        playSide: 'Both Sides',
        dominantHand: 'Right',
        bio: 'Active Winter Padel Slay League player.',
      },
      leagueId
    );
  };

  // Action: Remove player from app, leagues, open games, and member directory
  const removePlayer = (playerId: string) => {
    setPlayers((prev) => {
      if (prev.length <= 1) return prev; // Always keep at least 1 active profile
      const target = prev.find((p) => p.id === playerId);
      const remaining = prev.filter((p) => p.id !== playerId);

      if (currentPlayerId === playerId && remaining[0]) {
        setCurrentPlayerId(remaining[0].id);
      }

      if (target) {
        setMembers((mPrev) =>
          mPrev.filter(
            (m) =>
              m.id !== playerId &&
              m.name.toLowerCase() !== target.name.toLowerCase() &&
              m.email.toLowerCase() !== target.email.toLowerCase()
          )
        );
      }

      return remaining;
    });

    setLeagues((prev) =>
      prev.map((l) => ({
        ...l,
        registeredPlayerIds: l.registeredPlayerIds.filter((id) => id !== playerId),
      }))
    );

    setGames((prev) =>
      prev.map((g) => {
        const nextPlayers = {
          slot1: g.players.slot1?.id === playerId ? undefined : g.players.slot1,
          slot2: g.players.slot2?.id === playerId ? undefined : g.players.slot2,
          slot3: g.players.slot3?.id === playerId ? undefined : g.players.slot3,
          slot4: g.players.slot4?.id === playerId ? undefined : g.players.slot4,
        };
        const filled = Object.values(nextPlayers).filter(Boolean).length;
        return {
          ...g,
          players: nextPlayers,
          status: filled >= 4 ? 'full' : 'open',
        };
      })
    );
  };

  // Action: Remove member from directory
  const removeMember = (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (target) {
      const matchingPlayer = players.find(
        (p) => p.name.toLowerCase() === target.name.toLowerCase()
      );
      if (matchingPlayer && players.length > 1) {
        removePlayer(matchingPlayer.id);
      }
    }
  };

  // Action: Add interested member (Express Interest)
  const addInterestedMember = (memberData: Omit<InterestedMember, 'id' | 'joinedDate'>) => {
    const newMember: InterestedMember = {
      ...memberData,
      id: `mem-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setMembers((prev) => [newMember, ...prev]);
    triggerConfetti(75);
    return newMember;
  };

  // Action: Rename a player across roster, matches, open fixtures, games, and members
  const renamePlayer = (playerId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const existingPlayer = players.find((p) => p.id === playerId);
    const oldName = existingPlayer?.name;

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p))
    );

    setMatches((prev) =>
      prev.map((m) => ({
        ...m,
        teamA: {
          ...m.teamA,
          player1:
            m.teamA.player1.id === playerId
              ? { ...m.teamA.player1, name: trimmed }
              : m.teamA.player1,
          player2:
            m.teamA.player2.id === playerId
              ? { ...m.teamA.player2, name: trimmed }
              : m.teamA.player2,
        },
        teamB: {
          ...m.teamB,
          player1:
            m.teamB.player1.id === playerId
              ? { ...m.teamB.player1, name: trimmed }
              : m.teamB.player1,
          player2:
            m.teamB.player2.id === playerId
              ? { ...m.teamB.player2, name: trimmed }
              : m.teamB.player2,
        },
      }))
    );

    setNextGameSession((prev) => {
      if (!prev) return prev;
      const nextResting: { [roundNumber: number]: Player[] } = {};
      for (const [rKey, rList] of Object.entries(prev.restingByRound)) {
        nextResting[Number(rKey)] = rList.map((p) =>
          p.id === playerId ? { ...p, name: trimmed } : p
        );
      }
      return {
        ...prev,
        fixtures: prev.fixtures.map((f) => ({
          ...f,
          teamA: {
            player1:
              f.teamA.player1.id === playerId
                ? { ...f.teamA.player1, name: trimmed }
                : f.teamA.player1,
            player2:
              f.teamA.player2.id === playerId
                ? { ...f.teamA.player2, name: trimmed }
                : f.teamA.player2,
          },
          teamB: {
            player1:
              f.teamB.player1.id === playerId
                ? { ...f.teamB.player1, name: trimmed }
                : f.teamB.player1,
            player2:
              f.teamB.player2.id === playerId
                ? { ...f.teamB.player2, name: trimmed }
                : f.teamB.player2,
          },
        })),
        restingByRound: nextResting,
      };
    });

    setGames((prev) =>
      prev.map((g) => ({
        ...g,
        hostName: g.hostId === playerId ? trimmed : g.hostName,
        players: {
          slot1:
            g.players.slot1?.id === playerId
              ? { ...g.players.slot1, name: trimmed }
              : g.players.slot1,
          slot2:
            g.players.slot2?.id === playerId
              ? { ...g.players.slot2, name: trimmed }
              : g.players.slot2,
          slot3:
            g.players.slot3?.id === playerId
              ? { ...g.players.slot3, name: trimmed }
              : g.players.slot3,
          slot4:
            g.players.slot4?.id === playerId
              ? { ...g.players.slot4, name: trimmed }
              : g.players.slot4,
        },
      }))
    );

    if (oldName) {
      setMembers((prev) =>
        prev.map((m) =>
          m.name.toLowerCase() === oldName.toLowerCase() ||
          (existingPlayer && m.email.toLowerCase() === existingPlayer.email.toLowerCase())
            ? { ...m, name: trimmed }
            : m
        )
      );
    }
  };

  // Action: Update player profile
  const updatePlayer = (updated: Player) => {
    const existing = players.find((p) => p.id === updated.id);
    if (existing && existing.name !== updated.name) {
      renamePlayer(updated.id, updated.name);
    }
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Action: Join Game slot
  const joinGameSlot = (
    gameId: string,
    slotKey: 'slot1' | 'slot2' | 'slot3' | 'slot4',
    player: Player
  ) => {
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
    triggerConfetti(55);
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
  const createGame = (
    gameData: Omit<PadelGame, 'id' | 'status' | 'hostId' | 'hostName' | 'maxPlayers'>
  ) => {
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
    triggerConfetti(75);
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

    triggerConfetti(90);
  };

  // Internal helper to build a RecordedMatch and update player stats
  const buildRecordedMatch = (params: {
    idSuffix?: string;
    leagueId: string;
    gameId?: string;
    sessionId?: string;
    date?: string;
    round?: string;
    timeSlot?: string;
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
    winnerTeam: 'A' | 'B' | 'Tie';
  }): RecordedMatch => {
    const matchDate = params.date ?? '';
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

    return {
      id: `match-${Date.now()}-${params.idSuffix || Math.floor(Math.random() * 10000)}`,
      gameId: params.gameId,
      sessionId: params.sessionId || `session-${matchDate}`,
      leagueId: params.leagueId,
      date: matchDate,
      round: params.round,
      timeSlot: params.timeSlot,
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
  };

  const applyMatchesToPlayers = (newMatchesList: RecordedMatch[]) => {
    setPlayers((prev) => {
      let current = [...prev];
      for (const m of newMatchesList) {
        current = current.map((player) => {
          const isTeamA =
            player.id === m.teamA.player1.id || player.id === m.teamA.player2.id;
          const isTeamB =
            player.id === m.teamB.player1.id || player.id === m.teamB.player2.id;

          if (!isTeamA && !isTeamB) return player;

          const isTie = m.winnerTeam === 'Tie';
          const isWinner =
            !isTie && ((isTeamA && m.winnerTeam === 'A') || (isTeamB && m.winnerTeam === 'B'));
          const pointsAwarded = isTeamA
            ? m.scoringBreakdown.totalTeamAPoints
            : m.scoringBreakdown.totalTeamBPoints;

          const rankGain = isTie ? 0.01 : isWinner ? 0.05 : -0.02;
          const newScore = Math.max(
            1.0,
            Math.min(7.0, parseFloat((player.rankingScore + rankGain).toFixed(2)))
          );

          return {
            ...player,
            rankingScore: newScore,
            matchesPlayed: player.matchesPlayed + 1,
            matchesWon: isWinner ? player.matchesWon + 1 : player.matchesWon,
            currentStreak: isWinner ? player.currentStreak + 1 : 0,
            weeklyPointsGained: player.weeklyPointsGained + pointsAwarded,
            weeklyRankDelta: parseFloat(
              (player.weeklyRankDelta + (isWinner ? 0.08 : 0.01)).toFixed(2)
            ),
          };
        });
      }
      return current;
    });
  };

  // Action: Record Match Score
  const recordMatchScore = (params: {
    leagueId: string;
    gameId?: string;
    sessionId?: string;
    date?: string;
    round?: string;
    timeSlot?: string;
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
    winnerTeam: 'A' | 'B' | 'Tie';
  }) => {
    const newMatch = buildRecordedMatch(params);

    setMatches((prev) => [...prev, newMatch]);
    applyMatchesToPlayers([newMatch]);

    // Ensure all 4 players are registered in this league
    const matchPlayerIds = [
      params.teamAPlayer1.id,
      params.teamAPlayer2.id,
      params.teamBPlayer1.id,
      params.teamBPlayer2.id,
    ];
    setLeagues((prev) =>
      prev.map((l) => {
        if (l.id !== params.leagueId) return l;
        const merged = Array.from(new Set([...l.registeredPlayerIds, ...matchPlayerIds]));
        return { ...l, registeredPlayerIds: merged };
      })
    );

    if (params.gameId) {
      setGames((prev) =>
        prev.map((g) => (g.id === params.gameId ? { ...g, status: 'completed' } : g))
      );
    }

    triggerConfetti(95);
    return newMatch;
  };

  // Action: Save newly generated 20-min Next Games session
  const saveNextGameSession = (session: NextGameSession) => {
    setNextGameSession(session);
    triggerConfetti(90);
  };

  // Action: Import Next Games session from CSV or Google Sheet (atomically adding any new players)
  const importNextGameSession = (params: {
    session: NextGameSession;
    newPlayers?: Player[];
    alsoCreateCourtBookings?: boolean;
  }) => {
    const {
      session,
      newPlayers = [],
      alsoCreateCourtBookings = false,
    } = params;

    if (newPlayers.length > 0) {
      setPlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
        const toAdd = newPlayers.filter(
          (np) =>
            !existingIds.has(np.id) &&
            !existingNames.has(np.name.toLowerCase())
        );
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });

      setUserSignUpPlans((prev) => {
        const next = { ...prev };
        for (const np of newPlayers) {
          if (!next[np.id]) {
            next[np.id] = 'both';
          }
        }
        return next;
      });

      setLeagues((prev) =>
        prev.map((l) => {
          if (l.id !== session.leagueId) return l;
          const merged = Array.from(
            new Set([
              ...l.registeredPlayerIds,
              ...newPlayers.map((np) => np.id),
            ])
          );
          return { ...l, registeredPlayerIds: merged };
        })
      );

      setMembers((prev) => {
        const existingNames = new Set(prev.map((m) => m.name.toLowerCase()));
        const addedMembers: InterestedMember[] = newPlayers
          .filter((np) => !existingNames.has(np.name.toLowerCase()))
          .map((np, idx) => ({
            id: `mem-csv-${Date.now()}-${idx}`,
            name: np.name,
            email: np.email,
            avatar: np.avatar,
            rankingText: np.rankingText,
            rankingScore: np.rankingScore,
            status: 'Active League Player',
            preferredDays: 'Evenings & Weekends',
            notes: 'Imported via CSV / Google Sheet',
            joinedDate:
              np.joinedDate || new Date().toISOString().split('T')[0],
          }));
        return addedMembers.length > 0 ? [...addedMembers, ...prev] : prev;
      });
    }

    setNextGameSession(session);

    if (alsoCreateCourtBookings && session.fixtures.length > 0) {
      const createdGames: PadelGame[] = session.fixtures.map((fix, idx) => {
        const slotStart =
          fix.timeSlot.split(/[–-]/)[0]?.trim() ||
          session.startTime ||
          '18:00';
        return {
          id: `game-import-${Date.now()}-${idx}`,
          courtName: fix.courtName,
          location: `TuesSlay Central Hub, ${fix.courtName}`,
          isIndoor: !fix.courtName.toLowerCase().includes('outdoor'),
          date:
            fix.date ||
            session.date ||
            new Date().toISOString().split('T')[0],
          time: slotStart,
          durationMinutes:
            fix.durationMinutes || session.durationPerRoundMinutes || 20,
          format: 'League Ranked Match',
          leagueId: session.leagueId,
          targetLevel: '3.5 - 4.5',
          pricePerPlayer: 14,
          hostId: currentPlayer.id,
          hostName: currentPlayer.name,
          players: {
            slot1: fix.teamA.player1,
            slot2: fix.teamA.player2,
            slot3: fix.teamB.player1,
            slot4: fix.teamB.player2,
          },
          maxPlayers: 4,
          status: 'full',
          notes: `${fix.roundLabel} (${fix.timeSlot}) • Imported from CSV / Google Sheet`,
        };
      });
      setGames((prev) => [...createdGames, ...prev]);
    }

    triggerConfetti(100);
  };

  // Action: Update draft score on a Next Games fixture card
  const updateFixtureDraftScore = (
    fixtureId: string,
    teamAScore: number | undefined,
    teamBScore: number | undefined
  ) => {
    setNextGameSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fixtures: prev.fixtures.map((f) =>
          f.id === fixtureId ? { ...f, teamAScore, teamBScore } : f
        ),
      };
    });
  };

  // Action: Update Next Game Session date
  const updateNextSessionDate = (newDate: string) => {
    setNextGameSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        date: newDate,
        fixtures: prev.fixtures.map((f) => ({ ...f, date: newDate })),
      };
    });
  };

  // Action: Record a single fixture from Next Games into League Standings & Last Games
  const recordSingleFixture = (
    fixtureId: string,
    overrideScores?: { teamAScore: number; teamBScore: number }
  ) => {
    if (!nextGameSession) return null;
    const fix = nextGameSession.fixtures.find((f) => f.id === fixtureId);
    if (!fix || fix.completed) return null;

    const sA = overrideScores ? overrideScores.teamAScore : fix.teamAScore;
    const sB = overrideScores ? overrideScores.teamBScore : fix.teamBScore;
    if (sA === undefined || sB === undefined) return null;

    const winnerTeam: 'A' | 'B' | 'Tie' = sA > sB ? 'A' : sB > sA ? 'B' : 'Tie';
    const recorded = buildRecordedMatch({
      idSuffix: fix.id,
      leagueId: fix.leagueId,
      sessionId: nextGameSession.id,
      date: nextGameSession.date,
      round: fix.roundLabel,
      timeSlot: fix.timeSlot,
      courtName: fix.courtName,
      teamAPlayer1: fix.teamA.player1,
      teamAPlayer2: fix.teamA.player2,
      teamBPlayer1: fix.teamB.player1,
      teamBPlayer2: fix.teamB.player2,
      setScores: [`${sA}-${sB}`],
      teamASetsWon: winnerTeam === 'A' ? 1 : 0,
      teamBSetsWon: winnerTeam === 'B' ? 1 : 0,
      teamAPointsWon: sA,
      teamBPointsWon: sB,
      winnerTeam,
    });

    setMatches((prev) => [...prev, recorded]);
    applyMatchesToPlayers([recorded]);

    setNextGameSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fixtures: prev.fixtures.map((f) =>
          f.id === fixtureId
            ? {
                ...f,
                teamAScore: sA,
                teamBScore: sB,
                completed: true,
                recordedMatchId: recorded.id,
              }
            : f
        ),
      };
    });

    triggerConfetti(70);
    return recorded;
  };

  // Action: Record all fixtures in Next Games that have both scores filled in
  const recordAllScoredFixtures = () => {
    if (!nextGameSession) return 0;
    const readyFixtures = nextGameSession.fixtures.filter(
      (f) => !f.completed && f.teamAScore !== undefined && f.teamBScore !== undefined
    );
    if (readyFixtures.length === 0) return 0;

    const newRecordedMatches: RecordedMatch[] = readyFixtures.map((fix, idx) => {
      const sA = fix.teamAScore ?? 0;
      const sB = fix.teamBScore ?? 0;
      const winnerTeam: 'A' | 'B' | 'Tie' = sA > sB ? 'A' : sB > sA ? 'B' : 'Tie';
      return buildRecordedMatch({
        idSuffix: `${fix.id}-${idx}`,
        leagueId: fix.leagueId,
        sessionId: nextGameSession.id,
        date: nextGameSession.date,
        round: fix.roundLabel,
        timeSlot: fix.timeSlot,
        courtName: fix.courtName,
        teamAPlayer1: fix.teamA.player1,
        teamAPlayer2: fix.teamA.player2,
        teamBPlayer1: fix.teamB.player1,
        teamBPlayer2: fix.teamB.player2,
        setScores: [`${sA}-${sB}`],
        teamASetsWon: winnerTeam === 'A' ? 1 : 0,
        teamBSetsWon: winnerTeam === 'B' ? 1 : 0,
        teamAPointsWon: sA,
        teamBPointsWon: sB,
        winnerTeam,
      });
    });

    const recordedById = new Map<string, string>();
    readyFixtures.forEach((f, idx) => {
      recordedById.set(f.id, newRecordedMatches[idx].id);
    });

    setMatches((prev) => [...prev, ...newRecordedMatches]);
    applyMatchesToPlayers(newRecordedMatches);

    setNextGameSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fixtures: prev.fixtures.map((f) =>
          recordedById.has(f.id)
            ? { ...f, completed: true, recordedMatchId: recordedById.get(f.id) }
            : f
        ),
      };
    });

    triggerConfetti(120);
    return newRecordedMatches.length;
  };

  // Action: Update date on an existing recorded session or date group
  const updateRecordedSessionDate = (sessionKey: string, newDate: string) => {
    if (!newDate) return;
    setMatches((prev) =>
      prev.map((m) => {
        const sKey = m.sessionId || m.date || 'session-spreadsheet-1';
        const dKey = m.date ? `date:${m.date}` : sKey;
        if (sKey !== sessionKey && dKey !== sessionKey && m.date !== sessionKey) {
          return m;
        }
        return { ...m, date: newDate };
      })
    );
  };

  // Calculate dynamic league standings for any league
  const getLeagueStandings = (leagueId: string): LeagueStanding[] => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return [];

    const activePlayersMap = new Map<string, Player>();
    players.forEach((p) => activePlayersMap.set(p.id, p));

    const standingsMap = new Map<
      string,
      {
        player: Player;
        played: number;
        won: number;
        lost: number;
        drawn: number;
        pointsWon: number;
        pointsLost: number;
        leaguePoints: number;
        form: ('W' | 'L' | 'D')[];
        streak: number;
      }
    >();

    // Only include active players registered in the league (removed players stay removed)
    league.registeredPlayerIds.forEach((pid) => {
      const p = activePlayersMap.get(pid);
      if (p) {
        standingsMap.set(pid, {
          player: p,
          played: 0,
          won: 0,
          lost: 0,
          drawn: 0,
          pointsWon: 0,
          pointsLost: 0,
          leaguePoints: 0,
          form: [],
          streak: 0,
        });
      }
    });

    const leagueMatches = matches
      .filter((m) => m.leagueId === leagueId)
      .slice()
      .sort((a, b) => {
        const dA = a.date || '';
        const dB = b.date || '';
        if (dA && dB && dA !== dB) return dA.localeCompare(dB);
        return 0;
      });

    // Rolling form tracks ONLY the last recorded set (session) of games
    const lastMatch = leagueMatches[leagueMatches.length - 1];
    const latestSessionKey = lastMatch
      ? lastMatch.sessionId || lastMatch.date || 'session-spreadsheet-1'
      : null;

    leagueMatches.forEach((m) => {
      const mSessionKey = m.sessionId || m.date || 'session-spreadsheet-1';
      const isLatestSession = latestSessionKey !== null && mSessionKey === latestSessionKey;
      const teamAPlayerIds = [m.teamA.player1.id, m.teamA.player2.id];
      const teamBPlayerIds = [m.teamB.player1.id, m.teamB.player2.id];
      const ptsA = weightedScoringEnabled
        ? m.scoringBreakdown.totalTeamAPoints
        : m.teamA.pointsWon;
      const ptsB = weightedScoringEnabled
        ? m.scoringBreakdown.totalTeamBPoints
        : m.teamB.pointsWon;

      teamAPlayerIds.forEach((pid) => {
        const entry = standingsMap.get(pid);
        if (!entry) return; // Player was removed from roster/league

        entry.played += 1;
        entry.pointsWon += m.teamA.pointsWon;
        entry.pointsLost += m.teamB.pointsWon;
        entry.leaguePoints += ptsA;

        if (m.winnerTeam === 'A') {
          entry.won += 1;
          if (isLatestSession) entry.form.push('W');
          entry.streak = entry.streak >= 0 ? entry.streak + 1 : 1;
        } else if (m.winnerTeam === 'B') {
          entry.lost += 1;
          if (isLatestSession) entry.form.push('L');
          entry.streak = entry.streak <= 0 ? entry.streak - 1 : -1;
        } else {
          entry.drawn += 1;
          if (isLatestSession) entry.form.push('D');
          entry.streak = 0;
        }
      });

      teamBPlayerIds.forEach((pid) => {
        const entry = standingsMap.get(pid);
        if (!entry) return;

        entry.played += 1;
        entry.pointsWon += m.teamB.pointsWon;
        entry.pointsLost += m.teamA.pointsWon;
        entry.leaguePoints += ptsB;

        if (m.winnerTeam === 'B') {
          entry.won += 1;
          if (isLatestSession) entry.form.push('W');
          entry.streak = entry.streak >= 0 ? entry.streak + 1 : 1;
        } else if (m.winnerTeam === 'A') {
          entry.lost += 1;
          if (isLatestSession) entry.form.push('L');
          entry.streak = entry.streak <= 0 ? entry.streak - 1 : -1;
        } else {
          entry.drawn += 1;
          if (isLatestSession) entry.form.push('D');
          entry.streak = 0;
        }
      });
    });

    const result: LeagueStanding[] = Array.from(standingsMap.values()).map((val) => ({
      playerId: val.player.id,
      player: val.player,
      played: val.played,
      won: val.won,
      lost: val.lost,
      drawn: val.drawn,
      pointsWon: val.pointsWon,
      pointsLost: val.pointsLost,
      pointDiff: val.pointsWon - val.pointsLost,
      leaguePoints: val.leaguePoints,
      form: val.form,
      streak: val.streak,
      rank: 1,
    }));

    result.sort((a, b) => {
      if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      if (b.won !== a.won) return b.won - a.won;
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
    const winRate =
      top.matchesPlayed > 0 ? Math.round((top.matchesWon / top.matchesPlayed) * 100) : 100;

    return {
      player: top,
      pointsGained: top.weeklyPointsGained,
      rankDelta: top.weeklyRankDelta,
      winRate,
      streak: top.currentStreak,
      commentary: `${top.name} leads TuesSlay with +${top.weeklyPointsGained} league points gained and a +${top.weeklyRankDelta} rating surge!`,
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
    setNextGameSession(null);
    setCurrentPlayerId(
      INITIAL_PLAYERS.find((p) => p.id === DEFAULT_ACTIVE_PLAYER_ID)?.id ||
        INITIAL_PLAYERS[0].id
    );
    setUserSignUpPlans(buildDefaultPlans(INITIAL_PLAYERS));
    setViewMode('web');
    setWeightedScoringEnabled(false);
  };

  return {
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    members,
    nextGameSession,
    currentPlayer,
    currentPlayerId,
    setCurrentPlayerId,
    userSignUpPlans,
    selectSignUpOption,
    viewMode,
    setViewMode,
    cloudSyncStatus,
    weightedScoringEnabled,
    setWeightedScoringEnabled,
    registerPlayer,
    quickAddPlayer,
    removePlayer,
    removeMember,
    addInterestedMember,
    renamePlayer,
    updatePlayer,
    joinGameSlot,
    leaveGameSlot,
    createGame,
    registerForLeague,
    recordMatchScore,
    saveNextGameSession,
    importNextGameSession,
    clearNextGameSession: () => setNextGameSession(null),
    updateFixtureDraftScore,
    updateNextSessionDate,
    recordSingleFixture,
    recordAllScoredFixtures,
    updateRecordedSessionDate,
    getLeagueStandings,
    getMostImprovedPlayer,
    resetToDefaults,
  };
}
