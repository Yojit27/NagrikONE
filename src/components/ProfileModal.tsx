import React, { useState, useEffect } from 'react';
import { CitizenProfile, CivicReport } from '../types';
import {
  X,
  ShieldCheck,
  Flame,
  Award,
  ThumbsUp,
  MapPin,
  Calendar,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
  LogIn,
  LogOut,
  UserCheck,
  Clock,
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CitizenProfile;
  reports: CivicReport[];
  onResetData: () => void;
  onSelectReport: (reportId: string) => void;
  onVerifyCitizen?: (citizenId: string) => void;
}

const TinyFishStatusCard: React.FC = () => {
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

  return (
    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐟</span>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
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

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <b>How TinyFish works here in simple words:</b> TinyFish is your app's digital watchdog. When someone uploads a picture of a pothole or garbage dump, TinyFish uses AI web crawlers to search platforms like <b>Pinterest</b> and <b>Google Images</b>. If it finds the exact picture already exists online, it warns that the picture is fake or reused. If it sees smooth, synthetic textures from AI generators (like Midjourney), it flags it!
      </p>

      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
          How to connect your personal TinyFish account:
        </p>
        <p>
          You can add your TinyFish API key to your backend environment as{' '}
          <code className="text-emerald-600 font-mono">TINYFISH_API_KEY="your_key"</code>.
          The server automatically detects your key and connects your personal web agent workspace. Even without a key, the built-in Gemini Vision forensic model verifies every image in real time!
        </p>
      </div>
    </div>
  );
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  reports,
  onResetData,
  onSelectReport,
  onVerifyCitizen,
}) => {
  const {
    user,
    dbUser,
    isEmailVerified,
    signInWithGoogle,
    signOut,
    checkEmailVerification,
    sendVerificationEmail,
    resendCooldown,
  } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  if (!isOpen) return null;

  const myReports = reports.filter((r) => r.isUserSubmitted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Citizen Governance Identity & Settings
            </h3>
            <p className="text-xs text-slate-500">
              Identity verification, TinyFish AI agent status, and live map configuration
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Firebase Authentication & Google Account Card */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Citizen Account Credentials
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user
                      ? `Signed in as ${user.email}`
                      : 'Sign in to link grievances to your citizen record'}
                  </p>
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={async () => {
                    setIsSigningIn(true);
                    setAuthError(null);
                    try {
                      const res = await signInWithGoogle();
                      if (res && res.cancelled) {
                        return;
                      }
                      playSuccessChime();
                      confetti({ particleCount: 80, spread: 60 });
                    } catch (e: any) {
                      if (
                        e?.code === 'auth/popup-closed-by-user' ||
                        e?.code === 'auth/cancelled-popup-request'
                      ) {
                        return;
                      }
                      setAuthError(e?.message || 'Sign in failed. Please try again.');
                    } finally {
                      setIsSigningIn(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {isSigningIn ? 'Connecting...' : 'Sign In with Google'}
                </button>
              )}
            </div>

            {user && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Email Status:
                  </span>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Verification
                    </span>
                  )}
                </div>

                {!isEmailVerified && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={checkingVerification}
                      onClick={async () => {
                        setCheckingVerification(true);
                        setAuthError(null);
                        setAuthSuccess(null);
                        try {
                          const v = await checkEmailVerification();
                          if (v) {
                            setAuthSuccess('Email verified successfully!');
                            playSuccessChime();
                          } else {
                            setAuthError('Email is still unverified. Please check your inbox.');
                          }
                        } finally {
                          setCheckingVerification(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {checkingVerification ? 'Checking...' : 'Check Status'}
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={async () => {
                        setAuthError(null);
                        setAuthSuccess(null);
                        const res = await sendVerificationEmail();
                        if (res.success) {
                          setAuthSuccess('Verification email dispatched.');
                        } else {
                          setAuthError(res.error || 'Failed to dispatch verification email.');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Link'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {authSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl font-medium">
                {authSuccess}
              </p>
            )}

            {authError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl">
                {authError}
              </p>
            )}

            {user && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Synchronized with Firebase Auth &bull; UID: {user.uid.slice(0, 12)}...</span>
              </div>
            )}
          </div>

          {/* Citizen Digital Identity Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-900 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-extrabold text-xl">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-lg">{profile.name}</h4>
                    {profile.verifiedId ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Citizen Sentinel
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30">
                        Pending Verification
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    ID: {profile.id} &bull; Ward {profile.ward}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-center">
              <div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">
                  {profile.karmaPoints}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-300">
                  Karma Points
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {profile.levelNumber}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-300">
                  {profile.levelTitle.split(' ')[0]}
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-blue-400 font-mono">
                  {profile.upvotesGivenCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-300">
                  Upvotes Cast
                </div>
              </div>
            </div>
          </div>

          {/* TinyFish AI Integration Explanation & Status */}
          <TinyFishStatusCard />

          {/* Live Map GIS Engine */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Live Geolocation GIS Engine
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The interactive map is powered by official <b>Google Maps Platform</b> with <b>AdvancedMarkerElement</b>, dynamic 500-metre radius geo-scanning, satellite & hybrid imagery, and high-accuracy GPS ward geolocation.
            </p>
          </div>

          {/* Reset Simulated Data */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Clear local storage cache & reset sample tickets
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset citizen reports and karma back to initial defaults?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
