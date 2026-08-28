import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, codingProfilesTable, githubReposTable } from "@workspace/db";
import { CreateCodingProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { syncCodingProfilePlatform, profileUrlFor } from "../lib/codingSync";

const router: IRouter = Router();

router.get("/coding-profiles", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, req.userId));
  res.json(rows);
});

router.post("/coding-profiles", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCodingProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { platform, usernameOrHandle } = parsed.data;
  const [profile] = await db
    .insert(codingProfilesTable)
    .values({
      userId: req.userId,
      platform,
      usernameOrHandle,
      profileUrl: profileUrlFor(platform, usernameOrHandle),
      syncStatus: "pending",
    })
    .returning();

  // Kick off an initial sync immediately so the card isn't empty.
  const result = await syncCodingProfilePlatform(platform, usernameOrHandle);
  const [updated] = await db
    .update(codingProfilesTable)
    .set({
      profileUrl: result.profileUrl || profile.profileUrl,
      avatarUrl: result.avatarUrl ?? null,
      rating: result.rating ?? null,
      rank: result.rank ?? null,
      solvedCount: result.solvedCount ?? null,
      maxRating: result.maxRating ?? null,
      country: result.country ?? null,
      statsJson: result.statsJson,
      syncStatus: result.ok ? "ok" : "error",
      errorMessage: result.errorMessage ?? null,
      lastSyncedAt: new Date(),
    })
    .where(eq(codingProfilesTable.id, profile.id))
    .returning();

  if (platform === "github" && result.ok && Array.isArray(result.statsJson.repos)) {
    await db.delete(githubReposTable).where(eq(githubReposTable.codingProfileId, profile.id));
    const repos = result.statsJson.repos as any[];
    if (repos.length > 0) {
      await db.insert(githubReposTable).values(
        repos.map((r) => ({
          userId: req.userId,
          codingProfileId: profile.id,
          name: r.name,
          fullName: r.fullName,
          description: r.description,
          url: r.url,
          stars: r.stars ?? 0,
          forks: r.forks ?? 0,
          language: r.language,
          pushedAt: r.pushedAt ? new Date(r.pushedAt) : null,
        })),
      );
    }
  }

  res.status(201).json(updated);
});

router.delete("/coding-profiles/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [profile] = await db
    .delete(codingProfilesTable)
    .where(and(eq(codingProfilesTable.id, id), eq(codingProfilesTable.userId, req.userId)))
    .returning();
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  await db.delete(githubReposTable).where(eq(githubReposTable.codingProfileId, id));
  res.sendStatus(204);
});

router.post("/coding-profiles/:id/sync", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [profile] = await db
    .select()
    .from(codingProfilesTable)
    .where(and(eq(codingProfilesTable.id, id), eq(codingProfilesTable.userId, req.userId)));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const result = await syncCodingProfilePlatform(profile.platform, profile.usernameOrHandle);
  const [updated] = await db
    .update(codingProfilesTable)
    .set({
      profileUrl: result.profileUrl || profile.profileUrl,
      avatarUrl: result.avatarUrl ?? null,
      rating: result.rating ?? null,
      rank: result.rank ?? null,
      solvedCount: result.solvedCount ?? null,
      maxRating: result.maxRating ?? null,
      country: result.country ?? null,
      statsJson: result.statsJson,
      syncStatus: result.ok ? "ok" : "error",
      errorMessage: result.errorMessage ?? null,
      lastSyncedAt: new Date(),
    })
    .where(eq(codingProfilesTable.id, id))
    .returning();

  if (profile.platform === "github" && result.ok && Array.isArray(result.statsJson.repos)) {
    await db.delete(githubReposTable).where(eq(githubReposTable.codingProfileId, id));
    const repos = result.statsJson.repos as any[];
    if (repos.length > 0) {
      await db.insert(githubReposTable).values(
        repos.map((r) => ({
          userId: req.userId,
          codingProfileId: id,
          name: r.name,
          fullName: r.fullName,
          description: r.description,
          url: r.url,
          stars: r.stars ?? 0,
          forks: r.forks ?? 0,
          language: r.language,
          pushedAt: r.pushedAt ? new Date(r.pushedAt) : null,
        })),
      );
    }
  }

  res.json(updated);
});

router.get("/coding-profiles/:id/repos", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [profile] = await db
    .select({ id: codingProfilesTable.id })
    .from(codingProfilesTable)
    .where(and(eq(codingProfilesTable.id, id), eq(codingProfilesTable.userId, req.userId)));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  const rows = await db.select().from(githubReposTable).where(eq(githubReposTable.codingProfileId, id));
  res.json(rows);
});

export default router;
