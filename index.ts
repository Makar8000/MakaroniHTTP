import fastifyBasicAuth from "@fastify/basic-auth";
import Fastify from "fastify";
import aionRoutes from "./routes/aion.routes.ts";
import deeplRoutes from "./routes/deepl.routes.ts";
import healthRoutes from "./routes/health.routes.ts";

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

if (!Bun.env.BASIC_AUTH_HASH?.startsWith("$argon2")) {
  fastify.log.error("BASIC_AUTH_HASH not set");
  process.exit(1);
}

fastify.after(() => {
  // Public: no auth required
  fastify.register(healthRoutes);

  fastify.register(async (protectedScope) => {
    await protectedScope.register(fastifyBasicAuth, {
      authenticate: { realm: "MakaroniHTTP" },
      validate: async (username: string, password: string) => {
        if (!(await Bun.password.verify(`${username}:${password}`, Bun.env.BASIC_AUTH_HASH!))) {
          throw new Error("Invalid credentials");
        }
      },
    });
    protectedScope.addHook("onRequest", protectedScope.basicAuth);
    // Protected: Auth required endpoints
    protectedScope.register(aionRoutes);
    protectedScope.register(deeplRoutes);
  });
});

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
