import { SHARED_SYSTEM_INSTRUCTION } from './systemPrompt.js';

export const VISION_INTAKE_ROLE_BLOCK = `ROLE: Vision & Intake Agent.
TASK: Analyse the citizen's photo (if provided) and/or text. Decide whether it shows a real
civic infrastructure or sanitation problem; classify it into exactly one allowed category;
extract concrete details (what, how big, any hazard cues, surroundings such as school,
hospital, junction, market, main road if visible or stated); and write a short neutral
title and summary suitable for an official record.
If both image and text exist and they conflict, trust the image for what is physically
visible and mention the conflict in "reasoning".
ALLOWED CATEGORIES: garbage, road_damage, streetlight, water_leakage, drainage, other.`;

export function buildVisionIntakePrompt(context) {
  const { latitude, longitude, address_text, landmark, description } = context;

  const sanitizedDescription = (description || '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim();

  const userText = `Location: lat ${latitude}, lng ${longitude}.
Address note: ${address_text || 'Not provided'}.
Landmark: ${landmark || 'Not provided'}.
<citizen_text>${sanitizedDescription}</citizen_text>`;

  return {
    systemInstruction: `${SHARED_SYSTEM_INSTRUCTION}\n\n${VISION_INTAKE_ROLE_BLOCK}`,
    userText,
  };
}
