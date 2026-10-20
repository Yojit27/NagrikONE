import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import baseConfig from '../../firebase-applet-config.json';

// Resolves Firebase configuration securely from environment variables (VITE_FIREBASE_*),
// ensuring raw API keys are never hardcoded inside source files or repository configuration.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || baseConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || baseConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || baseConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || baseConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || baseConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || baseConfig.appId || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || baseConfig.firestoreDatabaseId || '',
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
