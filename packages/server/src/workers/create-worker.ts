import { randomString, toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { paramCase, pascalCase } from "change-case";
import { ResultType } from "model";
import { createLogger } from "utils";
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

    logger.info(
        // @ts-ignore
        // eslint-disable-next-line max-len
        `Created ${QUEUE_NAME} and ${JOB_NAME} at host ${redisConfig?.connection?.host}`
    );

    const stopRepeatable = async () => {
        const repeatableJobs = await queue.getRepeatableJobs();
        logger.info(`Stopping ${repeatableJobs.length} repeatable jobs...`);
        await Promise.all(
            repeatableJobs.map(async job => {
                await queue.removeRepeatableByKey(job.key);
            })
        );
    };

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
            // TODO: add try catch with Result return type
            await queue.add(JOB_NAME, data, {
                repeat: {
                    every: timeInMs,
                    immediately: true,
                },
                jobId: `${JOB_NAME}-${randomString()}`,
            });
        },
        stopRepeatable,
        activeCount: async () => {
            logger.info("Getting active count...");
            return await queue.getActiveCount();
        },
        getQueue: () => queue,
        clear: async () => {
            logger.info(`Clearing ${QUEUE_NAME} queue...`);
            await queue.obliterate();
            logger.info(`Clearing ${JOB_NAME} job...`);

            const ids = await queue.clean(0, 100_000);
            logger.info(`Cleared ${ids.length} jobs`);

            await stopRepeatable();
        },
    };

    return wrapper;
};
