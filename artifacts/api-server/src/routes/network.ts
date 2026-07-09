import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, socialLinksTable } from "@workspace/db";
import { CreateSocialLinkBody, UpdateSocialLinkBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { syncSocialPlatform } from "../lib/socialSync";

const router: IRouter = Router();

router.get("/social-links", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(socialLinksTable).where(eq(socialLinksTable.userId, req.userId));
  res.json(rows);
});

router.post("/social-links", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSocialLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [link] = await db
    .insert(socialLinksTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(link);
});

router.patch("/social-links/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateSocialLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [link] = await db
    .update(socialLinksTable)
    .set(parsed.data)
    .where(and(eq(socialLinksTable.id, id), eq(socialLinksTable.userId, req.userId)))
    .returning();
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.json(link);
});

router.delete("/social-links/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [link] = await db
    .delete(socialLinksTable)
    .where(and(eq(socialLinksTable.id, id), eq(socialLinksTable.userId, req.userId)))
    .returning();
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/social-links/:id/sync", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [link] = await db.select().from(socialLinksTable).where(and(eq(socialLinksTable.id, id), eq(socialLinksTable.userId, req.userId)));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  const result = await syncSocialPlatform(link.platform, link.handle);
  const [updated] = await db
    .update(socialLinksTable)
    .set({
      followers: result.followers ?? link.followers,
      postCount: result.postCount ?? link.postCount,
      dataJson: result.ok ? result.dataJson : link.dataJson,
      lastSyncedAt: new Date(),
    })
    .where(eq(socialLinksTable.id, id))
    .returning();
  res.json(updated);
});

export default router;
