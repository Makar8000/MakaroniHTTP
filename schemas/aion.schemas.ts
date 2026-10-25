export const bodySchema = {
  type: "object",
  required: ["msg"],
  properties: {
    // Discord's message limit; the timestamp and item links parseAionMessage adds can still push it over (-> 502)
    msg: { type: "string", minLength: 1, maxLength: 2000 },
  },
};
