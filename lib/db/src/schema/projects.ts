import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  techStack: text("tech_stack").array().notNull().default([]),
  status: text("status").notNull().default("planning"),
  priority: text("priority").notNull().default("medium"),
  progressPercent: integer("progress_percent").notNull().default(0),
  frontend: text("frontend"),
  backend: text("backend"),
  database: text("database"),
  deployment: text("deployment"),
  deadline: date("deadline", { mode: "string" }),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

export const projectTasksTable = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("todo"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectTaskSchema = createInsertSchema(projectTasksTable).omit({ id: true, createdAt: true });
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type ProjectTask = typeof projectTasksTable.$inferSelect;
