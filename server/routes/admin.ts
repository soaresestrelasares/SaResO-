import type { Response } from "express";
import { Router } from "express";
import { getDb } from "../db.js";
import { users, videos, reports, verifiedUsers, subscriptions } from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const adminRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "soaresestrelasares";

async function requireAdmin(req: AuthRequest, res: Response): Promise<boolean> {
  const db = getDb();
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, req.userId!))
    .limit(1);
  if (!user || user.username !== ADMIN_USERNAME) {
    res.status(403).json({ error: "Acesso negado." });
    return false;
  }
  return true;
}

// GET /stats — user count, video count, report count
adminRouter.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [videoCount] = await db.select({ count: sql<number>`count(*)` }).from(videos);
  const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports);
  const [pendingReports] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.resolved, 0));
  res.json({
    userCount: Number(userCount.count),
    videoCount: Number(videoCount.count),
    reportCount: Number(reportCount.count),
    pendingReports: Number(pendingReports.count),
  });
});

// GET /reports — list all reports
adminRouter.get("/reports", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const rows = await db
    .select({
      id: reports.id,
      reporterId: reports.reporterId,
      contentType: reports.contentType,
      contentId: reports.contentId,
      reason: reports.reason,
      resolved: reports.resolved,
      createdAt: reports.createdAt,
      reporterUsername: users.username,
      reporterDisplayName: users.displayName,
    })
    .from(reports)
    .innerJoin(users, eq(reports.reporterId, users.id))
    .orderBy(reports.createdAt);
  res.json(
    rows.map((r) => ({
      ...r,
      id: Number(r.id),
      reporterId: Number(r.reporterId),
      contentId: Number(r.contentId),
    })),
  );
});

// PATCH /reports/:id/resolve — mark report as resolved
adminRouter.patch("/reports/:id/resolve", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const id = parseInt(req.params.id as string);
  await db.update(reports).set({ resolved: 1 }).where(eq(reports.id, id));
  res.json({ ok: true });
});

// POST /verify/:userId — grant green verified badge
adminRouter.post("/verify/:userId", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const targetId = parseInt(req.params["userId"] as string);
  await db
    .insert(verifiedUsers)
    .values({ userId: targetId, verifiedBy: req.userId! })
    .onDuplicateKeyUpdate({ set: { verifiedAt: sql`NOW()` } });
  res.json({ ok: true });
});

// DELETE /verify/:userId — remove verified badge
adminRouter.delete("/verify/:userId", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const targetId = parseInt(req.params["userId"] as string);
  await db.delete(verifiedUsers).where(eq(verifiedUsers.userId, targetId));
  res.json({ ok: true });
});

// POST /premium/:userId — grant orange premium badge (30 days)
adminRouter.post("/premium/:userId", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const targetId = parseInt(req.params["userId"] as string);
  const days = parseInt(req.body.days as string) || 30;
  const expiresAt = new Date(Date.now() + days * 86400000);
  await db
    .insert(subscriptions)
    .values({ userId: targetId, expiresAt, active: 1 })
    .onDuplicateKeyUpdate({ set: { expiresAt, active: 1 } });
  res.json({ ok: true, expiresAt });
});

// DELETE /premium/:userId — remove premium badge
adminRouter.delete("/premium/:userId", authMiddleware, async (req: AuthRequest, res) => {
  if (!(await requireAdmin(req, res))) return;
  const db = getDb();
  const targetId = parseInt(req.params["userId"] as string);
  await db.update(subscriptions).set({ active: 0 }).where(eq(subscriptions.userId, targetId));
  res.json({ ok: true });
});
