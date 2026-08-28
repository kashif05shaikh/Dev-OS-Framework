import { Router, type IRouter } from "express";
import { and, eq, isNull, ne, desc, gt } from "drizzle-orm";
import {
  db,
  topicsTable,
  projectsTable,
  jobsTable,
  codingProfilesTable,
  notificationsTable,
  dailyGoalsTable,
  dailyTasksTable,
  habitsTable,
  habitCheckinsTable,
  focusSessionsTable,
  notesTable,
  resumesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const [
    tasks,
    goal,
    habits,
    checkinsToday,
    codingProfiles,
    unreadNotifications,
    recentNotes,
    activeProjects,
    jobs,
    topicsWithDeadline,
    projectsWithDeadline,
    primaryResume,
    activeSession,
  ] = await Promise.all([
    db.select().from(dailyTasksTable).where(and(eq(dailyTasksTable.userId, req.userId), eq(dailyTasksTable.date, today))),
    db.select().from(dailyGoalsTable).where(and(eq(dailyGoalsTable.userId, req.userId), eq(dailyGoalsTable.date, today))),
    db.select().from(habitsTable).where(eq(habitsTable.userId, req.userId)),
    db.select().from(habitCheckinsTable).where(and(eq(habitCheckinsTable.userId, req.userId), eq(habitCheckinsTable.date, today))),
    db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, req.userId)),
    db.select().from(notificationsTable).where(and(eq(notificationsTable.userId, req.userId), eq(notificationsTable.read, false))),
    db.select().from(notesTable).where(and(eq(notesTable.userId, req.userId), eq(notesTable.archived, false))).orderBy(desc(notesTable.updatedAt)).limit(5),
    db.select().from(projectsTable).where(and(eq(projectsTable.userId, req.userId), eq(projectsTable.status, "in_progress"))),
    db.select().from(jobsTable).where(eq(jobsTable.userId, req.userId)),
    db.select().from(topicsTable).where(and(eq(topicsTable.userId, req.userId), eq(topicsTable.completed, false))).then(rows => rows.filter(t => t.deadline && t.deadline >= today)),
    db.select().from(projectsTable).where(eq(projectsTable.userId, req.userId)).then(rows => rows.filter(p => p.deadline && p.deadline >= today)),
    db.select().from(resumesTable).where(and(eq(resumesTable.userId, req.userId), eq(resumesTable.isPrimary, true))).limit(1),
    db.select().from(focusSessionsTable).where(and(eq(focusSessionsTable.userId, req.userId), isNull(focusSessionsTable.endedAt))),
  ]);

  const checkedInHabitIds = new Set(checkinsToday.map((c) => c.habitId));
  const todayGoal = goal[0] ?? null;
  const todayStudyMinutes = todayGoal?.studyMinutesActual ?? 0;
  const todayCodingMinutes = todayGoal?.codingMinutesActual ?? 0;

  // Simple productivity score: ratio of actual vs target minutes, capped at 100
  const studyTarget = todayGoal?.studyMinutesTarget ?? 60;
  const codingTarget = todayGoal?.codingMinutesTarget ?? 60;
  const totalTarget = studyTarget + codingTarget;
  const totalActual = todayStudyMinutes + todayCodingMinutes;
  const productivityScore = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0;

  // Upcoming deadlines from topics + projects, sorted by date
  const deadlines = [
    ...topicsWithDeadline.map(t => ({
      sourceType: "topic" as const,
      sourceId: t.id,
      title: t.title,
      dueAt: t.deadline as string,
      url: `/learning`,
    })),
    ...projectsWithDeadline.map(p => ({
      sourceType: "project" as const,
      sourceId: p.id,
      title: p.name,
      dueAt: p.deadline as string,
      url: `/projects`,
    })),
  ].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 10);

  // Job pipeline grouped by status
  const jobPipeline: Record<string, number> = {};
  for (const job of jobs) {
    jobPipeline[job.status] = (jobPipeline[job.status] ?? 0) + 1;
  }

  // Resume status from primary resume
  const resume = primaryResume[0] ?? null;
  const resumeStatus = resume
    ? { versionName: resume.versionName, atsScore: resume.atsScore ?? null, isPrimary: true }
    : null;

  res.json({
    productivityScore,
    todayStudyMinutes,
    todayCodingMinutes,
    tasksToday: tasks,
    upcomingDeadlines: deadlines,
    recentNotes: recentNotes,
    activeProjects: activeProjects,
    jobPipeline,
    codingProfiles: codingProfiles.map(p => ({
      id: p.id,
      platform: p.platform,
      usernameOrHandle: p.usernameOrHandle,
      profileUrl: p.profileUrl,
      avatarUrl: p.avatarUrl,
      rating: p.rating,
      rank: p.rank,
      solvedCount: p.solvedCount,
      maxRating: p.maxRating,
      country: p.country,
      lastSyncedAt: p.lastSyncedAt,
      syncStatus: p.syncStatus,
      errorMessage: p.errorMessage,
      statsJson: p.statsJson,
    })),
    resumeStatus,
    habits: habits.map(h => ({
      id: h.id,
      name: h.name,
      color: h.color,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
      checkedInToday: checkedInHabitIds.has(h.id),
      createdAt: h.createdAt,
    })),
    unreadNotifications: unreadNotifications.length,
  });
});

export default router;
