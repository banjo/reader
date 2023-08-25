import { randomString, toMilliseconds } from "@banjoanton/utils";
import { Job, Queue, Worker } from "bullmq";
import { paramCase } from "change-case";
import { ResultType } from "model";
import { Logger, createLogger } from "utils";
import { redisConfig } from "./config";

type WorkerType = "queue" | "worker";

const createMisc = (name: string, type: WorkerType) => {
    const formattedName = paramCase(name);
    const logger = createLogger(`${type}:create:${formattedName}`);
    const QUEUE_NAME = `${formattedName}-queue`;
    const JOB_NAME = `${formattedName}-job`;

    return { logger, QUEUE_NAME, JOB_NAME };
};

type RepeatableSettings<T> = {
    logger: Logger;
    timeInMs: number;
    queue: Queue;
    jobName: string;
    data: T;
};

const handleRepeatable = async <T>({
    jobName,
    logger,
    queue,
    timeInMs,
    data,
}: RepeatableSettings<T>) => {
    logger.info(`Adding repeatable job every ${timeInMs / 1000 / 60} minutes...`);
    // TODO: add try catch with Result return type
    await queue.add(jobName, data, {
        repeat: {
            every: timeInMs,
            immediately: true,
        },
        jobId: `${jobName}-${randomString()}`,
    });
};

export const createQueue = <T extends object>(name: string) => {
    const { JOB_NAME, QUEUE_NAME, logger } = createMisc(name, "queue");
    const queue = new Queue<T>(QUEUE_NAME, { ...redisConfig, sharedConnection: true });

    logger.info(
        // @ts-ignore
        // eslint-disable-next-line max-len
        `Created queue ${QUEUE_NAME} at host ${redisConfig?.connection?.host}`
    );

    const wrapper = {
        add: async (data: T) => {
            logger.info("Adding job...");
            await queue.add(JOB_NAME, data);
        },
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 5 })) => {
            await handleRepeatable<T>({ logger, queue, timeInMs, data, jobName: JOB_NAME });
        },
        getQueue: () => queue,
        clear: async () => {
            logger.info(`Clearing ${QUEUE_NAME} queue...`);
            await queue.obliterate();
        },
    };

    return wrapper;
};

export const createWorker = <T extends object>(
    name: string,
    processor: (job: Job<T>) => Promise<ResultType<void>>
) => {
    const { JOB_NAME, QUEUE_NAME, logger } = createMisc(name, "worker");
    const queue = new Queue<T>(QUEUE_NAME, { ...redisConfig, sharedConnection: true });
    const worker = new Worker<T>(QUEUE_NAME, processor, { ...redisConfig, autorun: false });

    logger.info(
        // @ts-ignore
        // eslint-disable-next-line max-len
        `Created queue ${QUEUE_NAME} and job ${JOB_NAME} at host ${redisConfig?.connection?.host}`
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
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 5 })) => {
            await handleRepeatable<T>({ logger, queue, timeInMs, data, jobName: JOB_NAME });
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
        close: async () => {
            logger.info("Closing...");
            await queue.close();
            await worker.close();
        },
    };

    return wrapper;
};
