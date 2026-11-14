export const notificationJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Max 70 chars." },
    message: { type: "string", description: "Max 240 chars." },
    email_subject: { type: "string", description: "Max 100 chars." },
    email_body: { type: "string", description: "Max 700 chars, plain text." },
    tone: { type: "string", enum: ["informative", "reassuring", "celebratory", "apologetic"] }
  },
  required: [
    "title",
    "message",
    "email_subject",
    "email_body",
    "tone"
  ]
};
