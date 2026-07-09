import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, jobsTable, jobInterviewsTable } from "@workspace/db";
import { CreateJobBody, UpdateJobBody, CreateJobInterviewBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/jobs", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(jobsTable).where(eq(jobsTable.userId, req.userId));
  res.json(rows);
});

router.post("/jobs", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db
    .insert(jobsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(job);
});

router.get("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [job] = await db.select().from(jobsTable).where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

router.patch("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set(parsed.data)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId)))
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

router.delete("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [job] = await db
    .delete(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId)))
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await db.delete(jobInterviewsTable).where(eq(jobInterviewsTable.jobId, id));
  res.sendStatus(204);
});

router.get("/jobs/:id/interviews", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [job] = await db.select({ id: jobsTable.id }).from(jobsTable).where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const rows = await db.select().from(jobInterviewsTable).where(eq(jobInterviewsTable.jobId, id));
  res.json(rows);
});

router.post("/job-interviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateJobInterviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [interview] = await db
    .insert(jobInterviewsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(interview);
});

router.delete("/job-interviews/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [interview] = await db
    .delete(jobInterviewsTable)
    .where(and(eq(jobInterviewsTable.id, id), eq(jobInterviewsTable.userId, req.userId)))
    .returning();
  if (!interview) {
    res.status(404).json({ error: "Interview not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
