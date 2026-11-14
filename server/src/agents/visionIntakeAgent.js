import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { visionIntakeJsonSchema } from '../ai/schemas/visionIntake.json.js';
import { visionIntakeOutputSchema } from '../validation/aiSchemas.js';
import { buildVisionIntakePrompt } from '../ai/prompts/visionIntakePrompt.js';
import { getVisionIntakeFallback } from '../ai/fallbacks.js';

/**
 * Vision & Intake Agent analyzes image and text to identify the issue,
 * classify into one of the allowed categories, judge confidence, and extract cues.
 */
export async function runVisionIntakeAgent(context, image) {
  const { systemInstruction, userText } = buildVisionIntakePrompt(context);

  const result = await callAgentWithRetry({
    agentName: 'vision_intake',
    systemInstruction,
    userText,
    image,
    jsonSchema: visionIntakeJsonSchema,
    zodSchema: visionIntakeOutputSchema,
    fallbackFn: getVisionIntakeFallback,
    fallbackContext: context,
  });

  return result;
}
