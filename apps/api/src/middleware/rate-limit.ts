import type { AuthVariables } from "@app/instance";
import type { MiddlewareHandler } from "hono";
import { consumeRateLimit } from "server";
import { Result } from "utils";

type RateLimitConfig = {
    name: string;
    points: number;
    durationMs: number;
};

export function rateLimit({
    name,
    points,
    durationMs,
}: RateLimitConfig): MiddlewareHandler<{ Variables: AuthVariables }> {
    return async (c, next) => {
        const userId = c.get("userId");
        const key = `rate-limit:${name}:${userId ?? "anonymous"}`;
        const result = await consumeRateLimit({ key, points, durationMs });

        c.header("RateLimit-Limit", result.limit.toString());
        c.header("RateLimit-Remaining", result.remaining.toString());
        c.header("RateLimit-Reset", Math.ceil(result.resetAt / 1_000).toString());

        if (!result.allowed) {
            const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1_000));
            c.header("Retry-After", retryAfter.toString());
            return c.json(
                Result.error("Too many requests. Try again later.", "TooManyRequests"),
                429
            );
        }

        await next();
    };
}
