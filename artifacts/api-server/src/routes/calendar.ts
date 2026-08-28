import { Router, type IRouter } from "express";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, calendarEventsTable, projectsTable, jobsTable, topicsTable } from "@workspace/db";
import { CreateCalendarEventBody, UpdateCalendarEventBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/calendar/events", requireAuth, async (req, res): Promise<void> => {
  const conditions = [eq(calendarEventsTable.userId, req.userId)];
  if (req.query.start) conditions.push(gte(calendarEventsTable.startAt, new Date(String(req.query.start))));
  if (req.query.end) conditions.push(lte(calendarEventsTable.startAt, new Date(String(req.query.end))));
  const rows = await db
    .select()
    .from(calendarEventsTable)
    .where(and(...conditions))
    .orderBy(asc(calendarEventsTable.startAt));
  res.json(rows);
});

router.post("/calendar/events", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db
    .insert(calendarEventsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(event);
});

router.patch("/calendar/events/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db
    .update(calendarEventsTable)
    .set(parsed.data)
    .where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, req.userId)))
    .returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

router.delete("/calendar/events/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [event] = await db
    .delete(calendarEventsTable)
    .where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, req.userId)))
    .returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/calendar/upcoming", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [projects, jobs, topics, events] = await Promise.all([
    db.select().from(projectsTable).where(eq(projectsTable.userId, req.userId)),
    db.select().from(jobsTable).where(eq(jobsTable.userId, req.userId)),
    db.select().from(topicsTable).where(eq(topicsTable.userId, req.userId)),
    db
      .select()
      .from(calendarEventsTable)
      .where(and(eq(calendarEventsTable.userId, req.userId), gte(calendarEventsTable.startAt, now), lte(calendarEventsTable.startAt, in30Days))),
  ]);

  const deadlines = [
    ...projects
      .filter((p) => p.deadline)
      .map((p) => ({ sourceType: "project" as const, sourceId: p.id, title: p.name, dueAt: new Date(`${p.deadline}T00:00:00Z`).toISOString(), url: null })),
    ...jobs
      .filter((j) => j.status !== "rejected" && j.status !== "offer")
      .map((j) => ({ sourceType: "job" as const, sourceId: j.id, title: `${j.company} — ${j.role}`, dueAt: j.updatedAt.toISOString(), url: null })),
    ...topics
      .filter((t) => t.deadline && !t.completed)
      .map((t) => ({ sourceType: "topic" as const, sourceId: t.id, title: t.title, dueAt: new Date(`${t.deadline}T00:00:00Z`).toISOString(), url: t.url })),
    ...events.map((e) => ({ sourceType: "event" as const, sourceId: e.id, title: e.title, dueAt: e.startAt.toISOString(), url: null })),
  ]
    .filter((d) => new Date(d.dueAt).getTime() >= now.getTime() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 20);

  res.json(deadlines);
});

export default router;
