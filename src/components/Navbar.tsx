import React, { useState, useRef, useEffect } from 'react';
import { CivicNotification, CitizenProfile } from '../types';
import {
  Bell,
  Plus,
  Shield,
  MapPin,
  Flame,
  Award,
  CheckCircle2,
  Menu,
  X,
  Bot,
  BarChart3,
  Home,
  Map,
  Sparkles,
  Info,
  Instagram,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme } from '../context/LanguageThemeContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenReportModal: () => void;
  onOpenProfileModal: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  reportsCount: number;
  unlockedBadgesCount: number;
  notifications: CivicNotification[];
  onMarkNotificationRead: (id: string) => void;
  profile: CitizenProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  onOpenReportModal,
  onOpenProfileModal,
  onOpenAuth,
  reportsCount,
  unlockedBadgesCount,
  notifications,
  onMarkNotificationRead,
  profile,
}) => {
  const { user, isEmailVerified } = useAuth();
  const { language, setLanguage, theme, setTheme, openOnboarding, t } = useLanguageTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawer on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setShowLangDropdown(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0f131c]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left section: Hamburger (mobile) + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Drawer Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open drawer menu"
              className="lg:hidden w-10 h-10 -ml-1 flex items-center justify-center text-slate-600 dark:text-[#bacbbe] hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-[#1c1f29]"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Brand Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
              aria-label="NagrikOne AI Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-[#1a1f2c] border border-slate-200/90 dark:border-slate-700/80 p-1 flex items-center justify-center shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                <img
                  src="/logo-icon.svg"
                  alt="Nagrik One Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo-icon.png';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    Nagrik<span className="text-emerald-500">One</span>
                    <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 ml-0.5 opacity-90 font-mono">
                      .ai
                    </span>
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t('navHome', 'Dashboard')}</span>
            </button>

            <button
              onClick={() => onSelectTab('map')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'map'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>{t('navMap', 'Live Map')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800">
                {reportsCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('sahayak')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'sahayak'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4 text-emerald-500" />
              <span>{t('navAssistant', 'Sahayak AI')}</span>
            </button>

            <button
              onClick={() => onSelectTab('badges')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'badges'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t('navBadges', 'Badges')}</span>
              {unlockedBadgesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                  {unlockedBadgesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'analytics'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('navAnalytics', 'Analytics')}</span>
            </button>

            <button
              onClick={() => onSelectTab('about')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'about'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Info className="w-4 h-4 text-emerald-500" />
              <span>{t('navAbout', 'About')}</span>
            </button>

            <button
              onClick={() => onSelectTab('procedure')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'procedure'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('navProcedure', 'Our Procedure')}</span>
            </button>
          </nav>

          {/* Right Actions: Report Button, Language, Theme, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Report Issue CTA Button (Desktop) */}
            <button
              type="button"
              onClick={onOpenReportModal}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('btnReportIssue', 'Report Issue')}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#1c1f29] text-slate-700 dark:text-[#dfe2ef] transition-colors cursor-pointer text-xs font-extrabold"
                title="Select Language / भाषा चुनें"
                aria-label="Select Language"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-500">translate</span>
                <span className="font-bold">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName || 'हिंदी'}
                </span>
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181b25] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    {t('onboardingLangTitle', 'Choose language')}
                  </div>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        language === l.code
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-sm">{l.nativeName}</span>
                      <span className="text-[11px] font-normal text-slate-400">({l.englishName})</span>
                    </button>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setShowLangDropdown(false);
                        openOnboarding('theme');
                      }}
                      className="w-full text-center py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {t('onboardingThemeTitle', 'Appearance Themes')} &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Official Instagram Link */}
            <a
              href="https://www.instagram.com/naagrikone?utm_source=qr&dlrf=MXF2azExZ3J1dzZvdg=="
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#1c1f29] text-slate-600 dark:text-[#bacbbe] hover:text-pink-500 transition-colors cursor-pointer"
              title="Follow @NagrikOne.ai on Instagram"
              aria-label="Follow NagrikOne.ai on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#1c1f29] text-slate-600 dark:text-[#bacbbe] transition-colors relative cursor-pointer"
                title="Civic Notifications"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#0f131c] shadow-[0_0_8px_rgba(0,229,153,0.7)]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#181b25] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Civic Notifications
                    </h4>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-3 rounded-2xl border text-xs transition-colors cursor-pointer ${
                          notif.read
                            ? 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-white font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="line-clamp-1">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {notif.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Trigger Button */}
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#1c1f29] transition-colors cursor-pointer focus:outline-none"
              title="Civic Profile"
              aria-label="Civic Profile"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Left Menu Drawer (Mobile & Responsive) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex animate-in fade-in duration-200">
          {/* Overlay Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-[#0a0e17]/70 backdrop-blur-sm cursor-pointer"
            aria-label="Close menu"
          />

          {/* Drawer Panel */}
          <aside className="relative w-[82%] max-w-[320px] bg-white dark:bg-[#181b25] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pt-safe pb-safe overflow-hidden z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Top Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1a1f2c] border border-slate-200/80 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/logo-icon.svg"
                    alt="Nagrik One Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logo-icon.png';
                    }}
                  />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Nagrik<span className="text-emerald-500">One</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 ml-0.5 opacity-90 font-mono">
                    .ai
                  </span>
                </span>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#262a34] flex items-center justify-center text-slate-600 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-[#31353f] transition-colors"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'home'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">home</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navHome', 'Home Dashboard')}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => handleNavClick('map')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'map'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-cyan-400 text-[18px]">map</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navMap', 'Live Civic Map')}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                  {reportsCount}
                </span>
              </button>

              <button
                onClick={() => handleNavClick('sahayak')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'sahayak'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">smart_toy</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navAssistant', 'Sahayak AI')}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'profile'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">account_circle</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navProfile', 'Profile')}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => handleNavClick('badges')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'badges'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">military_tech</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navBadges', 'Badges')}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => handleNavClick('about')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'about'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-cyan-400 text-[18px]">info</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navAbout', 'About / Guidelines')}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => handleNavClick('procedure')}
                className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl transition-colors cursor-pointer text-left ${
                  currentTab === 'procedure'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-[#262a34] text-slate-800 dark:text-[#dfe2ef]'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">shield</span>
                </span>
                <span className="flex-1 text-sm font-semibold">{t('navProcedure', 'Our Procedure')}</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </button>

              {/* Language & Theme Onboarding Revisit Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openOnboarding('language');
                  }}
                  className="w-full flex items-center gap-3 px-3 h-12 rounded-xl bg-slate-50 dark:bg-[#202738] hover:bg-slate-100 dark:hover:bg-[#283248] text-slate-900 dark:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{t('btnRevisitOnboarding', 'Change Language & Theme')}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName} &bull; {theme}
                    </span>
                  </div>
                </button>
              </div>
            </nav>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenReportModal();
                }}
                className="w-full py-3 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>{t('btnReportIssue', 'Report Civic Issue')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
