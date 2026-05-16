import { promises as fs } from "fs";
import path from "path";
import type { Database } from "@/lib/types";

const dbPath = path.join(process.cwd(), "data", "wearit-db.json");

const emptyDb = (): Database => ({
  clothingItems: [],
  outfits: [],
  outfitItems: [],
  recommendations: [],
  feedback: [],
  preferences: [],
});

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const db = emptyDb();
    await writeDb(db);
    return db;
  }
}

export async function writeDb(db: Database) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function updateDb<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  const result = await mutate(db);
  await writeDb(db);
  return result;
}
