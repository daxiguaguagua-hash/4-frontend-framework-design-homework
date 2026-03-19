import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const githubProfiles = pgTable(
  "github_profiles",
  {
    id: serial("id").primaryKey(),
    githubId: text("github_id").notNull(),
    login: text("login").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url").notNull(),
    htmlUrl: text("html_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull()
  },
  (table) => ({
    githubIdUnique: uniqueIndex("github_profiles_github_id_unique").on(table.githubId)
  })
);

export type GithubProfile = typeof githubProfiles.$inferSelect;
export type NewGithubProfile = typeof githubProfiles.$inferInsert;

