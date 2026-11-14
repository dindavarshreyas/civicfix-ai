import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { routingJsonSchema } from '../ai/schemas/routing.json.js';
import { routingOutputSchema } from '../validation/aiSchemas.js';
import { buildRoutingPrompt } from '../ai/prompts/routingPrompt.js';
import { getRoutingFallback } from '../ai/fallbacks.js';

/**
 * Department Routing Agent selects the single best department from live database list.
 */
export async function runRoutingAgent(context) {
  const { intake, departments } = context;

  const { systemInstruction, userText } = buildRoutingPrompt({ intake, departments });

  const result = await callAgentWithRetry({
    agentName: 'routing',
    systemInstruction,
    userText,
    jsonSchema: routingJsonSchema,
    zodSchema: routingOutputSchema,
    fallbackFn: () => getRoutingFallback(intake.category, departments),
    fallbackContext: {},
  });

  // Post-processing verification: department_id must exist in departments list
  const validDept = (departments || []).find((d) => d.id === result.data.department_id);
  if (!validDept) {
    const fallback = getRoutingFallback(intake.category, departments);
    result.data.department_id = fallback.department_id;
    result.data.department_code = fallback.department_code;
    result.reasoning += ` (Department ID reconciled with database registry: ${fallback.department_code})`;
  } else {
    result.data.department_code = validDept.code;
    result.data.department_name = validDept.name;
    result.data.sla_hours = validDept.sla_hours;
  }

  return result;
}
