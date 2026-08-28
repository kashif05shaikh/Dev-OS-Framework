import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const socialLinksTable = pgTable("social_links", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  handle: text("handle"),
  url: text("url").notNull(),
  followers: integer("followers"),
  postCount: integer("post_count"),
  following: integer("following"),
  bio: text("bio"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  dataJson: jsonb("data_json").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSocialLinkSchema = createInsertSchema(socialLinksTable).omit({ id: true, createdAt: true });
export type InsertSocialLink = z.infer<typeof insertSocialLinkSchema>;
export type SocialLink = typeof socialLinksTable.$inferSelect;
