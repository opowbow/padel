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
import { PadelGame, SignUpOption } from './types/padel';

export function App() {
  const {
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
  } = usePadelState();

  const [activeTab, setActiveTab] = useState<TabType>('games');
  const [activeLeagueId, setActiveLeagueId] = useState<string>(leagues[0]?.id || 'league-winter-slay');
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignUpOptionsOpen, setIsSignUpOptionsOpen] = useState(false);
  const [signUpOptionDefault, setSignUpOptionDefault] = useState<SignUpOption>('both');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedGameForScore, setSelectedGameForScore] = useState<PadelGame | null>(null);

  const standings = getLeagueStandings(activeLeagueId);
  const mostImproved = getMostImprovedPlayer();

  const handleOpenSignUpOptions = (defaultChoice: SignUpOption = 'both') => {
    setSignUpOptionDefault(defaultChoice);
    setIsSignUpOptionsOpen(true);
  };

  const handleOpenRecordScore = (gameOrLeagueId?: PadelGame | string) => {
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

  // Render content matching active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* The Two Main Cards: Mixin Magic & Winter Padel Slay League */}
            <HomeHeroCards
              onNavigateToGames={() => setActiveTab('games')}
              onNavigateToLeague={() => setActiveTab('league')}
              onNavigateToMembers={() => setActiveTab('members')}
              onOpenRecordScore={() => handleOpenRecordScore(activeLeagueId)}
              topStandings={standings}
              activeGames={games}
            />

            {/* Quick Mixin Games Preview on Court */}
            <div className="pt-2">
              <GamesView
                games={games}
                currentPlayer={currentPlayer}
                onJoinSlot={joinGameSlot}
                onLeaveSlot={leaveGameSlot}
                onCreateGame={createGame}
                onOpenRecordScore={handleOpenRecordScore}
                onOpenSignUpOptions={() => handleOpenSignUpOptions('mixin')}
                currentPlan={userSignUpPlans[currentPlayer.id]}
              />
            </div>
          </div>
        );

      case 'games':
        return (
          <GamesView
            games={games}
            currentPlayer={currentPlayer}
            onJoinSlot={joinGameSlot}
            onLeaveSlot={leaveGameSlot}
            onCreateGame={createGame}
            onOpenRecordScore={handleOpenRecordScore}
            onOpenSignUpOptions={() => handleOpenSignUpOptions('mixin')}
            currentPlan={userSignUpPlans[currentPlayer.id]}
          />
        );

      case 'league':
        return (
          <LeagueView
            leagues={leagues}
            activeLeagueId={activeLeagueId}
            onSelectLeague={setActiveLeagueId}
            standings={standings}
            matches={matches}
            currentPlayer={currentPlayer}
            onRegisterForLeague={registerForLeague}
            onOpenRecordScore={handleOpenRecordScore}
            weightedScoring={weightedScoringEnabled}
            onOpenSignUpOptions={() => handleOpenSignUpOptions('league')}
            currentPlan={userSignUpPlans[currentPlayer.id]}
          />
        );

      case 'members':
        return (
          <MembersView
            members={members}
            onAddMember={addInterestedMember}
            onOpenSignUpPlayer={() => setIsSignUpOpen(true)}
          />
        );

      case 'improved':
        return (
          <MostImprovedView
            mostImprovedData={mostImproved}
            historicalAwards={weeklyAwards}
          />
        );

      case 'profile':
        return (
          <ProfileView
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
        onOpenMembers={() => setActiveTab('members')}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        weightedScoring={weightedScoringEnabled}
        onToggleWeightedScoring={() => setWeightedScoringEnabled(!weightedScoringEnabled)}
        onResetData={resetToDefaults}
      />

      {/* Main View Area: Mobile View vs Web View */}
      {viewMode === 'mobile' ? (
        <MobileFrame
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onSwitchToWeb={() => setViewMode('web')}
        >
          {renderTabContent()}
        </MobileFrame>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Desktop Sub Navigation Tabs */}
          <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* Active Tab Content */}
          <div className="animate-in fade-in duration-300">
            {renderTabContent()}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sky-400 tracking-wider">PadelSlay</span>
            <span>• Padel Mixin Magic & Winter Padel Slay League</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Designated Court Bookings</span>
            <span>•</span>
            <span>Top 4 Slay Titans Leaderboard</span>
            <span>•</span>
            <span>Weighted Win Upset Bonus Engine</span>
          </div>
        </div>
      </footer>

      {/* Player Sign Up Modal */}
      <PlayerSignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onRegister={registerPlayer}
      />

      {/* Multi-Option Sign Up Modal (Mixin, League, Both, Casual) */}
      <SignUpOptionsModal
        isOpen={isSignUpOptionsOpen}
        onClose={() => setIsSignUpOptionsOpen(false)}
        currentPlayer={currentPlayer}
        currentPlan={userSignUpPlans[currentPlayer.id]}
        defaultOption={signUpOptionDefault}
        onConfirmSignUp={(option, notes) => selectSignUpOption(option, currentPlayer.id, notes)}
      />

      {/* Record Match Score Modal */}
      <ScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => {
          setIsScoreModalOpen(false);
          setSelectedGameForScore(null);
        }}
        leagues={leagues}
        players={players}
        activePlayer={currentPlayer}
        weightedScoring={weightedScoringEnabled}
        preselectedLeagueId={activeLeagueId}
        preselectedGameId={selectedGameForScore?.id}
        preselectedPlayers={selectedGameForScore?.players}
        onRecordScore={recordMatchScore}
      />
    </div>
  );
}

export default App;
