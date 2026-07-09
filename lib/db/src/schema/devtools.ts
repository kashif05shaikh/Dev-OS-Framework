import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// accessToken is stored as provided by the user; only ever returned to the
// owning user's own requests and never included in list/catalog responses.
export const devToolConnectionsTable = pgTable("dev_tool_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  service: text("service").notNull(),
  accessToken: text("access_token").notNull(),
  accountLabel: text("account_label"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncStatus: text("sync_status").notNull().default("pending"),
  errorMessage: text("error_message"),
  dataJson: jsonb("data_json").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDevToolConnectionSchema = createInsertSchema(devToolConnectionsTable).omit({ id: true, createdAt: true });
export type InsertDevToolConnection = z.infer<typeof insertDevToolConnectionSchema>;
export type DevToolConnection = typeof devToolConnectionsTable.$inferSelect;
