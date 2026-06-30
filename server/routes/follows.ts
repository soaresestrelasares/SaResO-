import { Router } from "express";
import { getDb } from "../db.js";
import { follows, users, notifications } from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const followsRouter = Router();

followsRouter.post("/:userId", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const followingId = parseInt(req.params.userId as string);
  const followerId = req.userId!;
  if (followerId === followingId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }
  const rows = await db
    .select()
    .from(follows)
    .where(sql`follower_id = ${followerId} AND following_id = ${followingId}`)
    .limit(1);
  if (rows.length > 0) {
    await db
      .delete(follows)
      .where(sql`follower_id = ${followerId} AND following_id = ${followingId}`);
    res.json({ following: false });
  } else {
    await db.insert(follows).values({ followerId, followingId });
    // Trigger follow notification
    try {
      await db.insert(notifications).values({
        userId: followingId,
        actorId: followerId,
        type: "follow",
      });
    } catch {
      // no-op — notification failure should not break the follow
    }
    res.json({ following: true });
  }
});

followsRouter.get("/:userId/status", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const followingId = parseInt(req.params.userId as string);
  const followerId = req.userId!;
  const rows = await db
    .select()
    .from(follows)
    .where(sql`follower_id = ${followerId} AND following_id = ${followingId}`)
    .limit(1);
  res.json({ following: rows.length > 0 });
});
