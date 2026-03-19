import { sql } from "drizzle-orm";

import { db } from "./client";

let schemaReadyPromise: Promise<void> | null = null;

async function createSchema() {
  await db.execute(sql`
    create table if not exists github_profiles (
      id serial primary key,
      github_id text not null,
      login text not null,
      name text,
      avatar_url text not null,
      html_url text not null,
      created_at timestamp default now() not null
    )
  `);

  await db.execute(sql`
    create unique index if not exists github_profiles_github_id_unique
    on github_profiles (github_id)
  `);
}

export async function ensureDatabaseSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createSchema().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  await schemaReadyPromise;
}
