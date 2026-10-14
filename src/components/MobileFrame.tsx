import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';
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
    <div className="py-6 px-2 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] bg-slate-950/80">
      {/* Device Info Notice */}
      <div className="mb-4 text-center">
        <span className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
          📱 Mobile View Activated • Tap elements or switch to{' '}
          <button
            onClick={onSwitchToWeb}
            className="text-lime-400 hover:underline font-bold"
          >
            Web Desktop View
          </button>
        </span>
      </div>

      {/* Realistic Smartphone Chassis */}
      <div className="relative w-full max-w-[410px] h-[844px] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-slate-800 border-[7px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Dynamic Island / Top Speaker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800"></div>
          <div className="w-2 h-2 rounded-full bg-blue-950 ring-1 ring-blue-500/30"></div>
        </div>

        {/* Mobile Status Bar */}
        <div className="relative z-40 px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span>09:41</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Smartphone Internal Content Area */}
        <div className="relative flex-1 overflow-y-auto px-3 pt-2 pb-20 scrollbar-none">
          {children}
        </div>

        {/* Mobile Persistent Bottom Bar */}
        <div className="absolute bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 pt-1 pb-4">
          <Navigation
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            isMobileBottomBar={false} // Custom inside frame
          />

          {/* iOS Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-600/70 rounded-full mx-auto mt-2.5"></div>
        </div>
      </div>
    </div>
  );
};
