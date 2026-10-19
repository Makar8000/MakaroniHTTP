// limits from https://pushover.net/api#limits
export const bodySchema = {
  // null: the body is optional
  type: ["object", "null"],
  additionalProperties: false,
  properties: {
    title: { type: "string", maxLength: 250 },
    message: { type: "string", minLength: 1, maxLength: 1024 },
  },
};
