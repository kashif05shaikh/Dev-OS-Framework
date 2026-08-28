import { pgTable, text, serial, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyGoalsTable = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  studyMinutesTarget: integer("study_minutes_target").notNull().default(60),
  codingMinutesTarget: integer("coding_minutes_target").notNull().default(60),
  studyMinutesActual: integer("study_minutes_actual").notNull().default(0),
  codingMinutesActual: integer("coding_minutes_actual").notNull().default(0),
});

export const insertDailyGoalSchema = createInsertSchema(dailyGoalsTable).omit({ id: true });
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;
export type DailyGoal = typeof dailyGoalsTable.$inferSelect;

export const dailyTasksTable = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  date: date("date", { mode: "string" }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasksTable).omit({ id: true, createdAt: true });
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type DailyTask = typeof dailyTasksTable.$inferSelect;

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#22c55e"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHabitSchema = createInsertSchema(habitsTable).omit({ id: true, createdAt: true, currentStreak: true, longestStreak: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habitsTable.$inferSelect;

export const habitCheckinsTable = pgTable("habit_checkins", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  habitId: integer("habit_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
});

export const insertHabitCheckinSchema = createInsertSchema(habitCheckinsTable).omit({ id: true });
export type InsertHabitCheckin = z.infer<typeof insertHabitCheckinSchema>;
export type HabitCheckin = typeof habitCheckinsTable.$inferSelect;
