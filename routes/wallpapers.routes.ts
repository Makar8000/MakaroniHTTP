import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as wallpapers from "../db/wallpapers.repository.ts";
import {
  bodySchema,
  domainBodySchema,
  domainPatchBodySchema,
  paramsSchema,
  patchBodySchema,
  querySchema,
} from "../schemas/wallpapers.schemas.ts";
import type {
  WallpaperBody,
  WallpaperDomainBody,
  WallpaperDomainType,
  WallpaperQuery,
  WallpaperRow,
} from "../types/wallpapers.types.ts";

const POSTS_PATH: Record<Exclude<WallpaperDomainType, "custom">, string> = {
  danbooru: "posts.json",
  moebooru: "post.json",
};

const toResponse = (r: WallpaperRow) => ({
  id: r.id,
  file_url: r.file_url,
  tags: r.tags,
  tag_string: r.title,
  tag_string_artist: "Unknown",
  source: "https://makar.pw",
  enabled: r.enabled === 1,
});

/**
 * Encapsulates the routes for the wallpaper endpoints
 * @param fastify Encapsulated Fastify Instance
 * @param _options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  // Require auth for POST, PUT, and DELETE
  const auth = { onRequest: fastify.basicAuth };
  fastify.get<{ Querystring: WallpaperQuery }>(
    "/wallpapers",
    {
      schema: { querystring: querySchema },
      // disabled wallpapers stay private: listing them needs auth
      preHandler: (req, reply, done) => {
        if (req.query.include_disabled) {
          return fastify.basicAuth(req, reply, done);
        }
        done();
      },
    },
    async (req, reply) => {
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
    },
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

  // Forward to the domain's base_url. The domain's stored tags are appended to the client's `tags` param.
  // The plugin is set to "Danbooru", which always asks for posts.json; the path actually requested comes from `type`.
  for (const url of ["/wallpapers/:domain", "/wallpapers/:domain/posts.json"]) {
    fastify.get<{ Params: { domain: string } }>(url, async (req, reply) => {
      const row = wallpapers.findDomain(req.params.domain);
      if (!row) {
        return reply.code(404).send({ error: "unknown domain" });
      }
      const params = new URLSearchParams(req.url.split("?")[1] ?? "");
      // Set drops repeated tags and keeps first-seen order (client tags first)
      const tags = [...new Set(`${params.get("tags") ?? ""} ${row.tags}`.split(/\s+/).filter(Boolean))].join(" ");
      if (tags) {
        params.set("tags", tags);
      } else {
        params.delete("tags");
      }
      const target = new URL(
        row.type === "custom" ? row.base_url : `${row.base_url.replace(/\/+$/, "")}/${POSTS_PATH[row.type]}`,
      );
      // set (not replace the whole search) so a query already present in a custom base_url survives
      for (const [key, value] of params) {
        target.searchParams.set(key, value);
      }
      return reply.redirect(target.toString(), 307);
    });
  }

  fastify.get("/wallpapers/domains", auth, async () => wallpapers.listDomains());

  fastify.post<{ Body: WallpaperDomainBody }>(
    "/wallpapers/domains",
    { ...auth, schema: { body: domainBodySchema } },
    async (req, reply) => {
      if (!URL.canParse(req.body.base_url)) {
        return reply.code(400).send({ error: "invalid base_url" });
      }
      if (wallpapers.findDomain(req.body.name)) {
        return reply.code(409).send({ error: "domain already exists" });
      }
      wallpapers.insertDomain(req.body);
      return reply.code(201).send(wallpapers.findDomain(req.body.name));
    },
  );

  fastify.put<{ Params: { name: string }; Body: Partial<WallpaperDomainBody> }>(
    "/wallpapers/domains/:name",
    { ...auth, schema: { body: domainPatchBodySchema } },
    async (req, reply) => {
      const { name } = req.params;
      if (req.body.base_url !== undefined && !URL.canParse(req.body.base_url)) {
        return reply.code(400).send({ error: "invalid base_url" });
      }
      if (!wallpapers.findDomain(name)) {
        return reply.code(404).send({ error: "not found" });
      }
      wallpapers.updateDomain(name, req.body);
      return wallpapers.findDomain(name);
    },
  );

  fastify.delete<{ Params: { name: string } }>("/wallpapers/domains/:name", auth, async (req, reply) => {
    if (!wallpapers.removeDomain(req.params.name)) {
      return reply.code(404).send({ error: "not found" });
    }
    return reply.code(204).send();
  });
}

export default routes;
