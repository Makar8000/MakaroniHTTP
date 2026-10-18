import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as wallpapers from "../db/wallpapers.repository.ts";
import { bodySchema, paramsSchema, querySchema } from "../schemas/wallpapers.schemas.ts";
import type { WallpaperBody, WallpaperQuery, WallpaperRow } from "../types/wallpapers.types.ts";

const toResponse = (r: WallpaperRow) => ({
  id: r.id,
  file_url: r.file_url,
  tags: r.tags,
  tag_string: r.title,
  tag_string_artist: "Unknown",
  source: "https://makar.pw",
});

/**
 * Encapsulates the routes for the wallpaper endpoints
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  // Require auth for POST, PUT, and DELETE
  const auth = { onRequest: fastify.basicAuth };

  fastify.get<{ Querystring: WallpaperQuery }>("/wallpapers", { schema: { querystring: querySchema } }, async (req) =>
    wallpapers.list(req.query).map(toResponse),
  );

  fastify.post<{ Body: WallpaperBody }>(
    "/wallpapers",
    { ...auth, schema: { body: bodySchema } },
    async (req, reply) => {
      if (wallpapers.findByUrl(req.body.file_url)) {
        return reply.code(409).send({ error: "file_url already exists" });
      }
      wallpapers.insert(req.body);
      return reply.code(201).send(toResponse(wallpapers.findByUrl(req.body.file_url)!));
    },
  );

  fastify.put<{ Body: WallpaperBody }>("/wallpapers", { ...auth, schema: { body: bodySchema } }, async (req, reply) => {
    if (!wallpapers.findByUrl(req.body.file_url)) {
      return reply.code(404).send({ error: "file_url not found" });
    }
    wallpapers.updateByUrl(req.body);
    return toResponse(wallpapers.findByUrl(req.body.file_url)!);
  });

  fastify.delete<{ Params: { id: number } }>(
    "/wallpapers/:id",
    { ...auth, schema: { params: paramsSchema } },
    async (req, reply) => {
      if (!wallpapers.remove(req.params.id)) {
        return reply.code(404).send({ error: "not found" });
      }
      return reply.code(204).send();
    },
  );
}

export default routes;
