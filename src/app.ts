import { Hono } from "hono";

import { apiRoutes } from "./routes/api";
import { pageRoutes } from "./routes/page";

const app = new Hono();

app.route("/", pageRoutes);
app.route("/api", apiRoutes);

export default app;

