// CivicMind Constants & Configuration Defaults

export const USER_ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  ADMIN: 'admin',
};

export const ISSUE_CATEGORIES = [
  'garbage',
  'road_damage',
  'streetlight',
  'water_leakage',
  'drainage',
  'other',
];

export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const PRIORITY_THRESHOLDS = {
  CRITICAL: { min: 80, max: 100, defaultSlaHours: 24 },
  HIGH: { min: 60, max: 79, defaultSlaHours: 72 },
  MEDIUM: { min: 35, max: 59, defaultSlaHours: 168 }, // 7 days
  LOW: { min: 0, max: 34, defaultSlaHours: 336 },    // 14 days
};

export const ISSUE_STATUSES = [
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'reopened',
  'rejected',
];

export const ALLOWED_STATUS_TRANSITIONS = {
  submitted: ['triaged', 'rejected'],
  triaged: ['assigned', 'rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['closed', 'reopened'],
  reopened: ['assigned', 'in_progress', 'rejected'],
  closed: [], // Terminal
  rejected: [], // Terminal
};

export const REPORT_STATES = {
  RECEIVED: 'received',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
};

export const AGENT_RUN_STATUS = {
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  FALLBACK: 'fallback',
};

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
};

export const DEFAULT_PIPELINE_CONFIG = {
  DUPLICATE_RADIUS_M: 75,
  DUPLICATE_LOOKBACK_DAYS: 30,
  DUPLICATE_MAX_CANDIDATES: 5,
  DUPLICATE_MERGE_MIN_SIMILARITY: 0.6,
  AI_CONFIDENCE_THRESHOLD: 0.55,
  MAX_REPORTS_PER_USER_PER_DAY: 15,
};

export const HAZARD_CUES = [
  'exposed_wiring',
  'deep_pothole',
  'flooding',
  'sewage_overflow',
  'fire_risk',
  'blocked_road',
  'near_school',
  'near_hospital',
  'main_road',
  'junction',
  'dark_area',
  'health_hazard',
  'none',
];

export const DEFAULT_DEPARTMENTS = [
  {
    code: 'SWM',
    name: 'Solid Waste Management',
    description: 'Garbage collection, bin overflow, illegal dumping, street sweeping',
    handles_categories: ['garbage'],
    contact_email: 'swm@city.example',
  },
  {
    code: 'RPW',
    name: 'Roads & Public Works',
    description: 'Potholes, road cracks, broken pavements, road restoration',
    handles_categories: ['road_damage'],
    contact_email: 'roads@city.example',
  },
  {
    code: 'ESL',
    name: 'Electrical & Street Lighting',
    description: 'Streetlight installation, repair and exposed street wiring',
    handles_categories: ['streetlight'],
    contact_email: 'lighting@city.example',
  },
  {
    code: 'WSB',
    name: 'Water Supply & Sewerage Board',
    description: 'Water mains, pipe leaks, burst pipes, supply disruptions',
    handles_categories: ['water_leakage'],
    contact_email: 'water@city.example',
  },
  {
    code: 'DSW',
    name: 'Drainage & Storm Water',
    description: 'Blocked drains, sewer overflow, waterlogging, culvert cleaning',
    handles_categories: ['drainage'],
    contact_email: 'drainage@city.example',
  },
  {
    code: 'GGC',
    name: 'General Grievance Cell',
    description: 'Triage for unclassified or ambiguous civic complaints',
    handles_categories: ['other'],
    contact_email: 'grievance@city.example',
  },
];
