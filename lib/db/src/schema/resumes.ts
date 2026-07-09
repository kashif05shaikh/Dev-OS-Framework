import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  versionName: text("version_name").notNull(),
  contentText: text("content_text"),
  skills: text("skills").array().notNull().default([]),
  education: jsonb("education").$type<Record<string, unknown>[] | null>(),
  experience: jsonb("experience").$type<Record<string, unknown>[] | null>(),
  certificates: jsonb("certificates").$type<Record<string, unknown>[] | null>(),
  atsScore: integer("ats_score"),
  keywordAnalysis: jsonb("keyword_analysis").$type<Record<string, unknown> | null>(),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
