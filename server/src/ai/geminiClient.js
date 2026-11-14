import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const ai = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;
export const MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Calls Gemini with a system instruction, optional image, and a JSON schema.
 * Returns { data, rawText, latencyMs, model }. Throws error on failure.
 */
export async function generateStructured({
  systemInstruction,
  userText,
  image,
  jsonSchema,
  zodSchema,
  temperature = 0.2,
}) {
  if (!env.GEMINI_API_KEY || !ai) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.code = 'NO_API_KEY';
    throw error;
  }

  const parts = [{ text: userText }];
  if (image && image.base64) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType || 'image/webp',
        data: image.base64,
      },
    });
  }

  const started = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      temperature,
      responseMimeType: 'application/json',
      responseSchema: jsonSchema, // Google GenAI SDK schema
      maxOutputTokens: 2048,
    },
  });

  const latencyMs = Date.now() - started;
  const rawText = response.text;

  if (!rawText) {
    throw new Error('Empty response from Gemini model');
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (err) {
    const parseError = new Error(`Failed to parse Gemini JSON output: ${err.message}`);
    parseError.code = 'JSON_PARSE_ERROR';
    parseError.rawText = rawText;
    throw parseError;
  }

  const validated = zodSchema.parse(parsedJson);

  return {
    data: validated,
    rawText,
    latencyMs,
    model: MODEL,
  };
}
