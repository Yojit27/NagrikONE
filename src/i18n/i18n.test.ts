import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './types';
import { TRANSLATIONS, getTranslation } from './translations';

describe('i18n - Multilingual Language Support & English Integration', () => {
  const expectedCodes: SupportedLanguage[] = ['en', 'hi', 'pa', 'kn', 'bn', 'mr'];

  it('includes all 6 supported languages in SUPPORTED_LANGUAGES metadata', () => {
    const registeredCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(registeredCodes).toEqual(expect.arrayContaining(expectedCodes));
    expect(registeredCodes).toContain('en');
    expect(registeredCodes.length).toBe(6);
  });

  it('provides native names and English names without country flags', () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(lang.nativeName).toBeTruthy();
      expect(lang.englishName).toBeTruthy();
      expect(lang.script).toBeTruthy();
      // Ensure no flag emojis are used
      expect(lang.nativeName).not.toMatch(/[\uD83C][\uDDE6-\uDDFF]/);
    });
  });

  it('contains comprehensive translation keys for English (en)', () => {
    const enDict = TRANSLATIONS.en;
    expect(enDict).toBeDefined();
    expect(enDict.brandName).toBe('NagrikOne');
    expect(enDict.btnReportIssue).toBe('Report Civic Issue');
    expect(enDict.onboardingLangTitle).toBe('Choose your preferred language');
    expect(enDict.onboardingThemeTitle).toBe('Choose your preferred appearance');
    expect(enDict.catPothole).toBe('Roads & Potholes');
    expect(enDict.statusInProgress).toBe('In Progress');
    expect(enDict.settingsTitle).toBe('Preferences & Appearance');
  });

  it('correctly resolves translations via getTranslation for English and Indic languages', () => {
    expect(getTranslation('en', 'btnReportIssue')).toBe('Report Civic Issue');
    expect(getTranslation('hi', 'btnReportIssue')).toBe('समस्या दर्ज करें');
    expect(getTranslation('pa', 'btnReportIssue')).toBe('ਸਮੱਸਿਆ ਦਰਜ ਕਰੋ');
    expect(getTranslation('kn', 'btnReportIssue')).toBe('ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ');
    expect(getTranslation('bn', 'btnReportIssue')).toBe('সমস্যা রিপোর্ট করুন');
    expect(getTranslation('mr', 'btnReportIssue')).toBe('तक्रार नोंदवा');
  });

  it('gracefully falls back when key is missing or invalid', () => {
    expect(getTranslation('en', 'non_existent_key_xyz', 'Default Fallback')).toBe('Default Fallback');
  });
});
