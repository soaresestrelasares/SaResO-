import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_key_change_in_prod";

export interface AuthRequest extends Request {
  userId?: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      req.userId = payload.userId;
    } catch {
      // no-op
    }
  }
  next();
}

export function optionalAuthQuery(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization?.replace("Bearer ", "");
  const query = req.query.token as string | undefined;
  const token = header || query;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      req.userId = payload.userId;
    } catch {
      // no-op
    }
  }
  next();
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
