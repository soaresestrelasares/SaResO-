import { Router } from "express";
import { getDb } from "../db.js";
import {
  videos,
  users,
  likes,
  notifications,
  savedVideos,
  subscriptions,
  verifiedUsers,
} from "../schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const videosRouter = Router();

function videoSelectFields() {
  return {
    id: videos.id,
    userId: videos.userId,
    title: videos.title,
    description: videos.description,
    videoUrl: videos.videoUrl,
    thumbnailUrl: videos.thumbnailUrl,
    location: videos.location,
    musicUrl: videos.musicUrl,
    musicTitle: videos.musicTitle,
    likesCount: videos.likesCount,
    commentsCount: videos.commentsCount,
    viewsCount: videos.viewsCount,
    createdAt: videos.createdAt,
    username: users.username,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
  };
}

// Get feed (all videos sorted by newest)
videosRouter.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 0;
  const limit = 10;
  const rows = await db
    .select(videoSelectFields())
    .from(videos)
    .innerJoin(users, eq(videos.userId, users.id))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(page * limit);

  let liked: Set<number> = new Set();
  if (req.userId) {
    const userLikes = await db
      .select({ videoId: likes.videoId })
      .from(likes)
      .where(eq(likes.userId, req.userId));
    liked = new Set(userLikes.map((l) => Number(l.videoId)));
  }

  let saved: Set<number> = new Set();
  if (req.userId) {
    const userSaved = await db
      .select({ videoId: savedVideos.videoId })
      .from(savedVideos)
      .where(eq(savedVideos.userId, req.userId));
    saved = new Set(userSaved.map((s) => Number(s.videoId)));
  }

  // Batch badge info for all unique user IDs
  const userIds = [...new Set(rows.map((r) => Number(r.userId)))];
  const now = new Date();
  const premiumSet = new Set<number>();
  const verifiedSet = new Set<number>();
  if (userIds.length > 0) {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(sql`user_id IN (${sql.raw(userIds.join(","))})`);
    subs.forEach((s) => {
      if (s.active && new Date(s.expiresAt) > now) premiumSet.add(Number(s.userId));
    });
    const vfs = await db
      .select()
      .from(verifiedUsers)
      .where(sql`user_id IN (${sql.raw(userIds.join(","))})`);
    vfs.forEach((v) => verifiedSet.add(Number(v.userId)));
  }

  const result = rows.map((r) => ({
    ...r,
    id: Number(r.id),
    userId: Number(r.userId),
    liked: liked.has(Number(r.id)),
    saved: saved.has(Number(r.id)),
    isPremium: premiumSet.has(Number(r.userId)),
    isVerified: verifiedSet.has(Number(r.userId)),
  }));
  res.json(result);
});

// Create video
videosRouter.post("/", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const { title, description, videoUrl, thumbnailUrl, location, musicUrl, musicTitle } = req.body;
  if (!title || !videoUrl) {
    res.status(400).json({ error: "title and videoUrl required" });
    return;
  }
  const [result] = await db.insert(videos).values({
    userId: req.userId!,
    title,
    description: description || "",
    videoUrl,
    thumbnailUrl: thumbnailUrl || "",
    location: location || "",
    musicUrl: musicUrl || "",
    musicTitle: musicTitle || "",
  });
  res.json({ id: Number(result.insertId), title, videoUrl });
});

// Get saved videos for current user — must be before /:id
videosRouter.get("/saved", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const rows = await db
    .select(videoSelectFields())
    .from(savedVideos)
    .innerJoin(videos, eq(savedVideos.videoId, videos.id))
    .innerJoin(users, eq(videos.userId, users.id))
    .where(eq(savedVideos.userId, userId))
    .orderBy(desc(savedVideos.createdAt));

  const userLikes = await db
    .select({ videoId: likes.videoId })
    .from(likes)
    .where(eq(likes.userId, userId));
  const likedSet = new Set(userLikes.map((l) => Number(l.videoId)));

  res.json(
    rows.map((r) => ({
      ...r,
      id: Number(r.id),
      userId: Number(r.userId),
      liked: likedSet.has(Number(r.id)),
      saved: true,
    })),
  );
});

// Get single video
videosRouter.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [row] = await db
    .select(videoSelectFields())
    .from(videos)
    .innerJoin(users, eq(videos.userId, users.id))
    .where(eq(videos.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  let liked = false;
  if (req.userId) {
    const [l] = await db.select().from(likes).where(eq(likes.userId, req.userId)).limit(1);
    liked = !!l;
  }
  let savedFlag = false;
  if (req.userId) {
    const savedRows = await db
      .select()
      .from(savedVideos)
      .where(sql`user_id = ${req.userId} AND video_id = ${id}`)
      .limit(1);
    savedFlag = savedRows.length > 0;
  }
  // increment views
  await db
    .update(videos)
    .set({ viewsCount: sql`${videos.viewsCount} + 1` })
    .where(eq(videos.id, id));
  res.json({ ...row, id: Number(row.id), userId: Number(row.userId), liked, saved: savedFlag });
});

// Get videos by user
videosRouter.get("/user/:userId", optionalAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = parseInt(req.params.userId as string);
  const rows = await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// Like / unlike
videosRouter.post("/:id/like", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const videoId = parseInt(req.params.id as string);
  const userId = req.userId!;
  const existing = await db.select().from(likes).where(eq(likes.userId, userId)).limit(1);
  // Check if like for this specific video exists
  const rows = await db
    .select()
    .from(likes)
    .where(sql`user_id = ${userId} AND video_id = ${videoId}`)
    .limit(1);
  if (rows.length > 0) {
    await db.delete(likes).where(sql`user_id = ${userId} AND video_id = ${videoId}`);
    await db
      .update(videos)
      .set({ likesCount: sql`GREATEST(0, ${videos.likesCount} - 1)` })
      .where(eq(videos.id, videoId));
    res.json({ liked: false });
  } else {
    await db.insert(likes).values({ userId, videoId });
    await db
      .update(videos)
      .set({ likesCount: sql`${videos.likesCount} + 1` })
      .where(eq(videos.id, videoId));
    // Trigger like notification to video owner
    try {
      const [video] = await db
        .select({ userId: videos.userId })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);
      if (video && Number(video.userId) !== userId) {
        await db.insert(notifications).values({
          userId: Number(video.userId),
          actorId: userId,
          type: "like",
          entityId: videoId,
        });
      }
    } catch {
      // no-op
    }
    res.json({ liked: true });
  }
});

// Save / unsave
videosRouter.post("/:id/save", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const videoId = parseInt(req.params.id as string);
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(savedVideos)
    .where(sql`user_id = ${userId} AND video_id = ${videoId}`)
    .limit(1);
  if (rows.length > 0) {
    await db.delete(savedVideos).where(sql`user_id = ${userId} AND video_id = ${videoId}`);
    res.json({ saved: false });
  } else {
    await db.insert(savedVideos).values({ userId, videoId });
    res.json({ saved: true });
  }
});
