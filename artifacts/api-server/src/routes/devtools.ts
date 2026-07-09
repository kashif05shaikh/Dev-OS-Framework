import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, devToolConnectionsTable } from "@workspace/db";
import { ConnectDevToolBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { DEV_TOOLS_CATALOG, syncDevToolService } from "../lib/devToolsCatalog";

const router: IRouter = Router();

router.get("/dev-tools", requireAuth, async (req, res): Promise<void> => {
  const connections = await db.select().from(devToolConnectionsTable).where(eq(devToolConnectionsTable.userId, req.userId));
  const byService = new Map(connections.map((c) => [c.service, c]));
  res.json(
    DEV_TOOLS_CATALOG.map((entry) => {
      const conn = byService.get(entry.service);
      return {
        ...entry,
        connected: Boolean(conn),
        connectionId: conn?.id ?? null,
        lastSyncedAt: conn?.lastSyncedAt ?? null,
        syncStatus: conn?.syncStatus ?? null,
        dataJson: conn?.dataJson ?? null,
      };
    }),
  );
});

router.post("/dev-tools/connections", requireAuth, async (req, res): Promise<void> => {
  const parsed = ConnectDevToolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { service, accessToken, accountLabel } = parsed.data;
  const result = await syncDevToolService(service, accessToken);
  const [connection] = await db
    .insert(devToolConnectionsTable)
    .values({
      userId: req.userId,
      service,
      accessToken,
      accountLabel,
      syncStatus: result.ok ? "ok" : "error",
      errorMessage: result.errorMessage ?? null,
      dataJson: result.dataJson,
      lastSyncedAt: new Date(),
    })
    .returning();
  const { accessToken: _omit, ...safe } = connection;
  res.status(201).json({ ...safe, connected: true });
});

router.delete("/dev-tools/connections/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [connection] = await db
    .delete(devToolConnectionsTable)
    .where(and(eq(devToolConnectionsTable.id, id), eq(devToolConnectionsTable.userId, req.userId)))
    .returning();
  if (!connection) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/dev-tools/connections/:id/sync", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [connection] = await db
    .select()
    .from(devToolConnectionsTable)
    .where(and(eq(devToolConnectionsTable.id, id), eq(devToolConnectionsTable.userId, req.userId)));
  if (!connection) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }
  const result = await syncDevToolService(connection.service, connection.accessToken);
  const [updated] = await db
    .update(devToolConnectionsTable)
    .set({
      syncStatus: result.ok ? "ok" : "error",
      errorMessage: result.errorMessage ?? null,
      dataJson: result.dataJson,
      lastSyncedAt: new Date(),
    })
    .where(eq(devToolConnectionsTable.id, id))
    .returning();
  const { accessToken: _omit, ...safe } = updated;
  res.json({ ...safe, connected: true });
});

export default router;
