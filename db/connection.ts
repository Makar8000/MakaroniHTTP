import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

// create `data` folder if it doesn't already exist
mkdirSync("data", { recursive: true });

export const db = new Database("data/data.db", { create: true });

db.run(`CREATE TABLE IF NOT EXISTS wallpapers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tags TEXT NOT NULL,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
)`);
