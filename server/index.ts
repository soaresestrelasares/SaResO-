import http from "http";
import { createApp } from "./app.js";
import { serverConfig } from "./config.js";
import { initSocket } from "./socket.js";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb, getPool } from "./db.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  try {
    const db = getDb();
    await migrate(db, { migrationsFolder: path.join(serverDir, "../../drizzle") });
    console.log("[sareso] Database migrations applied.");
  } catch (err) {
    console.warn("[sareso] Migration warning (may already be applied):", err instanceof Error ? err.message : err);
  }
}

await runMigrations();

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(serverConfig.port, serverConfig.host);

server.once("listening", () => {
  console.log(`[${serverConfig.serviceName}] API ready on :${serverConfig.port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `[${serverConfig.serviceName}] API port ${serverConfig.port} is already in use. ` +
        "Run `pnpm dev` to automatically select a free development port.",
    );
  } else {
    console.error(`[${serverConfig.serviceName}] API failed to start:`, error);
  }

  process.exit(1);
});
