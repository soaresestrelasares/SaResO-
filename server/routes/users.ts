import { Router } from "express";
import { getDb } from "../db.js";
import {
  users,
  follows,
  videos,
  blockedUsers,
  subscriptions,
  verifiedUsers,
  creatorSubscribers,
} from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, optionalAuthQuery, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";
import { onlineUsers } from "../socket.js";

export const usersRouter = Router();

usersRouter.get("/search", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const q = ((req.query.q as string) || "").toLowerCase();
  if (!q || q.length < 2) {
    res.status(400).json({ error: "Pesquisa demasiado curta." });
    return;
  }
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(sql`LOWER(username) LIKE ${"%" + q + "%"} OR LOWER(display_name) LIKE ${"%" + q + "%"}`)
    .limit(20);
  res.json(rows.map((u) => ({ ...u, id: Number(u.id) })));
});

usersRouter.get("/:username", optionalAuthQuery, async (req: AuthRequest, res) => {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(sql`username = ${req.params.username}`)
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const viewerId = req.userId;
  const targetId = Number(user.id);
  const isMe = viewerId === targetId;

  const [followersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, user.id));
  const [followingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followerId, user.id));
  const [videosCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(videos)
    .where(eq(videos.userId, user.id));
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);
  const [verified] = await db
    .select()
    .from(verifiedUsers)
    .where(eq(verifiedUsers.userId, user.id))
    .limit(1);
  const [subCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(creatorSubscribers)
    .where(eq(creatorSubscribers.creatorId, user.id));
  const now = new Date();
  const isPremium = !!(sub && sub.active && new Date(sub.expiresAt) > now);
  const isVerified = !!verified;
  const isPrivate = user.isPrivate === 1;

  // Premium e verificados são obrigatoriamente públicos
  const forcePublic = isPremium || isVerified;

  // Se privado, só mostra conteúdo se for o próprio ou já seguir
  let isFollowing = false;
  if (viewerId && !isMe) {
    const [f] = await db
      .select()
      .from(follows)
      .where(sql`follower_id = ${viewerId} AND following_id = ${targetId}`)
      .limit(1);
    isFollowing = !!f;
  }

  const canViewContent = isMe || forcePublic || !isPrivate || isFollowing;

  res.json({
    id: targetId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    isPrivate: isPrivate && !forcePublic,
    followersCount: Number(followersCount.count),
    followingCount: Number(followingCount.count),
    videosCount: Number(videosCount.count),
    subscribersCount: Number(subCount?.count ?? 0),
    isPremium,
    isVerified,
    canViewContent,
    isFollowing,
  });
});

usersRouter.patch("/me", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const { displayName, bio, avatarUrl, username, isPrivate, location } = req.body;
  const updateData: Record<string, string | number> = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (location !== undefined) updateData.location = location;
  if (isPrivate !== undefined) updateData.isPrivate = isPrivate ? 1 : 0;
  if (username !== undefined) {
    if (username.length < 3 || username.length > 50) {
      res.status(400).json({ error: "O username deve ter entre 3 e 50 caracteres." });
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(username)) {
      res.status(400).json({ error: "O username só pode ter letras minúsculas, números, _ e ." });
      return;
    }
    const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing && Number(existing.id) !== req.userId!) {
      res.status(409).json({ error: "Este username já está ocupado." });
      return;
    }
    updateData.username = username;
  }
  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, req.userId!));
  }
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  res.json({
    id: Number(user.id),
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    isPrivate: user.isPrivate === 1,
  });
});

// GET /:username/online — check if user is online
usersRouter.get("/:username/online", async (req, res) => {
  const db = getDb();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, req.params.username))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ online: onlineUsers.has(Number(user.id)) });
});

// POST /block/:userId — block a user
usersRouter.post("/block/:userId", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const blockerId = req.userId!;
  const blockedId = parseInt(req.params.userId as string);
  if (blockerId === blockedId) {
    res.status(400).json({ error: "Não podes bloquear-te a ti mesmo." });
    return;
  }
  try {
    await db.insert(blockedUsers).values({ blockerId, blockedId });
    res.json({ ok: true });
  } catch {
    res.status(409).json({ error: "Utilizador já bloqueado." });
  }
});

// DELETE /block/:userId — unblock a user
usersRouter.delete("/block/:userId", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const blockerId = req.userId!;
  const blockedId = parseInt(req.params.userId as string);
  await db.delete(blockedUsers).where(sql`blocker_id = ${blockerId} AND blocked_id = ${blockedId}`);
  res.json({ ok: true });
});

// GET /blocked — list blocked users
usersRouter.get("/blocked", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const blockerId = req.userId!;
  const rows = await db
    .select({
      id: blockedUsers.id,
      blockedId: blockedUsers.blockedId,
      createdAt: blockedUsers.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(blockedUsers)
    .innerJoin(users, eq(blockedUsers.blockedId, users.id))
    .where(eq(blockedUsers.blockerId, blockerId));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), blockedId: Number(r.blockedId) })));
});
