import { describe, it, expect } from 'vitest';
import {
  visionIntakeOutputSchema,
  routingOutputSchema,
  duplicateOutputSchema,
  priorityOutputSchema,
  complaintOutputSchema,
  notificationOutputSchema,
} from '../validation/aiSchemas.js';

describe('AI Zod Schemas Validation', () => {
  it('validates a correct Vision & Intake agent output', () => {
    const validIntake = {
      is_valid_civic_issue: true,
      invalid_reason: '',
      category: 'road_damage',
      confidence: 0.92,
      title: 'Pothole on MG Road near bus stop',
      summary: 'A 1-metre pothole with exposed sub-base in the primary driving lane.',
      visible_details: ['asphalt breakup', 'exposed gravel', 'water puddle'],
      hazard_cues: ['deep_pothole', 'main_road'],
      estimated_scale: 'medium',
      image_text_conflict: false,
      reasoning: 'Clear visual evidence of road cratering in an active vehicle carriageway.',
    };

    const parsed = visionIntakeOutputSchema.parse(validIntake);
    expect(parsed.category).toBe('road_damage');
    expect(parsed.confidence).toBe(0.92);
  });

  it('rejects Vision Intake with invalid category', () => {
    const invalidIntake = {
      is_valid_civic_issue: true,
      invalid_reason: '',
      category: 'alien_invasion', // Invalid category
      confidence: 0.9,
      title: 'Strange object',
      summary: 'Details',
      visible_details: [],
      hazard_cues: ['none'],
      estimated_scale: 'small',
      image_text_conflict: false,
      reasoning: 'Test',
    };

    expect(() => visionIntakeOutputSchema.parse(invalidIntake)).toThrow();
  });

  it('validates Department Routing output', () => {
    const validRouting = {
      department_id: '11111111-1111-1111-1111-111111111111',
      department_code: 'RPW',
      secondary_department_code: '',
      confidence: 0.88,
      reasoning: 'Road asphalt restoration falls under Roads & Public Works division.',
    };

    const parsed = routingOutputSchema.parse(validRouting);
    expect(parsed.department_code).toBe('RPW');
  });

  it('validates Priority Agent output and enforces factor ranges', () => {
    const validPriority = {
      safety_risk: 30, // 0-40
      public_impact: 15, // 0-20
      location_sensitivity: 10, // 0-15
      time_weather_risk: 5, // 0-10
      factor_notes: {
        safety_risk: 'High vehicle speed',
        public_impact: 'High morning commuter footfall',
        location_sensitivity: 'Near transit hub',
        time_weather_risk: 'Ponding during rainfall',
      },
      confidence: 0.85,
      reasoning: 'Multi-factor severity analysis points to elevated priority.',
    };

    const parsed = priorityOutputSchema.parse(validPriority);
    expect(parsed.safety_risk).toBe(30);

    // Test out of range safety risk (must be <= 40)
    expect(() =>
      priorityOutputSchema.parse({
        ...validPriority,
        safety_risk: 55, // exceeds 40
      })
    ).toThrow();
  });

  it('validates Complaint Drafting output', () => {
    const validComplaint = {
      subject: 'Civic Grievance: ROAD DAMAGE on MG Road',
      salutation: 'To the Executive Engineer, Roads & Public Works,',
      body: 'A severe road surface breach has been reported.\n\nImmediate rectification is requested.',
      location_block: 'MG Road Metro Exit 2 (12.9721, 77.5950)',
      evidence_summary: 'Photographic evidence attached showing deep asphalt crater.',
      requested_action: 'Perform emergency cold mix patching and level surface.',
      expected_resolution_timeline: '72 hours as per SLA standard.',
      mode: 'full',
    };

    const parsed = complaintOutputSchema.parse(validComplaint);
    expect(parsed.mode).toBe('full');
  });

  it('validates Notification Agent output', () => {
    const validNotif = {
      title: 'Action In Progress',
      message: 'A field engineer has been dispatched to inspect issue CIV-2026-000101.',
      email_subject: '[CivicMind] Update: CIV-2026-000101',
      email_body: 'Dear Citizen, your report has moved to In Progress.',
      tone: 'reassuring',
    };

    const parsed = notificationOutputSchema.parse(validNotif);
    expect(parsed.tone).toBe('reassuring');
  });
});
