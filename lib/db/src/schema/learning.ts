import { pgTable, text, serial, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#7c3aed"),
  icon: text("icon").notNull().default("book"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;

export const learningFoldersTable = pgTable("learning_folders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  parentFolderId: integer("parent_folder_id"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLearningFolderSchema = createInsertSchema(learningFoldersTable).omit({ id: true, createdAt: true });
export type InsertLearningFolder = z.infer<typeof insertLearningFolderSchema>;
export type LearningFolder = typeof learningFoldersTable.$inferSelect;

export const topicsTable = pgTable("topics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  folderId: integer("folder_id"),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds"),
  channel: text("channel"),
  author: text("author"),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  deadline: date("deadline", { mode: "string" }),
  completed: boolean("completed").notNull().default(false),
  favorite: boolean("favorite").notNull().default(false),
  progressPercent: integer("progress_percent").notNull().default(0),
  revisionCount: integer("revision_count").notNull().default(0),
  studyTimeMinutes: integer("study_time_minutes").notNull().default(0),
  lastWatchedAt: timestamp("last_watched_at", { withTimezone: true }),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTopicSchema = createInsertSchema(topicsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topicsTable.$inferSelect;
