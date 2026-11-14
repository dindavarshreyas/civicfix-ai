export const duplicateJsonSchema = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["merge", "new_issue"] },
    matched_issue_id: { type: "string", description: "Empty string if new_issue." },
    similarity_score: { type: "number", minimum: 0, maximum: 1 },
    merged_summary_update: { type: "string", description: "Max 200 chars." },
    reasoning: { type: "string" }
  },
  required: [
    "decision",
    "matched_issue_id",
    "similarity_score",
    "merged_summary_update",
    "reasoning"
  ]
};
