import { Router, type IRouter } from "express";
import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { db, focusSessionsTable, dailyGoalsTable } from "@workspace/db";
import { StartFocusSessionBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/focus-sessions", requireAuth, async (req, res): Promise<void> => {
  const conditions = [eq(focusSessionsTable.userId, req.userId)];
  if (req.query.date) {
    const date = String(req.query.date);
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    conditions.push(gte(focusSessionsTable.startedAt, start), lte(focusSessionsTable.startedAt, end));
  }
  const rows = await db
    .select()
    .from(focusSessionsTable)
    .where(and(...conditions))
    .orderBy(desc(focusSessionsTable.startedAt));
  res.json(rows);
});

router.post("/focus-sessions/start", requireAuth, async (req, res): Promise<void> => {
  const parsed = StartFocusSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [active] = await db
    .select()
    .from(focusSessionsTable)
    .where(and(eq(focusSessionsTable.userId, req.userId), isNull(focusSessionsTable.endedAt)));
  if (active) {
    res.status(400).json({ error: "A focus session is already running" });
    return;
  }
  const [session] = await db
    .insert(focusSessionsTable)
    .values({ userId: req.userId, category: parsed.data.category, label: parsed.data.label })
    .returning();
  res.status(201).json(session);
});

router.post("/focus-sessions/:id/stop", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [session] = await db
    .select()
    .from(focusSessionsTable)
    .where(and(eq(focusSessionsTable.id, id), eq(focusSessionsTable.userId, req.userId)));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const endedAt = new Date();
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000));
  const [updated] = await db
    .update(focusSessionsTable)
    .set({ endedAt, durationMinutes })
    .where(eq(focusSessionsTable.id, id))
    .returning();

  // Roll the completed session into today's goal progress.
  const date = endedAt.toISOString().slice(0, 10);
  const [goal] = await db
    .select()
    .from(dailyGoalsTable)
    .where(and(eq(dailyGoalsTable.userId, req.userId), eq(dailyGoalsTable.date, date)));
  const field = session.category === "study" ? "studyMinutesActual" : "codingMinutesActual";
  if (goal) {
    await db
      .update(dailyGoalsTable)
      .set({ [field]: (goal as any)[field] + durationMinutes })
      .where(eq(dailyGoalsTable.id, goal.id));
  } else {
    await db.insert(dailyGoalsTable).values({ userId: req.userId, date, [field]: durationMinutes } as any);
  }

  res.json(updated);
});

router.get("/focus-sessions/active", requireAuth, async (req, res): Promise<void> => {
  const [session] = await db
    .select()
    .from(focusSessionsTable)
    .where(and(eq(focusSessionsTable.userId, req.userId), isNull(focusSessionsTable.endedAt)));
  res.json(session ?? null);
});

export default router;
