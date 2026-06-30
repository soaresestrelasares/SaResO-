import { Router } from "express";
import { getDb } from "../db.js";
import { reports } from "../schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const { contentType, contentId, reason } = req.body;
  if (!contentType || !contentId || !reason) {
    res.status(400).json({ error: "Campos obrigatórios em falta" });
    return;
  }
  await db.insert(reports).values({ reporterId: req.userId!, contentType, contentId, reason });
  res.json({
    ok: true,
    message: "Denúncia enviada. Obrigado por ajudar a manter a plataforma segura.",
  });
});
