import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { complaintJsonSchema } from '../ai/schemas/complaint.json.js';
import { complaintOutputSchema } from '../validation/aiSchemas.js';
import { buildComplaintPrompt } from '../ai/prompts/complaintPrompt.js';
import { getComplaintFallback } from '../ai/fallbacks.js';

/**
 * Complaint Drafting Agent prepares structured formal complaint for municipal filing
 * or an addendum for duplicate merges.
 */
export async function runComplaintAgent(context) {
  const { systemInstruction, userText } = buildComplaintPrompt(context);

  const result = await callAgentWithRetry({
    agentName: 'complaint',
    systemInstruction,
    userText,
    jsonSchema: complaintJsonSchema,
    zodSchema: complaintOutputSchema,
    fallbackFn: () => getComplaintFallback(context),
    fallbackContext: {},
  });

  return result;
}
