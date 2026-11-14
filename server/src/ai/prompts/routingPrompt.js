import { SHARED_SYSTEM_INSTRUCTION } from './systemPrompt.js';

export const ROUTING_ROLE_BLOCK = `ROLE: Department Routing Agent.
TASK: Choose the single most appropriate department from the provided list to resolve
this issue, using the category, summary, details and hazard cues. Prefer a department whose
handles_categories includes the category, but override that only if the details clearly
belong elsewhere (e.g. a water pipe leak causing a pothole -> Water Supply first, mention
Roads as secondary). If nothing fits confidently, choose the General Grievance Cell.`;

export function buildRoutingPrompt(context) {
  const { intake, departments } = context;

  const departmentListSummary = (departments || []).map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description,
    handles_categories: d.handles_categories,
  }));

  const userText = `INTAKE DATA:
${JSON.stringify(intake, null, 2)}

ACTIVE DEPARTMENTS:
${JSON.stringify(departmentListSummary, null, 2)}`;

  return {
    systemInstruction: `${SHARED_SYSTEM_INSTRUCTION}\n\n${ROUTING_ROLE_BLOCK}`,
    userText,
  };
}
