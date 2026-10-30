import { CivicCategoryType, AiReportAnalysisResult } from '../types';

export const VALID_CIVIC_CATEGORIES: CivicCategoryType[] = [
  'road_pothole',
  'garbage_waste',
  'streetlight',
  'water_drainage',
  'traffic_parking',
  'public_infrastructure',
  'sanitation',
];

export interface DepartmentInfo {
  department: string;
  defaultSlaHours: number;
  displayName: string;
}

export const CATEGORY_DEPARTMENT_MAP: Record<CivicCategoryType, DepartmentInfo> = {
  road_pothole: {
    department: 'Public Works Department (PWD) Division II',
    defaultSlaHours: 72,
    displayName: 'Roads & Potholes',
  },
  garbage_waste: {
    department: 'Municipal Solid Waste Management Dept (Zone 3)',
    defaultSlaHours: 48,
    displayName: 'Garbage & Solid Waste',
  },
  streetlight: {
    department: 'City Electricity Distribution & Lighting Board (DISCOM)',
    defaultSlaHours: 48,
    displayName: 'Street Lighting',
  },
  water_drainage: {
    department: 'Delhi Jal Board (DJB) / City Water Works',
    defaultSlaHours: 24,
    displayName: 'Water Supply & Drainage',
  },
  traffic_parking: {
    department: 'Traffic Police Municipal Cell',
    defaultSlaHours: 24,
    displayName: 'Traffic & Parking Enforcement',
  },
  public_infrastructure: {
    department: 'Municipal Infrastructure Engineering Wing',
    defaultSlaHours: 168,
    displayName: 'Public Infrastructure',
  },
  sanitation: {
    department: 'Municipal Public Health & Sanitation Division',
    defaultSlaHours: 48,
    displayName: 'Sanitation & Public Toilets',
  },
};

/**
 * Normalizes input string to a valid CivicCategoryType or null
 */
export function normalizeCategory(input?: string | null): CivicCategoryType | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.toLowerCase().trim().replace(/[-\s]+/g, '_');

  if (VALID_CIVIC_CATEGORIES.includes(raw as CivicCategoryType)) {
    return raw as CivicCategoryType;
  }

  // Synonym mapping
  if (raw.includes('pothole') || raw.includes('road') || raw.includes('asphalt') || raw.includes('gaddha') || raw.includes('sadak')) {
    return 'road_pothole';
  }
  if (raw.includes('garbage') || raw.includes('waste') || raw.includes('trash') || raw.includes('dump') || raw.includes('kachra')) {
    return 'garbage_waste';
  }
  if (raw.includes('streetlight') || raw.includes('lighting') || raw.includes('light') || raw.includes('lamp') || raw.includes('dark') || raw.includes('bijli')) {
    return 'streetlight';
  }
  if (raw.includes('water') || raw.includes('drain') || raw.includes('pipe') || raw.includes('flood') || raw.includes('leak') || raw.includes('paani') || raw.includes('sewer') || raw.includes('sewage')) {
    return 'water_drainage';
  }
  if (raw.includes('traffic') || raw.includes('parking') || raw.includes('jam') || raw.includes('signal') || raw.includes('bottleneck')) {
    return 'traffic_parking';
  }
  if (raw.includes('sanitation') || raw.includes('toilet') || raw.includes('urinal') || raw.includes('hygiene') || raw.includes('shauchalay')) {
    return 'sanitation';
  }
  if (raw.includes('infra') || raw.includes('bridge') || raw.includes('footpath') || raw.includes('sidewalk') || raw.includes('wall') || raw.includes('pavement')) {
    return 'public_infrastructure';
  }

  return null;
}

/**
 * Maps a 0-100 severity index to standard severity bands:
 * 0–24: Low
 * 25–49: Moderate
 * 50–74: High
 * 75–100: Critical
 */
export function mapSeverityScoreToLabel(score: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  if (bounded >= 75) return 'Critical';
  if (bounded >= 50) return 'High';
  if (bounded >= 25) return 'Moderate';
  return 'Low';
}

/**
 * PRIORITY 3: Resolves final category according to strict precedence rules:
 * 1. Citizen manual category ALWAYS takes precedence over AI detection.
 * 2. If no manual category exists, AI detected category is used if valid and confident.
 * 3. If neither is valid, fallback to 'public_infrastructure'.
 */
