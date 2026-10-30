export type SupportedLanguage = 'en' | 'hi' | 'pa' | 'kn' | 'bn' | 'mr';

export type AppTheme = 'default' | 'senior-light' | 'senior-dark' | 'high-contrast';

export interface LanguageMeta {
  code: SupportedLanguage;
  nativeName: string;
  englishName: string;
  script: string;
  sampleGreeting: string;
  description: string;
}

export interface ThemeMeta {
  id: AppTheme;
  nameKey: string;
  descKey: string;
  badge: string;
  bgPreview: string;
  cardPreview: string;
  textPreview: string;
  accentPreview: string;
  isDark: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    script: 'Latin (English)',
    sampleGreeting: 'Hello',
    description: 'Pan-India standard and global lingua franca',
  },
  {
    code: 'hi',
    nativeName: 'हिंदी',
    englishName: 'Hindi',
    script: 'देवनागरी (Devanagari)',
    sampleGreeting: 'नमस्ते',
    description: 'भारत भर में व्यापक रूप से बोली जाने वाली राजभाषा',
  },
  {
    code: 'pa',
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    script: 'ਗੁਰਮੁਖੀ (Gurmukhi)',
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    description: 'ਪੰਜਾਬ ਅਤੇ ਉੱਤਰੀ ਖੇਤਰਾਂ ਦੀ ਜੀਵੰਤ ਭਾਸ਼ਾ',
  },
  {
    code: 'kn',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    script: 'ಕನ್ನಡ (Kannada)',
    sampleGreeting: 'ನಮಸ್ಕಾರ',
    description: 'ಕರ್ನಾಟಕದ ಸುಂದರ ಸಾಂಸ್ಕೃತಿಕ ಭಾಷೆ',
  },
  {
    code: 'bn',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    script: 'বাংলা (Bengali)',
    sampleGreeting: 'নমস্কার',
    description: 'পশ্চিমবঙ্গ ও পূর্ব ভারতের সমৃদ্ধ সাহিত্যিক ভাষা',
  },
  {
    code: 'mr',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    script: 'देवनागरी (Devanagari)',
    sampleGreeting: 'नमस्कार',
    description: 'महाराष्ट्राची समृद्ध ऐतिहासिक व नागरी भाषा',
  },
];

export const APP_THEMES: ThemeMeta[] = [
  {
    id: 'default',
    nameKey: 'themeDefaultName',
    descKey: 'themeDefaultDesc',
    badge: 'Standard',
    bgPreview: '#0f131c',
    cardPreview: '#181b25',
    textPreview: '#ffffff',
    accentPreview: '#10b981',
    isDark: true,
  },
  {
    id: 'senior-light',
    nameKey: 'themeSeniorLightName',
    descKey: 'themeSeniorLightDesc',
    badge: 'Senior Comfort',
    bgPreview: '#FAF7F2',
    cardPreview: '#FFFFFF',
    textPreview: '#0F172A',
    accentPreview: '#0D7653',
    isDark: false,
  },
  {
    id: 'senior-dark',
    nameKey: 'themeSeniorDarkName',
    descKey: 'themeSeniorDarkDesc',
    badge: 'Senior Comfort',
    bgPreview: '#111622',
    cardPreview: '#1A2232',
    textPreview: '#F8FAFC',
    accentPreview: '#10B981',
    isDark: true,
  },
  {
    id: 'high-contrast',
    nameKey: 'themeHighContrastName',
    descKey: 'themeHighContrastDesc',
    badge: 'WCAG AAA',
    bgPreview: '#FFFFFF',
    cardPreview: '#FFFFFF',
    textPreview: '#000000',
    accentPreview: '#000000',
    isDark: false,
  },
];
