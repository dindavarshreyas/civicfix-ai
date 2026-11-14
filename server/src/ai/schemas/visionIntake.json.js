export const visionIntakeJsonSchema = {
  type: "object",
  properties: {
    is_valid_civic_issue: { type: "boolean" },
    invalid_reason: { type: "string", description: "Empty if valid. Max 160 chars." },
    category: {
      type: "string",
      enum: ["garbage", "road_damage", "streetlight", "water_leakage", "drainage", "other"]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    title: { type: "string", description: "Max 90 chars, neutral and factual." },
    summary: { type: "string", description: "Max 400 chars, objective description." },
    visible_details: {
      type: "array",
      items: { type: "string" },
      maxItems: 8
    },
    hazard_cues: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "exposed_wiring",
          "deep_pothole",
          "flooding",
          "sewage_overflow",
          "fire_risk",
          "blocked_road",
          "near_school",
          "near_hospital",
          "main_road",
          "junction",
          "dark_area",
          "health_hazard",
          "none"
        ]
      },
      maxItems: 6
    },
    estimated_scale: {
      type: "string",
      enum: ["small", "medium", "large", "unknown"]
    },
    image_text_conflict: { type: "boolean" },
    reasoning: { type: "string" }
  },
  required: [
    "is_valid_civic_issue",
    "invalid_reason",
    "category",
    "confidence",
    "title",
    "summary",
    "visible_details",
    "hazard_cues",
    "estimated_scale",
    "image_text_conflict",
    "reasoning"
  ]
};
