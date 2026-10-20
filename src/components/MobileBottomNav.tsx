import React from 'react';
import { Home, Map, Plus, Bot, Award, BarChart3, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportModal: () => void;
  unlockedBadgesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportModal,
  unlockedBadgesCount,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="grid grid-cols-6 h-16 items-center px-1">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'home'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'map'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Map</span>
        </button>

        {/* Center Glowing Action Button */}
        <div className="flex flex-col items-center justify-center -mt-6">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 border-4 border-slate-50 dark:border-slate-950 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            aria-label="Report Civic Issue"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Report
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('sahayak')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'sahayak'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sahayak</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('badges')}
          className={`flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer ${
            currentTab === 'badges'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <Award className="w-5 h-5" />
            {unlockedBadgesCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-amber-500 text-white text-[8px] font-extrabold flex items-center justify-center">
                {unlockedBadgesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Badges</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('procedure')}
          className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
            currentTab === 'procedure'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Rules</span>
        </button>
      </div>
    </nav>
  );
};
