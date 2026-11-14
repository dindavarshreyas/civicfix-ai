import { generateStructured } from './geminiClient.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an AI agent with retry logic, timeout, and deterministic fallback.
 * Retries up to 2 times with backoff on network/parse/validation errors.
 * Never throws fatal exception; falls back gracefully.
 */
export async function callAgentWithRetry({
  agentName,
  systemInstruction,
  userText,
  image,
  jsonSchema,
  zodSchema,
  fallbackFn,
  fallbackContext,
}) {
  const maxRetries = env.AI_MAX_RETRIES || 2;
  const timeoutMs = env.AI_TIMEOUT_MS || 30000;
  let attempt = 0;
  let currentUserText = userText;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const resultPromise = generateStructured({
        systemInstruction,
        userText: currentUserText,
        image,
        jsonSchema,
        zodSchema,
      });

      const timeoutPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          const timeoutErr = new Error(`AI request timed out after ${timeoutMs}ms`);
          timeoutErr.code = 'TIMEOUT';
          reject(timeoutErr);
        });
      });

      const { data, rawText, latencyMs, model } = await Promise.race([
        resultPromise,
        timeoutPromise,
      ]);

      clearTimeout(timeoutId);

      return {
        status: 'succeeded',
        data,
        reasoning: data.reasoning || 'AI agent execution completed successfully.',
        model,
        latencyMs,
        error_message: null,
      };
    } catch (err) {
      lastError = err;
      attempt++;

      logger.warn(
        { agentName, attempt, error: err.message, code: err.code },
        `Agent ${agentName} attempt ${attempt} failed`
      );

      if (attempt <= maxRetries) {
        const backoffMs = attempt === 1 ? 500 : 1500;
        await sleep(backoffMs);

        // Correction note if schema validation failed
        if (err.name === 'ZodError') {
          currentUserText = `${userText}\n\n[Correction]: Your previous output failed schema validation: ${err.message}. Return valid JSON adhering strictly to the schema.`;
        }
      }
    }
  }

  // All retries failed or no API key -> execute deterministic fallback
  logger.info({ agentName, reason: lastError?.message }, `Using deterministic fallback for ${agentName}`);
  const fallbackData = fallbackFn(fallbackContext);

  return {
    status: 'fallback',
    data: fallbackData,
    reasoning: fallbackData.reasoning || 'Deterministic fallback executed due to AI unavailability or retry exhaustion.',
    model: 'fallback-heuristic',
    latencyMs: 1,
    error_message: lastError ? `${lastError.name}: ${lastError.message}` : 'Fallback triggered',
  };
}
