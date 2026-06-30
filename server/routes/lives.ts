import { Router } from "express";
import { getDb } from "../db.js";
import { lives, users, liveBans } from "../schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const livesRouter = Router();

// POST / — start a live
livesRouter.post("/", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: "Título obrigatório" });
    return;
  }
  const [result] = await db.insert(lives).values({
    userId: req.userId!,
    title,
    status: "live",
    viewerCount: 0,
  });
  res.json({ id: Number(result.insertId), title, status: "live" });
});

// PATCH /:id/end — end a live
livesRouter.patch("/:id/end", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [live] = await db.select().from(lives).where(eq(lives.id, id)).limit(1);
  if (!live) {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }
  if (Number(live.userId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  await db
    .update(lives)
    .set({ status: "ended", endedAt: sql`NOW()` })
    .where(eq(lives.id, id));
  res.json({ ok: true });
});

// DELETE /:id — delete a live (owner only)
livesRouter.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [live] = await db.select().from(lives).where(eq(lives.id, id)).limit(1);
  if (!live) {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }
  if (Number(live.userId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  await db.update(lives).set({ status: "deleted" }).where(eq(lives.id, id));
  res.json({ ok: true });
});

// POST /:id/ban — ban a user from the live
livesRouter.post("/:id/ban", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const liveId = parseInt(req.params.id as string);
  const { userId: targetUserId, reason } = req.body;

  const [live] = await db.select().from(lives).where(eq(lives.id, liveId)).limit(1);
  if (!live) {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }
  if (Number(live.userId) !== req.userId!) {
    res.status(403).json({ error: "Apenas o anfitrião pode banir espectadores." });
    return;
  }
  if (!targetUserId || targetUserId === req.userId!) {
    res.status(400).json({ error: "Utilizador inválido." });
    return;
  }

  await db
    .insert(liveBans)
    .values({ liveId, userId: targetUserId, bannedBy: req.userId!, reason: reason || "" })
    .onDuplicateKeyUpdate({ set: { reason: reason || "" } });
  res.json({ ok: true });
});

// DELETE /:id/ban/:userId — unban a user
livesRouter.delete("/:id/ban/:userId", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const liveId = parseInt(req.params.id as string);
  const targetUserId = parseInt(req.params.userId as string);

  const [live] = await db.select().from(lives).where(eq(lives.id, liveId)).limit(1);
  if (!live) {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }
  if (Number(live.userId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }

  await db.delete(liveBans).where(sql`live_id = ${liveId} AND user_id = ${targetUserId}`);
  res.json({ ok: true });
});

// GET /:id/bans — list banned users
livesRouter.get("/:id/bans", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const liveId = parseInt(req.params.id as string);

  const [live] = await db.select().from(lives).where(eq(lives.id, liveId)).limit(1);
  if (!live) {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }
  if (Number(live.userId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }

  const rows = await db
    .select({
      id: liveBans.id,
      userId: liveBans.userId,
      reason: liveBans.reason,
      createdAt: liveBans.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(liveBans)
    .innerJoin(users, eq(liveBans.userId, users.id))
    .where(eq(liveBans.liveId, liveId))
    .orderBy(desc(liveBans.createdAt));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// GET / — list active lives
livesRouter.get("/", async (_req, res) => {
  const db = getDb();
  const rows = await db
    .select({
      id: lives.id,
      userId: lives.userId,
      title: lives.title,
      status: lives.status,
      viewerCount: lives.viewerCount,
      startedAt: lives.startedAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(lives)
    .innerJoin(users, eq(lives.userId, users.id))
    .where(eq(lives.status, "live"))
    .orderBy(desc(lives.startedAt));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// GET /:id — get live details
livesRouter.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [row] = await db
    .select({
      id: lives.id,
      userId: lives.userId,
      title: lives.title,
      status: lives.status,
      viewerCount: lives.viewerCount,
      startedAt: lives.startedAt,
      endedAt: lives.endedAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(lives)
    .innerJoin(users, eq(lives.userId, users.id))
    .where(eq(lives.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }
  if (row.status === "deleted") {
    res.status(404).json({ error: "Live não encontrada" });
    return;
  }

  let isBanned = false;
  if (req.userId) {
    const [ban] = await db
      .select()
      .from(liveBans)
      .where(sql`live_id = ${id} AND user_id = ${req.userId}`)
      .limit(1);
    isBanned = !!ban;
  }

  res.json({
    ...row,
    id: Number(row.id),
    userId: Number(row.userId),
    isBanned,
    isOwner: req.userId ? Number(row.userId) === req.userId : false,
  });
});

// POST /:id/viewers/increment — increment viewer count
livesRouter.post("/:id/viewers/increment", async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  await db
    .update(lives)
    .set({ viewerCount: sql`viewer_count + 1` })
    .where(eq(lives.id, id));
  res.json({ ok: true });
});

// POST /:id/viewers/decrement — decrement viewer count
livesRouter.post("/:id/viewers/decrement", async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  await db
    .update(lives)
    .set({ viewerCount: sql`GREATEST(viewer_count - 1, 0)` })
    .where(eq(lives.id, id));
  res.json({ ok: true });
});
