import React from 'react';
import { CalendarDays, Trophy, Sparkles, UserCheck } from 'lucide-react';

export type TabType = 'games' | 'league' | 'improved' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isMobileBottomBar?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isMobileBottomBar = false,
}) => {
  const tabs = [
    {
      id: 'games' as TabType,
      label: 'Games Booking',
      icon: CalendarDays,
      badge: '4-Player',
    },
    {
      id: 'league' as TabType,
      label: 'League & Rankings',
      icon: Trophy,
      badge: 'Points',
    },
    {
      id: 'improved' as TabType,
      label: 'Player of Week',
      icon: Sparkles,
      badge: 'MVP',
    },
    {
      id: 'profile' as TabType,
      label: 'My Ranking & Stats',
      icon: UserCheck,
      badge: undefined,
    },
  ];

  if (isMobileBottomBar) {
    return (
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-lime-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[8px] font-black px-1 rounded-full bg-lime-400 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Desktop Navigation Tabs
  return (
    <nav className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
              isActive
                ? 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/20'
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase ${
                  isActive
                    ? 'bg-slate-950 text-lime-400'
                    : 'bg-lime-400/15 text-lime-400 border border-lime-400/30'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
