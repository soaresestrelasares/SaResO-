import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";
import { messages, conversations } from "./schema.js";
import { eq, sql } from "drizzle-orm";
import { Filter } from "bad-words";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_key_change_in_prod";
const filter = new Filter();

const extraWords = [
  "idiota",
  "burro",
  "estupido",
  "cretino",
  "imbecil",
  "palhaço",
  "lixo",
  "merda",
  "porra",
  "caralho",
  "cona",
  "puta",
  "puto",
  "vadia",
  "retardado",
];
extraWords.forEach((w) => {
  try {
    filter.addWords(w);
  } catch {
    // no-op
  }
});

export function initSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || (socket.handshake.query.token as string);
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      (socket as unknown as { userId: number }).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // Map userId -> socketId for call signaling
  const onlineUsers = new Map<number, string>();

  io.on("connection", (socket) => {
    const userId = (socket as unknown as { userId: number }).userId;
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // ── Chat ──────────────────────────────────────────────
    socket.on(
      "chat:send",
      async ({ conversationId, content }: { conversationId: number; content: string }) => {
        if (!content || !conversationId) return;
        if (filter.isProfane(content)) {
          socket.emit("chat:error", { error: "Mensagem bloqueada: contém linguagem ofensiva." });
          return;
        }
        try {
          const db = getDb();
          const [result] = await db.insert(messages).values({
            conversationId,
            senderId: userId,
            content,
            type: "text",
          });
          await db
            .update(conversations)
            .set({ lastMessageAt: sql`NOW()` })
            .where(eq(conversations.id, conversationId));

          const msg = {
            id: Number(result.insertId),
            conversationId,
            senderId: userId,
            content,
            type: "text",
            createdAt: new Date().toISOString(),
          };
          // Broadcast to all members of the conversation room
          io.to(`conv:${conversationId}`).emit("chat:receive", msg);
        } catch (err) {
          socket.emit("chat:error", { error: "Erro ao enviar mensagem" });
        }
      },
    );

    socket.on("chat:join", (conversationId: number) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("chat:leave", (conversationId: number) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── WebRTC Call Signaling ─────────────────────────────
    socket.on(
      "call:offer",
      ({
        targetUserId,
        offer,
        callType,
      }: {
        targetUserId: number;
        offer: unknown;
        callType: "video" | "audio";
      }) => {
        const targetSocket = onlineUsers.get(targetUserId);
        if (!targetSocket) {
          socket.emit("call:error", { error: "Utilizador não está online" });
          return;
        }
        io.to(targetSocket).emit("call:incoming", { callerId: userId, offer, callType });
      },
    );

    socket.on("call:answer", ({ callerId, answer }: { callerId: number; answer: unknown }) => {
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) io.to(callerSocket).emit("call:answered", { answer });
    });

    socket.on(
      "call:ice-candidate",
      ({ targetUserId, candidate }: { targetUserId: number; candidate: unknown }) => {
        const targetSocket = onlineUsers.get(targetUserId);
        if (targetSocket)
          io.to(targetSocket).emit("call:ice-candidate", { candidate, fromUserId: userId });
      },
    );

    socket.on("call:reject", ({ callerId }: { callerId: number }) => {
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) io.to(callerSocket).emit("call:rejected", { userId });
    });

    socket.on("call:end", ({ targetUserId }: { targetUserId: number }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) io.to(targetSocket).emit("call:ended", { userId });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
    });
  });

  return io;
}
