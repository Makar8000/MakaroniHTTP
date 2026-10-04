import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as discord from "../util/discord.util.ts";

interface AionChatBody {
  msg: string;
}

const REG_REPLACE: { regex: RegExp; replace: string }[] = [
  { regex: /\[charname:(?<charname>[^;\]]+)[^\]]*\]/g, replace: "$1" },
  { regex: /\[cmd:(?<charname>[^;\]]+)[^\]]*\]/g, replace: "<Recruit Group>" },
  { regex: /\[item: ?(?<itemId>[^;\]]+)[^\]]*\]/g, replace: "<https://aioncodex.com/usc/item/$1/>" },
];
const parseAionMessage = (msg: string): string => {
  let ret = msg;
  REG_REPLACE.forEach((r) => {
    ret = ret.replaceAll(r.regex, r.replace);
  });
  ret = `[<t:${Math.floor(Date.now() / 1000)}:T>] ${ret}`;
  return ret;
};

/**
 * Encapsulates the routes
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
// deno-lint-ignore require-await
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  fastify.route<{ Body: AionChatBody }>({
    method: "POST",
    url: "/aionChat",
    handler: async (req, reply) => {
      req.log.info("Auth route");
      const message = parseAionMessage(req.body.msg);
      await discord.sendChannelMessage(Deno.env.get("THREAD_ID") ?? "", { content: message });
      reply.send({ success: true });
    },
  });
}

export default routes;
