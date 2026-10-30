import React from 'react';
import { useLanguageTheme } from '../context/LanguageThemeContext';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportModal: () => void;
  unlockedBadgesCount?: number;
  reportsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportModal,
  reportsCount = 7,
}) => {
  const { t } = useLanguageTheme();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/90 dark:bg-[#0a0e17]/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-2px_16px_rgba(0,0,0,0.3)]"
      data-active-classes="text-emerald-500"
    >
      <div className="relative flex justify-around items-center h-16 px-4 max-w-md mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors cursor-pointer ${
            currentTab === 'home'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-[#bacbbe] hover:text-slate-800 dark:hover:text-white'
          }`}
          aria-label={t('navHome', 'Home')}
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span className="text-[11px] font-semibold truncate max-w-[60px]">{t('navHome', 'Home')}</span>
        </button>

        {/* 2. Live Map */}
        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors cursor-pointer ${
            currentTab === 'map'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-[#bacbbe] hover:text-slate-800 dark:hover:text-white'
          }`}
          aria-label={t('navMap', 'Live Map')}
        >
          <span className="material-symbols-outlined text-[24px]">map</span>
          <span className="text-[11px] font-semibold truncate max-w-[60px]">{t('navMap', 'Live Map')}</span>
          {reportsCount > 0 && (
            <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center shadow-[0_0_8px_rgba(0,229,153,0.5)]">
              {reportsCount}
            </span>
          )}
        </button>

        {/* 3. Center Floating Report (+) Action Button */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-[0_4px_24px_rgba(0,229,153,0.4)] hover:shadow-[0_4px_30px_rgba(0,229,153,0.6)] active:scale-95 transition-all border-4 border-white dark:border-[#0f131c] cursor-pointer"
            aria-label={t('btnReportIssue', 'Report Issue')}
            title={t('btnReportIssue', 'Report Issue')}
          >
            <span className="material-symbols-outlined text-[30px] font-bold">add</span>
          </button>
        </div>

        {/* 4. Sahayak */}
        <button
          type="button"
          onClick={() => onSelectTab('sahayak')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors cursor-pointer ${
            currentTab === 'sahayak'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-[#bacbbe] hover:text-slate-800 dark:hover:text-white'
          }`}
          aria-label={t('navAssistant', 'Sahayak')}
        >
          <span className="material-symbols-outlined text-[24px]">smart_toy</span>
          <span className="text-[11px] font-semibold truncate max-w-[60px]">{t('navAssistant', 'Sahayak')}</span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors cursor-pointer ${
            currentTab === 'profile'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-[#bacbbe] hover:text-slate-800 dark:hover:text-white'
          }`}
          aria-label={t('navProfile', 'Profile')}
        >
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
          <span className="text-[11px] font-semibold truncate max-w-[60px]">{t('navProfile', 'Profile')}</span>
        </button>
      </div>
    </nav>
  );
};
