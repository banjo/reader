import { randomString, toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { paramCase, pascalCase } from "change-case";
import { ResultType, createLogger } from "utils";
import { redisConfig } from "./config";

export const createWorker = <T extends object>(
    name: string,
    processor: (job: Job<T>) => Promise<ResultType<void>>
) => {
    const logger = createLogger(`CreateWorker${pascalCase(name)}`);
    const QUEUE_NAME = `${paramCase(name)}-queue`;
    const JOB_NAME = `${paramCase(name)}-job`;
    const queue = new Queue<T>(QUEUE_NAME, redisConfig);
    const worker = new Worker<T>(QUEUE_NAME, processor, redisConfig);

    const wrapper = {
        start: async () => {
            logger.info("Starting...");
            await worker.waitUntilReady();
        },
        add: async (data: T) => {
            logger.info("Adding job...");
            await queue.add(JOB_NAME, data);
        },
        close: async () => {
            logger.info("Closing...");
            await queue.close();
            await worker.close();
        },
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 5 })) => {
            logger.info(`Adding repeatable job every ${timeInMs / 1000 / 60} minutes...`);
            await queue.add(JOB_NAME, data, {
                repeat: {
                    every: timeInMs,
                    immediately: true,
                },
                jobId: `${JOB_NAME}-${randomString()}`,
            });
        },
        stopRepeatable: async () => {
            const repeatableJobs = await queue.getRepeatableJobs();
            logger.info(`Stopping ${repeatableJobs.length} repeatable jobs...`);
            await Promise.all(
                repeatableJobs.map(async job => {
                    await queue.removeRepeatableByKey(job.key);
                })
            );
        },
        activeCount: async () => {
            logger.info("Getting active count...");
            return await queue.getActiveCount();
        },
        getQueue: () => queue,
    };

    return wrapper;
};
