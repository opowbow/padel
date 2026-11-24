import React from 'react';
import { Wifi, Battery, Signal, Maximize2 } from 'lucide-react';
import { Navigation, TabType } from './Navigation';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onSwitchToWeb: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onSelectTab,
  onSwitchToWeb,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-start flex-1 bg-slate-950 sm:py-4 sm:px-4 overflow-x-hidden">
      {/* Top Banner Notice (Visible on Desktop only) */}
      <div className="hidden sm:flex items-center gap-3 mb-3 text-center">
        <span className="text-xs text-slate-300 font-semibold bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <span>📱 Mobile App View (420px Viewport)</span>
          <span>•</span>
          <button
            onClick={onSwitchToWeb}
            className="text-sky-400 hover:text-sky-300 hover:underline font-bold flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Switch to Web Desktop</span>
          </button>
        </span>
      </div>

      {/*
        Responsive Chassis:
        - On native mobile (<640px): Natural full-width flow with fixed bottom tab bar so nothing is cropped vertically or horizontally.
        - On desktop (>=640px): Fits viewport height cleanly (`calc(100dvh - 115px)`) with flex column layout and `@container` queries so child grids adapt to the 420px width instead of the desktop browser width.
      */}
      <div className="relative w-full sm:w-[420px] sm:max-w-[94vw] min-h-[calc(100dvh-60px)] sm:min-h-[560px] sm:h-[min(820px,calc(100dvh-115px))] bg-slate-950 sm:bg-slate-900 sm:rounded-[44px] shadow-2xl sm:ring-1 sm:ring-slate-800 sm:border-[6px] sm:border-slate-800 flex flex-col sm:overflow-hidden">
        {/* Dynamic Island / Top Speaker (Desktop simulator only) */}
        <div className="hidden sm:flex mx-auto mt-2 w-24 h-5 bg-black rounded-full z-30 items-center justify-between px-3 shrink-0">
          <div className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-slate-800"></div>
          <div className="w-2 h-2 rounded-full bg-blue-950 ring-1 ring-sky-500/30"></div>
        </div>

        {/* Mobile Status Bar (Desktop simulator only) */}
        <div className="hidden sm:flex px-5 pt-1.5 pb-1 items-center justify-between text-[11px] font-bold text-slate-300 shrink-0">
          <span className="font-mono">TuesSlay</span>
          <div className="flex items-center gap-2 text-slate-300">
            <Signal className="w-3.5 h-3.5 text-sky-400" />
            <Wifi className="w-3.5 h-3.5 text-sky-400" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Mobile Internal Content Area with @container so child components size to mobile frame */}
        <div className="@container relative flex-1 min-h-0 sm:overflow-y-auto overflow-x-hidden px-3 pt-3 pb-24 sm:pb-5 scrollbar-none space-y-4">
          {children}
        </div>

        {/* Mobile Persistent Bottom Tab Bar */}
        <div className="fixed sm:static bottom-0 inset-x-0 z-40 shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-1.5 pt-2 pb-2.5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <Navigation
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            isMobileBottomBar={true}
          />
          <div className="hidden sm:block w-24 h-1 bg-slate-600/60 rounded-full mx-auto mt-1.5"></div>
        </div>
      </div>
    </div>
  );
};
