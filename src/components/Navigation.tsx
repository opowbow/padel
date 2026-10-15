import React from 'react';
import { Home, CalendarDays, Trophy, Users, Sparkles, UserCheck, Flame } from 'lucide-react';

export type TabType = 'home' | 'games' | 'league' | 'members' | 'improved' | 'profile';

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
      label: 'Mixin Magic',
      mobileLabel: 'Mixin',
      icon: CalendarDays,
      badge: 'Courts',
      isLeague: false,
    },
    {
      id: 'league' as TabType,
      label: 'Winter Padel Slay League',
      mobileLabel: 'Winter Slay',
      icon: Trophy,
      badge: 'Top 4',
      isLeague: true, // Specifically animated to draw attention
    },
    {
      id: 'home' as TabType,
      label: 'Hub',
      mobileLabel: 'Hub',
      icon: Home,
      badge: undefined,
      isLeague: false,
    },
    {
      id: 'members' as TabType,
      label: 'Members List',
      mobileLabel: 'Members',
      icon: Users,
      badge: 'Join',
      isLeague: false,
    },
    {
      id: 'improved' as TabType,
      label: 'MVP of Week',
      mobileLabel: 'MVP',
      icon: Sparkles,
      badge: undefined,
      isLeague: false,
    },
    {
      id: 'profile' as TabType,
      label: 'My Ranking',
      mobileLabel: 'Ranking',
      icon: UserCheck,
      badge: undefined,
      isLeague: false,
    },
  ];

  if (isMobileBottomBar) {
    return (
      <nav className="w-full flex items-center justify-between px-1 py-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isLeague) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                    : 'text-sky-300 hover:text-white bg-slate-800/90 border border-sky-400/50 animate-league-attract'
                }`}
              >
                {/* Animated Attention Glow Beacon */}
                <span className="absolute -top-2.5 right-1/2 translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[8px] font-black uppercase tracking-wider shadow-md animate-bounce">
                  <Flame className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300 animate-flame-shimmer" />
                  <span>HOT</span>
                </span>

                <div className="relative mt-1">
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5] text-white' : 'text-sky-400'}`} />
                </div>
                <span className={`text-[8.5px] mt-0.5 tracking-tight font-black uppercase whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-sky-300'
                }`}>
                  {tab.mobileLabel}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-sky-400 font-bold bg-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5] text-sky-400' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 text-[6.5px] font-black px-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[8.5px] mt-0.5 tracking-tight truncate max-w-[46px]">{tab.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Desktop Navigation Tabs
  return (
    <nav className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        // Animated League Tab for desktop attention
        if (tab.isLeague) {
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-sky-500/25 ring-2 ring-sky-400'
                  : 'bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 text-sky-200 border-2 border-sky-400/60 hover:border-sky-300 animate-league-attract'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-400 animate-bounce'}`} />
              </div>
              <span className="uppercase tracking-wide">{tab.label}</span>
              
              {/* Eye-catching badge */}
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-black uppercase bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm">
                <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300 animate-flame-shimmer" />
                <span>TOP 4 TITANS</span>
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all relative shrink-0 ${
              isActive
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase ${
                  isActive
                    ? 'bg-slate-950/40 text-white'
                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
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
