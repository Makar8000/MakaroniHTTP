import type {
  WallpaperBody,
  WallpaperDomainBody,
  WallpaperDomainRow,
  WallpaperQuery,
  WallpaperRow,
} from "../types/wallpapers.types.ts";
import { db } from "./connection.ts";

const COLUMNS = "id, file_url, title, tags";

/**
 * Enabled wallpapers, optionally filtered by `tags`.
 * Random order by default; `random: false` sorts by id so `offset` pages are stable.
 * @returns the requested page plus `total`, the number of matches ignoring limit/offset
 */
export const list = ({
  limit,
  offset = 0,
  tags,
  random = true,
}: WallpaperQuery): { rows: WallpaperRow[]; total: number } => {
  const wanted = (tags ?? "").split(/\s+/).filter(Boolean);
  // instr on space-padded strings = exact whole-tag match, and avoids LIKE wildcards ("_" in tags)
  const where = ["enabled = 1", ...wanted.map(() => "instr(' ' || tags || ' ', ?) > 0")].join(" AND ");
  const params: (string | number)[] = wanted.map((t) => ` ${t} `);

  const total = db
    .query<{ n: number }, (string | number)[]>(`SELECT COUNT(*) AS n FROM wallpapers WHERE ${where}`)
    .get(...params)!.n;

  let sql = `SELECT ${COLUMNS} FROM wallpapers WHERE ${where} ORDER BY ${random ? "RANDOM()" : "id"}`;
  if (limit || offset) {
    // SQLite only allows OFFSET after LIMIT; -1 means "no limit"
    sql += " LIMIT ? OFFSET ?";
    params.push(limit ?? -1, offset);
  }
  return { rows: db.query<WallpaperRow, (string | number)[]>(sql).all(...params), total };
};

const DOMAIN_COLUMNS = "name, base_url, tags, type";

export const listDomains = (): WallpaperDomainRow[] =>
  db.query<WallpaperDomainRow, []>(`SELECT ${DOMAIN_COLUMNS} FROM wallpaper_domains ORDER BY name`).all();

export const findDomain = (name: string): WallpaperDomainRow | null =>
  db.query<WallpaperDomainRow, [string]>(`SELECT ${DOMAIN_COLUMNS} FROM wallpaper_domains WHERE name = ?`).get(name);

export const findByUrl = (url: string): WallpaperRow | null =>
  db.query<WallpaperRow, [string]>(`SELECT ${COLUMNS} FROM wallpapers WHERE file_url = ?`).get(url);

export const insert = ({ title, tags, file_url, enabled }: WallpaperBody): void => {
  db.query("INSERT INTO wallpapers (file_url, title, tags, enabled) VALUES (?, ?, ?, ?)").run(
    file_url,
    title,
    tags,
    enabled ? 1 : 0,
  );
};

export const findById = (id: number): WallpaperRow | null =>
  db.query<WallpaperRow, [number]>(`SELECT ${COLUMNS} FROM wallpapers WHERE id = ?`).get(id);

const UPDATABLE = ["file_url", "title", "tags", "enabled"] as const;
/** Updates only the provided fields. Column names come from the UPDATABLE whitelist, values are bound. */
export const update = (id: number, patch: Partial<WallpaperBody>): void => {
  const fields = UPDATABLE.filter((k) => patch[k] !== undefined);
  if (!fields.length) {
    return;
  }
  const values = fields.map((k) => {
    if (k === "enabled") {
      return patch.enabled ? 1 : 0;
    }
    return patch[k] as string;
  });
  db.query(`UPDATE wallpapers SET ${fields.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).run(...values, id);
};

/** @returns true if a row was deleted */
export const remove = (id: number): boolean => db.query("DELETE FROM wallpapers WHERE id = ?").run(id).changes > 0;

export const insertDomain = ({ name, base_url, tags, type = "danbooru" }: WallpaperDomainBody): void => {
  db.query("INSERT INTO wallpaper_domains (name, base_url, tags, type) VALUES (?, ?, ?, ?)").run(
    name,
    base_url,
    tags,
    type,
  );
};

const DOMAIN_UPDATABLE = ["base_url", "tags", "type"] as const;
/** Updates only the provided fields. Column names come from the DOMAIN_UPDATABLE whitelist, values are bound. */
export const updateDomain = (name: string, patch: Partial<WallpaperDomainBody>): void => {
  const fields = DOMAIN_UPDATABLE.filter((k) => patch[k] !== undefined);
  if (!fields.length) {
    return;
  }
  db.query(`UPDATE wallpaper_domains SET ${fields.map((k) => `${k} = ?`).join(", ")} WHERE name = ?`).run(
    ...fields.map((k) => patch[k] as string),
    name,
  );
};

/** @returns true if a row was deleted */
export const removeDomain = (name: string): boolean =>
  db.query("DELETE FROM wallpaper_domains WHERE name = ?").run(name).changes > 0;
