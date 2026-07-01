import { Router } from "express";
import { getDb } from "../db.js";
import { resumes, users } from "../schema.js";
import { eq, sql, and, or } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const resumesRouter = Router();

// GET /resumes/me — obter o meu currículo
resumesRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const [row] = await db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      summary: resumes.summary,
      skills: resumes.skills,
      experience: resumes.experience,
      education: resumes.education,
      desiredRole: resumes.desiredRole,
      desiredLocation: resumes.desiredLocation,
      remote: resumes.remote,
      cvUrl: resumes.cvUrl,
      isPublic: resumes.isPublic,
      updatedAt: resumes.updatedAt,
      createdAt: resumes.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      location: users.location,
    })
    .from(resumes)
    .innerJoin(users, eq(resumes.userId, users.id))
    .where(eq(resumes.userId, req.userId!))
    .limit(1);
  if (!row) {
    res.json({
      id: 0,
      userId: req.userId!,
      summary: "",
      skills: "",
      experience: "",
      education: "",
      desiredRole: "",
      desiredLocation: "",
      remote: 0,
      cvUrl: "",
      isPublic: 1,
    });
    return;
  }
  res.json(parseResume(row));
});

// PUT /resumes/me — criar/atualizar currículo
resumesRouter.put("/me", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const {
    summary,
    skills,
    experience,
    education,
    desiredRole,
    desiredLocation,
    remote,
    cvUrl,
    isPublic,
  } = req.body;
  const values: Record<string, string | number | undefined> = {
    summary: summary ?? "",
    skills: Array.isArray(skills) ? skills.join(", ") : (skills ?? ""),
    experience: typeof experience === "string" ? experience : JSON.stringify(experience || []),
    education: typeof education === "string" ? education : JSON.stringify(education || []),
    desiredRole: desiredRole ?? "",
    desiredLocation: desiredLocation ?? "",
    remote: remote ? 1 : 0,
    cvUrl: cvUrl ?? "",
    isPublic: isPublic !== false ? 1 : 0,
    updatedAt: new Date().toISOString(),
  };

  const [existing] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, req.userId!))
    .limit(1);
  if (existing) {
    await db.update(resumes).set(values).where(eq(resumes.userId, req.userId!));
  } else {
    await db.insert(resumes).values({ userId: req.userId!, ...values });
  }

  const [row] = await db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      summary: resumes.summary,
      skills: resumes.skills,
      experience: resumes.experience,
      education: resumes.education,
      desiredRole: resumes.desiredRole,
      desiredLocation: resumes.desiredLocation,
      remote: resumes.remote,
      cvUrl: resumes.cvUrl,
      isPublic: resumes.isPublic,
      updatedAt: resumes.updatedAt,
      createdAt: resumes.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      location: users.location,
    })
    .from(resumes)
    .innerJoin(users, eq(resumes.userId, users.id))
    .where(eq(resumes.userId, req.userId!))
    .limit(1);
  res.json(parseResume(row));
});

// GET /resumes — pesquisa pública de currículos (para empresas)
resumesRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const q = ((req.query.q as string) || "").toLowerCase();
  const location = ((req.query.location as string) || "").toLowerCase();
  const remote = req.query.remote === "true";
  const page = parseInt(req.query.page as string) || 0;
  const limit = 10;

  let whereClause: ReturnType<typeof and> | ReturnType<typeof or> | ReturnType<typeof eq> = eq(
    resumes.isPublic,
    1,
  );
  const conditions = [eq(resumes.isPublic, 1)];
  if (q) {
    conditions.push(
      or(
        sql`LOWER(${resumes.skills}) LIKE ${"%" + q + "%"}`,
        sql`LOWER(${resumes.desiredRole}) LIKE ${"%" + q + "%"}`,
        sql`LOWER(${resumes.summary}) LIKE ${"%" + q + "%"}`,
        sql`LOWER(${users.displayName}) LIKE ${"%" + q + "%"}`,
      )!,
    );
  }
  if (location) {
    conditions.push(
      or(
        sql`LOWER(${resumes.desiredLocation}) LIKE ${"%" + location + "%"}`,
        sql`LOWER(${users.location}) LIKE ${"%" + location + "%"}`,
      )!,
    );
  }
  if (remote) {
    conditions.push(eq(resumes.remote, 1));
  }
  if (conditions.length > 1) {
    whereClause = and(...conditions);
  }

  const rows = await db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      summary: resumes.summary,
      skills: resumes.skills,
      experience: resumes.experience,
      education: resumes.education,
      desiredRole: resumes.desiredRole,
      desiredLocation: resumes.desiredLocation,
      remote: resumes.remote,
      cvUrl: resumes.cvUrl,
      isPublic: resumes.isPublic,
      updatedAt: resumes.updatedAt,
      createdAt: resumes.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      location: users.location,
    })
    .from(resumes)
    .innerJoin(users, eq(resumes.userId, users.id))
    .where(whereClause)
    .orderBy(sql`resumes.updated_at DESC`)
    .limit(limit)
    .offset(page * limit);

  res.json(rows.map(parseResume));
});

function parseResume(row: Record<string, unknown>) {
  let experience: unknown[] = [];
  let education: unknown[] = [];
  try {
    experience = JSON.parse((row.experience as string) || "[]");
  } catch {
    experience = [];
  }
  try {
    education = JSON.parse((row.education as string) || "[]");
  } catch {
    education = [];
  }
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    summary: row.summary as string,
    skills: String(row.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    experience,
    education,
    desiredRole: row.desiredRole as string,
    desiredLocation: row.desiredLocation as string,
    remote: row.remote === 1,
    cvUrl: row.cvUrl as string,
    isPublic: row.isPublic === 1,
    updatedAt: row.updatedAt as string,
    createdAt: row.createdAt as string,
    username: row.username as string,
    displayName: row.displayName as string,
    avatarUrl: row.avatarUrl as string | null,
    location: row.location as string | null,
  };
}
