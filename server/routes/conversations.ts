import { Router } from "express";
import { getDb } from "../db.js";
import { conversations, messages, users } from "../schema.js";
import { eq, desc, or, and, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { moderateContent } from "../middleware/moderation.js";

export const conversationsRouter = Router();

// Get my conversations
conversationsRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
    .orderBy(desc(conversations.lastMessageAt));

  const result = [];
  for (const conv of rows) {
    const otherId = Number(conv.user1Id) === userId ? Number(conv.user2Id) : Number(conv.user1Id);
    const [other] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, otherId))
      .limit(1);
    const [lastMsg] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    result.push({
      id: Number(conv.id),
      other,
      lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
      lastMessageAt: conv.lastMessageAt,
    });
  }
  res.json(result);
});

// Start or get conversation with user
conversationsRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const { targetUserId } = req.body;
  if (!targetUserId || targetUserId === userId) {
    res.status(400).json({ error: "Utilizador inválido" });
    return;
  }

  const u1 = Math.min(userId, targetUserId);
  const u2 = Math.max(userId, targetUserId);

  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.user1Id, u1), eq(conversations.user2Id, u2)))
    .limit(1);
  if (existing) {
    res.json({ id: Number(existing.id) });
    return;
  }

  const [result] = await db.insert(conversations).values({ user1Id: u1, user2Id: u2 });
  res.json({ id: Number(result.insertId) });
});

// Get messages in conversation
conversationsRouter.get("/:id/messages", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const convId = parseInt(req.params.id as string);
  const userId = req.userId!;
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
  if (!conv || (Number(conv.user1Id) !== userId && Number(conv.user2Id) !== userId)) {
    res.status(403).json({ error: "Sem acesso" });
    return;
  }
  const msgs = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      senderUsername: users.username,
      senderDisplayName: users.displayName,
      senderAvatarUrl: users.avatarUrl,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, convId))
    .orderBy(messages.createdAt);
  res.json(msgs.map((m) => ({ ...m, id: Number(m.id), senderId: Number(m.senderId) })));
});

// Send message (REST fallback)
conversationsRouter.post(
  "/:id/messages",
  authMiddleware,
  moderateContent,
  async (req: AuthRequest, res) => {
    const db = getDb();
    const convId = parseInt(req.params.id as string);
    const userId = req.userId!;
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "Mensagem vazia" });
      return;
    }
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convId))
      .limit(1);
    if (!conv || (Number(conv.user1Id) !== userId && Number(conv.user2Id) !== userId)) {
      res.status(403).json({ error: "Sem acesso" });
      return;
    }
    const [result] = await db
      .insert(messages)
      .values({ conversationId: convId, senderId: userId, content, type: "text" });
    await db
      .update(conversations)
      .set({ lastMessageAt: sql`NOW()` })
      .where(eq(conversations.id, convId));
    res.json({ id: Number(result.insertId), content, senderId: userId, createdAt: new Date() });
  },
);
