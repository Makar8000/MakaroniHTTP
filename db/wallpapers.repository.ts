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

export const updateByUrl = ({ title, tags, file_url, enabled }: WallpaperBody): void => {
  db.query("UPDATE wallpapers SET title = ?, tags = ?, enabled = ? WHERE file_url = ?").run(
    title,
    tags,
    enabled ? 1 : 0,
    file_url,
  );
};

/** @returns true if a row was deleted */
export const remove = (id: number): boolean => db.query("DELETE FROM wallpapers WHERE id = ?").run(id).changes > 0;
