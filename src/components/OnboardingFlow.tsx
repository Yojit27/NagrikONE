import React, { useState } from 'react';
import { useLanguageTheme } from '../context/LanguageThemeContext';
import { SupportedLanguage, AppTheme, SUPPORTED_LANGUAGES, APP_THEMES } from '../i18n/types';
import { Check, ArrowRight, ArrowLeft, Sparkles, Eye, ShieldCheck, Sun, Moon } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  isOpen,
  onComplete,
  onCancel,
}) => {
  const {
    language: currentLang,
    theme: currentTheme,
    setLanguage: applyGlobalLanguage,
    setTheme: applyGlobalTheme,
    completeOnboarding,
    t,
  } = useLanguageTheme();

  const [step, setStep] = useState<'language' | 'theme'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLang || 'hi');
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(currentTheme || 'default');

  if (!isOpen) return null;

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    // Dynamically update language so next step immediately renders in chosen language
    applyGlobalLanguage(lang);
  };

  const handleContinueToTheme = () => {
    applyGlobalLanguage(selectedLanguage);
    setStep('theme');
  };

  const handleBackToLanguage = () => {
    setStep('language');
  };

  const handleFinishOnboarding = async () => {
    applyGlobalLanguage(selectedLanguage);
    applyGlobalTheme(selectedTheme);
    await completeOnboarding(selectedLanguage, selectedTheme);

    try {
      playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}

    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#151923] border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Top Progress & Step Bar */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-[#1a202e]/60">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm">
              {step === 'language' ? '1/2' : '2/2'}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {step === 'language' ? 'चरण 1: भाषा चयन' : 'चरण 2: दृश्य थीम'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {step === 'language' ? 'Language Preferences' : 'Appearance & Comfort'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-1.5 rounded-full transition-all ${
                step === 'language' ? 'bg-emerald-500 w-8' : 'bg-emerald-500'
              }`}
            />
            <div
              className={`w-6 h-1.5 rounded-full transition-all ${
                step === 'theme' ? 'bg-emerald-500 w-8' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
          </div>
        </div>

        {/* STEP A: LANGUAGE SELECTION */}
        {step === 'language' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <h1
                id="onboarding-title"
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                Choose your preferred language
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                अपनी पसंदीदा भाषा चुनें &bull; ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ &bull; ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ
              </p>
            </div>

            {/* 5 Selectable Language Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {SUPPORTED_LANGUAGES.map((lang, index) => {
                const isSelected = selectedLanguage === lang.code;
                const isFullSpan = index === SUPPORTED_LANGUAGES.length - 1 && SUPPORTED_LANGUAGES.length % 2 !== 0;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isFullSpan ? 'sm:col-span-2' : ''
                    } ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1a202e] hover:border-emerald-400/60 hover:bg-slate-100 dark:hover:bg-[#202738]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Native Script Badge */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl sm:text-2xl shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lang.nativeName.slice(0, 2)}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                            {lang.nativeName}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            ({lang.englishName})
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {lang.description}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step A Action Footer */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleContinueToTheme}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP B: THEME SELECTION */}
        {step === 'theme' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <h1
                id="onboarding-title"
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                {t('onboardingThemeTitle', 'Choose your preferred appearance')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {t(
                  'onboardingThemeSubtitle',
                  'Select high contrast or senior-friendly comfort themes with larger text and soothing colors.'
                )}
              </p>
            </div>

            {/* 4 Theme Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {APP_THEMES.map((thm) => {
                const isSelected = selectedTheme === thm.id;
                const themeName = t(thm.nameKey, thm.id);
                const themeDesc = t(thm.descKey, '');

                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(thm.id);
                      applyGlobalTheme(thm.id);
                    }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#1a202e] hover:border-emerald-400/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                            {themeName}
                          </h3>
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {thm.badge}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Miniature Live Preview Box */}
                    <div
                      className="rounded-xl p-3 border space-y-2 mb-3 overflow-hidden shadow-inner text-xs transition-colors"
                      style={{
                        backgroundColor: thm.bgPreview,
                        borderColor: thm.id === 'high-contrast' ? '#000000' : 'rgba(128,128,128,0.25)',
                        color: thm.textPreview,
                      }}
                    >
                      {/* Mini Card Surface */}
                      <div
                        className="rounded-lg p-2.5 border flex items-center justify-between"
                        style={{
                          backgroundColor: thm.cardPreview,
                          borderColor: thm.id === 'high-contrast' ? '#000000' : 'rgba(128,128,128,0.2)',
                        }}
                      >
                        <span className="font-bold text-[11px] truncate">
                          {t('previewBadgeText', 'In Progress')}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{
                            backgroundColor: thm.id === 'high-contrast' ? '#000000' : thm.accentPreview,
                            color: thm.id === 'high-contrast' ? '#ffffff' : '#000000',
                          }}
                        >
                          Ward 42
                        </span>
                      </div>

                      {/* Mini Button */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[10px] opacity-80 truncate">
                          {t('gridLiveStatus', 'Ward Status')}
                        </span>
                        <div
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: thm.id === 'high-contrast' ? '#000000' : thm.accentPreview,
                            color: '#ffffff',
                          }}
                        >
                          {t('previewButtonText', 'Report')}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {themeDesc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Step B Action Footer */}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleBackToLanguage}
                className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('btnBack', 'Back')}</span>
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{t('btnFinish', 'Enter Application')}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
