import { authMiddleware } from "@app/middleware/auth";
import { item } from "@app/routes/item/routes";
import { items } from "@app/routes/items/routes";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createHonoInstance } from "./instance";
import { feed } from "./routes/feed/routes";

import "dotenv/config";

const app = createHonoInstance().basePath("/api");

app.use("*", logger());
app.use(
    "*",
    cors({
        origin: "*",
    })
);
app.use("*", authMiddleware);

app.route("/feed", feed);
app.route("/item", item);
app.route("/items", items);

const PORT = Number(process.env.PORT) || 3003;
const isProd = process.env.NODE_ENV === "production";

console.log(`🚀 Server ready at port ${PORT} - Mode: ${isProd ? "production" : "development"}`);

serve({
    fetch: app.fetch,
    port: PORT,
});
