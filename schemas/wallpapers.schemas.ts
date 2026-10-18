export const querySchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1 },
    offset: { type: "integer", minimum: 0 },
    tags: { type: "string" },
    random: { type: "boolean" },
  },
};

export const bodySchema = {
  type: "object",
  required: ["title", "tags", "file_url", "enabled"],
  additionalProperties: false,
  properties: {
    title: { type: "string", maxLength: 500 },
    tags: { type: "string", maxLength: 2000 },
    file_url: { type: "string", pattern: "^https?://\\S+$", maxLength: 2048 },
    enabled: { type: "boolean" },
  },
};

export const patchBodySchema = { ...bodySchema, required: [] };

export const paramsSchema = {
  type: "object",
  properties: { id: { type: "integer" } },
};
