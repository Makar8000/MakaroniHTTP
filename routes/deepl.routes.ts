import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { bodySchema } from "../schemas/deepl.schemas.ts";
import type { TranslateBody } from "../types/deepl.types.ts";
import { translator } from "../util/deepl.util.ts";

/**
 * Encapsulates the routes for the translate endpoint
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  fastify.route<{ Body: TranslateBody }>({
    method: "POST",
    url: "/translate",
    schema: { body: bodySchema },
    handler: async (req, reply) => {
      req.log.info("Translate route");
      try {
        return await translator.translateText(
          req.body.text,
          req.body.sourceLang ?? null,
          req.body.targetLang ?? "en-US",
        );
      } catch (ex) {
        const { message } = ex as Error;
        // shortcut: deepl-node marks bad input (DeepL's 400s, its own 'en'/'pt' check) only in the message, reworded messages fall back to 502
        if (/^(Bad request|targetLang=|Unexpected status code: 413)/.test(message)) {
          return reply.code(400).send({ error: message });
        }
        // message only: on connection failures the error object carries the request's DeepL-Auth-Key header
        req.log.error(`DeepL request failed: ${message}`);
        return reply.code(502).send({ error: "translation failed" });
      }
    },
  });
}

export default routes;
