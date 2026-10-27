import Redis from "ioredis";
import { createLogger } from "utils";
import { getRedisConnection } from "../../workers/config";

const logger = createLogger("RateLimit");

let client: Redis | undefined;
let connecting: Promise<unknown> | undefined;

const getClient = () => {
    if (!client) {
        client = new Redis({
            ...getRedisConnection(),
            lazyConnect: true,
            connectTimeout: 1_000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
        });
        client.on("error", error => {
            logger.error(`Redis rate limit connection error: ${error.message}`);
        });
        // Do not keep short-lived processes (tests, scripts, CLI tools) alive just for this
        // connection. The API process stays alive through its HTTP server.
        client.on("ready", () => {
            const socket = (client as unknown as { stream?: { unref?: () => void } }).stream;
            socket?.unref?.();
        });
    }

    return client;
};

const ensureConnected = async (redis: Redis) => {
    if (redis.status === "ready") {
        return;
    }

    if (!connecting) {
        connecting = redis.connect().finally(() => {
            connecting = undefined;
        });
    }

    await connecting;
};

export const closeRateLimitClient = async () => {
    const current = client;
    client = undefined;

    if (!current) {
        return;
    }

    if (current.status === "ready") {
        await current.quit().catch(() => current.disconnect());
        return;
    }

    current.disconnect();
};

export const pingRateLimitRedis = async () => {
    const redis = getClient();
    await ensureConnected(redis);
    return (await redis.ping()) === "PONG";
};

const incrementScript = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
    redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`;

export type RateLimitOptions = {
    key: string;
    points: number;
    durationMs: number;
};

export type RateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    degraded?: boolean;
};

export const consumeRateLimit = async ({
    key,
    points,
    durationMs,
}: RateLimitOptions): Promise<RateLimitResult> => {
    const now = Date.now();

    if (process.env.NODE_ENV !== "production" && process.env.RATE_LIMIT_DISABLED === "true") {
        return {
            allowed: true,
            limit: points,
            remaining: points,
            resetAt: now + durationMs,
        };
    }

    try {
        const redis = getClient();
        await ensureConnected(redis);

        const count = Number(await redis.eval(incrementScript, 1, key, durationMs));
        const ttl = await redis.pttl(key);

        return {
            allowed: count <= points,
            limit: points,
            remaining: Math.max(points - count, 0),
            resetAt: now + (ttl > 0 ? ttl : durationMs),
        };
    } catch (error) {
        // A rate-limit outage should not take the API down. The worker and request limits still
        // bound most expensive work.
        logger.error(
            `Could not check rate limit for ${key}: ${
                error instanceof Error ? error.message : error
            }`
        );

        return {
            allowed: true,
            limit: points,
            remaining: points,
            resetAt: now + durationMs,
            degraded: true,
        };
    }
};
