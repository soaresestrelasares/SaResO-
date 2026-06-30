import { Router } from "express";
import { getDb } from "../db.js";
import { notifications, users } from "../schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const notificationsRouter = Router();

// GET / — list notifications for authenticated user (most recent 50)
notificationsRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;

  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      actorId: notifications.actorId,
      type: notifications.type,
      entityId: notifications.entityId,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
      actorAvatarUrl: users.avatarUrl,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  res.json(
    rows.map((r) => ({
      ...r,
      id: Number(r.id),
      userId: Number(r.userId),
      actorId: Number(r.actorId),
      entityId: r.entityId ? Number(r.entityId) : null,
    })),
  );
});

// PATCH /:id/read — mark one notification as read
notificationsRouter.patch("/:id/read", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const id = parseInt(req.params.id as string);

  await db
    .update(notifications)
    .set({ readAt: sql`NOW()` })
    .where(sql`id = ${id} AND user_id = ${userId}`);

  res.json({ ok: true });
});

// POST /read-all — mark all as read
notificationsRouter.post("/read-all", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;

  await db
    .update(notifications)
    .set({ readAt: sql`NOW()` })
    .where(sql`user_id = ${userId} AND read_at IS NULL`);

  res.json({ ok: true });
});
