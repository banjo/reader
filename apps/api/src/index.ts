import { authMiddleware } from "@app/middleware/auth";
import { item } from "@app/routes/item/routes";
import { items } from "@app/routes/items/routes";
import { serve } from "@hono/node-server";
import { prisma } from "db";
import { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { pingRateLimitRedis } from "server";
import { createLogger } from "utils";
import { createHonoInstance, type AuthVariables } from "./instance";
import { feed } from "./routes/feed/routes";

import "dotenv/config";

const healthLogger = createLogger("api:health");

const app = createHonoInstance();
const api = app.basePath("/api");

api.use("*", logger());
api.use(
    "*",
    cors({
        origin: "*",
    })
);

app.get("/health", c => {
    return c.json({
        status: "ok",
        message: "API is running",
    });
});

api.get("/health", c => {
    return c.json({
        status: "ok",
        message: "API is running",
    });
});

const withTimeout = async (promise: Promise<unknown>, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
        await Promise.race([
            promise,
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error("Health check timed out")), ms);
            }),
        ]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
};

const readiness = async () => {
    const [database, redis] = await Promise.all([
        withTimeout(prisma.$queryRaw`SELECT 1`, 2_000)
            .then(() => "ok" as const)
            .catch(() => "error" as const),
        withTimeout(pingRateLimitRedis(), 2_000)
            .then(() => "ok" as const)
            .catch(() => "error" as const),
    ]);

    const healthy = database === "ok" && redis === "ok";

    if (!healthy) {
        healthLogger.error(`Readiness check failed: database=${database} redis=${redis}`);
    }

    return {
        healthy,
        body: {
            status: healthy ? "ok" : "unavailable",
            checks: { database, redis },
        },
    };
};

const readinessHandler = async (c: Context<{ Variables: AuthVariables }>) => {
    const result = await readiness();
    return c.json(result.body, result.healthy ? 200 : 503);
};

app.get("/health/ready", readinessHandler);
api.get("/health/ready", readinessHandler);

api.use("*", authMiddleware);

api.route("/feed", feed);
api.route("/item", item);
api.route("/items", items);

const PORT = Number(process.env.PORT) || 3003;
const isProd = process.env.NODE_ENV === "production";

console.log(`🚀 Server ready at port ${PORT} - Mode: ${isProd ? "production" : "development"}`);

serve({
    fetch: app.fetch,
    port: PORT,
});
