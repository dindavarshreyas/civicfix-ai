import { describe, it, expect } from 'vitest';
import { haversineM } from '../utils/geo.js';
import { getDuplicateFallback } from '../ai/fallbacks.js';

describe('Duplicate Detection & Geospatial Logic', () => {
  it('correctly calculates Haversine distance between two coordinates', () => {
    // Distance between two points ~25m apart
    const lat1 = 12.97210;
    const lon1 = 77.59500;
    const lat2 = 12.97225;
    const lon2 = 77.59515;

    const distance = haversineM(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(35);
  });

  it('reports 0 metres for identical coordinates', () => {
    const d = haversineM(12.9721, 77.5950, 12.9721, 77.5950);
    expect(d).toBeCloseTo(0, 1);
  });

  it('fallback merges candidate when distance <= 30m', () => {
    const candidates = [
      {
        id: 'iss-123',
        reference_no: 'CIV-2026-000101',
        distance_m: 18.5,
        title: 'Deep pothole',
      },
    ];

    const result = getDuplicateFallback(candidates);
    expect(result.decision).toBe('merge');
    expect(result.matched_issue_id).toBe('iss-123');
    expect(result.similarity_score).toBeGreaterThanOrEqual(0.6);
  });

  it('fallback creates new_issue when closest candidate > 30m', () => {
    const candidates = [
      {
        id: 'iss-456',
        reference_no: 'CIV-2026-000102',
        distance_m: 85.0,
        title: 'Deep pothole',
      },
    ];

    const result = getDuplicateFallback(candidates);
    expect(result.decision).toBe('new_issue');
    expect(result.matched_issue_id).toBe('');
  });

  it('returns new_issue when candidates list is empty', () => {
    const result = getDuplicateFallback([]);
    expect(result.decision).toBe('new_issue');
    expect(result.matched_issue_id).toBe('');
  });
});
