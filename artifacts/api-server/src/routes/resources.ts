import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";
import { CreateResourceBody, UpdateResourceBody, FetchResourceMetadataBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { fetchUrlMetadata } from "../lib/urlMetadata";

const router: IRouter = Router();

router.get("/resources", requireAuth, async (req, res): Promise<void> => {
  const conditions = [eq(resourcesTable.userId, req.userId)];
  if (req.query.category) conditions.push(eq(resourcesTable.category, String(req.query.category)));
  if (req.query.q) conditions.push(ilike(resourcesTable.title, `%${String(req.query.q)}%`));
  const rows = await db.select().from(resourcesTable).where(and(...conditions));
  res.json(rows);
});

router.post("/resources", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [resource] = await db
    .insert(resourcesTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(resource);
});

router.patch("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [resource] = await db
    .update(resourcesTable)
    .set(parsed.data)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.userId, req.userId)))
    .returning();
  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }
  res.json(resource);
});

router.delete("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [resource] = await db
    .delete(resourcesTable)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.userId, req.userId)))
    .returning();
  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/resources/fetch-metadata", requireAuth, async (req, res): Promise<void> => {
  const parsed = FetchResourceMetadataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const metadata = await fetchUrlMetadata(parsed.data.url);
  res.json(metadata);
});

export default router;
