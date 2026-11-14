import { SHARED_SYSTEM_INSTRUCTION } from './systemPrompt.js';

export const NOTIFICATION_ROLE_BLOCK = `ROLE: Citizen Notification Agent.
TASK: Write a short, warm, plain-language update for a citizen about their reported civic
issue, given the new status and any officer note. Be accurate and do not promise specific
dates beyond the provided SLA. Mention the reference number. If the issue was merged with
other reports, mention that neighbours also reported it and that they are all being kept
informed. Keep the in-app message under 240 characters.`;

export function buildNotificationPrompt(context) {
  const { reference_no, category, status, officer_note, report_count = 1, sla_hours = 72 } = context;

  const userText = `ISSUE DETAILS:
- Reference No: ${reference_no}
- Category: ${category}
- New Status: ${status}
- Officer / System Note: ${officer_note || 'Status updated.'}
- Total Reports / Neighbours: ${report_count}
- SLA Resolution Window: ${sla_hours} hours`;

  return {
    systemInstruction: `${SHARED_SYSTEM_INSTRUCTION}\n\n${NOTIFICATION_ROLE_BLOCK}`,
    userText,
  };
}
