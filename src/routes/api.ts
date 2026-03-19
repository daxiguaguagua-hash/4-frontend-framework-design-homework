import { Hono } from "hono";

import { deleteGithubProfile, listGithubProfiles, saveGithubProfile } from "../db/queries";
import { fetchGithubUser } from "../lib/github";

export const apiRoutes = new Hono();

apiRoutes.get("/hello", (c) => {
  return c.json({
    message: "hello from hono on aws lambda",
    timestamp: new Date().toISOString()
  });
});

apiRoutes.get("/records", async (c) => {
  const records = await listGithubProfiles();

  return c.json({
    records: records.map((record) => ({
      id: record.id,
      githubId: record.githubId,
      login: record.login,
      name: record.name,
      avatarUrl: record.avatarUrl,
      htmlUrl: record.htmlUrl,
      createdAt: record.createdAt
    }))
  });
});

apiRoutes.post("/github-profile", async (c) => {
  const body = await c.req.json<{ token?: string }>().catch(() => null);

  if (!body?.token) {
    return c.json({ error: "token is required" }, 400);
  }

  try {
    const githubUser = await fetchGithubUser(body.token);
    const saved = await saveGithubProfile({
      githubId: String(githubUser.id),
      login: githubUser.login,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      htmlUrl: githubUser.html_url
    });

    return c.json({
      record: saved
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return c.json({ error: message }, 500);
  }
});

apiRoutes.delete("/records/:id", async (c) => {
  const id = Number(c.req.param("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "invalid id" }, 400);
  }

  const deleted = await deleteGithubProfile(id);

  if (!deleted) {
    return c.json({ error: "record not found" }, 404);
  }

  return c.json({
    success: true,
    deletedId: deleted.id
  });
});

