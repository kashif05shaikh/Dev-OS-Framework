import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, notesTable, topicsTable, projectsTable, jobsTable, resourcesTable, promptsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/search", requireAuth, async (req, res): Promise<void> => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.json({ results: [] });
    return;
  }
  const like = `%${q}%`;

  const [notes, topics, projects, jobs, resources, prompts] = await Promise.all([
    db.select().from(notesTable).where(and(eq(notesTable.userId, req.userId), ilike(notesTable.title, like))).limit(10),
    db.select().from(topicsTable).where(and(eq(topicsTable.userId, req.userId), ilike(topicsTable.title, like))).limit(10),
    db.select().from(projectsTable).where(and(eq(projectsTable.userId, req.userId), ilike(projectsTable.name, like))).limit(10),
    db.select().from(jobsTable).where(and(eq(jobsTable.userId, req.userId), or(ilike(jobsTable.company, like), ilike(jobsTable.role, like)))).limit(10),
    db.select().from(resourcesTable).where(and(eq(resourcesTable.userId, req.userId), ilike(resourcesTable.title, like))).limit(10),
    db.select().from(promptsTable).where(and(eq(promptsTable.userId, req.userId), ilike(promptsTable.title, like))).limit(10),
  ]);

  const results = [
    ...notes.map((n) => ({ type: "note", id: String(n.id), title: n.title, subtitle: "Note", url: `/notes/${n.id}` })),
    ...topics.map((t) => ({ type: "topic", id: String(t.id), title: t.title, subtitle: "Learning topic", url: `/learning/topics/${t.id}` })),
    ...projects.map((p) => ({ type: "project", id: String(p.id), title: p.name, subtitle: "Project", url: `/projects/${p.id}` })),
    ...jobs.map((j) => ({ type: "job", id: String(j.id), title: `${j.company} — ${j.role}`, subtitle: "Job application", url: `/jobs/${j.id}` })),
    ...resources.map((r) => ({ type: "resource", id: String(r.id), title: r.title, subtitle: "Resource", url: `/resources/${r.id}` })),
    ...prompts.map((p) => ({ type: "prompt", id: String(p.id), title: p.title, subtitle: "AI prompt", url: `/ai-hub/prompts/${p.id}` })),
  ];

  res.json({ results });
});

export default router;
