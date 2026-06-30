import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { serverConfig } from "./config.js";
import { errorHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { videosRouter } from "./routes/videos.js";
import { commentsRouter } from "./routes/comments.js";
import { followsRouter } from "./routes/follows.js";
import { usersRouter } from "./routes/users.js";
import { seedRouter } from "./routes/seed.js";
import { companiesRouter } from "./routes/companies.js";
import { jobsRouter } from "./routes/jobs.js";
import { conversationsRouter } from "./routes/conversations.js";
import { reportsRouter } from "./routes/reports.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { error: "Demasiadas tentativas. Tenta novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120,
  message: { error: "Demasiados pedidos. Tenta novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Cabeçalhos de segurança HTTP
  app.use(
    helmet({
      contentSecurityPolicy: serverConfig.isProduction
        ? undefined
        : false, // desativar em dev para Vite HMR funcionar
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(express.json({ limit: "2mb" }));

  // Rate limiting
  app.use("/api/auth", authLimiter);
  app.use("/api", apiLimiter);

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/videos", videosRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/follows", followsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/seed", seedRouter);
  app.use("/api/companies", companiesRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "API route not found." });
  });

  if (serverConfig.isProduction) {
    app.use(express.static(serverConfig.clientDistDir));
    app.get(/.*/, (_request, response) => {
      response.sendFile(serverConfig.indexHtmlPath);
    });
  } else {
    app.use((_request, response) => {
      response
        .status(404)
        .json({ error: "The API server is running. Open the Vite preview URL for the app." });
    });
  }

  app.use(errorHandler);
  return app;
}
