import { Router } from "express";
import { getDb } from "../db.js";
import {
  stories,
  storyViews,
  users,
  follows,
  videos,
  likes,
  videoViews,
  hashtags,
} from "../schema.js";
import { eq, desc, sql, and, isNull, gte } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const discoverRouter = Router();

// GET /stories — stories ativos dos utilizadores que sigo
// GET /stories/user/:userId — stories de um utilizador específico
// POST /stories — criar story
// POST /stories/:id/view — marcar como visto
// GET /suggestions — perfis sugeridos para seguir
// GET /trending — conteúdo em tendência
// GET /hashtag/:tag — vídeos por hashtag

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3600000);
}

// Criar story
discoverRouter.post("/stories", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const { mediaUrl, mediaType } = req.body;
  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl obrigatório" });
    return;
  }
  const now = new Date();
  const [result] = await db.insert(stories).values({
    userId: req.userId!,
    mediaUrl,
    mediaType: mediaType === "video" ? "video" : "image",
    expiresAt: addHours(now, 24),
  });
  res.json({ id: Number(result.insertId) });
});

// Stories dos utilizadores que sigo + os meus
discoverRouter.get("/stories", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const now = new Date();
  const followed = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, req.userId!));
  const userIds = [req.userId!, ...followed.map((f) => Number(f.followingId))];
  if (userIds.length === 0) {
    res.json([]);
    return;
  }
  const rows = await db
    .select({
      id: stories.id,
      userId: stories.userId,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      createdAt: stories.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(stories)
    .innerJoin(users, eq(stories.userId, users.id))
    .where(
      and(sql`stories.user_id IN (${sql.raw(userIds.join(","))})`, gte(stories.expiresAt, now)),
    )
    .orderBy(desc(stories.createdAt));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// Stories de um utilizador específico
discoverRouter.get("/stories/user/:userId", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = parseInt(req.params.userId as string);
  const now = new Date();
  const rows = await db
    .select({
      id: stories.id,
      userId: stories.userId,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      createdAt: stories.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(stories)
    .innerJoin(users, eq(stories.userId, users.id))
    .where(and(eq(stories.userId, userId), gte(stories.expiresAt, now)))
    .orderBy(desc(stories.createdAt));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// Marcar story como visto
discoverRouter.post("/stories/:id/view", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const storyId = parseInt(req.params.id as string);
  await db
    .insert(storyViews)
    .values({ storyId, userId: req.userId! })
    .onDuplicateKeyUpdate({ set: {} });
  res.json({ ok: true });
});

// Sugestões de perfis para seguir (não seguidos, ordenados por popularidade aleatória)
discoverRouter.get("/suggestions", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const followed = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, req.userId!));
  const followedIds = followed.map((f) => Number(f.followingId));
  followedIds.push(req.userId!);

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(users)
    .where(sql`id NOT IN (${sql.raw(followedIds.length > 0 ? followedIds.join(",") : "0")})`)
    .orderBy(sql`RAND()`)
    .limit(10);
  res.json(rows.map((r) => ({ ...r, id: Number(r.id) })));
});

// Trending — vídeos mais vistos nas últimas 24h
discoverRouter.get("/trending", async (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 0;
  const limit = 10;
  const since = new Date(Date.now() - 24 * 3600000);
  const rows = await db
    .select({
      id: videos.id,
      userId: videos.userId,
      title: videos.title,
      description: videos.description,
      videoUrl: videos.videoUrl,
      thumbnailUrl: videos.thumbnailUrl,
      likesCount: videos.likesCount,
      commentsCount: videos.commentsCount,
      viewsCount: videos.viewsCount,
      createdAt: videos.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(videos)
    .innerJoin(users, eq(videos.userId, users.id))
    .where(gte(videos.createdAt, since))
    .orderBy(desc(videos.viewsCount), desc(videos.likesCount))
    .limit(limit)
    .offset(page * limit);
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// Vídeos por hashtag
discoverRouter.get("/hashtag/:tag", async (req, res) => {
  const db = getDb();
  const tag = req.params.tag as string;
  const page = parseInt(req.query.page as string) || 0;
  const limit = 10;
  const rows = await db
    .select({
      id: videos.id,
      userId: videos.userId,
      title: videos.title,
      description: videos.description,
      videoUrl: videos.videoUrl,
      thumbnailUrl: videos.thumbnailUrl,
      likesCount: videos.likesCount,
      commentsCount: videos.commentsCount,
      viewsCount: videos.viewsCount,
      createdAt: videos.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(hashtags)
    .innerJoin(videos, eq(hashtags.videoId, videos.id))
    .innerJoin(users, eq(videos.userId, users.id))
    .where(eq(hashtags.tag, tag.toLowerCase()))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(page * limit);
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});

// Pesquisa de hashtags populares
discoverRouter.get("/hashtags/search", async (req, res) => {
  const db = getDb();
  const q = ((req.query.q as string) || "").toLowerCase();
  if (!q) {
    res.json([]);
    return;
  }
  const rows = await db
    .select({
      tag: hashtags.tag,
      count: sql`COUNT(DISTINCT video_id)`.as("count"),
    })
    .from(hashtags)
    .where(sql`tag LIKE ${"%" + q + "%"}`)
    .groupBy(hashtags.tag)
    .orderBy(desc(sql`count`))
    .limit(10);
  res.json(rows);
});

// Feed Following — vídeos só de quem sigo
discoverRouter.get("/feed/following", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 0;
  const limit = 10;
  const followed = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, req.userId!));
  const userIds = followed.map((f) => Number(f.followingId));
  if (userIds.length === 0) {
    res.json([]);
    return;
  }
  const rows = await db
    .select({
      id: videos.id,
      userId: videos.userId,
      title: videos.title,
      description: videos.description,
      videoUrl: videos.videoUrl,
      thumbnailUrl: videos.thumbnailUrl,
      likesCount: videos.likesCount,
      commentsCount: videos.commentsCount,
      viewsCount: videos.viewsCount,
      createdAt: videos.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(videos)
    .innerJoin(users, eq(videos.userId, users.id))
    .where(sql`videos.user_id IN (${sql.raw(userIds.join(","))})`)
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(page * limit);
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), userId: Number(r.userId) })));
});
