import type { FastifyInstance, FastifyPluginOptions } from "fastify";

/**
 * Encapsulates the routes
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
// deno-lint-ignore require-await
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  fastify.route({
    method: "GET",
    url: "/health",
    handler: (_req, reply) => {
      reply.send({ status: "ok", uptime: Math.floor(performance.now() / 1000) });
    },
  });
}

export default routes;
