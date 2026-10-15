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
    <div className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-65px)] bg-slate-950 sm:py-6 sm:px-4">
      {/* Top Banner Notice (Visible on Desktop only) */}
      <div className="hidden sm:flex items-center gap-3 mb-4 text-center">
        <span className="text-xs text-slate-300 font-semibold bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <span>📱 Mobile App Simulator (Flagship 430px Viewport)</span>
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
        - On mobile (<640px): 100% full screen native experience with NO squashing or faux bezels.
        - On desktop (>=640px): Elegant, spacious flagship smartphone mockup with realistic curved borders.
      */}
      <div className="relative w-full sm:max-w-[430px] h-screen sm:h-[870px] bg-slate-950 sm:bg-slate-900 sm:rounded-[52px] sm:p-3 shadow-2xl sm:ring-1 sm:ring-slate-800 sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden">
        {/* Dynamic Island / Top Speaker (Desktop only) */}
        <div className="hidden sm:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-950 ring-1 ring-sky-500/30"></div>
        </div>

        {/* Mobile Status Bar */}
        <div className="relative z-40 px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-300 shrink-0">
          <span className="font-mono">09:41</span>
          <div className="flex items-center gap-2 text-slate-300">
            <Signal className="w-3.5 h-3.5 text-sky-400" />
            <Wifi className="w-3.5 h-3.5 text-sky-400" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Mobile Internal Content Area with generous scrolling room */}
        <div className="relative flex-1 overflow-y-auto px-3.5 pt-2 pb-24 scrollbar-none space-y-4">
          {children}
        </div>

        {/* Mobile Persistent Bottom Tab Bar */}
        <div className="absolute bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-1 pt-1.5 pb-3 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <Navigation
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            isMobileBottomBar={true}
          />

          {/* iOS Home Indicator Bar */}
          <div className="w-28 h-1 bg-slate-600/60 rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    </div>
  );
};