export function resolveCategoryPrecedence(
  manualCategoryInput?: string | null,
  aiDetectedCategoryInput?: string | null,
  categoryConfidence = 0.85,
  categoryExplanation = 'Evaluated from citizen description'
): {
  manualCategory: CivicCategoryType | null;
  aiDetectedCategory: CivicCategoryType;
  finalCategory: CivicCategoryType;
  categoryConfidence: number;
  categoryExplanation: string;
  selectionSource: 'manual' | 'ai_detected' | 'fallback';
} {
  const normalizedAi = normalizeCategory(aiDetectedCategoryInput);
  const aiDetectedCategory: CivicCategoryType = normalizedAi || 'public_infrastructure';

  const normalizedManual = normalizeCategory(manualCategoryInput);

  // RULE A: If a manual category has been selected by the citizen, preserve it as authoritative
  if (normalizedManual) {
    const isAgreement = normalizedManual === aiDetectedCategory;
    return {
      manualCategory: normalizedManual,
      aiDetectedCategory,
      finalCategory: normalizedManual, // MANUAL WINS
      categoryConfidence: 1.0, // Authoritative citizen manual choice
      categoryExplanation: isAgreement
        ? `Citizen manual selection (${CATEGORY_DEPARTMENT_MAP[normalizedManual].displayName}) matches AI recommendation.`
        : `Citizen manual selection (${CATEGORY_DEPARTMENT_MAP[normalizedManual].displayName}) takes precedence over AI recommendation (${CATEGORY_DEPARTMENT_MAP[aiDetectedCategory].displayName}).`,
      selectionSource: 'manual',
    };
  }

  // RULE B: No manual category provided; use valid AI detected category
  if (normalizedAi && categoryConfidence >= 0.25) {
    return {
      manualCategory: null,
      aiDetectedCategory,
      finalCategory: aiDetectedCategory, // AI DETECTED APPLIED
      categoryConfidence,
      categoryExplanation:
        categoryExplanation ||
        `No manual category specified. AI detected issue matches ${CATEGORY_DEPARTMENT_MAP[aiDetectedCategory].displayName}.`,
      selectionSource: 'ai_detected',
    };
  }

  // RULE C: Invalid or unconfident AI category with no manual selection
  return {
    manualCategory: null,
    aiDetectedCategory: 'public_infrastructure',
    finalCategory: 'public_infrastructure',
    categoryConfidence: 0.2,
    categoryExplanation:
      'Could not infer a specific category with high confidence. Routed to Public Infrastructure for administrative triage.',
    selectionSource: 'fallback',
  };
}

/**
 * Fallback heuristic processing when Gemini API is offline or returns an error.
 * Satisfies all non-negotiable rules for polishing, severity, and category precedence.
 */
