import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const noteFoldersTable = pgTable("note_folders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  parentId: integer("parent_id"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNoteFolderSchema = createInsertSchema(noteFoldersTable).omit({ id: true, createdAt: true });
export type InsertNoteFolder = z.infer<typeof insertNoteFolderSchema>;
export type NoteFolder = typeof noteFoldersTable.$inferSelect;

export const notesTable = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  folderId: integer("folder_id"),
  title: text("title").notNull(),
  contentMarkdown: text("content_markdown").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  pinned: boolean("pinned").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNoteSchema = createInsertSchema(notesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notesTable.$inferSelect;

export const noteVersionsTable = pgTable("note_versions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNoteVersionSchema = createInsertSchema(noteVersionsTable).omit({ id: true, createdAt: true });
export type InsertNoteVersion = z.infer<typeof insertNoteVersionSchema>;
export type NoteVersion = typeof noteVersionsTable.$inferSelect;
