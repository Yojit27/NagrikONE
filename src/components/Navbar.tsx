import React, { useState, useRef, useEffect } from 'react';
import { CivicNotification, CitizenProfile } from '../types';
import {
  Sun,
  Moon,
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

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            aria-label="NagrikOne AI Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 flex items-center justify-center shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/logo-icon.svg"
                alt="Nagrik One Official Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  Nagrik<span className="text-blue-600 dark:text-blue-400">One</span>
                  <span className="text-xs ml-1 font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                    AI
                  </span>
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 -mt-0.5 tracking-wider uppercase truncate max-w-[160px] xs:max-w-[220px] sm:max-w-none">
                Your City &bull; Your Voice &bull; Our Action
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
            <span>Dashboard</span>
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
            <span>Live Map</span>
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
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>Sahayak AI</span>
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
            <span>Civic Badges</span>
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
            <span>Analytics</span>
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
            <span>Our Procedure</span>
          </button>
        </nav>

        {/* Right Actions: Report Button, Theme, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Report Issue CTA Button */}
          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Report Issue</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Official Instagram Link */}
          <a
            href="https://www.instagram.com/naagrikone?utm_source=qr&dlrf=MXF2azExZ3J1dzZvdg=="
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer"
            title="Follow @naagrikone on Instagram"
            aria-label="Follow Nagrik One on Instagram @naagrikone (opens in a new tab)"
          >
            <Instagram className="w-4 h-4" />
          </a>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Toggle light/dark theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors relative cursor-pointer"
              title="Civic Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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

          {/* Citizen Account Entry / Profile Pill */}
          {user ? (
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Citizen Profile & Karma"
            >
              <div className="relative w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                {(user.displayName || profile.name || 'C').charAt(0).toUpperCase()}
                <span
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={isEmailVerified ? 'Email Verified' : 'Verification Pending'}
                />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {profile.karmaPoints} pts
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {isEmailVerified ? `Ward ${profile.ward}` : 'Pending Verify'}
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth?.('signup')}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
