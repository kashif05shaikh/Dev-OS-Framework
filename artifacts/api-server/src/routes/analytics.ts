import { Router, type IRouter } from "express";
import { eq, gte } from "drizzle-orm";
import { db, focusSessionsTable, projectsTable, jobsTable, resumesTable, subjectsTable, topicsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const RANGE_DAYS: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };

router.get("/analytics/overview", requireAuth, async (req, res): Promise<void> => {
  const range = String(req.query.range ?? "month");
  const days = RANGE_DAYS[range] ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [sessions, projects, jobs, resumes] = await Promise.all([
    db.select().from(focusSessionsTable).where(eq(focusSessionsTable.userId, req.userId)),
    db.select().from(projectsTable).where(eq(projectsTable.userId, req.userId)),
    db.select().from(jobsTable).where(eq(jobsTable.userId, req.userId)),
    db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId)),
  ]);

  const recentSessions = sessions.filter((s) => s.startedAt >= since && s.durationMinutes);
  const totalStudyMinutes = recentSessions.filter((s) => s.category === "study").reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const totalCodingMinutes = recentSessions.filter((s) => s.category === "coding").reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

  const jobStatusBreakdown: Record<string, number> = {};
  for (const job of jobs) {
    jobStatusBreakdown[job.status] = (jobStatusBreakdown[job.status] ?? 0) + 1;
  }

  const atsScores = resumes.map((r) => r.atsScore).filter((s): s is number => s != null);
  const resumeAtsAverage = atsScores.length > 0 ? atsScores.reduce((a, b) => a + b, 0) / atsScores.length : null;

  res.json({
    totalStudyMinutes,
    totalCodingMinutes,
    totalProjects: projects.length,
    totalJobs: jobs.length,
    jobStatusBreakdown,
    resumeAtsAverage,
  });
});

router.get("/analytics/coding-activity", requireAuth, async (req, res): Promise<void> => {
  const range = String(req.query.range ?? "month");
  const days = RANGE_DAYS[range] ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sessions = await db.select().from(focusSessionsTable).where(gte(focusSessionsTable.startedAt, since));
  const mine = sessions.filter((s) => s.userId === req.userId && s.durationMinutes);

  const byDate = new Map<string, { codingMinutes: number; studyMinutes: number; submissions: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    byDate.set(d, { codingMinutes: 0, studyMinutes: 0, submissions: 0 });
  }
  for (const s of mine) {
    const d = s.startedAt.toISOString().slice(0, 10);
    const entry = byDate.get(d);
    if (!entry) continue;
    if (s.category === "coding") entry.codingMinutes += s.durationMinutes ?? 0;
    if (s.category === "study") entry.studyMinutes += s.durationMinutes ?? 0;
    entry.submissions += 1;
  }

  const points = [...byDate.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(points);
});

router.get("/analytics/learning-progress", requireAuth, async (req, res): Promise<void> => {
  const [subjects, topics] = await Promise.all([
    db.select().from(subjectsTable).where(eq(subjectsTable.userId, req.userId)),
    db.select().from(topicsTable).where(eq(topicsTable.userId, req.userId)),
  ]);

  const points = subjects.map((subject) => {
    const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      completedTopics: subjectTopics.filter((t) => t.completed).length,
      totalTopics: subjectTopics.length,
    };
  });

  res.json(points);
});

export default router;
