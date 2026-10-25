import "./util/env.ts";
import fastifyBasicAuth from "@fastify/basic-auth";
import fastifyRateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import aionRoutes from "./routes/aion.routes.ts";
import deeplRoutes from "./routes/deepl.routes.ts";
import healthRoutes from "./routes/health.routes.ts";
import pushoverRoutes from "./routes/pushover.routes.ts";
import wallpapersRoutes from "./routes/wallpapers.routes.ts";

const fastify = Fastify({
  trustProxy: "127.0.0.1",
  // unknown body fields get a 400 instead of being silently dropped; union types are for the translate text field
  ajv: { customOptions: { removeAdditional: false, allowUnionTypes: true } },
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

// limited to 80 requests per minute
fastify.register(fastifyRateLimit, { max: 80, timeWindow: "1 minute" });

// basic auth
fastify.register(fastifyBasicAuth, {
  authenticate: { realm: "MakaroniHTTP" },
  validate: async (username: string, password: string) => {
    if (!(await Bun.password.verify(`${username}:${password}`, Bun.env.BASIC_AUTH_HASH!))) {
      throw new Error("Invalid credentials");
    }
  },
});

fastify.after(() => {
  fastify.register(healthRoutes);
  fastify.register(wallpapersRoutes);
  fastify.register(pushoverRoutes);

  fastify.register(async (protectedScope) => {
    protectedScope.addHook("onRequest", protectedScope.basicAuth);
    // Protected: Auth required endpoints
    protectedScope.register(aionRoutes);
    protectedScope.register(deeplRoutes);
  });
});

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: Number(Bun.env.PORT ?? 3000), host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
