export const priorityJsonSchema = {
  type: "object",
  properties: {
    safety_risk: { type: "integer", minimum: 0, maximum: 40 },
    public_impact: { type: "integer", minimum: 0, maximum: 20 },
    location_sensitivity: { type: "integer", minimum: 0, maximum: 15 },
    time_weather_risk: { type: "integer", minimum: 0, maximum: 10 },
    factor_notes: {
      type: "object",
      properties: {
        safety_risk: { type: "string" },
        public_impact: { type: "string" },
        location_sensitivity: { type: "string" },
        time_weather_risk: { type: "string" }
      },
      required: [
        "safety_risk",
        "public_impact",
        "location_sensitivity",
        "time_weather_risk"
      ]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoning: { type: "string" }
  },
  required: [
    "safety_risk",
    "public_impact",
    "location_sensitivity",
    "time_weather_risk",
    "factor_notes",
    "confidence",
    "reasoning"
  ]
};
