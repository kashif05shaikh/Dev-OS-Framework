import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  author: text("author"),
  readingTimeMinutes: integer("reading_time_minutes"),
  category: text("category"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true, createdAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
