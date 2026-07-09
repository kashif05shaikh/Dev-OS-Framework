import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, dailyGoalsTable, dailyTasksTable, habitsTable, habitCheckinsTable } from "@workspace/db";
import {
  UpsertDailyGoalBody,
  CreateTaskTodayBody,
  UpdateTaskTodayBody,
  CreateHabitBody,
  ToggleHabitCheckinBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { toDateOnlyString } from "../lib/dateOnly";

const router: IRouter = Router();

// ---------- Daily goals ----------
router.get("/daily-goals", requireAuth, async (req, res): Promise<void> => {
  const date = String(req.query.date).slice(0, 10);
  const [goal] = await db
    .select()
    .from(dailyGoalsTable)
    .where(and(eq(dailyGoalsTable.userId, req.userId), eq(dailyGoalsTable.date, date)));
  if (goal) {
    res.json(goal);
    return;
  }
  const [created] = await db
    .insert(dailyGoalsTable)
    .values({ userId: req.userId, date })
    .returning();
  res.json(created);
});

router.post("/daily-goals", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpsertDailyGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const date = toDateOnlyString(parsed.data.date)!;
  const [existing] = await db
    .select()
    .from(dailyGoalsTable)
    .where(and(eq(dailyGoalsTable.userId, req.userId), eq(dailyGoalsTable.date, date)));
  if (existing) {
    const [updated] = await db
      .update(dailyGoalsTable)
      .set({ ...parsed.data, date })
      .where(eq(dailyGoalsTable.id, existing.id))
      .returning();
    res.json(updated);
    return;
  }
  const [created] = await db
    .insert(dailyGoalsTable)
    .values({ ...parsed.data, date, userId: req.userId })
    .returning();
  res.json(created);
});

// ---------- Tasks today ----------
router.get("/tasks-today", requireAuth, async (req, res): Promise<void> => {
  const date = String(req.query.date).slice(0, 10);
  const rows = await db
    .select()
    .from(dailyTasksTable)
    .where(and(eq(dailyTasksTable.userId, req.userId), eq(dailyTasksTable.date, date)))
    .orderBy(asc(dailyTasksTable.position));
  res.json(rows);
});

router.post("/tasks-today", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTaskTodayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db
    .insert(dailyTasksTable)
    .values({ ...parsed.data, date: toDateOnlyString(parsed.data.date)!, userId: req.userId })
    .returning();
  res.status(201).json(task);
});

router.patch("/tasks-today/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateTaskTodayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db
    .update(dailyTasksTable)
    .set(parsed.data)
    .where(and(eq(dailyTasksTable.id, id), eq(dailyTasksTable.userId, req.userId)))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.delete("/tasks-today/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [task] = await db
    .delete(dailyTasksTable)
    .where(and(eq(dailyTasksTable.id, id), eq(dailyTasksTable.userId, req.userId)))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

// ---------- Habits ----------
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function habitWithState(habitId: number, userId: string) {
  const [habit] = await db.select().from(habitsTable).where(eq(habitsTable.id, habitId));
  const [checkin] = await db
    .select()
    .from(habitCheckinsTable)
    .where(and(eq(habitCheckinsTable.habitId, habitId), eq(habitCheckinsTable.userId, userId), eq(habitCheckinsTable.date, todayStr())));
  return { ...habit, checkedInToday: Boolean(checkin) };
}

router.get("/habits", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(habitsTable).where(eq(habitsTable.userId, req.userId));
  const today = todayStr();
  const checkins = await db
    .select()
    .from(habitCheckinsTable)
    .where(and(eq(habitCheckinsTable.userId, req.userId), eq(habitCheckinsTable.date, today)));
  const checkedInIds = new Set(checkins.map((c) => c.habitId));
  res.json(rows.map((h) => ({ ...h, checkedInToday: checkedInIds.has(h.id) })));
});

router.post("/habits", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [habit] = await db
    .insert(habitsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json({ ...habit, checkedInToday: false });
});

router.delete("/habits/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [habit] = await db
    .delete(habitsTable)
    .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, req.userId)))
    .returning();
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  await db.delete(habitCheckinsTable).where(eq(habitCheckinsTable.habitId, id));
  res.sendStatus(204);
});

router.post("/habits/:id/checkin", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = ToggleHabitCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [habit] = await db.select().from(habitsTable).where(and(eq(habitsTable.id, id), eq(habitsTable.userId, req.userId)));
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  const checkinDate = toDateOnlyString(parsed.data.date)!;
  const [existing] = await db
    .select()
    .from(habitCheckinsTable)
    .where(and(eq(habitCheckinsTable.habitId, id), eq(habitCheckinsTable.userId, req.userId), eq(habitCheckinsTable.date, checkinDate)));

  if (existing) {
    await db.delete(habitCheckinsTable).where(eq(habitCheckinsTable.id, existing.id));
  } else {
    await db.insert(habitCheckinsTable).values({ userId: req.userId, habitId: id, date: checkinDate });
  }

  // Recompute current streak by walking back day by day from today.
  const allCheckins = await db
    .select()
    .from(habitCheckinsTable)
    .where(and(eq(habitCheckinsTable.habitId, id), eq(habitCheckinsTable.userId, req.userId)));
  const checkinDates = new Set(allCheckins.map((c) => c.date));

  let streak = 0;
  const cursor = new Date();
  while (checkinDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const longestStreak = Math.max(habit.longestStreak, streak);
  const [updated] = await db
    .update(habitsTable)
    .set({ currentStreak: streak, longestStreak })
    .where(eq(habitsTable.id, id))
    .returning();

  const result = await habitWithState(id, req.userId);
  res.json({ ...updated, checkedInToday: result.checkedInToday });
});

export default router;
