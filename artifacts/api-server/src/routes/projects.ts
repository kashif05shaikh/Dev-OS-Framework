import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, projectsTable, projectTasksTable } from "@workspace/db";
import { CreateProjectBody, UpdateProjectBody, CreateProjectTaskBody, UpdateProjectTaskBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { toDateOnlyString } from "../lib/dateOnly";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(projectsTable).where(eq(projectsTable.userId, req.userId));
  res.json(rows);
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .insert(projectsTable)
    .values({ ...parsed.data, deadline: toDateOnlyString(parsed.data.deadline), userId: req.userId })
    .returning();
  res.status(201).json(project);
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [project] = await db.select().from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId)));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.patch("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .update(projectsTable)
    .set({ ...parsed.data, deadline: toDateOnlyString(parsed.data.deadline) })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId)))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [project] = await db
    .delete(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId)))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await db.delete(projectTasksTable).where(eq(projectTasksTable.projectId, id));
  res.sendStatus(204);
});

router.get("/projects/:id/tasks", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId)));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const rows = await db.select().from(projectTasksTable).where(eq(projectTasksTable.projectId, id));
  res.json(rows);
});

router.post("/project-tasks", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db
    .insert(projectTasksTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(task);
});

router.patch("/project-tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateProjectTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db
    .update(projectTasksTable)
    .set(parsed.data)
    .where(and(eq(projectTasksTable.id, id), eq(projectTasksTable.userId, req.userId)))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.delete("/project-tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [task] = await db
    .delete(projectTasksTable)
    .where(and(eq(projectTasksTable.id, id), eq(projectTasksTable.userId, req.userId)))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
