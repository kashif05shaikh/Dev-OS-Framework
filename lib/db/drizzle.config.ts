import { defineConfig } from "drizzle-kit";
import path from "path";

// CUSTOM_DB_URL takes precedence so drizzle-kit targets the external database.
const dbUrl = process.env.CUSTOM_DB_URL ?? process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("CUSTOM_DB_URL (or DATABASE_URL) must be set. Ensure the database is provisioned.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
