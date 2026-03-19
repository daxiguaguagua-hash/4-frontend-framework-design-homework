import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const shouldUseSsl =
  process.env.DATABASE_SSL === "true" || databaseUrl.includes("sslmode=require");

const client = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: shouldUseSsl ? "require" : undefined
});

export const db = drizzle(client);
