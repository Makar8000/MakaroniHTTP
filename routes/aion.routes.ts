import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { AionChatBody } from "../types/aion.types.ts";
import { parseAionMessage } from "../util/aion.util.ts";
import * as discord from "../util/discord.util.ts";

/**
 * Encapsulates the routes for the aion endpoints
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  fastify.route<{ Body: AionChatBody }>({
    method: "POST",
    url: "/aionChat",
    handler: async (req, reply) => {
      req.log.info("Auth route");
      const message = parseAionMessage(req.body.msg);
      await discord.sendChannelMessage(Bun.env.THREAD_ID ?? "", { content: message });
      reply.send({ success: true });
    },
  });
}

export default routes;
