import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "../db.js";
import { users, passwordResetTokens } from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, signToken, AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const db = getDb();
    const { username, displayName, email, password } = req.body as Record<string, string>;

    if (!username || !email || !password || !displayName) {
      res.status(400).json({ error: "Preenche todos os campos." });
      return;
    }
    if (username.length < 3 || username.length > 50) {
      res.status(400).json({ error: "O username deve ter entre 3 e 50 caracteres." });
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(username)) {
      res.status(400).json({ error: "O username só pode ter letras minúsculas, números, _ e ." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "A password deve ter pelo menos 6 caracteres." });
      return;
    }

    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      res.status(409).json({ error: "Este email já está registado. Faz login." });
      return;
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUsername.length > 0) {
      res.status(409).json({ error: "Este username já está ocupado. Escolhe outro." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.insert(users).values({ username, displayName, email, passwordHash });
    const token = signToken(Number(result.insertId));

    res.json({
      token,
      user: { id: Number(result.insertId), username, displayName, email, bio: "", avatarUrl: "" },
    });
  } catch {
    res.status(500).json({ error: "Erro ao criar conta. Tenta novamente." });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body as Record<string, string>;

    if (!email || !password) {
      res.status(400).json({ error: "Preenche o email e a password." });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Email ou password incorretos." });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Email ou password incorretos." });
      return;
    }
    const token = signToken(Number(user.id));
    res.json({
      token,
      user: {
        id: Number(user.id),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl ?? "",
      },
    });
  } catch {
    res.status(500).json({ error: "Erro ao fazer login. Tenta novamente." });
  }
});

authRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    res.json({
      id: Number(user.id),
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
    });
  } catch {
    res.status(500).json({ error: "Erro ao carregar perfil." });
  }
});

// POST /forgot-password — generate a 6-digit code and return it directly
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const db = getDb();
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ error: "Email obrigatório." });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      // Don't reveal if email exists
      res.json({ message: "Se o email existir, receberás um código de recuperação." });
      return;
    }
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate old tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(sql`user_id = ${Number(user.id)} AND used = 0`);

    await db.insert(passwordResetTokens).values({
      userId: Number(user.id),
      token: tokenHash,
      used: 0,
      expiresAt,
    });

    // Return code directly (no email setup yet)
    res.json({
      message: "Código de recuperação gerado.",
      code, // shown in app until email is configured
    });
  } catch {
    res.status(500).json({ error: "Erro ao gerar código. Tenta novamente." });
  }
});

// POST /reset-password — verify code and reset password
authRouter.post("/reset-password", async (req, res) => {
  try {
    const db = getDb();
    const { email, code, newPassword } = req.body as {
      email: string;
      code: string;
      newPassword: string;
    };
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: "Email, código e nova password obrigatórios." });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "A nova password deve ter pelo menos 6 caracteres." });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      res.status(400).json({ error: "Código inválido ou expirado." });
      return;
    }
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");
    const [tokenRow] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        sql`user_id = ${Number(user.id)} AND token = ${tokenHash} AND used = 0 AND expires_at > NOW()`,
      )
      .limit(1);
    if (!tokenRow) {
      res.status(400).json({ error: "Código inválido ou expirado." });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    await db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.id, tokenRow.id));
    res.json({ message: "Password alterada com sucesso." });
  } catch {
    res.status(500).json({ error: "Erro ao redefinir password. Tenta novamente." });
  }
});
