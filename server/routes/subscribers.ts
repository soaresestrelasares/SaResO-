import { Router } from "express";
import { getDb } from "../db.js";
import { creatorSubscribers, users, notifications, subscriptions } from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const subscribersRouter = Router();

// POST /api/creators/:creatorId/subscribe — subscrever/cancelar subscrição
subscribersRouter.post("/:creatorId/subscribe", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const subscriberId = req.userId!;
  const creatorId = parseInt(req.params["creatorId"] as string);

  if (subscriberId === creatorId) {
    res.status(400).json({ error: "Não podes subscrever o teu próprio perfil." });
    return;
  }

  // Verificar que o criador é premium ativo
  const now = new Date();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, creatorId))
    .limit(1);
  if (!sub || !sub.active || new Date(sub.expiresAt) <= now) {
    res.status(400).json({ error: "Só podes subscrever perfis Premium." });
    return;
  }

  const [existing] = await db
    .select()
    .from(creatorSubscribers)
    .where(sql`subscriber_id = ${subscriberId} AND creator_id = ${creatorId}`)
    .limit(1);

  if (existing) {
    await db
      .delete(creatorSubscribers)
      .where(sql`subscriber_id = ${subscriberId} AND creator_id = ${creatorId}`);
    res.json({ subscribed: false });
  } else {
    await db.insert(creatorSubscribers).values({ subscriberId, creatorId });
    // Notificar o criador
    await db.insert(notifications).values({
      userId: creatorId,
      actorId: subscriberId,
      type: "subscribe",
      entityId: subscriberId,
    });
    res.json({ subscribed: true });
  }
});

// GET /api/creators/:creatorId/subscribers — lista de subscritores (só o próprio criador vê)
subscribersRouter.get("/:creatorId/subscribers", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const creatorId = parseInt(req.params["creatorId"] as string);

  if (req.userId !== creatorId) {
    res.status(403).json({ error: "Acesso negado." });
    return;
  }

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      subscribedAt: creatorSubscribers.createdAt,
    })
    .from(creatorSubscribers)
    .innerJoin(users, eq(creatorSubscribers.subscriberId, users.id))
    .where(eq(creatorSubscribers.creatorId, creatorId))
    .orderBy(creatorSubscribers.createdAt);

  res.json(rows.map((r) => ({ ...r, id: Number(r.id) })));
});

// GET /api/creators/:creatorId/subscribe-status — verificar se está subscrito
subscribersRouter.get(
  "/:creatorId/subscribe-status",
  authMiddleware,
  async (req: AuthRequest, res) => {
    const db = getDb();
    const subscriberId = req.userId!;
    const creatorId = parseInt(req.params["creatorId"] as string);

    const [existing] = await db
      .select()
      .from(creatorSubscribers)
      .where(sql`subscriber_id = ${subscriberId} AND creator_id = ${creatorId}`)
      .limit(1);

    const [countRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(creatorSubscribers)
      .where(eq(creatorSubscribers.creatorId, creatorId));

    res.json({ subscribed: !!existing, subscribersCount: Number(countRow?.count ?? 0) });
  },
);
