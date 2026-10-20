import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Send,
  KeyRound,
  ShieldCheck,
  LogOut,
  Compass,
  Sparkles,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';
import firebaseConfig from '../../firebase-applet-config.json';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'verify_pending';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
  onGuestContinue?: () => void;
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onGuestContinue,
  onSuccess,
}) => {
  const {
    user,
    isEmailVerified,
    signUpWithEmail,
    signInWithEmail,
    sendVerificationEmail,
    checkEmailVerification,
    sendPasswordReset,
    signInWithGoogle,
    signOut,
    resendCooldown,
    verificationNotice,
    clearVerificationNotice,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(() => {
    if (user && !isEmailVerified) return 'verify_pending';
    return initialMode;
  });

  // Sync mode if user state changes
  React.useEffect(() => {
    if (user && !isEmailVerified) {
      setMode('verify_pending');
    } else if (user && isEmailVerified && mode === 'verify_pending') {
      if (onSuccess) onSuccess();
    }
  }, [user, isEmailVerified, mode, onSuccess]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [showFirebaseSetupGuide, setShowFirebaseSetupGuide] = useState(false);

  // Switch modes safely
  const switchMode = (newMode: AuthMode) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowFirebaseSetupGuide(false);
    clearVerificationNotice();
    setMode(newMode);
  };

  // Sign-Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('Please enter your full citizen name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g., citizen@example.com).');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and confirmation do not match.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please acknowledge the Civic Sentinel conduct and terms to proceed.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(cleanEmail, password, cleanName);
      if (result.success) {
        setShowFirebaseSetupGuide(false);
        if (result.emailSent) {
          setSuccessMessage(`Account created! A verification link has been sent to ${cleanEmail}.`);
        } else {
          setErrorMessage(
            result.error ||
              'Account created, but verification email could not be sent. Please use the resend button.'
          );
        }
        setMode('verify_pending');
      } else {
        if (result.code === 'auth/operation-not-allowed') {
          setShowFirebaseSetupGuide(true);
        }
        setErrorMessage(result.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setShowFirebaseSetupGuide(true);
      }
      setErrorMessage(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(cleanEmail, password);
      if (result.success) {
        setShowFirebaseSetupGuide(false);
        if (result.emailVerified) {
          playSuccessChime();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          if (onSuccess) onSuccess();
        } else {
          setMode('verify_pending');
        }
      } else {
        if (result.code === 'auth/operation-not-allowed') {
          setShowFirebaseSetupGuide(true);
        }
        setErrorMessage(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setShowFirebaseSetupGuide(true);
      }
      setErrorMessage(err.message || 'Login failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Email
  const handleResendVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await sendVerificationEmail();
      if (res.success) {
        setSuccessMessage(
          `Verification email dispatched to ${user?.email || email}. Check your inbox and spam folder.`
        );
      } else {
        setErrorMessage(res.error || 'Unable to dispatch verification email. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending verification email.');
    } finally {
      setLoading(false);
    }
  };

  // Check Verification Now
  const handleCheckVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setCheckingVerification(true);

    try {
      const verified = await checkEmailVerification();
      if (verified) {
        playSuccessChime();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
        setSuccessMessage('Email verified successfully! Welcome to Nagrik One.');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(
          'Email not yet verified. Please click the link in your email, wait a few moments, and check again.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not verify status. Please check your connection.');
    } finally {
      setCheckingVerification(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter the email address registered with your account.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendPasswordReset(cleanEmail);
      if (result.success) {
        setSuccessMessage(
          `If an account exists with ${cleanEmail}, a password reset link has been dispatched to your inbox.`
        );
      } else {
        setErrorMessage(result.error || 'Failed to dispatch password reset email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Option
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res && res.cancelled) {
        setLoading(false);
        return;
      }
      playSuccessChime();
      confetti({ particleCount: 80, spread: 60 });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-xl shadow-blue-500/10 mb-3">
          <img
            src="/logo-icon.svg"
            alt="Nagrik One Official Seal"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Nagrik<span className="text-blue-600 dark:text-blue-400">One</span>
          <span className="text-xs ml-1.5 font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
            AI
          </span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase mt-1">
          Citizen Governance & Accountability Portal
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 backdrop-blur-xl transition-all">
        {/* Verification Notice / URL Toast */}
        {verificationNotice && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{verificationNotice}</p>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Firebase Console Setup Guide Banner if Email/Password provider is disabled in project */}
        {showFirebaseSetupGuide && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-slate-800 dark:text-slate-200 text-xs shadow-sm animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                    How to Enable Email/Password in Firebase
                  </p>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold">
                    Quick Action
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  In your active Firebase project (<span className="font-mono font-bold text-slate-900 dark:text-white">{firebaseConfig.projectId}</span>), Email/Password is currently disabled in the console. Follow these 3 steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 text-xs font-medium pl-1">
                  <li>Click <b>Open Firebase Console</b> below.</li>
                  <li>In the <b>Sign-in method</b> tab, select <b>Email/Password</b>.</li>
                  <li>Toggle <b>Enable</b> to ON and click <b>Save</b>.</li>
                  <li>Return here and retry Sign Up or Login!</li>
                </ol>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    <span>Open Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <span>Or Continue with Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: VERIFICATION PENDING */}
        {/* ========================================================================= */}
        {mode === 'verify_pending' ? (
          <div className="space-y-5 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Mail className="w-8 h-8 stroke-[1.8]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800/80 mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Verification Pending</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Verify Your Email Address
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                An official verification link has been dispatched to:
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 rounded-xl mt-1.5 inline-block font-mono">
                {user?.email || email}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Instructions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Check your inbox for an email from Nagrik One Authentication.</li>
                <li>Please also check your <b>Spam / Junk folder</b> if not in inbox.</li>
                <li>Click the link in the email to activate your citizen credentials.</li>
              </ul>
            </div>

            {/* Verification Check & Resend Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checkingVerification || loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checkingVerification ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Firebase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>I've verified my email — Check again</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || loading}
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend verification email'}
                </span>
              </button>
            </div>

            {/* Logout / Switch Account */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  switchMode('login');
                }}
                className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Return to Login</span>
              </button>

              {onGuestContinue && (
                <button
                  type="button"
                  onClick={onGuestContinue}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium cursor-pointer"
                >
                  Preview as Guest
                </button>
              )}
            </div>
          </div>
        ) : mode === 'forgot' ? (
          /* ========================================================================= */
          /* VIEW 2: FORGOT PASSWORD */
          /* ========================================================================= */
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Password Recovery
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered citizen email to receive a secure password reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., citizen@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                &larr; Back to Login
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 3 & 4: LOGIN OR SIGN UP */
          /* ========================================================================= */
          <div className="space-y-5 animate-in fade-in">
            {/* Primary Segmented Toggle: Sign Up vs Login */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign Up</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log In</span>
              </button>
            </div>

            {/* Descriptive Tagline */}
            <div className="text-left">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {mode === 'signup' ? 'Create Your Citizen Account' : 'Welcome Back, Citizen'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'signup'
                  ? 'Join verified citizens tracking and resolving civic grievances.'
                  : 'Access your reported issues, civic badges, and accountability ladder.'}
              </p>
            </div>

            {/* Authentication Form */}
            <form onSubmit={mode === 'signup' ? handleSignUp : handleLogin} className="space-y-3.5">
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Citizen Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. citizen@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Terms Checkbox (Sign Up only) */}
              {mode === 'signup' && (
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I pledge to submit truthful, genuine civic reports in compliance with the{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Citizen Grievance Charter
                      </span>{' '}
                      and privacy policy.
                    </span>
                  </label>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {mode === 'signup' ? 'Creating Account & Sending Email...' : 'Signing In...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signup' ? 'Create Account & Verify Email' : 'Sign In to Citizen Dashboard'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                Or continue with
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Guest / Public Map Preview Link */}
            {onGuestContinue && (
              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onGuestContinue}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Explore Public Grievance Feed (Read-Only)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Guarantee Footer */}
      <div className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secured by Firebase Enterprise Authentication</span>
        </div>
        <p>Encrypted sessions &bull; Multi-factor verification &bull; Strict Citizen Privacy</p>
      </div>
    </div>
  );
};
