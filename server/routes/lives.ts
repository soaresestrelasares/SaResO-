import { Router } from "express";
import { getDb } from "../db.js";
import { lives, users } from "../schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const livesRouter = Router();

// POST / — start a live
livesRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
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
livesRouter.get("/:id", async (req, res) => {
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
  res.json({ ...row, id: Number(row.id), userId: Number(row.userId) });
});
