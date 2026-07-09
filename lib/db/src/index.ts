import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// CUSTOM_DB_URL takes precedence over the Replit-managed DATABASE_URL so that
// an external database can be used without Replit intercepting the variable.
const connectionString = process.env.CUSTOM_DB_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "CUSTOM_DB_URL (or DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
