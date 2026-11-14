import { SHARED_SYSTEM_INSTRUCTION } from './systemPrompt.js';

export const PRIORITY_ROLE_BLOCK = `ROLE: Priority & Severity Agent.
TASK: Assess how urgent this civic issue is. Score ONLY these four factors (integers):
 - safety_risk: 0-40 (risk of injury, electrocution, accident, disease)
 - public_impact: 0-20 (how many people affected; road importance; blocked access)
 - location_sensitivity: 0-15 (near school, hospital, main road, junction, market, transit)
 - time_weather_risk: 0-10 (worsens quickly with rain, darkness, heat, or time)
Do NOT score duplicates; the system adds a corroboration bonus separately.
Consider the current report_count only as supporting context for public_impact.
Provide short per-factor justification and an overall reasoning.`;

export function buildPriorityPrompt(context) {
  const { intake, location, report_count = 1 } = context;

  const userText = `CIVIC ISSUE TO EVALUATE:
- Category: ${intake.category}
- Title: ${intake.title}
- Summary: ${intake.summary}
- Scale: ${intake.estimated_scale}
- Hazard Cues: ${(intake.hazard_cues || []).join(', ')}
- Visible Details: ${(intake.visible_details || []).join(', ')}
- Location Notes: ${location.address_text || ''} ${location.landmark || ''}
- Current Duplicate/Report Count: ${report_count} (for context only)`;

  return {
    systemInstruction: `${SHARED_SYSTEM_INSTRUCTION}\n\n${PRIORITY_ROLE_BLOCK}`,
    userText,
  };
}
