import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, resumesTable } from "@workspace/db";
import { CreateResumeBody, UpdateResumeBody, AnalyzeResumeBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { analyzeResumeAgainstJob } from "../lib/resumeAnalyzer";

const router: IRouter = Router();

router.get("/resumes", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId));
  res.json(rows);
});

router.post("/resumes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existingCount = await db.select({ id: resumesTable.id }).from(resumesTable).where(eq(resumesTable.userId, req.userId));
  const [resume] = await db
    .insert(resumesTable)
    .values({ ...parsed.data, userId: req.userId, isPrimary: existingCount.length === 0 })
    .returning();
  res.status(201).json(resume);
});

router.get("/resumes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)));
  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.json(resume);
});

router.patch("/resumes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [resume] = await db
    .update(resumesTable)
    .set(parsed.data)
    .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
    .returning();
  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.json(resume);
});

router.delete("/resumes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [resume] = await db
    .delete(resumesTable)
    .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
    .returning();
  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/resumes/:id/analyze", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  const analysis = analyzeResumeAgainstJob(existing.contentText ?? "", existing.skills, parsed.data.jobDescription);
  const [resume] = await db
    .update(resumesTable)
    .set({ atsScore: analysis.atsScore, keywordAnalysis: analysis.keywordAnalysis })
    .where(eq(resumesTable.id, id))
    .returning();
  res.json(resume);
});

router.patch("/resumes/:id/set-primary", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [existing] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  await db.update(resumesTable).set({ isPrimary: false }).where(eq(resumesTable.userId, req.userId));
  const [resume] = await db.update(resumesTable).set({ isPrimary: true }).where(eq(resumesTable.id, id)).returning();
  res.json(resume);
});

export default router;
