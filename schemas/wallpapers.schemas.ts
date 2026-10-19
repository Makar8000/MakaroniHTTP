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

export const domainBodySchema = {
  type: "object",
  required: ["name", "base_url", "tags"],
  additionalProperties: false,
  properties: {
    // used as a path segment in /wallpapers/:domain
    name: { type: "string", pattern: "^[A-Za-z0-9_-]+$", maxLength: 100 },
    base_url: { type: "string", pattern: "^https?://\\S+$", maxLength: 2048 },
    tags: { type: "string", maxLength: 2000 },
    type: { type: "string", enum: ["danbooru", "moebooru", "custom"] },
  },
};

// name is the primary key and comes from the path, so it can't be patched
const { name: _name, ...domainPatchProperties } = domainBodySchema.properties;
export const domainPatchBodySchema = { ...domainBodySchema, required: [], properties: domainPatchProperties };
