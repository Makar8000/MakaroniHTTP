import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = Bun.env.DB_PATH ?? "data/data.db";

// create the db's folder (`data` by default) if it doesn't already exist
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH, { create: true });

db.run(`CREATE TABLE IF NOT EXISTS wallpapers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tags TEXT NOT NULL,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
)`);

db.run(`CREATE TABLE IF NOT EXISTS wallpaper_domains (
  name TEXT PRIMARY KEY,
  base_url TEXT NOT NULL,
  tags TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'danbooru' CHECK (type IN ('danbooru', 'moebooru', 'custom'))
)`);
