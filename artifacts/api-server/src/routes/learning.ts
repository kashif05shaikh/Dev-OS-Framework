import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, subjectsTable, learningFoldersTable, topicsTable } from "@workspace/db";
import {
  CreateSubjectBody,
  UpdateSubjectBody,
  CreateLearningFolderBody,
  UpdateLearningFolderBody,
  CreateTopicBody,
  UpdateTopicBody,
  FetchTopicMetadataBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { fetchUrlMetadata } from "../lib/urlMetadata";
import { toDateOnlyString } from "../lib/dateOnly";

const router: IRouter = Router();

// ---------- Subjects ----------
router.get("/subjects", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(subjectsTable).where(eq(subjectsTable.userId, req.userId));
  res.json(rows);
});

router.post("/subjects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db
    .insert(subjectsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(subject);
});

router.patch("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db
    .update(subjectsTable)
    .set(parsed.data)
    .where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, req.userId)))
    .returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(subject);
});

router.delete("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [subject] = await db
    .delete(subjectsTable)
    .where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, req.userId)))
    .returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.sendStatus(204);
});

// ---------- Learning folders ----------
router.get("/learning-folders", requireAuth, async (req, res): Promise<void> => {
  const subjectId = req.query.subjectId ? parseInt(String(req.query.subjectId), 10) : undefined;
  const conditions = [eq(learningFoldersTable.userId, req.userId)];
  if (subjectId !== undefined) conditions.push(eq(learningFoldersTable.subjectId, subjectId));
  const rows = await db.select().from(learningFoldersTable).where(and(...conditions));
  res.json(rows);
});

router.post("/learning-folders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateLearningFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [folder] = await db
    .insert(learningFoldersTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(folder);
});

router.patch("/learning-folders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateLearningFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [folder] = await db
    .update(learningFoldersTable)
    .set(parsed.data)
    .where(and(eq(learningFoldersTable.id, id), eq(learningFoldersTable.userId, req.userId)))
    .returning();
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  res.json(folder);
});

router.delete("/learning-folders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [folder] = await db
    .delete(learningFoldersTable)
    .where(and(eq(learningFoldersTable.id, id), eq(learningFoldersTable.userId, req.userId)))
    .returning();
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  res.sendStatus(204);
});

// ---------- Topics ----------
router.get("/topics", requireAuth, async (req, res): Promise<void> => {
  const conditions = [eq(topicsTable.userId, req.userId)];
  if (req.query.subjectId) conditions.push(eq(topicsTable.subjectId, parseInt(String(req.query.subjectId), 10)));
  if (req.query.folderId) conditions.push(eq(topicsTable.folderId, parseInt(String(req.query.folderId), 10)));
  const rows = await db.select().from(topicsTable).where(and(...conditions));
  res.json(rows);
});

router.post("/topics", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [topic] = await db
    .insert(topicsTable)
    .values({ ...parsed.data, deadline: toDateOnlyString(parsed.data.deadline), userId: req.userId })
    .returning();
  res.status(201).json(topic);
});

router.get("/topics/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [topic] = await db
    .select()
    .from(topicsTable)
    .where(and(eq(topicsTable.id, id), eq(topicsTable.userId, req.userId)));
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  res.json(topic);
});

router.patch("/topics/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [topic] = await db
    .update(topicsTable)
    .set({ ...parsed.data, deadline: toDateOnlyString(parsed.data.deadline) })
    .where(and(eq(topicsTable.id, id), eq(topicsTable.userId, req.userId)))
    .returning();
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  res.json(topic);
});

router.delete("/topics/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [topic] = await db
    .delete(topicsTable)
    .where(and(eq(topicsTable.id, id), eq(topicsTable.userId, req.userId)))
    .returning();
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/topics/fetch-metadata", requireAuth, async (req, res): Promise<void> => {
  const parsed = FetchTopicMetadataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const metadata = await fetchUrlMetadata(parsed.data.url);
  res.json(metadata);
});

export default router;
