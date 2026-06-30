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

export function getPool(): Pool {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new DatabaseUnavailableError("DATABASE_URL is not configured for this project.");
  }

  pool ??= mysql.createPool(databaseUrl);
  return pool;
}

export function getDb(): MySql2Database<typeof schema> {
  db ??= drizzle(getPool(), {
    schema,
    mode: "default",
  });

  return db;
}
