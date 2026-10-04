import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import fastifyAuth from "@fastify/auth";
import healthRoutes from "./routes/health.routes.ts";
import deeplRoutes from "./routes/deepl.routes.ts";
// import aionRoutes from './routes/aion.routes.ts';

declare module "fastify" {
  interface FastifyInstance {
    verifyApiKey: (
      req: FastifyRequest,
      reply: FastifyReply,
      done: (err?: Error) => void,
    ) => void;
  }
}

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        ignore: "pid,hostname",
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss Z",
      },
    },
  },
});

fastify.register(fastifyAuth);
fastify.decorate(
  "verifyApiKey",
  (req: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
    if (req.headers["apikey"] != Deno.env.get("API_KEY")) {
      return done(new Error("Invalid API Key"));
    }
    done();
  },
);

fastify.after(() => {
  fastify.addHook("onRequest", fastify.auth([fastify.verifyApiKey]));
  fastify.register(healthRoutes);
  // fastify.register(aionRoutes);
  fastify.register(deeplRoutes);
});

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    Deno.exit(1);
  }
};
start();
