#!/usr/bin/env node

import { spawn } from "node:child_process";
import net from "node:net";

const DEFAULT_API_PORT = 4001;
const HOST = "127.0.0.1";
const SERVICE_NAME = "fullstack-starter";

function parsePort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : undefined;
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, HOST, () => {
      server.close(() => resolve(true));
    });
  });
}

function getRandomPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();
    server.once("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;

      server.close(() => {
        if (port) {
          resolve(port);
        } else {
          reject(new Error("Unable to select a free API port."));
        }
      });
    });
  });
}

async function selectApiPort(preferredPort) {
  return (await canListen(preferredPort)) ? preferredPort : getRandomPort();
}

const configuredPort = parsePort(process.env.API_PORT);
const preferredPort = configuredPort ?? DEFAULT_API_PORT;
const apiPort = await selectApiPort(preferredPort);

if (process.env.API_PORT && !configuredPort) {
  console.warn(
    `[${SERVICE_NAME}] Ignoring invalid API_PORT=${process.env.API_PORT}; using ${apiPort}.`,
  );
} else if (apiPort !== preferredPort) {
  console.warn(`[${SERVICE_NAME}] API port ${preferredPort} is busy; using ${apiPort} instead.`);
} else {
  console.log(`[${SERVICE_NAME}] Using API port ${apiPort}.`);
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(
  pnpmCommand,
  [
    "exec",
    "concurrently",
    "-k",
    "-n",
    "web,api",
    "vite dev --host=0.0.0.0 --force",
    "tsx watch server/index.ts",
  ],
  {
    env: {
      ...process.env,
      API_PORT: String(apiPort),
    },
    stdio: "inherit",
  },
);

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

child.on("error", (error) => {
  console.error(`[${SERVICE_NAME}] Failed to start development processes:`, error);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
