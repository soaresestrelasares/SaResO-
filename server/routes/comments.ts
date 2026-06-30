import { Router } from "express";
import { getDb } from "../db.js";
import { comments, users, videos, notifications } from "../schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const commentsRouter = Router();

commentsRouter.get("/:videoId", async (req, res) => {
  const db = getDb();
  const videoId = parseInt(req.params.videoId as string);
  const rows = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      videoId: comments.videoId,
      content: comments.content,
      createdAt: comments.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.createdAt));
  res.json(
    rows.map((r) => ({
      ...r,
      id: Number(r.id),
      userId: Number(r.userId),
      videoId: Number(r.videoId),
    })),
  );
});

commentsRouter.post("/:videoId", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const videoId = parseInt(req.params.videoId as string);
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: "content required" });
    return;
  }
  const [result] = await db.insert(comments).values({ userId: req.userId!, videoId, content });
  await db
    .update(videos)
    .set({ commentsCount: sql`${videos.commentsCount} + 1` })
    .where(eq(videos.id, videoId));
  // Trigger comment notification to video owner
  try {
    const [video] = await db
      .select({ userId: videos.userId })
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);
    if (video && Number(video.userId) !== req.userId!) {
      await db.insert(notifications).values({
        userId: Number(video.userId),
        actorId: req.userId!,
        type: "comment",
        entityId: videoId,
      });
    }
  } catch {
    // no-op
  }
  res.json({ id: Number(result.insertId), userId: req.userId!, videoId, content });
});
