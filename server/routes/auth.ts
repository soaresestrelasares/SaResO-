import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../db.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
import { authMiddleware, signToken, AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const db = getDb();
  const { username, displayName, email, password } = req.body;
  if (!username || !email || !password || !displayName) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const existingUsername = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existingUsername.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await db.insert(users).values({ username, displayName, email, passwordHash });
  const token = signToken(Number(result.insertId));
  res.json({
    token,
    user: { id: Number(result.insertId), username, displayName, email, bio: "", avatarUrl: "" },
  });
});

authRouter.post("/login", async (req, res) => {
  const db = getDb();
  const { email, password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
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
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    },
  });
});

authRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: Number(user.id),
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  });
});
