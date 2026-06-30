import { bigint, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// Copy the pattern into server/schema.ts; never keep this example table or name.
export const exampleRecords = mysqlTable("example_records", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
