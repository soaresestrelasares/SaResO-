import { Router } from "express";
import { getDb } from "../db.js";
import { companies, jobs, users } from "../schema.js";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const companiesRouter = Router();

// Create company
companiesRouter.post("/", authMiddleware, moderateContent, async (req: AuthRequest, res) => {
  const db = getDb();
  const { name, logoUrl, description, website, industry, location } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nome da empresa obrigatório" });
    return;
  }
  const [result] = await db.insert(companies).values({
    ownerId: req.userId!,
    name,
    logoUrl: logoUrl || "",
    description: description || "",
    website: website || "",
    industry: industry || "",
    location: location || "",
  });
  res.json({ id: Number(result.insertId), name });
});

// Get my companies
companiesRouter.get("/mine", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = await db.select().from(companies).where(eq(companies.ownerId, req.userId!));
  res.json(rows.map((r) => ({ ...r, id: Number(r.id), ownerId: Number(r.ownerId) })));
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
    ...company,
    id: Number(company.id),
    ownerId: Number(company.ownerId),
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
