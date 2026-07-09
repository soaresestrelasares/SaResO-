import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";

import * as schema from "./schema.js";

let pool: Pool | undefined;
let db: MySql2Database<typeof schema> | undefined;

export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

function getDatabaseUrl(): string | undefined {
  const value = process.env.DATABASE_URL?.trim();
  return value || undefined;
}

function getPoolConfig() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new DatabaseUnavailableError("DATABASE_URL is not configured for this project.");
  }

  // Proteção contra caracteres invisíveis ou encoding estranho no final da URL
  const cleanUrl = databaseUrl
    .replace(/[\r\n]+/g, "")
    .replace(/\s+/g, "")
    .replace(/:([0-9]{2,5}):([0-9]{2,5})(\/|$)/, ":$1$2") // evita duplicação de porta
    .trim();

  return cleanUrl;
}

async function ensureDatabaseExists(): Promise<void> {
  const cleanUrl = getPoolConfig();
  const parsed = new URL(cleanUrl);
  const username = encodeURIComponent(parsed.username);
  const password = encodeURIComponent(parsed.password);
  const host = parsed.hostname;
  const port = parsed.port || "3306";
  const connectionUrl = `mysql://${username}:${password}@${host}:${port}`;
  const tempPool = mysql.createPool({
    uri: connectionUrl,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 1,
  });
  try {
    const databaseName = parsed.pathname.replace(/^\//, "");
    if (databaseName) {
      await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    }
  } finally {
    await tempPool.end();
  }
}

export async function initPool(): Promise<void> {
  if (pool) return;
  const databaseUrl = getPoolConfig();
  console.log("[db] DATABASE_URL processed:", databaseUrl.replace(/:[^:@]+@/, ":***@"));
  await ensureDatabaseExists();
  pool = mysql.createPool({
    uri: databaseUrl,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
  });
}

export function getPool(): Pool {
  const databaseUrl = getPoolConfig();
  pool ??= mysql.createPool({
    uri: databaseUrl,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

export function getDb(): MySql2Database<typeof schema> {
  db ??= drizzle(getPool(), {
    schema,
    mode: "default",
  });

  return db;
}
