import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { bodySchema } from "../schemas/pushover.schemas.ts";
import type { FindMyPhoneBody } from "../types/pushover.types.ts";

/**
 * Encapsulates the routes for the find-my-phone endpoint
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  fastify.route<{ Body: FindMyPhoneBody | null }>({
    method: "POST",
    url: "/find-my-phone",
    config: { rateLimit: { max: 3, timeWindow: "1 minute" } },
    schema: { body: bodySchema },
    handler: async (req, reply) => {
      req.log.info("Find my phone route");
      try {
        const resp = await fetch("https://api.pushover.net/1/messages.json", {
          method: "POST",
          body: new URLSearchParams({
            token: Bun.env.PUSHOVER_API_KEY ?? "",
            user: Bun.env.PUSHOVER_USER_KEY ?? "",
            title: req.body?.title ?? "Find my device",
            message: req.body?.message ?? "Alert sent from Makaroni",
            priority: "2",
            retry: "45",
            expire: `${60 * 5}`,
            sound: "peace",
          }),
        });
        return reply.code(resp.ok ? 200 : 502).send(await resp.json());
      } catch (err) {
        // network failure, or a non-JSON body such as a proxy error page
        req.log.error(err);
        return reply.code(502).send({ error: "pushover request failed" });
      }
    },
  });
}

export default routes;
