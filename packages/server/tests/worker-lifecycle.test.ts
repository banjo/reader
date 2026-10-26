import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Queue, QueueEvents } from "bullmq";

const testRedisUrl = process.env.TEST_REDIS_URL;

test("worker lifecycle", { skip: !testRedisUrl, timeout: 30_000 }, async t => {
    assert.ok(testRedisUrl);
    const redis = new URL(testRedisUrl);
    const connection = {
        host: redis.hostname,
        port: Number(redis.port) || 6379,
        password: decodeURIComponent(redis.password) || undefined,
        db: Number(redis.pathname.slice(1)) || 0,
    };
    const prefix = `worker-test-${randomUUID().replaceAll("-", "")}`;
    const { redisConfig } = await import("../src/workers/config");
    redisConfig.connection = connection;
    redisConfig.prefix = prefix;
    const { createWorker } = await import("../src/workers/create");
    const { Result } = await import("utils");
    let processed = 0;
    const factory = () =>
        createWorker<{ value: string }>(
            "lazyWorkerTest",
            async () => {
                processed++;
                return Result.okEmpty();
            },
            { concurrency: 7 }
        );
    const worker = factory();
    const queue = worker.getQueue();
    const events = new QueueEvents(queue.name, { connection, prefix });
    const idle = createWorker<{ value: string }>("idleWorkerTest", async () => Result.okEmpty());
    t.after(async () => {
        await Promise.all([worker.close(), events.close()]);
        const cleanup = new Queue(queue.name, { connection, prefix });
        const idleCleanup = new Queue(idle.getQueue().name, { connection, prefix });
        try {
            await Promise.all([
                cleanup.obliterate({ force: true }),
                idleCleanup.obliterate({ force: true }),
            ]);
        } finally {
            await Promise.all([cleanup.close(), idleCleanup.close()]);
        }
    });

    await Promise.all([queue.waitUntilReady(), events.waitUntilReady()]);
    assert.equal(worker.getWorker(), undefined);
    assert.equal(idle.getWorker(), undefined);

    const started = worker.start();
    worker.start();
    assert.equal(worker.getWorker(), started);
    assert.equal(factory().getWorker(), started);
    assert.equal(started.opts.concurrency, 7);

    const job = await queue.add("lazy-job", { value: "processed" });
    await job.waitUntilFinished(events, 10_000);
    assert.equal(processed, 1);

    await idle.close();
    assert.equal(idle.getWorker(), undefined);
});
