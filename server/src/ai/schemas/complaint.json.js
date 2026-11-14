export const complaintJsonSchema = {
  type: "object",
  properties: {
    subject: { type: "string", description: "Max 120 chars." },
    salutation: { type: "string" },
    body: { type: "string", description: "Max 1200 chars. Plain paragraphs separated by \\n\\n." },
    location_block: { type: "string", description: "Coordinates, address note, landmark." },
    evidence_summary: { type: "string", description: "Max 300 chars; mention if photo evidence attached." },
    requested_action: { type: "string", description: "Max 250 chars." },
    expected_resolution_timeline: { type: "string" },
    mode: { type: "string", enum: ["full", "addendum"] }
  },
  required: [
    "subject",
    "salutation",
    "body",
    "location_block",
    "evidence_summary",
    "requested_action",
    "expected_resolution_timeline",
    "mode"
  ]
};
