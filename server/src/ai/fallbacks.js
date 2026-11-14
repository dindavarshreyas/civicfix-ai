import { calculatePriority } from '../utils/scoring.js';

/**
 * Deterministic fallback for Vision & Intake Agent.
 */
export function getVisionIntakeFallback(context) {
  const text = ((context.description || '') + ' ' + (context.address_text || '')).toLowerCase();

  let category = 'other';
  let confidence = 0.35;
  let title = 'Civic issue report';
  let hazard_cues = ['none'];

  if (/garbage|trash|waste|dump|rubbish|bin|litter/.test(text)) {
    category = 'garbage';
    confidence = 0.75;
    title = 'Garbage accumulation reported';
    hazard_cues = ['health_hazard'];
  } else if (/pothole|road|crack|pavement|asphalt|tarmac/.test(text)) {
    category = 'road_damage';
    confidence = 0.8;
    title = 'Road damage or pothole reported';
    hazard_cues = ['deep_pothole'];
  } else if (/light|lamp|dark|pole|bulb|wiring|electric/.test(text)) {
    category = 'streetlight';
    confidence = 0.8;
    title = 'Streetlight malfunction reported';
    hazard_cues = ['dark_area'];
  } else if (/leak|pipe|water|burst|supply/.test(text)) {
    category = 'water_leakage';
    confidence = 0.8;
    title = 'Water leakage or burst pipe reported';
  } else if (/drain|sewer|clog|flood|waterlog|gutter|culvert/.test(text)) {
    category = 'drainage';
    confidence = 0.8;
    title = 'Drainage blockage or flooding reported';
    hazard_cues = ['flooding'];
  }

  const summary = context.description
    ? `Citizen reported: "${context.description.slice(0, 350)}"`
    : `Citizen submitted evidence of ${category.replace('_', ' ')} at coordinates ${context.latitude}, ${context.longitude}.`;

  return {
    is_valid_civic_issue: true,
    invalid_reason: '',
    category,
    confidence,
    title,
    summary,
    visible_details: ['Reported via citizen intake'],
    hazard_cues,
    estimated_scale: 'medium',
    image_text_conflict: false,
    reasoning: 'Fallback heuristic classified issue based on keyword and metadata analysis.',
  };
}

/**
 * Deterministic fallback for Department Routing Agent.
 */
export function getRoutingFallback(category, departments = []) {
  const match = departments.find(
    (d) => d.is_active !== false && d.handles_categories && d.handles_categories.includes(category)
  );

  if (match) {
    return {
      department_id: match.id,
      department_code: match.code,
      secondary_department_code: '',
      confidence: 0.85,
      reasoning: `Matched active department ${match.name} handling ${category}.`,
    };
  }

  // Fallback to General Grievance Cell or first department
  const ggc = departments.find((d) => d.code === 'GGC') || departments[0] || {
    id: '00000000-0000-0000-0000-000000000000',
    code: 'GGC',
    name: 'General Grievance Cell',
  };

  return {
    department_id: ggc.id,
    department_code: ggc.code,
    secondary_department_code: '',
    confidence: 0.5,
    reasoning: 'No specific department handler found; routed to General Grievance Cell for manual triage.',
  };
}

/**
 * Deterministic fallback for Duplicate Detection Agent.
 */
export function getDuplicateFallback(candidates = []) {
  if (!candidates || candidates.length === 0) {
    return {
      decision: 'new_issue',
      matched_issue_id: '',
      similarity_score: 0.0,
      merged_summary_update: '',
      reasoning: 'No open candidate issues found in proximity.',
    };
  }

  const closest = candidates[0];
  // If nearest candidate is within 30 metres, assume duplicate in fallback
  if (closest && closest.distance_m <= 30) {
    return {
      decision: 'merge',
      matched_issue_id: closest.id,
      similarity_score: 0.85,
      merged_summary_update: 'Additional citizen report received within 30 metres.',
      reasoning: `Deterministic fallback: Candidate ${closest.reference_no} is within ${Math.round(closest.distance_m)}m of the report.`,
    };
  }

  return {
    decision: 'new_issue',
    matched_issue_id: '',
    similarity_score: 0.2,
    merged_summary_update: '',
    reasoning: 'Deterministic fallback: Closest candidate issue is beyond 30m threshold.',
  };
}

