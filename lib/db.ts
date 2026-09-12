import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString || connectionString.includes("[YOUR-PASSWORD]") || connectionString.includes("[YOUR_PASSWORD]")) {
  console.warn(
    "⚠️ [Database] DATABASE_URL is not configured properly in .env! It contains an unreplaced placeholder [YOUR-PASSWORD]. Please update .env with your actual database password."
  );
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

export const client =
  globalForDb.postgresClient ||
  postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
export * from "../drizzle/schema";
