import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Safely resolve optional base configuration without hard failure if file is removed
const configModules = import.meta.glob<{ default: Record<string, string> }>('/firebase-applet-config.json', { eager: true });
const baseConfig = configModules['/firebase-applet-config.json']?.default || {};

// Resolves Firebase configuration securely from environment variables (VITE_FIREBASE_*),
// with hardcoded fallbacks to project identifier without exposing private keys.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || baseConfig?.apiKey || 'AIzaSyDDaoGAhq3oUicb7ZCeohhLsrQAq-ueHmk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || baseConfig?.authDomain || 'animated-axis-n48x0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || baseConfig?.projectId || 'animated-axis-n48x0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || baseConfig?.storageBucket || 'animated-axis-n48x0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || baseConfig?.messagingSenderId || '512639990934',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || baseConfig?.appId || '1:512639990934:web:112a6912e76b4e52e156b7',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || baseConfig?.firestoreDatabaseId || 'ai-studio-nagrikoneaicitiz-cead6d4d-452c-4b18-ada7-f37284817ea8',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app, firebaseConfig.storageBucket || undefined);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export default firebaseConfig;
