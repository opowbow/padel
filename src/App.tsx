import React, { useState } from 'react';
import { usePadelState } from './hooks/usePadelState';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { HomeHeroCards } from './components/HomeHeroCards';
import { GamesView } from './components/GamesView';
import { LeagueView } from './components/LeagueView';
import { MembersView } from './components/MembersView';
import { MostImprovedView } from './components/MostImprovedView';
import { ProfileView } from './components/ProfileView';
import { MobileFrame } from './components/MobileFrame';
import { PlayerSignUpModal } from './components/PlayerSignUpModal';
import { SignUpOptionsModal } from './components/SignUpOptionsModal';
import { ScoreModal } from './components/ScoreModal';
import { CreateGameSessionModal } from './components/CreateGameSessionModal';
import { ImportNextGamesModal } from './components/ImportNextGamesModal';
import { ManagePlayersModal } from './components/ManagePlayersModal';
import { TasksModal } from './components/TasksModal';
import { PadelGame, RecordedMatch, SignUpOption } from './types/padel';

export function App() {
  const {
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    members,
    nextGameSession,
    starOfTheNight,
    currentPlayer,
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
    recordMatchScore,
    updateRecordedMatch,
    deleteRecordedMatch,
    saveNextGameSession,
    importNextGameSession,
    updateFixtureDraftScore,
    updateNextSessionDate,
    recordSingleFixture,
    recordAllScoredFixtures,
    updateRecordedSessionDate,
    updateStarOfTheNight,
    getLeagueStandings,
    getWeeklyMvp,
    resetToDefaults,
  } = usePadelState();

  // Default both Main Web View and Mobile View to 'league' (Top 3 Rankings + Full League underneath)
  const [activeTab, setActiveTab] = useState<TabType>('league');
  const [leagueGamesPanel, setLeagueGamesPanel] = useState<'last' | 'next' | null>(null);

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setLeagueGamesPanel(null);
  };

  const handleGoHome = () => {
    setActiveTab('league');
    setLeagueGamesPanel(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [activeLeagueId, setActiveLeagueId] = useState<string>(
    leagues[0]?.id || 'league-winter-slay'
  );
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignUpOptionsOpen, setIsSignUpOptionsOpen] = useState(false);
  const [signUpOptionDefault, setSignUpOptionDefault] = useState<SignUpOption>('both');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedGameForScore, setSelectedGameForScore] = useState<PadelGame | null>(null);
  const [editingMatchForScore, setEditingMatchForScore] = useState<RecordedMatch | null>(null);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isImportNextGamesOpen, setIsImportNextGamesOpen] = useState(false);
  const [importDefaultCreateBookings, setImportDefaultCreateBookings] = useState(false);
  const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);

  const openImportModal = (createBookingsByDefault = false) => {
    setImportDefaultCreateBookings(createBookingsByDefault);
    setIsImportNextGamesOpen(true);
  };

  const standings = getLeagueStandings(activeLeagueId);
  const weeklyMvp = getWeeklyMvp(activeLeagueId);

  const handleOpenSignUpOptions = (defaultChoice: SignUpOption = 'both') => {
    setSignUpOptionDefault(defaultChoice);
    setIsSignUpOptionsOpen(true);
  };

  const handleOpenRecordScore = (gameOrLeagueId?: PadelGame | string) => {
    setEditingMatchForScore(null);
    if (typeof gameOrLeagueId === 'string') {
      setActiveLeagueId(gameOrLeagueId);
      setSelectedGameForScore(null);
    } else if (gameOrLeagueId) {
      setSelectedGameForScore(gameOrLeagueId);
      if (gameOrLeagueId.leagueId) {
        setActiveLeagueId(gameOrLeagueId.leagueId);
      }
    } else {
      setSelectedGameForScore(null);
    }
    setIsScoreModalOpen(true);
  };

  const handleOpenEditMatch = (match: RecordedMatch) => {
    setSelectedGameForScore(null);
    setEditingMatchForScore(match);
    if (match.leagueId) {
      setActiveLeagueId(match.leagueId);
    }
    setIsScoreModalOpen(true);
  };

  const handleQuickUpdateRecordedScore = (
    matchId: string,
    teamAPointsWon: number,
    teamBPointsWon: number
  ) => {
    updateRecordedMatch(matchId, { teamAPointsWon, teamBPointsWon });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            <HomeHeroCards
              onNavigateToGames={() => handleSelectTab('games')}
              onNavigateToLeague={() => handleSelectTab('league')}
              onNavigateToMembers={() => handleSelectTab('members')}
              onOpenRecordScore={() => handleOpenRecordScore(activeLeagueId)}
              topStandings={standings}
              weeklyMvp={weeklyMvp}
              starOfTheNight={starOfTheNight}
              activeGames={games}
            />

            <div className="pt-2">
              <LeagueView
                leagues={leagues}
                activeLeagueId={activeLeagueId}
                onSelectLeague={setActiveLeagueId}
                players={players}
                standings={standings}
                weeklyMvp={weeklyMvp}
                starOfTheNight={starOfTheNight}
                onUpdateStarOfTheNight={updateStarOfTheNight}
                matches={matches}
                currentPlayer={currentPlayer}
                nextGameSession={nextGameSession}
                onOpenRecordScore={handleOpenRecordScore}
                onOpenCreateGameSession={() => setIsCreateSessionOpen(true)}
                onOpenImportNextGames={() => openImportModal(false)}
                onOpenManagePlayers={() => setIsManagePlayersOpen(true)}
                onOpenTasks={() => setIsTasksOpen(true)}
                onRenamePlayer={renamePlayer}
                onUpdateFixtureDraftScore={updateFixtureDraftScore}
                onUpdateNextSessionDate={updateNextSessionDate}
                onRecordSingleFixture={recordSingleFixture}
                onRecordAllScoredFixtures={recordAllScoredFixtures}
                onUpdateRecordedSessionDate={updateRecordedSessionDate}
                weightedScoring={weightedScoringEnabled}
                activeGamesPanel={leagueGamesPanel}
                onChangeGamesPanel={setLeagueGamesPanel}
              />
            </div>
          </div>
        );

      case 'games':
        return (
          <GamesView
            games={games}
            matches={matches}
            players={players}
            currentPlayer={currentPlayer}
            onJoinSlot={joinGameSlot}
            onLeaveSlot={leaveGameSlot}
            onCreateGame={createGame}
            onOpenRecordScore={handleOpenRecordScore}
            onQuickAddPlayer={(name, score) => quickAddPlayer(name, score, activeLeagueId)}
            onOpenSignUpOptions={() => handleOpenSignUpOptions('mixin')}
            onOpenImportNextGames={() => openImportModal(true)}
            currentPlan={userSignUpPlans[currentPlayer.id]}
          />
        );

      case 'league':
        return (
          <LeagueView
            leagues={leagues}
            activeLeagueId={activeLeagueId}
            onSelectLeague={setActiveLeagueId}
            players={players}
            standings={standings}
            weeklyMvp={weeklyMvp}
            starOfTheNight={starOfTheNight}
            onUpdateStarOfTheNight={updateStarOfTheNight}
            matches={matches}
            currentPlayer={currentPlayer}
            nextGameSession={nextGameSession}
            onOpenRecordScore={handleOpenRecordScore}
            onOpenCreateGameSession={() => setIsCreateSessionOpen(true)}
            onOpenImportNextGames={() => openImportModal(false)}
            onOpenManagePlayers={() => setIsManagePlayersOpen(true)}
            onOpenTasks={() => setIsTasksOpen(true)}
            onRenamePlayer={renamePlayer}
            onUpdateFixtureDraftScore={updateFixtureDraftScore}
            onUpdateNextSessionDate={updateNextSessionDate}
            onRecordSingleFixture={recordSingleFixture}
            onRecordAllScoredFixtures={recordAllScoredFixtures}
            onUpdateRecordedSessionDate={updateRecordedSessionDate}
            weightedScoring={weightedScoringEnabled}
            activeGamesPanel={leagueGamesPanel}
            onChangeGamesPanel={setLeagueGamesPanel}
          />
        );

      case 'members':
        return (
          <MembersView
            members={members}
            onAddMember={addInterestedMember}
            onRemoveMember={removeMember}
            onOpenManagePlayers={() => setIsManagePlayersOpen(true)}
            onOpenSignUpPlayer={() => setIsSignUpOpen(true)}
          />
        );

      case 'improved':
        return (
          <MostImprovedView
            weeklyMvp={weeklyMvp}
            starOfTheNight={starOfTheNight}
            players={players}
            currentPlayer={currentPlayer}
            onUpdateStarOfTheNight={updateStarOfTheNight}
            historicalAwards={weeklyAwards}
          />
        );

      case 'profile':
        return (
          <ProfileView
            key={currentPlayer.id}
            currentPlayer={currentPlayer}
            onUpdatePlayer={updatePlayer}
            onOpenSignUp={() => setIsSignUpOpen(true)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 padel-gradient-bg flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        currentPlayer={currentPlayer}
        players={players}
        onSelectPlayer={setCurrentPlayerId}
        onOpenSignUp={() => setIsSignUpOpen(true)}
        onOpenMembers={() => setIsManagePlayersOpen(true)}
        onOpenTasks={() => setIsTasksOpen(true)}
        onGoHome={handleGoHome}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        cloudSyncStatus={cloudSyncStatus}
        weightedScoring={weightedScoringEnabled}
        onToggleWeightedScoring={() => setWeightedScoringEnabled(!weightedScoringEnabled)}
        onResetData={resetToDefaults}
      />

      {/* Main View Area: Mobile View vs Web View */}
      {viewMode === 'mobile' ? (
        <MobileFrame
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onSwitchToWeb={() => setViewMode('web')}
        >
          {renderTabContent()}
        </MobileFrame>
      ) : (
        <main className="@container flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
          {/* Desktop Sub Navigation Tabs */}
          <Navigation activeTab={activeTab} onSelectTab={handleSelectTab} />

          {/* Active Tab Content */}
          <div className="animate-in fade-in duration-300">{renderTabContent()}</div>
        </main>
      )}

      {/* Footer (hidden on small mobile screens when bottom tab bar is fixed) */}
      <footer
        className={`mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 ${
          viewMode === 'mobile' ? 'hidden sm:block' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sky-400 tracking-wider">TuesSlay</span>
            <span>• Winter Padel Slay League & 20-Min Smart Rotations</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>History-Smart Random Teams</span>
            <span>•</span>
            <span>Leader, Weekly MVP & Star of the Night</span>
            <span>•</span>
            <span>Voice & One-Tap Score Input</span>
          </div>
        </div>
      </footer>

      {/* Create Game (20-Min Smart Fixtures) Modal */}
      <CreateGameSessionModal
        isOpen={isCreateSessionOpen}
        onClose={() => setIsCreateSessionOpen(false)}
        leagueId={activeLeagueId}
        players={players}
        previousMatches={matches.filter((m) => m.leagueId === activeLeagueId)}
        onSaveSession={(session) => {
          saveNextGameSession(session);
          setActiveTab('league');
          setLeagueGamesPanel('next');
        }}
        onQuickAddPlayer={(name, score) => quickAddPlayer(name, score, activeLeagueId)}
        onRenamePlayer={renamePlayer}
        onRemovePlayer={removePlayer}
        onOpenFullSignUp={() => setIsSignUpOpen(true)}
        onOpenImportNextGames={() => openImportModal(false)}
      />

      {/* Import Next Games from CSV or Google Sheet Modal */}
      <ImportNextGamesModal
        key={`import-${isImportNextGamesOpen ? 'open' : 'closed'}-${importDefaultCreateBookings}`}
        isOpen={isImportNextGamesOpen}
        onClose={() => setIsImportNextGamesOpen(false)}
        leagueId={activeLeagueId}
        players={players}
        previousMatches={matches.filter((m) => m.leagueId === activeLeagueId)}
        defaultAlsoCreateBookings={importDefaultCreateBookings}
        onImportSession={({ session, newPlayers, alsoCreateCourtBookings }) => {
          importNextGameSession({
            session,
            newPlayers,
            alsoCreateCourtBookings,
          });
          setActiveTab('league');
          setLeagueGamesPanel('next');
        }}
      />

      {/* Tasks Modal (Tasks -> Scores -> Edit: search player & edit game scores) */}
      <TasksModal
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        players={players}
        matches={matches}
        weightedScoring={weightedScoringEnabled}
        onQuickUpdateScore={handleQuickUpdateRecordedScore}
        onOpenFullEditMatch={handleOpenEditMatch}
        onOpenAddScore={() => handleOpenRecordScore(activeLeagueId)}
        onOpenManagePlayers={() => setIsManagePlayersOpen(true)}
        onOpenImportNextGames={() => openImportModal(false)}
      />

      {/* Manage Players (Add / Edit / Remove Players) Modal */}
      <ManagePlayersModal
        isOpen={isManagePlayersOpen}
        onClose={() => setIsManagePlayersOpen(false)}
        players={players}
        onQuickAddPlayer={(name, score) => quickAddPlayer(name, score, activeLeagueId)}
        onRenamePlayer={renamePlayer}
        onRemovePlayer={removePlayer}
        onOpenFullSignUp={() => setIsSignUpOpen(true)}
      />

      {/* Full Player Profile Sign Up Modal */}
      <PlayerSignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onRegister={(data) => registerPlayer(data, activeLeagueId)}
      />

      {/* Multi-Option Sign Up Modal */}
      <SignUpOptionsModal
        isOpen={isSignUpOptionsOpen}
        onClose={() => setIsSignUpOptionsOpen(false)}
        currentPlayer={currentPlayer}
        currentPlan={userSignUpPlans[currentPlayer.id]}
        defaultOption={signUpOptionDefault}
        onConfirmSignUp={(option, notes) => selectSignUpOption(option, currentPlayer.id, notes)}
      />

      {/* Easy & Voice Match Score Modal (Add or Edit Any Match Score) */}
      <ScoreModal
        key={`${activeLeagueId}-${selectedGameForScore?.id || editingMatchForScore?.id || 'manual'}`}
        isOpen={isScoreModalOpen}
        onClose={() => {
          setIsScoreModalOpen(false);
          setSelectedGameForScore(null);
          setEditingMatchForScore(null);
        }}
        leagues={leagues}
        players={players}
        activePlayer={currentPlayer}
        weightedScoring={weightedScoringEnabled}
        preselectedLeagueId={activeLeagueId}
        preselectedGameId={selectedGameForScore?.id}
        preselectedPlayers={selectedGameForScore?.players}
        editingMatch={editingMatchForScore}
        onRecordScore={recordMatchScore}
        onUpdateScore={updateRecordedMatch}
        onDeleteMatch={deleteRecordedMatch}
      />
    </div>
  );
}

export default App;
