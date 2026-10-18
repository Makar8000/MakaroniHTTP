import type { FastifyInstance, FastifyPluginOptions } from "fastify";

/**
 * Encapsulates the routes for the health endpoints
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  const handler = (_req: unknown, reply: { send: (payload: unknown) => unknown }): void => {
    reply.send({ status: "ok", uptime: Math.floor(performance.now() / 1000) });
  };

  fastify.route({ method: "GET", url: "/health", handler });
  fastify.route({ method: "GET", url: "/health-auth", onRequest: fastify.basicAuth, handler });
}

export default routes;
