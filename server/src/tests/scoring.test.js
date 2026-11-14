import { describe, it, expect } from 'vitest';
import { calculatePriority } from '../utils/scoring.js';
import { PRIORITY_LEVELS, PRIORITY_THRESHOLDS } from '../config/constants.js';

describe('Priority Scoring Engine', () => {
  it('correctly calculates baseline score and maps to priority level', () => {
    const result = calculatePriority({
      safety_risk: 35,
      public_impact: 18,
      location_sensitivity: 12,
      time_weather_risk: 8,
      report_count: 1,
    });

    // 35 + 18 + 12 + 8 + 0 = 73 -> HIGH
    expect(result.score).toBe(73);
    expect(result.level).toBe(PRIORITY_LEVELS.HIGH);
    expect(result.defaultSlaHours).toBe(72);
  });

  it('correctly computes duplicate corroboration bonus min(15, 3*(n-1)) and escalates to CRITICAL', () => {
    // 35 + 18 + 12 + 8 = 73
    // For report_count = 4: bonus = min(15, 3*(4-1)) = 9
    // Final score = 73 + 9 = 82 -> CRITICAL (>=80)
    const result = calculatePriority({
      safety_risk: 35,
      public_impact: 18,
      location_sensitivity: 12,
      time_weather_risk: 8,
      report_count: 4,
    });

    expect(result.factors.corroboration_bonus).toBe(9);
    expect(result.score).toBe(82);
    expect(result.level).toBe(PRIORITY_LEVELS.CRITICAL);
    expect(result.defaultSlaHours).toBe(24);
  });

  it('caps corroboration bonus at 15 for large report counts', () => {
    const result = calculatePriority({
      safety_risk: 10,
      public_impact: 10,
      location_sensitivity: 5,
      time_weather_risk: 5,
      report_count: 15, // 3 * 14 = 42 -> capped at 15
    });

    expect(result.factors.corroboration_bonus).toBe(15);
    expect(result.score).toBe(45); // 30 + 15 = 45 -> MEDIUM
    expect(result.level).toBe(PRIORITY_LEVELS.MEDIUM);
  });

  it('clamps each factor to its maximum allowed limit', () => {
    const result = calculatePriority({
      safety_risk: 999, // max 40
      public_impact: 999, // max 20
      location_sensitivity: 999, // max 15
      time_weather_risk: 999, // max 10
      report_count: 10, // max bonus 15
    });

    expect(result.factors.safety_risk).toBe(40);
    expect(result.factors.public_impact).toBe(20);
    expect(result.factors.location_sensitivity).toBe(15);
    expect(result.factors.time_weather_risk).toBe(10);
    expect(result.score).toBe(100);
    expect(result.level).toBe(PRIORITY_LEVELS.CRITICAL);
  });

  it('correctly assigns LOW priority for minor issues', () => {
    const result = calculatePriority({
      safety_risk: 5,
      public_impact: 5,
      location_sensitivity: 0,
      time_weather_risk: 0,
      report_count: 1,
    });

    expect(result.score).toBe(10);
    expect(result.level).toBe(PRIORITY_LEVELS.LOW);
    expect(result.defaultSlaHours).toBe(336); // 14 days
  });
});
