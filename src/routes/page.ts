import { readFile } from "node:fs/promises";
import path from "node:path";

import { Hono } from "hono";

export const pageRoutes = new Hono();

pageRoutes.get("/", async (c) => {
  const filePath = path.join(process.cwd(), "src/views/index.html");
  const html = await readFile(filePath, "utf8");
  return c.html(html);
});

