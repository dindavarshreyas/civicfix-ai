import { SHARED_SYSTEM_INSTRUCTION } from './systemPrompt.js';

export const DUPLICATE_ROLE_BLOCK = `ROLE: Duplicate Detection & Merge Agent.
TASK: Decide whether the NEW report describes the SAME real-world problem as one of the
EXISTING open issues listed. Two reports are the same problem only if they concern the
same physical defect or accumulation at effectively the same spot (consider the distance_m
given), and the same category. Similar problems on the same street that are clearly
different spots (different pothole, different lamp post) are NOT duplicates.
Description wording may differ; judge by meaning, location and visible details.
Choose at most one existing issue to merge into. If unsure, prefer "new_issue" when
distance_m > 40 and the descriptions differ in specifics; prefer "merge" when distance_m
<= 25 and the descriptions are compatible.
Also write "merged_summary_update": one sentence that adds any NEW information from the
new report to the canonical issue (empty if nothing new).`;

export function buildDuplicatePrompt(context) {
  const { newReport, candidates } = context;

  const userText = `NEW REPORT:
- Category: ${newReport.category}
- Title: ${newReport.title}
- Summary: ${newReport.summary}
- Details: ${(newReport.visible_details || []).join(', ')}
- Latitude: ${newReport.latitude}, Longitude: ${newReport.longitude}
- Citizen Text: <citizen_text>${newReport.description || ''}</citizen_text>

NEARBY CANDIDATE ISSUES (sorted by distance):
${JSON.stringify(
  candidates.map((c) => ({
    id: c.id,
    reference_no: c.reference_no,
    distance_m: Math.round(c.distance_m),
    title: c.title,
    summary: c.summary,
    status: c.status,
    priority: c.priority,
    report_count: c.report_count,
    last_reported_at: c.last_reported_at,
  })),
  null,
  2
)}`;

  return {
    systemInstruction: `${SHARED_SYSTEM_INSTRUCTION}\n\n${DUPLICATE_ROLE_BLOCK}`,
    userText,
  };
}
