import { Router } from "express";
import { getDb } from "../db.js";
import { jobs, companies, jobApplications, users, notifications } from "../schema.js";
import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { authMiddleware, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const jobsRouter = Router();

// List/search jobs
jobsRouter.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const { keyword, location, type, page = "0" } = req.query as Record<string, string>;
  const offset = parseInt(page) * 20;

  let rows = await db
    .select({
      id: jobs.id,
      companyId: jobs.companyId,
      title: jobs.title,
      description: jobs.description,
      location: jobs.location,
      type: jobs.type,
      salary: jobs.salary,
      requirements: jobs.requirements,
      applicationsCount: jobs.applicationsCount,
      createdAt: jobs.createdAt,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
      companyLocation: companies.location,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.active, 1))
    .orderBy(desc(jobs.createdAt))
    .limit(20)
    .offset(offset);

  // Simple in-memory filter for keyword/location/type
  if (keyword)
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(keyword.toLowerCase()) ||
        r.description.toLowerCase().includes(keyword.toLowerCase()),
    );
  if (location)
    rows = rows.filter((r) => (r.location || "").toLowerCase().includes(location.toLowerCase()));
  if (type) rows = rows.filter((r) => r.type === type);

  res.json(rows.map((r) => ({ ...r, id: Number(r.id), companyId: Number(r.companyId) })));
});

// Get single job
jobsRouter.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [row] = await db
    .select({
      id: jobs.id,
      companyId: jobs.companyId,
      title: jobs.title,
      description: jobs.description,
      location: jobs.location,
      type: jobs.type,
      salary: jobs.salary,
      requirements: jobs.requirements,
      applicationsCount: jobs.applicationsCount,
      createdAt: jobs.createdAt,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
      companyLocation: companies.location,
      companyWebsite: companies.website,
      companyIndustry: companies.industry,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Vaga não encontrada" });
    return;
  }

  let applied = false;
  if (req.userId) {
    const [app] = await db
      .select()
      .from(jobApplications)
      .where(and(eq(jobApplications.jobId, id), eq(jobApplications.userId, req.userId)))
      .limit(1);
    applied = !!app;
  }
  res.json({ ...row, id: Number(row.id), companyId: Number(row.companyId), applied });
});

// Create job
jobsRouter.post("/", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const { companyId, title, description, location, type, salary, requirements } = req.body;
  if (!companyId || !title || !description) {
    res.status(400).json({ error: "companyId, title e description obrigatórios" });
    return;
  }
  // Verify ownership
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company || Number(company.ownerId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  const [result] = await db.insert(jobs).values({
    companyId,
    title,
    description,
    location: location || "",
    type: type || "full-time",
    salary: salary || "",
    requirements: requirements || "",
  });
  res.json({ id: Number(result.insertId), title });
});

// Apply to job
jobsRouter.post("/:id/apply", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const jobId = parseInt(req.params.id as string);
  const { coverLetter } = req.body;
  const existing = await db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.jobId, jobId), eq(jobApplications.userId, req.userId!)))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Já se candidatou a esta vaga" });
    return;
  }
  await db
    .insert(jobApplications)
    .values({ jobId, userId: req.userId!, coverLetter: coverLetter || "", status: "pending" });
  await db
    .update(jobs)
    .set({ applicationsCount: sql`${jobs.applicationsCount} + 1` })
    .where(eq(jobs.id, jobId));
  // Trigger job_application notification to company owner
  try {
    const [job] = await db
      .select({ companyId: jobs.companyId })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    if (job) {
      const [company] = await db
        .select({ ownerId: companies.ownerId })
        .from(companies)
        .where(eq(companies.id, job.companyId))
        .limit(1);
      if (company && Number(company.ownerId) !== req.userId!) {
        await db.insert(notifications).values({
          userId: Number(company.ownerId),
          actorId: req.userId!,
          type: "job_application",
          entityId: jobId,
        });
      }
    }
  } catch {
    // no-op
  }
  res.json({ ok: true });
});

// Get applications for a job (company owner only)
jobsRouter.get("/:id/applications", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const jobId = parseInt(req.params.id as string);
  const [job] = await db
    .select({ companyId: jobs.companyId })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!job) {
    res.status(404).json({ error: "Vaga não encontrada" });
    return;
  }
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, job.companyId))
    .limit(1);
  if (!company || Number(company.ownerId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  const apps = await db
    .select({
      id: jobApplications.id,
      userId: jobApplications.userId,
      coverLetter: jobApplications.coverLetter,
      status: jobApplications.status,
      createdAt: jobApplications.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.userId, users.id))
    .where(eq(jobApplications.jobId, jobId))
    .orderBy(desc(jobApplications.createdAt));
  res.json(apps.map((a) => ({ ...a, id: Number(a.id), userId: Number(a.userId) })));
});

// Update application status
jobsRouter.patch("/applications/:appId", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const appId = parseInt(req.params.appId as string);
  const { status } = req.body;
  if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status inválido" });
    return;
  }
  await db.update(jobApplications).set({ status }).where(eq(jobApplications.id, appId));
  res.json({ ok: true });
});
