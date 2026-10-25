export const bodySchema = {
  type: "object",
  required: ["text"],
  properties: {
    // a type list, not anyOf: inside anyOf, Fastify's coerceTypes "array" would turn ["a"] into "a" and change the response shape
    text: { type: ["string", "array"], minLength: 1, minItems: 1, items: { type: "string", minLength: 1 } },
    sourceLang: { type: ["string", "null"], minLength: 1 },
    targetLang: { type: "string", minLength: 1 },
  },
};
