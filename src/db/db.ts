import Dexie, { type EntityTable } from "dexie";
import type { SubFile } from "../models";

interface ApiKey {
  id: string;
  family: string;
  model: string;
  apiKey: string;
  isDefault: boolean;
}

const db = new Dexie("Database") as Dexie & {
  apiKeys: EntityTable<
    ApiKey,
    "id" // primary key "id" (for the typings only)
  >;
  subtitles: EntityTable<
    SubFile,
    "id" // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
db.version(1).stores({
  apiKeys: "id, model, apiKey", // primary key "id" (for the runtime!)
  subtitles: "id, original, split, splitTranslated, filename, state", // primary key "id" (for the runtime!)
});

export type { ApiKey };
export { db };
