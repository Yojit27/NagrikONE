import React, { useState, useEffect } from 'react';
import { CitizenProfile, CivicReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme } from '../context/LanguageThemeContext';
import { SUPPORTED_LANGUAGES, APP_THEMES } from '../i18n/types';
import { playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ProfileViewProps {
  profile: CitizenProfile;
  reports: CivicReport[];
  onOpenReportDetail?: (report: CivicReport) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onUpdateProfile?: (updated: Partial<CitizenProfile>) => void;
  onReturnHome?: () => void;
}

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAE7viJJlk7NYejYXZYUImk-mtO7J3x-2F4EpgaSxlIjntY17R3qIDDsNMRKyARy2YxmkEjxOuIPWZ39jmtiQVlNhprUd9L6idyMKLkSExk4p5HVfqY2BhElD2DwJrL1wxJXnEf52X4sGFdgrPg6ZIrtPd6prLKK3QMZA_E_d0R0j1K-DcWA29F3bxcyn59uOORsuMvZTzua2hmIlastkBouYdpr2hb8MLR2FR4lCV5OLL4eLzJvOoK';

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  reports,
  onOpenReportDetail,
  onOpenAuth,
  onUpdateProfile,
  onReturnHome,
}) => {
  const { user, dbUser, isEmailVerified, signOut, sendVerificationEmail, resendCooldown } = useAuth();
  const { language, setLanguage, theme, setTheme, openOnboarding, t } = useLanguageTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name || 'Aarav Sharma');
  const [editWard, setEditWard] = useState(profile.ward || '42 (Central)');
  const [liveAlerts, setLiveAlerts] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState<'conduct' | 'privacy' | null>(null);

  const [tinyFishStatus, setTinyFishStatus] = useState<{
    configured: boolean;
    mode: string;
    message: string;
  }>({
    configured: false,
    mode: 'gemini_vision_agent',
    message: 'Operating on built-in Gemini Vision + TinyFish Web Forensics engine.',
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/tinyfish/status')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setTinyFishStatus(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const myReports = reports.filter((r) => r.isUserSubmitted);
  const displayName = user?.displayName || dbUser?.displayName || profile.name || 'Aarav Sharma';
  const displayEmail = user?.email || profile.email || 'aarav.sharma@civicmail.in';
  const displayKarma = profile.karmaPoints || 100;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName,
        ward: editWard,
      });
    }
    setIsEditing(false);
    playSuccessChime();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 sm:px-6 pb-20 space-y-4">
      {/* Return Button for Navigation Context */}
      {onReturnHome && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onReturnHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Dashboard</span>
          </button>
          <span className="text-xs font-mono text-emerald-500 font-bold">Encrypted Citizen Grid</span>
        </div>
      )}

      {/* 1. Profile Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar with Verified Beacon */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(0,229,153,0.35)]">
              <img
                src={user?.photoURL || DEFAULT_AVATAR}
                alt={displayName}
                className="w-full h-full rounded-full object-cover bg-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>
            <div
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md ring-2 ring-white dark:ring-[#181b25]"
              title="Verified Citizen Sentinel"
            >
              <span className="material-symbols-outlined text-[15px] font-bold">verified</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {displayName}
          </h1>

          <p className="text-xs text-slate-500 dark:text-[#bacbbe] flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-[15px] text-emerald-500">location_on</span>
            <span>Ward {profile.ward || '42'}, Central Zone</span>
          </p>

          {/* Level and Rating Pills */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#31353f] text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              <span>Level 3 Civic Sentinel</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1 border border-emerald-500/20">
              <span className="material-symbols-outlined text-[14px]">star</span>
              <span>4.8 / 5.0 Rating</span>
            </span>
          </div>

          {/* Reputation Pool Strip */}
          <div className="mt-3.5 w-full rounded-xl bg-slate-100 dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">military_tech</span>
              <span className="text-xs font-bold text-slate-900 dark:text-[#dfe2ef]">Reputation Pool</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-emerald-500">{displayKarma}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">pts earned</span>
            </div>
          </div>

          {/* Action Buttons: Edit Profile & Log Out */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-full h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(0,229,153,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            {user ? (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full h-11 rounded-full bg-slate-100 dark:bg-[#31353f] hover:bg-slate-200 dark:hover:bg-[#3a3f4b] text-rose-500 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth?.('login')}
                className="w-full h-11 rounded-full bg-slate-100 dark:bg-[#31353f] hover:bg-slate-200 dark:hover:bg-[#3a3f4b] text-emerald-500 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Inline Edit Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="w-full mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-700 text-left space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#262a34] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Ward</label>
                <input
                  type="text"
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#262a34] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. Civic Contribution Card */}
      <div className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">leaderboard</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Civic Contribution
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            Top 5% in Ward
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#bacbbe]">
              <span className="text-xs font-semibold">Reports Filed</span>
              <span className="material-symbols-outlined text-[16px] text-cyan-400">campaign</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {myReports.length > 0 ? myReports.length : 12}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">total</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#bacbbe]">
              <span className="text-xs font-semibold">Verified True</span>
              <span className="material-symbols-outlined text-[16px] text-emerald-500">task_alt</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-emerald-500">10</span>
              <span className="text-[10px] font-semibold text-slate-400">83% accuracy</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#bacbbe]">
              <span className="text-xs font-semibold">Community Endorse</span>
              <span className="material-symbols-outlined text-[16px] text-emerald-400">thumb_up</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">148</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">upvotes</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-[#bacbbe]">
              <span className="text-xs font-semibold">Avg Response</span>
              <span className="material-symbols-outlined text-[16px] text-cyan-400">schedule</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">18h</span>
              <span className="text-[10px] font-semibold text-slate-400">triage speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Resident Credentials */}
      <div className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">badge</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Resident Credentials
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {/* Civic Mail */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#262a34] flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Civic Mail</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                  {displayEmail}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
          </div>

          {/* Jurisdiction */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#262a34] flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-[18px]">home_pin</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Jurisdiction
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Ward {profile.ward || '42'} - Indiranagar / Central
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#31353f] text-slate-700 dark:text-[#bacbbe]">
              Zone 04
            </span>
          </div>
        </div>
      </div>

      {/* 4. TinyFish AI Engine Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              TinyFish AI Web Agent Engine
            </h4>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              tinyFishStatus.configured
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            }`}
          >
            {tinyFishStatus.configured ? 'Live Account Active' : 'Vision Forensics Active'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-[#bacbbe] leading-relaxed">
          TinyFish monitors civic incident imagery for authenticity, crawling indexed web sources to prevent duplicate or AI-generated issue reports.
        </p>
      </div>

      {/* 5. Language & Appearance Settings (Senior & Accessibility Friendly) */}
      <div className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-[22px]">palette</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t('settingsTitle', 'Preferences & Appearance')}
            </h2>
          </div>
          <button
            onClick={() => openOnboarding('language')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>{t('btnRevisitOnboarding', 'Change Language & Theme')}</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </div>

        {/* Language Selector */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('languageSettingLabel', 'Display Language')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  language === l.code
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1c1f29] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                  {l.nativeName.slice(0, 1)}
                </span>
                <span className="truncate">{l.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Theme Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('themeSettingLabel', 'Visual Theme')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {APP_THEMES.map((thm) => {
              const isSelected = theme === thm.id;
              return (
                <button
                  key={thm.id}
                  onClick={() => setTheme(thm.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1c1f29] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full border shrink-0"
                      style={{
                        backgroundColor: thm.bgPreview,
                        borderColor: thm.id === 'high-contrast' ? '#000000' : 'rgba(128,128,128,0.4)',
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {t(thm.nameKey, thm.id)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {thm.badge}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Account & Security Settings */}
      <div className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-emerald-500 text-[20px]">tune</span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Account &amp; Security
          </h2>
        </div>

        <div className="space-y-1.5">
          {/* Live Telemetry Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">notifications_active</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Live Telemetry &amp; Alerts
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#bacbbe]">
                  Push notifications on civic status changes
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={liveAlerts}
                onChange={() => setLiveAlerts(!liveAlerts)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-[#31353f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>


          {/* Reporting Code of Conduct */}
          <button
            onClick={() => setShowPolicyModal('conduct')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#262a34] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">policy</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Reporting Code of Conduct &amp; Grievance Policy
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
          </button>

          {/* Privacy Policy */}
          <button
            onClick={() => setShowPolicyModal('privacy')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#262a34] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">security</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Privacy Policy &amp; Municipal Open Data Ledger
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
          </button>

          {/* Switch Account */}
          <button
            onClick={() => onOpenAuth?.('login')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#262a34] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">switch_account</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Log In to Another Citizen Account
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">swap_horiz</span>
          </button>
        </div>
      </div>

      {/* End Active Session Button */}
      <div className="pt-2">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full h-12 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
          <span>End Active Session</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 dark:text-[#bacbbe]/70 mt-2">
          NagrikOne Client Engine v2.4.1 • Encrypted Municipal Protocol
        </p>
      </div>

      {/* Policy Modals */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {showPolicyModal === 'conduct'
                  ? 'Reporting Code of Conduct & Grievance Policy'
                  : 'Privacy Policy & Municipal Open Data Ledger'}
              </h3>
              <button
                onClick={() => setShowPolicyModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#31353f] flex items-center justify-center text-slate-600 dark:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
              {showPolicyModal === 'conduct' ? (
                <>
                  <p>
                    NagrikOne AI is an authenticated public interest platform. All grievance dispatches are legally binding entries in the municipal open audit trail.
                  </p>
                  <p>
                    1. <b>Factual Submissions:</b> Reports must reflect actual physical civic infrastructure defects observed directly by the submitting citizen.
                  </p>
                  <p>
                    2. <b>Zero Tolerance for Defamation:</b> Submissions containing hate speech, targeted attacks on government officials, or private property disputes will result in immediate profile suspension and removal of civic karma.
                  </p>
                  <p>
                    3. <b>Community Verification:</b> Community endorsements represent civic eyewitness confirmation. Falsified upvoting rings will be penalized under Ward bylaws.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Your citizen telemetry is strictly utilized for public interest municipal escalation.
                  </p>
                  <p>
                    1. <b>Data Minimization:</b> GPS coordinates and defect photographs are published in the Open Civic Data Ledger. Sensitive citizen credentials and verification hashes remain encrypted and are accessible solely by authenticated Municipal Officers.
                  </p>
                  <p>
                    2. <b>Audit Trails:</b> Every status alteration, departmental reminder dispatch, and SLA timestamp is cryptographically hashed for civic accountability.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setShowPolicyModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
            >
              Close Policy
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-slate-700 p-6 shadow-2xl flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[28px]">logout</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Sign Out of NagrikOne?
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#bacbbe]">
              You will stop receiving instantaneous ward incident triage dispatches on this terminal.
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="h-10 rounded-full bg-slate-100 dark:bg-[#1c1f29] text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#31353f] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (user) {
                    await signOut();
                  }
                  setShowLogoutModal(false);
                }}
                className="h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