/**
 * Deterministic fallback for Priority Agent.
 */
export function getPriorityFallback(category, report_count = 1) {
  const categoryBase = {
    road_damage: 50,
    drainage: 50,
    water_leakage: 45,
    streetlight: 40,
    garbage: 35,
    other: 30,
  }[category] || 35;

  const safety_risk = Math.round(categoryBase * 0.5);
  const public_impact = Math.round(categoryBase * 0.25);
  const location_sensitivity = 5;
  const time_weather_risk = 5;

  const calculated = calculatePriority({
    safety_risk,
    public_impact,
    location_sensitivity,
    time_weather_risk,
    report_count,
  });

  return {
    safety_risk,
    public_impact,
    location_sensitivity,
    time_weather_risk,
    factor_notes: {
      safety_risk: `Standard baseline safety score for ${category}.`,
      public_impact: 'Standard baseline public impact.',
      location_sensitivity: 'Default sensitivity baseline.',
      time_weather_risk: 'Default seasonal risk baseline.',
    },
    confidence: 0.65,
    reasoning: 'Deterministic rule-based priority assessment based on municipal category baselines.',
    calculated,
  };
}

/**
 * Deterministic fallback for Complaint Drafting Agent.
 */
export function getComplaintFallback({
  subject = 'Civic Grievance Notice',
  reference_no = 'CIV-PENDING',
  category = 'other',
  department_name = 'Municipal Department',
  location_block = 'Reported Location',
  mode = 'full',
  report_count = 1,
}) {
  if (mode === 'addendum') {
    return {
      subject: `ADDENDUM: ${subject} (${reference_no})`,
      salutation: `To the Officer-in-Charge, ${department_name},`,
      body: `Please note that an additional citizen has corroborated this issue. The total number of verified citizen complaints for this location is now ${report_count}. Immediate field inspection and rectification are requested.`,
      location_block,
      evidence_summary: 'Additional citizen report appended to canonical record.',
      requested_action: 'Expedite inspection and resolve hazard under escalated priority.',
      expected_resolution_timeline: 'As per SLA priority schedule.',
      mode: 'addendum',
    };
  }

  return {
    subject: `Civic Grievance: ${category.replace('_', ' ').toUpperCase()} at ${location_block}`,
    salutation: `To the Officer-in-Charge, ${department_name},`,
    body: `A civic problem categorized under ${category.replace('_', ' ')} has been formally registered through CivicMind. Photographic or descriptive evidence has been submitted by the citizen. Please assign a field officer to inspect the location and carry out required remediation within the prescribed municipal SLA window.`,
    location_block,
    evidence_summary: 'Citizen-provided visual and textual evidence attached to record.',
    requested_action: 'Inspect site, schedule corrective works, and update status in CivicMind.',
    expected_resolution_timeline: 'Within SLA response timeframe.',
    mode: 'full',
  };
}

/**
 * Deterministic fallback for Notification Agent.
 */
export function getNotificationFallback({ reference_no, status, report_count = 1 }) {
  const statusTitles = {
    submitted: 'Report Registered',
    triaged: 'Report Triaged',
    assigned: 'Officer Assigned',
    in_progress: 'Work In Progress',
    resolved: 'Issue Resolved',
    closed: 'Issue Closed',
    reopened: 'Issue Reopened',
    rejected: 'Report Update',
  };

  const title = statusTitles[status] || `Status Updated: ${status}`;
  const countNote = report_count > 1 ? ` (${report_count} neighbours also reported this)` : '';
  const message = `Issue ${reference_no} is now ${status.replace('_', ' ')}${countNote}. We will keep you updated.`;

  return {
    title,
    message: message.slice(0, 240),
    email_subject: `[CivicMind] Update on ${reference_no}: ${status.replace('_', ' ')}`,
    email_body: `Dear Citizen,\n\nYour civic report ${reference_no} has moved to status: ${status.replace('_', ' ')}.\n\nThank you for helping keep our community clean, safe, and functional.\n\nCivicMind Municipal Coordination`,
    tone: status === 'resolved' ? 'celebratory' : 'informative',
  };
}
