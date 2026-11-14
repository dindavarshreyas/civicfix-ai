import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { notificationJsonSchema } from '../ai/schemas/notification.json.js';
import { notificationOutputSchema } from '../validation/aiSchemas.js';
import { buildNotificationPrompt } from '../ai/prompts/notificationPrompt.js';
import { getNotificationFallback } from '../ai/fallbacks.js';

/**
 * Citizen Notification Agent creates warm, clear, empathetic update messages.
 */
export async function runNotificationAgent(context) {
  const { systemInstruction, userText } = buildNotificationPrompt(context);

  const result = await callAgentWithRetry({
    agentName: 'notification',
    systemInstruction,
    userText,
    jsonSchema: notificationJsonSchema,
    zodSchema: notificationOutputSchema,
    fallbackFn: () => getNotificationFallback(context),
    fallbackContext: {},
  });

  return result;
}
