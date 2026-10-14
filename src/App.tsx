import React, { useState } from 'react';
import { usePadelState } from './hooks/usePadelState';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { GamesView } from './components/GamesView';
import { LeagueView } from './components/LeagueView';
import { MostImprovedView } from './components/MostImprovedView';
import { ProfileView } from './components/ProfileView';
import { MobileFrame } from './components/MobileFrame';
import { PlayerSignUpModal } from './components/PlayerSignUpModal';
import { ScoreModal } from './components/ScoreModal';
import { PadelGame } from './types/padel';

export function App() {
  const {
    players,
    games,
    leagues,
    matches,
    weeklyAwards,
    currentPlayer,
    setCurrentPlayerId,
    viewMode,
    setViewMode,
    weightedScoringEnabled,
    setWeightedScoringEnabled,
    registerPlayer,
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
  const [activeLeagueId, setActiveLeagueId] = useState<string>(leagues[0]?.id || 'league-1');
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedGameForScore, setSelectedGameForScore] = useState<PadelGame | null>(null);

  const standings = getLeagueStandings(activeLeagueId);
  const mostImproved = getMostImprovedPlayer();

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
      case 'games':
        return (
          <GamesView
            games={games}
            currentPlayer={currentPlayer}
            onJoinSlot={joinGameSlot}
            onLeaveSlot={leaveGameSlot}
            onCreateGame={createGame}
            onOpenRecordScore={handleOpenRecordScore}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 padel-gradient-bg flex flex-col selection:bg-lime-400 selection:text-slate-950">
      {/* Top Main Navigation Header */}
      <Header
        currentPlayer={currentPlayer}
        players={players}
        onSelectPlayer={setCurrentPlayerId}
        onOpenSignUp={() => setIsSignUpOpen(true)}
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
            <span className="font-black text-slate-400 tracking-wider">PADELSMASH</span>
            <span>• Modern Group Booking, Ranking Engine & Leagues</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Points Won/Lost Delta Recording</span>
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
