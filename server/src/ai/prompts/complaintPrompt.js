import { SHARED_SYSTEM_INSTRUCTION } from './systemPrompt.js';

export const COMPLAINT_ROLE_BLOCK = `ROLE: Complaint Drafting Agent.
TASK: Draft a formal, concise, respectful complaint addressed to the responsible
department, ready to be filed. Include only facts from the inputs. Use clear professional
English. For merged issues (mode = "addendum"), draft a short addendum stating that
additional citizens have reported the same problem, the new report count, and any new
details, instead of repeating the whole complaint.`;

export function buildComplaintPrompt(context) {
  const { intake, routing, priority, location, mode = 'full', report_count = 1, reference_no } = context;

  const userText = `MODE: ${mode}
REFERENCE NUMBER: ${reference_no || 'TBD'}
DEPARTMENT: ${routing.department_code} (Name: ${routing.department_name || routing.department_code})
CATEGORY: ${intake.category}
TITLE: ${intake.title}
SUMMARY: ${intake.summary}
EVIDENCE DETAILS: ${(intake.visible_details || []).join(', ')}
HAZARDS: ${(intake.hazard_cues || []).join(', ')}
LOCATION: Lat ${location.latitude}, Lng ${location.longitude}. Address: ${location.address_text || 'Not specified'}. Landmark: ${location.landmark || 'Not specified'}.
PRIORITY LEVEL: ${priority.level} (Score: ${priority.score}/100, SLA: ${priority.defaultSlaHours}h)
TOTAL REPORT COUNT: ${report_count}`;

  return {
    systemInstruction: `${SHARED_SYSTEM_INSTRUCTION}\n\n${COMPLAINT_ROLE_BLOCK}`,
    userText,
  };
}
