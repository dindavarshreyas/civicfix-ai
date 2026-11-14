import { PRIORITY_LEVELS, PRIORITY_THRESHOLDS } from '../config/constants.js';

/**
 * Calculates priority score and level according to CivicMind rubric:
 * score = clamp(safety + impact + location + timeWeather + min(15, 3*(report_count-1)), 0, 100)
 */
export function calculatePriority({
  safety_risk = 0,
  public_impact = 0,
  location_sensitivity = 0,
  time_weather_risk = 0,
  report_count = 1,
}) {
  const safety = Math.max(0, Math.min(40, Math.round(Number(safety_risk) || 0)));
  const impact = Math.max(0, Math.min(20, Math.round(Number(public_impact) || 0)));
  const location = Math.max(0, Math.min(15, Math.round(Number(location_sensitivity) || 0)));
  const timeWeather = Math.max(0, Math.min(10, Math.round(Number(time_weather_risk) || 0)));

  // Backend corroboration bonus: min(15, 3 * (report_count - 1))
  const count = Math.max(1, Math.round(Number(report_count) || 1));
  const corroboration_bonus = Math.min(15, Math.max(0, 3 * (count - 1)));

  const rawScore = safety + impact + location + timeWeather + corroboration_bonus;
  const score = Math.max(0, Math.min(100, rawScore));

  let level = PRIORITY_LEVELS.LOW;
  let defaultSlaHours = PRIORITY_THRESHOLDS.LOW.defaultSlaHours;

  if (score >= PRIORITY_THRESHOLDS.CRITICAL.min) {
    level = PRIORITY_LEVELS.CRITICAL;
    defaultSlaHours = PRIORITY_THRESHOLDS.CRITICAL.defaultSlaHours;
  } else if (score >= PRIORITY_THRESHOLDS.HIGH.min) {
    level = PRIORITY_LEVELS.HIGH;
    defaultSlaHours = PRIORITY_THRESHOLDS.HIGH.defaultSlaHours;
  } else if (score >= PRIORITY_THRESHOLDS.MEDIUM.min) {
    level = PRIORITY_LEVELS.MEDIUM;
    defaultSlaHours = PRIORITY_THRESHOLDS.MEDIUM.defaultSlaHours;
  }

  return {
    score,
    level,
    defaultSlaHours,
    factors: {
      safety_risk: safety,
      public_impact: impact,
      location_sensitivity: location,
      time_weather_risk: timeWeather,
      corroboration_bonus,
    },
  };
}

/**
 * Computes SLA due timestamp given SLA hours.
 */
export function calculateSlaDueAt(slaHours = 72, fromDate = new Date()) {
  const due = new Date(fromDate);
  due.setHours(due.getHours() + slaHours);
  return due.toISOString();
}
