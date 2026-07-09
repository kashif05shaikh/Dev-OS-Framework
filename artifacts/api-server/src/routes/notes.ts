import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, noteFoldersTable, notesTable, noteVersionsTable } from "@workspace/db";
import {
  CreateNoteFolderBody,
  UpdateNoteFolderBody,
  CreateNoteBody,
  UpdateNoteBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// ---------- Note folders ----------
router.get("/note-folders", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(noteFoldersTable).where(eq(noteFoldersTable.userId, req.userId));
  res.json(rows);
});

router.post("/note-folders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateNoteFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [folder] = await db
    .insert(noteFoldersTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(folder);
});

router.patch("/note-folders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateNoteFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [folder] = await db
    .update(noteFoldersTable)
    .set(parsed.data)
    .where(and(eq(noteFoldersTable.id, id), eq(noteFoldersTable.userId, req.userId)))
    .returning();
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  res.json(folder);
});

router.delete("/note-folders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [folder] = await db
    .delete(noteFoldersTable)
    .where(and(eq(noteFoldersTable.id, id), eq(noteFoldersTable.userId, req.userId)))
    .returning();
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  res.sendStatus(204);
});

// ---------- Notes ----------
router.get("/notes", requireAuth, async (req, res): Promise<void> => {
  const conditions = [eq(notesTable.userId, req.userId)];
  if (req.query.folderId) conditions.push(eq(notesTable.folderId, parseInt(String(req.query.folderId), 10)));
  if (req.query.pinned !== undefined) conditions.push(eq(notesTable.pinned, req.query.pinned === "true"));
  if (req.query.archived !== undefined) conditions.push(eq(notesTable.archived, req.query.archived === "true"));
  if (req.query.q) {
    const q = `%${String(req.query.q)}%`;
    conditions.push(or(ilike(notesTable.title, q), ilike(notesTable.contentMarkdown, q))!);
  }
  const rows = await db
    .select()
    .from(notesTable)
    .where(and(...conditions))
    .orderBy(desc(notesTable.pinned), desc(notesTable.updatedAt));
  res.json(rows);
});

router.post("/notes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [note] = await db
    .insert(notesTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(note);
});

router.get("/notes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [note] = await db.select().from(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, req.userId)));
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(note);
});

router.patch("/notes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  // Snapshot the previous content as a version whenever the body text changes.
  if (parsed.data.contentMarkdown !== undefined && parsed.data.contentMarkdown !== existing.contentMarkdown) {
    await db.insert(noteVersionsTable).values({ noteId: id, contentMarkdown: existing.contentMarkdown });
  }

  const [note] = await db
    .update(notesTable)
    .set(parsed.data)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, req.userId)))
    .returning();
  res.json(note);
});

router.delete("/notes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [note] = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, req.userId)))
    .returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  await db.delete(noteVersionsTable).where(eq(noteVersionsTable.noteId, id));
  res.sendStatus(204);
});

router.post("/notes/:id/duplicate", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, req.userId)));
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = note;
  const [dup] = await db
    .insert(notesTable)
    .values({ ...rest, title: `${note.title} (copy)`, pinned: false })
    .returning();
  res.status(201).json(dup);
});

router.get("/notes/:id/versions", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [note] = await db.select({ id: notesTable.id }).from(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, req.userId)));
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  const rows = await db
    .select()
    .from(noteVersionsTable)
    .where(eq(noteVersionsTable.noteId, id))
    .orderBy(desc(noteVersionsTable.createdAt));
  res.json(rows);
});

export default router;
