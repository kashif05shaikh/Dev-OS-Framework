import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// userId is the Clerk user id (e.g. "user_xxx"). It is the primary key —
// one profile row per authenticated user, created just-in-time on first request.
export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  theme: text("theme").notNull().default("dark"),
  accentColor: text("accent_color").notNull().default("#7c3aed"),
  timezone: text("timezone").notNull().default("UTC"),
  dashboardLayout: jsonb("dashboard_layout").$type<Record<string, unknown> | null>(),
  preferences: jsonb("preferences").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ createdAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
