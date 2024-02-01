const dotenv = require('dotenv');
dotenv.config();

const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        ignore: 'pid,hostname',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss Z',
      },
    },
  },
});

fastify.register(require('@fastify/auth'));
fastify.decorate('verifyApiKey', (req, _reply, done) => {
  if (req.headers["apikey"] != process.env.API_KEY) {
    return done(new Error('Invalid API Key'));
  }
  done();
});

fastify.after(() => {
  fastify.addHook('onRequest', fastify.auth([fastify.verifyApiKey]));
  fastify.register(require('./routes/aion.routes'));
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();