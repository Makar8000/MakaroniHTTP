import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as wallpapers from "../db/wallpapers.repository.ts";
import { bodySchema, paramsSchema, patchBodySchema, querySchema } from "../schemas/wallpapers.schemas.ts";
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

  // /posts.json is the booru path, so both the base route and posts.json is included
  for (const url of ["/wallpapers", "/wallpapers/posts.json"]) {
    fastify.get<{ Querystring: WallpaperQuery }>(url, { schema: { querystring: querySchema } }, async (req, reply) => {
      const { rows, total } = wallpapers.list(req.query);
      const { limit, offset = 0, random = true } = req.query;

      reply.header("X-Total-Count", total).header("X-Offset", offset);
      if (limit) {
        reply.header("X-Limit", limit);
      }

      // RFC 8288 Link header for next/prev pages
      if (limit && !random) {
        const link = (o: number, rel: string) => {
          const u = new URL(req.url, "http://x");
          u.searchParams.set("offset", String(o));
          return `<${u.pathname}${u.search}>; rel="${rel}"`;
        };
        const links: string[] = [];
        if (offset > 0) {
          links.push(link(Math.max(0, offset - limit), "prev"));
        }
        if (offset + limit < total) {
          links.push(link(offset + limit, "next"));
        }
        if (links.length) {
          reply.header("Link", links.join(", "));
        }
      }

      return rows.map(toResponse);
    });
  }

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

  fastify.put<{ Params: { id: number }; Body: Partial<WallpaperBody> }>(
    "/wallpapers/:id",
    { ...auth, schema: { params: paramsSchema, body: patchBodySchema } },
    async (req, reply) => {
      const { id } = req.params;
      if (!wallpapers.findById(id)) {
        return reply.code(404).send({ error: "not found" });
      }
      // changing file_url to one that belongs to a different row would violate UNIQUE
      const other = req.body.file_url ? wallpapers.findByUrl(req.body.file_url) : null;
      if (other && other.id !== id) {
        return reply.code(409).send({ error: "file_url already exists" });
      }
      wallpapers.update(id, req.body);
      return toResponse(wallpapers.findById(id)!);
    },
  );

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
