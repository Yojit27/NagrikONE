import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../lib/firebase.ts';

export interface DbUser {
  id?: number;
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  role?: string | null;
  karmaPoints?: number | null;
  ward?: string;
  city?: string;
  levelNumber?: number;
  levelTitle?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  idToken: string | null;
  loading: boolean;
  isEmailVerified: boolean;
  resendCooldown: number;
  verificationNotice: string | null;
  clearVerificationNotice: () => void;
  signUpWithEmail: (
    email: string,
    pass: string,
    fullName: string
  ) => Promise<{ success: boolean; emailSent: boolean; error?: string; code?: string }>;
  signInWithEmail: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; emailVerified: boolean; error?: string; code?: string }>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string; code?: string }>;
  checkEmailVerification: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; cancelled?: boolean; user?: User } | void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  idToken: null,
  loading: true,
  isEmailVerified: false,
  resendCooldown: 0,
  verificationNotice: null,
  clearVerificationNotice: () => {},
  signUpWithEmail: async () => ({ success: false, emailSent: false }),
  signInWithEmail: async () => ({ success: false, emailVerified: false }),
  sendVerificationEmail: async () => ({ success: false }),
  checkEmailVerification: async () => false,
  sendPasswordReset: async () => ({ success: false }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const cooldownTimerRef = useRef<any>(null);

  const startCooldown = useCallback((seconds: number = 60) => {
    setResendCooldown(seconds);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const syncFirestoreProfile = async (firebaseUser: User, customName?: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      const existingData = snap.exists() ? snap.data() : null;

      const profilePayload: DbUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: customName || firebaseUser.displayName || existingData?.displayName || 'Citizen Sentinel',
        photoUrl: firebaseUser.photoURL || existingData?.photoUrl || null,
        karmaPoints: existingData?.karmaPoints ?? 120,
        ward: existingData?.ward || '42 (Central)',
        city: existingData?.city || 'New Delhi NCR',
        levelNumber: existingData?.levelNumber ?? 2,
        levelTitle: existingData?.levelTitle || 'Ward Sentinel (Level 2)',
        createdAt: existingData?.createdAt || new Date().toISOString(),
      };

      await setDoc(userRef, profilePayload, { merge: true });
      setDbUser(profilePayload);
    } catch (err) {
      console.warn('Firestore profile sync note (fallback to Cloud SQL):', err);
    }
  };

  const fetchDbUser = async (token: string) => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDbUser((prev) => ({
          ...prev,
          ...data.data,
        }));
      }
    } catch (err) {
      console.warn('Backend user profile sync note:', err);
    }
  };

  // Check URL parameters for oobCode / mode=verifyEmail action handler
  useEffect(() => {
    const handleUrlActionCodes = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');

        if (mode === 'verifyEmail' && oobCode) {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
            setIsEmailVerified(true);
          }
          setVerificationNotice('Your email has been verified successfully! Welcome to Nagrik One.');
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (mode === 'resetPassword' && oobCode) {
          setVerificationNotice('Password reset link accepted. Please enter your new password.');
        }
      } catch (err: any) {
        console.warn('URL action code handling:', err);
        if (err?.code === 'auth/invalid-action-code') {
          setVerificationNotice('This verification link is invalid or has already been used.');
        } else if (err?.code === 'auth/expired-action-code') {
          setVerificationNotice('This verification link has expired. Please request a new one.');
        }
      }
    };

    handleUrlActionCodes();
  }, []);

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsEmailVerified(currentUser.emailVerified);
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          await Promise.allSettled([
            fetchDbUser(token),
            syncFirestoreProfile(currentUser),
          ]);
        } catch (e) {
          console.error('Error fetching Firebase ID token:', e);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
        setDbUser(null);
        setIsEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Polling for email verification if user is logged in but unverified
  useEffect(() => {
    if (!user || isEmailVerified) return;

    const interval = setInterval(async () => {
      if (!auth.currentUser) return;
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setUser({ ...auth.currentUser });
          setIsEmailVerified(true);
          setVerificationNotice('Email verified successfully! You now have full citizen access.');
        }
      } catch (e) {
        // Silently ignore background reload network blips
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [user, isEmailVerified]);

  const signUpWithEmail = async (email: string, pass: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const createdUser = cred.user;

      // Update Firebase Auth user display name
      if (fullName.trim()) {
        try {
          await updateProfile(createdUser, { displayName: fullName.trim() });
        } catch (nameErr) {
          console.warn('Could not update displayName on user:', nameErr);
        }
      }

      // Sync Firestore profile immediately
      await syncFirestoreProfile(createdUser, fullName.trim());

      // Send real email verification using Firebase Auth
      let emailSent = false;
      try {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await sendEmailVerification(createdUser, actionCodeSettings);
        emailSent = true;
        startCooldown(60);
      } catch (emailErr: any) {
        console.warn('[Nagrik One Auth] sendEmailVerification note during sign-up:', emailErr?.code, emailErr?.message);
        // Do not fail registration; user is kept in pending state and can resend
        return {
          success: true,
          emailSent: false,
          code: emailErr?.code,
          error:
            emailErr?.code === 'auth/too-many-requests'
              ? 'Account created, but verification email rate limit reached. Please wait before requesting another email.'
              : emailErr?.code === 'auth/operation-not-allowed'
              ? 'Email templates or Email/Password provider are not enabled in your Firebase Console.'
              : 'Account created, but verification email could not be dispatched automatically. Please use the Resend button.',
        };
      }

      return { success: true, emailSent: true };
    } catch (err: any) {
      console.warn('[Nagrik One Auth] Sign-Up attempt note:', err?.code, err?.message);
      let errorMsg = 'Failed to create account. Please check your details.';
      if (err?.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email address already exists. Please log in instead.';
      } else if (err?.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err?.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters with letters and numbers.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMsg =
          'Email/Password sign-up is currently disabled in the Firebase Console for project "animated-axis-n48x0". Please enable the Email/Password provider in Firebase Console under Authentication > Sign-in method.';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, emailSent: false, error: errorMsg, code: err?.code };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await cred.user.reload();
      const verified = cred.user.emailVerified;
      setUser({ ...cred.user });
      setIsEmailVerified(verified);

      const token = await cred.user.getIdToken();
      setIdToken(token);
      await Promise.allSettled([
        fetchDbUser(token),
        syncFirestoreProfile(cred.user),
      ]);

      return { success: true, emailVerified: verified };
    } catch (err: any) {
      console.warn('[Nagrik One Auth] Sign-In attempt note:', err?.code, err?.message);
      let errorMsg = 'Invalid email or password.';
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        errorMsg = 'Incorrect email or password. Please verify and try again.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMsg =
          'Email/Password sign-in is disabled in your Firebase project. Please enable Email/Password provider in the Firebase Console under Authentication > Sign-in method.';
      } else if (err?.code === 'auth/user-disabled') {
        errorMsg = 'This citizen account has been disabled. Please contact municipal support.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please wait a few moments before trying again.';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your connection and try again.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, emailVerified: false, error: errorMsg, code: err?.code };
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      return { success: false, error: 'No authenticated user session found.' };
    }
    if (resendCooldown > 0) {
      return {
        success: false,
        error: `Please wait ${resendCooldown}s before requesting another verification email.`,
      };
    }

    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      startCooldown(60);
      return { success: true };
    } catch (err: any) {
      console.warn('[Nagrik One Auth] sendVerificationEmail note:', err?.code, err?.message);
      let errorMsg = 'Unable to send verification email. Please try again later.';
      if (err?.code === 'auth/too-many-requests') {
        startCooldown(120);
        errorMsg = 'Too many verification email requests. Please check your inbox or wait 2 minutes.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMsg = 'Firebase Authentication email templates are not enabled in your project.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg, code: err?.code };
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setUser({ ...auth.currentUser });
      setIsEmailVerified(verified);
      return verified;
    } catch (err) {
      console.warn('[Nagrik One Auth] checkEmailVerification note:', err);
      return false;
    }
  };

  const sendPasswordReset = async (email: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      return { success: true };
    } catch (err: any) {
      console.warn('[Nagrik One Auth] sendPasswordReset note:', err?.code, err?.message);
      // For user privacy and security requirements:
      // If user not found, we still return a neutral success message so accounts cannot be enumerated
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        return { success: true };
      }
      let errorMsg = 'Failed to dispatch password reset email. Please try again.';
      if (err?.code === 'auth/operation-not-allowed') {
        errorMsg = 'Password reset via email is disabled in your Firebase Console project settings.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMsg = 'Network connection failure. Please check your internet connection.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg, code: err?.code };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await result.user.reload();
      setIsEmailVerified(result.user.emailVerified);
      const token = await result.user.getIdToken();
      setIdToken(token);
      await Promise.allSettled([
        fetchDbUser(token),
        syncFirestoreProfile(result.user),
      ]);
      return { success: true, user: result.user };
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        console.info('Google Sign-In popup closed by user.');
        return { success: false, cancelled: true };
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by browser. Please enable popups and try again.');
      }
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setIdToken(null);
      setDbUser(null);
      setIsEmailVerified(false);
    } catch (err) {
      console.error('Sign Out failed:', err);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
      return token;
    }
    return null;
  };

  const clearVerificationNotice = () => setVerificationNotice(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        idToken,
        loading,
        isEmailVerified,
        resendCooldown,
        verificationNotice,
        clearVerificationNotice,
        signUpWithEmail,
        signInWithEmail,
        sendVerificationEmail,
        checkEmailVerification,
        sendPasswordReset,
        signInWithGoogle,
        signOut,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
