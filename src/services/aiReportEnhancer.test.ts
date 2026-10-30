import { describe, it, expect } from 'vitest';
import {
  normalizeCategory,
  mapSeverityScoreToLabel,
  resolveCategoryPrecedence,
  heuristicReportEnhance,
  CATEGORY_DEPARTMENT_MAP,
  VALID_CIVIC_CATEGORIES,
} from './aiReportEnhancer';

describe('NagrikOne AI Enhancement, Severity Assessment & Category Detection', () => {
  // Test 1: A Hindi description is polished into accurate English
  it('Criterion 1: Polishes a Hindi/Hinglish description into professional English without inventing facts', () => {
    const hindiInput =
      'yaha road pe bahut bade gaddhe h or barish me pani bhar jata h, gadi chalane me dikkat hoti h';
    const result = heuristicReportEnhance(hindiInput, 'Road Pothole', 'road_pothole');

    expect(result.original_description).toBe(hindiInput);
    expect(result.polished_description_en).toBeTruthy();
    expect(result.polished_description_en).toContain('Large potholes are present on this road');
    expect(result.polished_description_en).toContain('rainwater accumulates');
    expect(result.polished_description_en).toContain('vehicles to pass safely');
    // Does not invent injuries or fabricated measurements
    expect(result.polished_description_en.toLowerCase()).not.toContain('broken bones');
    expect(result.polished_description_en.toLowerCase()).not.toContain('5 fatalities');
  });

  // Test 2: An English description with grammatical errors is corrected without changing meaning
  it('Criterion 2: Corrects English with grammatical errors into concise, professional English', () => {
    const brokenEnglish = 'broken street light wire sparking in dark night very danger for pedestrian';
    const result = heuristicReportEnhance(brokenEnglish, 'Streetlight Wire');

    expect(result.original_description).toBe(brokenEnglish);
    expect(result.polished_description_en).toBeTruthy();
    // Capitalized first letter and ends with period
    expect(result.polished_description_en[0]).toBe(result.polished_description_en[0].toUpperCase());
    expect(result.polished_description_en.endsWith('.')).toBe(true);
    // Preserves key indicators
    expect(result.ai_detected_category).toBe('streetlight');
  });

  // Test 3: A safety hazard description receives a reasoned severity estimate (0–100)
  it('Criterion 3: Accurately computes a reasoned 0-100 severity index for safety hazards', () => {
    const criticalHazard =
      'Open manhole on main road with deep excavation and live wire sparking near pedestrian crossing';
    const result = heuristicReportEnhance(criticalHazard);

    expect(result.severity_index).toBeGreaterThanOrEqual(75);
    expect(result.severity_index).toBeLessThanOrEqual(100);
    expect(result.severity_label).toBe('Critical');
    expect(result.severity_confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.severity_explanation).toBeTruthy();
    expect(result.is_insufficient_info).toBe(false);
  });

  // Test 4: A vague description is flagged as insufficient information with low confidence
  it('Criterion 4: Flags vague or trivial descriptions as is_insufficient_info with low confidence', () => {
    const vagueInput = 'bad problem fix please';
    const result = heuristicReportEnhance(vagueInput);

    expect(result.is_insufficient_info).toBe(true);
    expect(result.severity_confidence).toBeLessThanOrEqual(0.5);
    expect(result.severity_index).toBeLessThan(25);
    expect(result.severity_label).toBe('Low');
    expect(result.severity_explanation.toLowerCase()).toContain('insufficient');
  });

  // Test 5: A report with matching manual and AI categories is confirmed
  it('Criterion 5: Confirms matching citizen manual and AI detected categories', () => {
    const description = 'Large pothole and broken asphalt on MG Road causing vehicular delay';
    const manualCategory = 'road_pothole';

    const resolution = resolveCategoryPrecedence(manualCategory, 'road_pothole', 0.95);
    expect(resolution.manualCategory).toBe('road_pothole');
    expect(resolution.aiDetectedCategory).toBe('road_pothole');
    expect(resolution.finalCategory).toBe('road_pothole');
    expect(resolution.selectionSource).toBe('manual');
    expect(resolution.categoryExplanation).toContain('matches AI recommendation');
  });

  // Test 6: A report with conflicting manual and AI categories strictly preserves the manual category
  it('Criterion 6: Citizen manual selection STRICTLY takes precedence over AI recommendation', () => {
    // Citizen chose "road_pothole", but AI detected "streetlight"
    const resolution = resolveCategoryPrecedence(
      'road_pothole',
      'streetlight',
      0.98,
      'Streetlight detected'
    );

    expect(resolution.manualCategory).toBe('road_pothole');
    expect(resolution.aiDetectedCategory).toBe('streetlight');
    // Non-negotiable: Final category MUST be the citizen manual category
    expect(resolution.finalCategory).toBe('road_pothole');
    expect(resolution.selectionSource).toBe('manual');
    expect(resolution.categoryExplanation).toContain('takes precedence over AI recommendation');
  });

  // Test 7: A report with no manual category uses a valid AI category
  it('Criterion 7: Applies AI detected category when citizen has not made a manual selection', () => {
    const resolution = resolveCategoryPrecedence(
      null, // No manual selection
      'water_drainage',
      0.92,
      'Sewage water and drain blockage identified'
    );

    expect(resolution.manualCategory).toBeNull();
    expect(resolution.aiDetectedCategory).toBe('water_drainage');
    expect(resolution.finalCategory).toBe('water_drainage');
    expect(resolution.selectionSource).toBe('ai_detected');
  });

  // Test 8: A report with an invalid AI category falls back gracefully
  it('Criterion 8: Gracefully falls back when AI produces an invalid category string', () => {
    // Neither manual category nor valid AI category exists
    const resolution = resolveCategoryPrecedence(
      null,
      'unknown_alien_category_9999',
      0.1,
      'Unable to parse'
    );

    expect(resolution.manualCategory).toBeNull();
    expect(VALID_CIVIC_CATEGORIES).toContain(resolution.finalCategory);
    expect(resolution.finalCategory).toBe('public_infrastructure');
    expect(resolution.selectionSource).toBe('fallback');
  });

  // Test 9: Simulated AI service failure preserves original report and applies safe fallbacks
  it('Criterion 9: Heuristic analyzer handles missing/malformed inputs safely without throwing', () => {
    const emptyResult = heuristicReportEnhance('', '', null);
    expect(emptyResult.original_description).toBe('');
    expect(emptyResult.polished_description_en).toBeTruthy();
    expect(emptyResult.final_category).toBe('public_infrastructure');
    expect(emptyResult.severity_index).toBeGreaterThanOrEqual(0);
    expect(emptyResult.severity_index).toBeLessThanOrEqual(100);
    expect(emptyResult.department).toBeTruthy();
    expect(emptyResult.sla_hours).toBeGreaterThan(0);
  });

  // Test 10: Complete data structure validation for database persistence
  it('Criterion 10: Verifies all AI-enhanced triage fields conform to database schema requirements', () => {
    const result = heuristicReportEnhance(
      'Sewage water overflowing from drain onto market road',
      'Drain Overflow',
      'water_drainage'
    );

    // Verify all required fields exist and have correct types
    expect(typeof result.original_description).toBe('string');
    expect(typeof result.polished_description_en).toBe('string');
    expect(typeof result.severity_index).toBe('number');
    expect(result.severity_index).toBeGreaterThanOrEqual(0);
    expect(result.severity_index).toBeLessThanOrEqual(100);
    expect(['Low', 'Moderate', 'High', 'Critical']).toContain(result.severity_label);
    expect(typeof result.severity_confidence).toBe('number');
    expect(typeof result.severity_explanation).toBe('string');
    expect(typeof result.is_insufficient_info).toBe('boolean');
    expect(typeof result.final_category).toBe('string');
    expect(VALID_CIVIC_CATEGORIES).toContain(result.final_category);
    expect(typeof result.department).toBe('string');
    expect(typeof result.sla_hours).toBe('number');
  });

  // Test 11: Downstream authority routing strictly adheres to final category
  it('Criterion 11: Directs department routing and SLA assignment based on finalCategory', () => {
    for (const cat of VALID_CIVIC_CATEGORIES) {
      const deptInfo = CATEGORY_DEPARTMENT_MAP[cat];
      expect(deptInfo).toBeDefined();
      expect(deptInfo.department.length).toBeGreaterThan(5);
      expect(deptInfo.defaultSlaHours).toBeGreaterThan(0);
      expect(deptInfo.displayName.length).toBeGreaterThan(3);
    }

    // Verify PWD routing for roads
    expect(CATEGORY_DEPARTMENT_MAP['road_pothole'].department).toContain('Public Works');
    // Verify DJB routing for water
    expect(CATEGORY_DEPARTMENT_MAP['water_drainage'].department).toContain('Delhi Jal Board');
    // Verify DISCOM routing for streetlights
    expect(CATEGORY_DEPARTMENT_MAP['streetlight'].department).toContain('Lighting');
  });

  // Helper test: Verify severity band boundaries
  it('Helper: Correctly maps 0-100 severity index to standard bands', () => {
    expect(mapSeverityScoreToLabel(0)).toBe('Low');
    expect(mapSeverityScoreToLabel(24)).toBe('Low');
    expect(mapSeverityScoreToLabel(25)).toBe('Moderate');
    expect(mapSeverityScoreToLabel(49)).toBe('Moderate');
    expect(mapSeverityScoreToLabel(50)).toBe('High');
    expect(mapSeverityScoreToLabel(74)).toBe('High');
    expect(mapSeverityScoreToLabel(75)).toBe('Critical');
    expect(mapSeverityScoreToLabel(100)).toBe('Critical');
  });

  // Helper test: Verify synonym normalization
  it('Helper: Normalizes various language synonyms to valid civic category keys', () => {
    expect(normalizeCategory('sadak')).toBe('road_pothole');
    expect(normalizeCategory('kachra')).toBe('garbage_waste');
    expect(normalizeCategory('bijli')).toBe('streetlight');
    expect(normalizeCategory('paani')).toBe('water_drainage');
    expect(normalizeCategory('shauchalay')).toBe('sanitation');
  });
});
