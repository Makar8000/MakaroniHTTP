import type { WallpaperBody, WallpaperQuery, WallpaperRow } from "../types/wallpapers.types.ts";
import { db } from "./connection.ts";

const COLUMNS = "id, file_url, title, tags";

/** Enabled wallpapers in random order, optionally containing ALL of the space-delimited `tags`. */
export const list = ({ limit, tags }: WallpaperQuery): WallpaperRow[] => {
  const wanted = (tags ?? "").split(/\s+/).filter(Boolean);
  // instr on space-padded strings = exact whole-tag match, and avoids LIKE wildcards ("_" in tags)
  const where = ["enabled = 1", ...wanted.map(() => "instr(' ' || tags || ' ', ?) > 0")];
  const params: (string | number)[] = wanted.map((t) => ` ${t} `);
  let sql = `SELECT ${COLUMNS} FROM wallpapers WHERE ${where.join(" AND ")} ORDER BY RANDOM()`;
  if (limit) {
    sql += " LIMIT ?";
    params.push(limit);
  }
  return db.query<WallpaperRow, (string | number)[]>(sql).all(...params);
};

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
