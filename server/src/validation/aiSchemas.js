import { z } from 'zod';
import { HAZARD_CUES, ISSUE_CATEGORIES } from '../config/constants.js';

// Vision & Intake Output Schema
export const visionIntakeOutputSchema = z.object({
  is_valid_civic_issue: z.boolean(),
  invalid_reason: z.string().max(160),
  category: z.enum(ISSUE_CATEGORIES),
  confidence: z.number().min(0).max(1),
  title: z.string().max(90),
  summary: z.string().max(400),
  visible_details: z.array(z.string()).max(8),
  hazard_cues: z.array(z.enum(HAZARD_CUES)).max(6),
  estimated_scale: z.enum(['small', 'medium', 'large', 'unknown']),
  image_text_conflict: z.boolean(),
  reasoning: z.string(),
}).strict();

// Department Routing Output Schema
export const routingOutputSchema = z.object({
  department_id: z.string(),
  department_code: z.string(),
  secondary_department_code: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
}).strict();

// Duplicate Detection Output Schema
export const duplicateOutputSchema = z.object({
  decision: z.enum(['merge', 'new_issue']),
  matched_issue_id: z.string(),
  similarity_score: z.number().min(0).max(1),
  merged_summary_update: z.string().max(200),
  reasoning: z.string(),
}).strict();

// Priority Output Schema
export const priorityOutputSchema = z.object({
  safety_risk: z.number().int().min(0).max(40),
  public_impact: z.number().int().min(0).max(20),
  location_sensitivity: z.number().int().min(0).max(15),
  time_weather_risk: z.number().int().min(0).max(10),
  factor_notes: z.object({
    safety_risk: z.string(),
    public_impact: z.string(),
    location_sensitivity: z.string(),
    time_weather_risk: z.string(),
  }),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
}).strict();

// Complaint Output Schema
export const complaintOutputSchema = z.object({
  subject: z.string().max(120),
  salutation: z.string(),
  body: z.string().max(1200),
  location_block: z.string(),
  evidence_summary: z.string().max(300),
  requested_action: z.string().max(250),
  expected_resolution_timeline: z.string(),
  mode: z.enum(['full', 'addendum']),
}).strict();

// Notification Output Schema
export const notificationOutputSchema = z.object({
  title: z.string().max(70),
  message: z.string().max(240),
  email_subject: z.string().max(100),
  email_body: z.string().max(700),
  tone: z.enum(['informative', 'reassuring', 'celebratory', 'apologetic']),
}).strict();
