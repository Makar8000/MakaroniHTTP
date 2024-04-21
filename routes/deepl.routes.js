const deepl = require('deepl-node');
const tlOpts = {
  sendPlatformInfo: false,
};
const translator = new deepl.Translator(process.env.DEEPL_API_KEY, tlOpts);

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify, options) {
  fastify.route({
    method: 'POST',
    url: '/translate',
    handler: async (req, reply) => {
      req.log.info('Translate route');
      if (!req.body.text) {
        reply.code(400).send({ error: 'invalid request' });
        return;
      }
      try {
        const resp = await translator.translateText(req.body.text, req.body.sourceLang ?? null, req.body.targetLang ?? 'en-US');
        reply.send(resp);
      } catch (ex) {
        reply.code(500).send({ error: ex.message });
      }
    },
  });
}

module.exports = routes;