import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const focusSessionsTable = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  label: text("label"),
  category: text("category").notNull().default("study"),
  mode: text("mode").notNull().default("stopwatch"),
  targetMinutes: integer("target_minutes"),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  distractionCount: integer("distraction_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFocusSessionSchema = createInsertSchema(focusSessionsTable).omit({ id: true, createdAt: true });
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessionsTable.$inferSelect;
