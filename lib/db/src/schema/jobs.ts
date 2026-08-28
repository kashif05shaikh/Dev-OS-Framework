import { pgTable, text, serial, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  packageAmount: text("package_amount"),
  location: text("location"),
  recruiterName: text("recruiter_name"),
  recruiterEmail: text("recruiter_email"),
  referral: boolean("referral").notNull().default(false),
  notes: text("notes"),
  links: text("links").array().notNull().default([]),
  status: text("status").notNull().default("wishlist"),
  position: integer("position").notNull().default(0),
  resumeVersionId: integer("resume_version_id"),
  companyLogoUrl: text("company_logo_url"),
  applicationUrl: text("application_url"),
  jobDescription: text("job_description"),
  deadline: date("deadline", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;

export const jobInterviewsTable = pgTable("job_interviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: integer("job_id").notNull(),
  roundName: text("round_name").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJobInterviewSchema = createInsertSchema(jobInterviewsTable).omit({ id: true, createdAt: true });
export type InsertJobInterview = z.infer<typeof insertJobInterviewSchema>;
export type JobInterview = typeof jobInterviewsTable.$inferSelect;
