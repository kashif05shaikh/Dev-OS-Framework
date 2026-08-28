import { pgTable, text, serial, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promptCategoriesTable = pgTable("prompt_categories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#7c3aed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPromptCategorySchema = createInsertSchema(promptCategoriesTable).omit({ id: true, createdAt: true });
export type InsertPromptCategory = z.infer<typeof insertPromptCategorySchema>;
export type PromptCategory = typeof promptCategoriesTable.$inferSelect;

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  categoryId: integer("category_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tool: text("tool"),
  favorite: boolean("favorite").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPromptSchema = createInsertSchema(promptsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof promptsTable.$inferSelect;

// Favorite flags for the static AI tool catalog (catalog itself lives in server code).
export const aiToolFavoritesTable = pgTable(
  "ai_tool_favorites",
  {
    userId: text("user_id").notNull(),
    toolId: text("tool_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.toolId] })],
);

export type AiToolFavorite = typeof aiToolFavoritesTable.$inferSelect;
