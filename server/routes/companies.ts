import { Router } from "express";
import { getDb } from "../db.js";
import { companies, jobs, users } from "../schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const companiesRouter = Router();

const TRIAL_DAYS = 90;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}

function normalizeCompany(row: typeof companies.$inferSelect) {
  return {
    ...row,
    id: Number(row.id),
    ownerId: Number(row.ownerId),
    trialEndsAt: row.trialEndsAt,
    subscriptionEndsAt: row.subscriptionEndsAt,
    subscriptionStatus: row.subscriptionStatus,
    subscriptionPlan: row.subscriptionPlan,
    stripeSubscriptionId: row.stripeSubscriptionId,
  };
}

function companyIsActive(row: typeof companies.$inferSelect) {
  const now = new Date();
  if (row.subscriptionStatus === "active") {
    return row.subscriptionEndsAt ? new Date(row.subscriptionEndsAt) > now : true;
  }
  if (row.subscriptionStatus === "trial") {
    return new Date(row.trialEndsAt) > now;
  }
  return false;
}

// Create company
companiesRouter.post("/", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const { name, logoUrl, description, website, industry, location } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nome da empresa obrigatório" });
    return;
  }
  const now = new Date();
  const [result] = await db.insert(companies).values({
    ownerId: req.userId!,
    name,
    logoUrl: logoUrl || "",
    description: description || "",
    website: website || "",
    industry: industry || "",
    location: location || "",
    subscriptionStatus: "trial",
    trialEndsAt: addDays(now, TRIAL_DAYS),
  });
  res.json({ id: Number(result.insertId), name, status: "trial", trialDays: TRIAL_DAYS });
});

// Get my companies
companiesRouter.get("/mine", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = await db.select().from(companies).where(eq(companies.ownerId, req.userId!));
  res.json(rows.map((r) => ({ ...normalizeCompany(r), isActive: companyIsActive(r) })));
});

// Get company by id
companiesRouter.get("/:id", async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  if (!company) {
    res.status(404).json({ error: "Empresa não encontrada" });
    return;
  }
  const companyJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.companyId, id))
    .orderBy(desc(jobs.createdAt));
  res.json({
    ...normalizeCompany(company),
    isActive: companyIsActive(company),
    jobs: companyJobs.map((j) => ({ ...j, id: Number(j.id), companyId: Number(j.companyId) })),
  });
});

// Update company
companiesRouter.patch("/:id", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const id = parseInt(req.params.id as string);
  const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  if (!company || Number(company.ownerId) !== req.userId!) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  const { name, logoUrl, description, website, industry, location } = req.body;
  await db
    .update(companies)
    .set({ name, logoUrl, description, website, industry, location })
    .where(eq(companies.id, id));
  res.json({ ok: true });
});

// Public helper: check if company can post jobs
export async function canCompanyPostJob(companyId: number): Promise<boolean> {
  const db = getDb();
  const [row] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  return row ? companyIsActive(row) : false;
}
