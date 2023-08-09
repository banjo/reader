import { authMiddleware } from "@app/middleware/auth";
import { item } from "@app/routes/item/routes";
import { items } from "@app/routes/items/routes";
import { webhook } from "@app/routes/webhook/routes";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createHonoInstance } from "./instance";
import { feed } from "./routes/feed/routes";

const app = createHonoInstance().basePath("/api");

app.use("*", logger());
app.use(
    "*",
    cors({
        origin: "*",
        allowHeaders: ["Auth-Token", "X-External-User-Id"],
        credentials: true,
    })
);
app.use("*", authMiddleware);

app.route("/feed", feed);
app.route("/item", item);
app.route("/items", items);
app.route("/webhook", webhook);

const PORT = Number(process.env.PORT) || 3003;

serve({
    fetch: app.fetch,
    port: PORT,
});

console.log(`🚀 Server ready at http://localhost:${PORT}`);
