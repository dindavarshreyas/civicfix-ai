import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { priorityJsonSchema } from '../ai/schemas/priority.json.js';
import { priorityOutputSchema } from '../validation/aiSchemas.js';
import { buildPriorityPrompt } from '../ai/prompts/priorityPrompt.js';
import { getPriorityFallback } from '../ai/fallbacks.js';
import { calculatePriority } from '../utils/scoring.js';

/**
 * Priority & Severity Agent evaluates four distinct risk dimensions,
 * which the backend clamps and combines with duplicate corroboration bonus.
 */
export async function runPriorityAgent(context) {
  const { intake, location, report_count = 1 } = context;

  const { systemInstruction, userText } = buildPriorityPrompt({
    intake,
    location,
    report_count,
  });

  const result = await callAgentWithRetry({
    agentName: 'priority',
    systemInstruction,
    userText,
    jsonSchema: priorityJsonSchema,
    zodSchema: priorityOutputSchema,
    fallbackFn: () => getPriorityFallback(intake.category, report_count),
    fallbackContext: {},
  });

  // Backend deterministic calculation & clamping
  const calculated = calculatePriority({
    safety_risk: result.data.safety_risk,
    public_impact: result.data.public_impact,
    location_sensitivity: result.data.location_sensitivity,
    time_weather_risk: result.data.time_weather_risk,
    report_count,
  });

  result.calculated = calculated;
  return result;
}
