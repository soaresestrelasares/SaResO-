import http from "http";
import { createApp } from "./app.js";
import { serverConfig } from "./config.js";
import { initSocket } from "./socket.js";
import { initPool } from "./db.js";
import { ensureTables } from "./migrate.js";

try {
  await initPool();
  await ensureTables();
} catch (err) {
  console.error("[sareso] FATAL: Failed to create tables:", JSON.stringify(err));
  process.exit(1);
}

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
