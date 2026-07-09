import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const codingProfilesTable = pgTable("coding_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  usernameOrHandle: text("username_or_handle").notNull(),
  profileUrl: text("profile_url").notNull(),
  avatarUrl: text("avatar_url"),
  rating: integer("rating"),
  rank: text("rank"),
  solvedCount: integer("solved_count"),
  maxRating: integer("max_rating"),
  country: text("country"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncStatus: text("sync_status").notNull().default("pending"),
  errorMessage: text("error_message"),
  statsJson: jsonb("stats_json").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCodingProfileSchema = createInsertSchema(codingProfilesTable).omit({ id: true, createdAt: true });
export type InsertCodingProfile = z.infer<typeof insertCodingProfileSchema>;
export type CodingProfile = typeof codingProfilesTable.$inferSelect;

export const githubReposTable = pgTable("github_repos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  codingProfileId: integer("coding_profile_id").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  stars: integer("stars").notNull().default(0),
  forks: integer("forks").notNull().default(0),
  language: text("language"),
  pushedAt: timestamp("pushed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGithubRepoSchema = createInsertSchema(githubReposTable).omit({ id: true, createdAt: true });
export type InsertGithubRepo = z.infer<typeof insertGithubRepoSchema>;
export type GithubRepo = typeof githubReposTable.$inferSelect;
