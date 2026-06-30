import { Router } from "express";
import { getDb } from "../db.js";
import { users, follows, videos } from "../schema.js";
import { eq, sql, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.get("/:username", async (req, res) => {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, req.params.username))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
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
  res.json({
    id: Number(user.id),
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    followersCount: Number(followersCount.count),
    followingCount: Number(followingCount.count),
    videosCount: Number(videosCount.count),
  });
});

usersRouter.patch("/me", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const { displayName, bio, avatarUrl } = req.body;
  await db.update(users).set({ displayName, bio, avatarUrl }).where(eq(users.id, req.userId!));
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  res.json({
    id: Number(user.id),
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  });
});
