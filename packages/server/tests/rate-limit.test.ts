import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { closeRateLimitClient, consumeRateLimit } from "../src/shared/lib/rate-limit";

const testRedisUrl = process.env.TEST_REDIS_URL;
process.env.NODE_ENV = "test";

after(closeRateLimitClient);

test("rate limits consume a fixed window per key", { skip: !testRedisUrl }, async () => {
    const key = `rate-limit-test:${randomUUID()}`;
    const options = { key, points: 2, durationMs: 5_000 };

    const first = await consumeRateLimit(options);
    assert.equal(first.allowed, true);
    assert.equal(first.remaining, 1);
    assert.ok(first.resetAt > Date.now());

    const second = await consumeRateLimit(options);
    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);

    const third = await consumeRateLimit(options);
    assert.equal(third.allowed, false);
    assert.equal(third.remaining, 0);
});

test("rate limiting can be disabled for tests", { skip: !testRedisUrl }, async () => {
    process.env.RATE_LIMIT_DISABLED = "true";

    try {
        const result = await consumeRateLimit({
            key: `rate-limit-disabled:${randomUUID()}`,
            points: 1,
            durationMs: 5_000,
        });

        assert.equal(result.allowed, true);
        assert.equal(result.remaining, 1);
    } finally {
        delete process.env.RATE_LIMIT_DISABLED;
    }
});
