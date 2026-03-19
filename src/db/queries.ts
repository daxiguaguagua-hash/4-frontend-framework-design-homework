import { desc, eq } from "drizzle-orm";

import { db } from "./client";
import { ensureDatabaseSchema } from "./init";
import { githubProfiles } from "./schema";

type SaveGithubProfileInput = {
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
};

export async function listGithubProfiles() {
  await ensureDatabaseSchema();
  return db.select().from(githubProfiles).orderBy(desc(githubProfiles.id));
}

export async function saveGithubProfile(input: SaveGithubProfileInput) {
  await ensureDatabaseSchema();

  const rows = await db
    .insert(githubProfiles)
    .values({
      githubId: input.githubId,
      login: input.login,
      name: input.name,
      avatarUrl: input.avatarUrl,
      htmlUrl: input.htmlUrl
    })
    .onConflictDoNothing({
      target: githubProfiles.githubId
    })
    .returning();

  if (rows[0]) {
    return rows[0];
  }

  const existing = await db
    .select()
    .from(githubProfiles)
    .where(eq(githubProfiles.githubId, input.githubId))
    .limit(1);

  return existing[0] ?? null;
}

export async function deleteGithubProfile(id: number) {
  await ensureDatabaseSchema();

  const rows = await db
    .delete(githubProfiles)
    .where(eq(githubProfiles.id, id))
    .returning({ id: githubProfiles.id });

  return rows[0] ?? null;
}
