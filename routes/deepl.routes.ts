import * as deepl from 'deepl-node';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

interface TranslateBody {
  text?: string | string[];
  sourceLang?: deepl.SourceLanguageCode | null;
  targetLang?: deepl.TargetLanguageCode;
}

const tlOpts: deepl.TranslatorOptions = {
  sendPlatformInfo: false,
};
const translator = new deepl.Translator(Deno.env.get('DEEPL_API_KEY') ?? '', tlOpts);

/**
 * Encapsulates the routes
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
// deno-lint-ignore require-await
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  fastify.route<{ Body: TranslateBody }>({
    method: 'POST',
    url: '/translate',
    handler: async (req, reply) => {
      req.log.info('Translate route');
      if (!req.body.text) {
        reply.code(400).send({ error: 'invalid request' });
        return;
      }
      try {
        const resp = await translator.translateText(
          req.body.text as string,
          req.body.sourceLang ?? null,
          req.body.targetLang ?? 'en-US',
        );
        reply.send(resp);
      } catch (ex) {
        reply.code(500).send({ error: (ex as Error).message });
      }
    },
  });
}

export default routes;
