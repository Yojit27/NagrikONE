import { CivicBadge } from '../types';

export const INITIAL_BADGES: CivicBadge[] = [
  {
    id: 'first-sentinel',
    title: 'First Sentinel',
    description: 'Submitted your first verified civic issue report to municipal authorities.',
    icon: 'ShieldAlert',
    category: 'reporting',
    unlocked: false,
    progress: 0,
    target: 1,
    currentValue: 0,
    unit: 'report',
  },
  {
    id: 'civic-guardian',
    title: 'Civic Guardian',
    description: 'Submitted 3 civic issues to safeguard your local neighborhood.',
    icon: 'Award',
    category: 'milestone',
    unlocked: false,
    progress: 0,
    target: 3,
    currentValue: 0,
    unit: 'reports',
  },
  {
    id: 'eagle-eye',
    title: 'Eagle Eye',
    description: 'Provided accurate photo evidence with verified GPS coordinates.',
    icon: 'Camera',
    category: 'accuracy',
    unlocked: false,
    progress: 0,
    target: 1,
    currentValue: 0,
    unit: 'photo',
  },
  {
    id: 'voice-of-street',
    title: 'Voice of the Street',
    description: 'Upvoted and supported 3 citizen reports to accelerate civic resolution.',
    icon: 'ThumbsUp',
    category: 'community',
    unlocked: false,
    progress: 0,
    target: 3,
    currentValue: 0,
    unit: 'upvotes',
  },
  {
    id: 'neighborhood-champion',
    title: 'Neighborhood Champion',
    description: 'Reported civic problems across 3 distinct infrastructure categories.',
    icon: 'MapPin',
    category: 'milestone',
    unlocked: false,
    progress: 0,
    target: 3,
    currentValue: 0,
    unit: 'categories',
  },
  {
    id: 'master-patroller',
    title: 'Master Patroller',
    description: 'Reached 5 civic contributions and helped improve urban living conditions.',
    icon: 'Trophy',
    category: 'milestone',
    unlocked: false,
    progress: 0,
    target: 5,
    currentValue: 0,
    unit: 'reports',
  },
  {
    id: 'rti-crusader',
    title: 'RTI Crusader',
    description: 'Generated a formal RTI application under Section 6(1) to demand municipal accountability.',
    icon: 'FileText',
    category: 'legal',
    unlocked: false,
    progress: 0,
    target: 1,
    currentValue: 0,
    unit: 'RTI draft',
  },
  {
    id: 'city-reformer',
    title: 'City Reformer',
    description: 'Followed a civic issue through the entire lifecycle to verified municipal resolution.',
    icon: 'Sparkles',
    category: 'milestone',
    unlocked: false,
    progress: 0,
    target: 1,
    currentValue: 0,
    unit: 'resolved report',
  },
  {
    id: 'pro-bono-legal-vanguard',
    title: 'Legal Vanguard & Pro Bono Action',
    description: 'Connected with partner law firms & pro bono advocates to legally escalate municipal negligence into judicial action.',
    icon: 'Scale',
    category: 'legal',
    unlocked: false,
    progress: 0,
    target: 1,
    currentValue: 0,
    unit: 'legal connect',
  },
];

const STORAGE_KEY = 'nagrikone_badges_v2';

export function loadSavedBadges(): CivicBadge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_BADGES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with INITIAL_BADGES to ensure new badges exist
      return INITIAL_BADGES.map((b) => {
        const found = parsed.find((p: any) => p.id === b.id);
        return found ? { ...b, ...found } : b;
      });
    }
  } catch (e) {
    console.warn('Failed to load badges from localStorage:', e);
  }
  return INITIAL_BADGES;
}

export function saveBadges(badges: CivicBadge[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
  } catch (e) {
    console.warn('Failed to save badges:', e);
  }
}

export interface BadgeCheckMetrics {
  totalReports: number;
  hasPhotoReport: boolean;
  totalUpvotesGiven: number;
  categoriesUsed: Set<string>;
  rtiGeneratedCount?: number;
  resolvedCount?: number;
  legalActionTakenCount?: number;
}

export function evaluateBadges(
  currentBadges: CivicBadge[],
  metrics: BadgeCheckMetrics
): { updatedBadges: CivicBadge[]; newlyUnlocked: CivicBadge[] } {
  const newlyUnlocked: CivicBadge[] = [];

  const updatedBadges = currentBadges.map((badge) => {
    let currentVal = badge.currentValue;

    switch (badge.id) {
      case 'first-sentinel':
        currentVal = metrics.totalReports;
        break;
      case 'civic-guardian':
        currentVal = metrics.totalReports;
        break;
      case 'eagle-eye':
        currentVal = metrics.hasPhotoReport ? 1 : 0;
        break;
      case 'voice-of-street':
        currentVal = metrics.totalUpvotesGiven;
        break;
      case 'neighborhood-champion':
        currentVal = metrics.categoriesUsed.size;
        break;
      case 'master-patroller':
        currentVal = metrics.totalReports;
        break;
      case 'rti-crusader':
        currentVal = metrics.rtiGeneratedCount || 0;
        break;
      case 'city-reformer':
        currentVal = metrics.resolvedCount || 0;
        break;
      case 'pro-bono-legal-vanguard':
        currentVal = metrics.legalActionTakenCount || 0;
        break;
    }

    const progress = Math.min(100, Math.round((currentVal / badge.target) * 100));
    const shouldUnlock = currentVal >= badge.target;
    const wasUnlocked = badge.unlocked;

    if (shouldUnlock && !wasUnlocked) {
      const unlockedBadge: CivicBadge = {
        ...badge,
        currentValue: currentVal,
        progress: 100,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(unlockedBadge);
      return unlockedBadge;
    }

    return {
      ...badge,
      currentValue: currentVal,
      progress,
      unlocked: shouldUnlock || wasUnlocked,
    };
  });

  saveBadges(updatedBadges);
  return { updatedBadges, newlyUnlocked };
}
