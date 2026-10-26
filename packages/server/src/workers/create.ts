import { randomString, toMilliseconds, toSeconds } from "@banjoanton/utils";
import { Job, JobsOptions, Queue, Worker } from "bullmq";
import { kebabCase } from "change-case";
import { ResultType } from "model";
import { createLogger } from "utils";
import { redisConfig } from "./config";

type WorkerType = "queue" | "worker";
type WorkerOptions = {
    concurrency?: number;
    jobOptions?: Pick<JobsOptions, "attempts" | "backoff">;
};

const createMisc = (name: string, type: WorkerType) => {
    const formattedName = kebabCase(name);
    const logger = createLogger(`${type}:create:${formattedName}`);
    const QUEUE_NAME = `${formattedName}-queue`;
    const JOB_NAME = `${formattedName}-job`;

    return { logger, QUEUE_NAME, JOB_NAME };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueue = Queue<any, any, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWorker = Worker<any, any, string>;

const singleton = {
    queues: [] as AnyQueue[],
    workers: [] as AnyWorker[],
};

export const createWorker = <T extends object>(
    name: string,
    processor: (job: Job<T>) => Promise<ResultType<void>>,
    options: WorkerOptions = {}
) => {
    const { JOB_NAME, QUEUE_NAME, logger } = createMisc(name, "worker");

    const currentQueue = singleton.queues.find(q => q.name === QUEUE_NAME);

    let queue: Queue<T, void, string, T, void, string>;
    if (currentQueue) {
        queue = currentQueue;
    } else {
        queue = new Queue<T, void, string, T, void, string>(QUEUE_NAME, {
            ...redisConfig,
            defaultJobOptions: options.jobOptions,
        });
        singleton.queues.push(queue);
    }

    const currentWorker = singleton.workers.find(w => w.name === QUEUE_NAME);

    let worker: Worker<T, ResultType<void>, string>;
    if (currentWorker) {
        worker = currentWorker;
    } else {
        worker = new Worker<T, ResultType<void>, string>(QUEUE_NAME, processor, {
            ...redisConfig,
            autorun: false,
            concurrency: options.concurrency ?? 1,
            removeOnComplete: { age: toSeconds({ hours: 6 }), count: 500 },
            removeOnFail: { age: toSeconds({ days: 1 }), count: 1_000 },
        });
        singleton.workers.push(worker);
    }

    logger.info(
        // @ts-ignore
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
        start: () => {
            logger.info("Starting...");
            setTimeout(() => worker.run());
        },
        add: async (data: T) => {
            logger.info("Adding job...");
            await queue.add(JOB_NAME, data);
        },
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 60 })) => {
            logger.info(`Adding repeatable job every 60 minutes...`);
            // TODO: add try catch with Result return type
            await queue.add(JOB_NAME, data, {
                ...options.jobOptions,
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
        close: async () => {
            logger.info("Closing...");
            await queue.close();
            await worker.close();
        },
    };

    return wrapper;
};