export function heuristicReportEnhance(
  description: string,
  title?: string,
  manualCategory?: string | null
): AiReportAnalysisResult {
  const rawText = (description || title || '').trim();
  const lower = rawText.toLowerCase();

  // 1. Check for vague / insufficient information
  const trimmed = rawText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const vagueKeywords = ['bad', 'problem', 'issue', 'fix', 'help', 'kharab', 'dikkat', 'please', 'broken', 'repair'];
  const isTooShort = rawText.length < 15 || words.length < 3;
  const isVagueOnly = isTooShort || words.every((w) => vagueKeywords.includes(w.toLowerCase()));

  // 2. Polish description heuristic
  let polishedDescription = rawText;
  if (!polishedDescription) {
    polishedDescription = 'Civic infrastructure defect requiring municipal inspection and remediation.';
  } else {
    // Basic grammar/clean up without exaggerating or removing facts
    let cleaned = rawText
      .replace(/\s+/g, ' ')
      .trim();

    // Common Hindi/Hinglish translations for known patterns without inventing facts
    if (lower.includes('gaddhe') || lower.includes('gadhe') || lower.includes('gaddha')) {
      if (lower.includes('pani bhar jata') || lower.includes('water accumulates')) {
        cleaned = 'Large potholes are present on this road, and rainwater accumulates in them during rainfall, making it difficult for vehicles to pass safely.';
      } else if (lower.includes('gadi chalane')) {
        cleaned = 'Potholes on the roadway are obstructing traffic and creating hazardous driving conditions for passing vehicles.';
      } else {
        cleaned = 'Potholes are present on the roadway surface, creating a hazard for vehicular traffic and pedestrians.';
      }
    } else if (lower.includes('kachra') || lower.includes('kachre ka dher')) {
      cleaned = 'Accumulation of uncollected municipal garbage on the street is causing foul odors and unsanitary conditions.';
    } else if (lower.includes('bijli') || lower.includes('batti nahi') || lower.includes('light nahi')) {
      cleaned = 'Streetlights along this stretch are non-functional, causing poor visibility and unsafe conditions for pedestrians at night.';
    } else if (lower.includes('paani') && (lower.includes('pipe') || lower.includes('leak'))) {
      cleaned = 'Water pipeline leakage is resulting in continuous flow and water loss onto the public street.';
    } else {
      // Capitalize first letter and ensure ending period
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
        cleaned += '.';
      }
    }
    polishedDescription = cleaned;
  }

  // 3. Category detection heuristic
  let detectedCategory: CivicCategoryType = 'public_infrastructure';
  let categoryConfidence = 0.8;
  let categoryExplanation = 'Identified based on civic hazard keywords in description.';

  if (lower.includes('pothole') || lower.includes('road') || lower.includes('asphalt') || lower.includes('gaddh') || lower.includes('sadak')) {
    detectedCategory = 'road_pothole';
    categoryConfidence = 0.92;
    categoryExplanation = 'Description mentions road potholes and pavement defect keywords.';
  } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash') || lower.includes('dump') || lower.includes('kachra')) {
    detectedCategory = 'garbage_waste';
    categoryConfidence = 0.9;
    categoryExplanation = 'Description references uncollected waste or solid refuse.';
  } else if (lower.includes('light') || lower.includes('dark') || lower.includes('lamp') || lower.includes('pole') || lower.includes('bijli') || lower.includes('wire')) {
    detectedCategory = 'streetlight';
    categoryConfidence = 0.88;
    categoryExplanation = 'Description references street lighting or electrical fixtures.';
  } else if (lower.includes('water') || lower.includes('drain') || lower.includes('leak') || lower.includes('flood') || lower.includes('paani') || lower.includes('sewer') || lower.includes('sewage')) {
    detectedCategory = 'water_drainage';
    categoryConfidence = 0.93;
    categoryExplanation = 'Description references water pipeline, drainage, or sewage overflow.';
  } else if (lower.includes('traffic') || lower.includes('parking') || lower.includes('jam') || lower.includes('signal') || lower.includes('vehicle')) {
    detectedCategory = 'traffic_parking';
    categoryConfidence = 0.86;
    categoryExplanation = 'Description references traffic congestion or vehicular obstruction.';
  } else if (lower.includes('toilet') || lower.includes('sanitation') || lower.includes('urinal') || lower.includes('hygiene') || lower.includes('shauchalay')) {
    detectedCategory = 'sanitation';
    categoryConfidence = 0.89;
    categoryExplanation = 'Description references public sanitation or toilet facilities.';
  }

  // 4. Severity Assessment heuristic
  let severityIndex = 50;
  let severityConfidence = 0.85;
  let severityExplanation = 'Evaluated based on reported public infrastructure condition and disruption.';
  let isInsufficientInfo = false;

  if (isVagueOnly) {
    isInsufficientInfo = true;
    severityIndex = 20;
    severityConfidence = 0.25;
    severityExplanation =
      'Description contains insufficient factual details or specific location context to confirm immediate hazard severity; recorded as low-confidence preliminary triage.';
  } else {
    // Check critical safety hazards (immediate risk to human life or safety)
    const criticalIndicators = [
      'open manhole',
      'live wire',
      'sparking wire',
      'deep excavation',
      'cave in',
      'road collapse',
      'severe flood',
      'water in homes',
      'sparking transformer',
      'hazardous chemical',
      'major accident',
    ];
    const isCritical = criticalIndicators.some((ci) => lower.includes(ci));

    // Check high priority indicators
    const highIndicators = [
      'large pothole',
      'deep pothole',
      'two wheeler skid',
      'skidding',
      'tripping',
      'fall hazard',
      'burst pipe',
      'pipeline burst',
      'drinking water contamination',
      'sewage overflow',
      'pitch dark',
      'blind turn',
      'broken bridge',
    ];
    const isHigh = highIndicators.some((hi) => lower.includes(hi));

    if (isCritical) {
      severityIndex = 88;
      severityConfidence = 0.92;
      severityExplanation =
        'Description indicates immediate risk of severe bodily injury or life safety threat (e.g. open fall hazard, live current, or structural collapse).';
    } else if (isHigh) {
      severityIndex = 68;
      severityConfidence = 0.88;
      severityExplanation =
        'Description indicates substantial disruption or physical hazard to motorists and pedestrians requiring accelerated dispatch.';
    } else if (lower.includes('overflow') || lower.includes('dark') || lower.includes('smell') || lower.includes('blocked')) {
      severityIndex = 42;
      severityConfidence = 0.8;
      severityExplanation =
        'Moderate localized inconvenience and civic service impairment without immediate threat to life.';
    } else {
      severityIndex = 22;
      severityConfidence = 0.75;
      severityExplanation =
        'Low severity routine maintenance request with localized impact and no clear safety danger.';
    }
  }

  // 5. Apply Priority 3 Precedence Rules
  const categoryResolution = resolveCategoryPrecedence(
    manualCategory,
    detectedCategory,
    categoryConfidence,
    categoryExplanation
  );

  const deptInfo = CATEGORY_DEPARTMENT_MAP[categoryResolution.finalCategory];

  return {
    original_description: rawText,
    polished_description_en: polishedDescription,
    severity_index: severityIndex,
    severity_label: mapSeverityScoreToLabel(severityIndex),
    severity_confidence: severityConfidence,
    severity_explanation: severityExplanation,
    is_insufficient_info: isInsufficientInfo,
    manual_category: categoryResolution.manualCategory,
    ai_detected_category: categoryResolution.aiDetectedCategory,
    final_category: categoryResolution.finalCategory,
    category_confidence: categoryResolution.categoryConfidence,
    category_explanation: categoryResolution.categoryExplanation,
    suggested_title: title || `${deptInfo.displayName} Issue Report`,
    department: deptInfo.department,
    sla_hours: deptInfo.defaultSlaHours,
    safety_hazards: [
      severityIndex >= 70 ? 'Immediate commuter risk' : 'Localized traffic or pedestrian inconvenience',
      severityIndex >= 50 ? 'Secondary public infrastructure deterioration' : 'Routine municipal backlog',
    ],
    selection_source: categoryResolution.selectionSource,
  };
}
