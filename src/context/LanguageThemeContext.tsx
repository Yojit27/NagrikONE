import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, AppTheme, SUPPORTED_LANGUAGES, APP_THEMES } from '../i18n/types';
import { getTranslation } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const STORAGE_LANG_KEY = 'nagrikone_language';
const STORAGE_THEME_VARIANT_KEY = 'nagrikone_theme_variant';
const STORAGE_ONBOARDING_KEY = 'nagrikone_onboarding_completed';

export interface LanguageThemeContextType {
  language: SupportedLanguage;
  theme: AppTheme;
  setLanguage: (lang: SupportedLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  t: (key: string, fallback?: string) => string;
  showOnboarding: boolean;
  onboardingStep: 'language' | 'theme' | null;
  setOnboardingStep: (step: 'language' | 'theme' | null) => void;
  openOnboarding: (step?: 'language' | 'theme') => void;
  closeOnboarding: () => void;
  completeOnboarding: (selectedLang?: SupportedLanguage, selectedTheme?: AppTheme) => Promise<void>;
  isThemeDark: boolean;
}

const LanguageThemeContext = createContext<LanguageThemeContextType>({
  language: 'hi',
  theme: 'default',
  setLanguage: () => {},
  setTheme: () => {},
  t: (key, fallback) => fallback || key,
  showOnboarding: false,
  onboardingStep: null,
  setOnboardingStep: () => {},
  openOnboarding: () => {},
  closeOnboarding: () => {},
  completeOnboarding: async () => {},
  isThemeDark: true,
});

export const LanguageThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // 1. Language state initialization
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as SupportedLanguage;
      if (saved && ['en', 'hi', 'pa', 'kn', 'bn', 'mr'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'hi'; // Default to Hindi
  });

  // 2. Theme state initialization
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_VARIANT_KEY) as AppTheme;
      if (saved && ['default', 'senior-light', 'senior-dark', 'high-contrast'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'default';
  });

  // 3. Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'language' | 'theme' | null>(null);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    const isDark =
      theme === 'senior-dark' ||
      (theme === 'default' &&
        (localStorage.getItem('nagrikone_theme') !== 'light'));

    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      body.classList.remove('dark');
    }
  }, [theme]);

  // Sync user preferences with Firestore when user logs in
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const syncUserPreferences = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists() && isMounted) {
          const data = snap.data();
          const hasCompleted = !!data.onboardingCompleted;

          if (data.preferredLanguage && ['en', 'hi', 'pa', 'kn', 'bn', 'mr'].includes(data.preferredLanguage)) {
            setLanguageState(data.preferredLanguage as SupportedLanguage);
            localStorage.setItem(STORAGE_LANG_KEY, data.preferredLanguage);
          }
          if (data.preferredTheme && ['default', 'senior-light', 'senior-dark', 'high-contrast'].includes(data.preferredTheme)) {
            setThemeState(data.preferredTheme as AppTheme);
            localStorage.setItem(STORAGE_THEME_VARIANT_KEY, data.preferredTheme);
          }

          if (hasCompleted) {
            localStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
          } else {
            // New user without completed preferences: prompt onboarding
            const localCompleted = localStorage.getItem(STORAGE_ONBOARDING_KEY) === 'true';
            if (!localCompleted) {
              setOnboardingStep('language');
              setShowOnboarding(true);
            }
          }
        } else if (isMounted) {
          // Document does not exist or missing onboarding flag
          const localCompleted = localStorage.getItem(STORAGE_ONBOARDING_KEY) === 'true';
          if (!localCompleted) {
            setOnboardingStep('language');
            setShowOnboarding(true);
          }
        }
      } catch (err) {
        console.warn('Could not read user preferences from Firestore:', err);
      }
    };

    syncUserPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Set Language Handler
  const setLanguage = useCallback(
    (newLang: SupportedLanguage) => {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_LANG_KEY, newLang);
      } catch {}

      if (user) {
        // Persist to Firestore asynchronously
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { preferredLanguage: newLang }, { merge: true }).catch((e) =>
          console.warn('Preference save error:', e)
        );
      }
    },
    [user]
  );

  // Set Theme Handler
  const setTheme = useCallback(
    (newTheme: AppTheme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_THEME_VARIANT_KEY, newTheme);
      } catch {}

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { preferredTheme: newTheme }, { merge: true }).catch((e) =>
          console.warn('Preference save error:', e)
        );
      }
    },
    [user]
  );

  // Translation function
  const t = useCallback(
    (key: string, fallback?: string): string => {
      return getTranslation(language, key, fallback);
    },
    [language]
  );

  // Open Onboarding
  const openOnboarding = useCallback((step: 'language' | 'theme' = 'language') => {
    setOnboardingStep(step);
    setShowOnboarding(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingStep(null);
  }, []);

  // Complete Onboarding
  const completeOnboarding = useCallback(
    async (selectedLang?: SupportedLanguage, selectedTheme?: AppTheme) => {
      const finalLang = selectedLang || language;
      const finalTheme = selectedTheme || theme;

      setLanguageState(finalLang);
      setThemeState(finalTheme);

      try {
        localStorage.setItem(STORAGE_LANG_KEY, finalLang);
        localStorage.setItem(STORAGE_THEME_VARIANT_KEY, finalTheme);
        localStorage.setItem(STORAGE_ONBOARDING_KEY, 'true');
      } catch {}

      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(
            userRef,
            {
              preferredLanguage: finalLang,
              preferredTheme: finalTheme,
              onboardingCompleted: true,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not persist onboarding to Firestore:', err);
        }
      }

      setShowOnboarding(false);
      setOnboardingStep(null);
    },
    [language, theme, user]
  );

  const isThemeDark =
    theme === 'senior-dark' ||
    (theme === 'default' &&
      (localStorage.getItem('nagrikone_theme') !== 'light'));

  return (
    <LanguageThemeContext.Provider
      value={{
        language,
        theme,
        setLanguage,
        setTheme,
        t,
        showOnboarding,
        onboardingStep,
        setOnboardingStep,
        openOnboarding,
        closeOnboarding,
        completeOnboarding,
        isThemeDark,
      }}
    >
      {children}
    </LanguageThemeContext.Provider>
  );
};

export const useLanguageTheme = () => useContext(LanguageThemeContext);
