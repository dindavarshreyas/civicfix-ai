export const routingJsonSchema = {
  type: "object",
  properties: {
    department_id: { type: "string", description: "Must be one of the provided department ids." },
    department_code: { type: "string" },
    secondary_department_code: { type: "string", description: "Empty string if none." },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoning: { type: "string" }
  },
  required: [
    "department_id",
    "department_code",
    "secondary_department_code",
    "confidence",
    "reasoning"
  ]
};
