import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, promptCategoriesTable, promptsTable, aiToolFavoritesTable } from "@workspace/db";
import { CreatePromptCategoryBody, CreatePromptBody, UpdatePromptBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { AI_TOOLS_CATALOG } from "../lib/aiToolsCatalog";

const router: IRouter = Router();

router.get("/ai-tools", requireAuth, async (req, res): Promise<void> => {
  const favorites = await db.select().from(aiToolFavoritesTable).where(eq(aiToolFavoritesTable.userId, req.userId));
  const favoriteIds = new Set(favorites.map((f) => f.toolId));
  res.json(AI_TOOLS_CATALOG.map((tool) => ({ ...tool, favorite: favoriteIds.has(tool.id) })));
});

router.patch("/ai-tools/:toolId/favorite", requireAuth, async (req, res): Promise<void> => {
  const toolId = Array.isArray(req.params.toolId) ? req.params.toolId[0] : req.params.toolId;
  const tool = AI_TOOLS_CATALOG.find((t) => t.id === toolId);
  if (!tool) {
    res.status(404).json({ error: "Tool not found" });
    return;
  }
  const [existing] = await db
    .select()
    .from(aiToolFavoritesTable)
    .where(and(eq(aiToolFavoritesTable.userId, req.userId), eq(aiToolFavoritesTable.toolId, toolId)));
  if (existing) {
    await db
      .delete(aiToolFavoritesTable)
      .where(and(eq(aiToolFavoritesTable.userId, req.userId), eq(aiToolFavoritesTable.toolId, toolId)));
    res.json({ ...tool, favorite: false });
    return;
  }
  await db.insert(aiToolFavoritesTable).values({ userId: req.userId, toolId });
  res.json({ ...tool, favorite: true });
});

router.get("/prompt-categories", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(promptCategoriesTable).where(eq(promptCategoriesTable.userId, req.userId));
  res.json(rows);
});

router.post("/prompt-categories", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePromptCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db
    .insert(promptCategoriesTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(category);
});

router.delete("/prompt-categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [category] = await db
    .delete(promptCategoriesTable)
    .where(and(eq(promptCategoriesTable.id, id), eq(promptCategoriesTable.userId, req.userId)))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/prompts", requireAuth, async (req, res): Promise<void> => {
  const conditions = [eq(promptsTable.userId, req.userId)];
  if (req.query.categoryId) conditions.push(eq(promptsTable.categoryId, parseInt(String(req.query.categoryId), 10)));
  if (req.query.favorite !== undefined) conditions.push(eq(promptsTable.favorite, req.query.favorite === "true"));
  if (req.query.q) {
    const q = `%${String(req.query.q)}%`;
    conditions.push(or(ilike(promptsTable.title, q), ilike(promptsTable.content, q))!);
  }
  const rows = await db
    .select()
    .from(promptsTable)
    .where(and(...conditions))
    .orderBy(desc(promptsTable.updatedAt));
  res.json(rows);
});

router.post("/prompts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [prompt] = await db
    .insert(promptsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();
  res.status(201).json(prompt);
});

router.patch("/prompts/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [prompt] = await db
    .update(promptsTable)
    .set(parsed.data)
    .where(and(eq(promptsTable.id, id), eq(promptsTable.userId, req.userId)))
    .returning();
  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }
  res.json(prompt);
});

router.delete("/prompts/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [prompt] = await db
    .delete(promptsTable)
    .where(and(eq(promptsTable.id, id), eq(promptsTable.userId, req.userId)))
    .returning();
  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/prompts/:id/favorite", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [existing] = await db.select().from(promptsTable).where(and(eq(promptsTable.id, id), eq(promptsTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }
  const [prompt] = await db
    .update(promptsTable)
    .set({ favorite: !existing.favorite })
    .where(eq(promptsTable.id, id))
    .returning();
  res.json(prompt);
});

router.post("/prompts/:id/use", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [existing] = await db.select().from(promptsTable).where(and(eq(promptsTable.id, id), eq(promptsTable.userId, req.userId)));
  if (!existing) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }
  const [prompt] = await db
    .update(promptsTable)
    .set({ usageCount: existing.usageCount + 1 })
    .where(eq(promptsTable.id, id))
    .returning();
  res.json(prompt);
});

export default router;
