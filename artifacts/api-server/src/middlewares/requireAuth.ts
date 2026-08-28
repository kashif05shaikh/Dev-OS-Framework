import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

/**
 * Requires a signed-in Clerk user and just-in-time provisions a `profiles`
 * row for them on first access so every other table can safely reference
 * `req.userId` as a foreign key without a separate signup step.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;

  try {
    const [existing] = await db
      .select({ userId: profilesTable.userId })
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId));
    if (!existing) {
      await db
        .insert(profilesTable)
        .values({ userId })
        .onConflictDoNothing();
    }
  } catch (err) {
    req.log.error({ err }, "Failed to provision profile");
    res.status(500).json({ error: "Failed to provision user profile" });
    return;
  }

  next();
}
