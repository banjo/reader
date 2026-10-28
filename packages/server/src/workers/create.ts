import { toMilliseconds, toSeconds } from "@banjoanton/utils";
import { Job, JobsOptions, Queue, Worker } from "bullmq";
import { kebabCase } from "change-case";
import { ResultType } from "model";
import { createLogger } from "utils";
import { redisConfig } from "./config";

type WorkerType = "queue" | "worker";
type WorkerOptions<T> = {
    concurrency?: number;
    jobOptions?: Pick<JobsOptions, "attempts" | "backoff">;
    repeatJobId?: (data: T) => string;
    /**
     * Run a repeatable job at a fixed point (in ms) of each interval instead of right away.
     * Use it to spread jobs out and to keep restarts from running every job at once.
     */
    repeatSlot?: (data: T, every: number) => number;
    onFailed?: (job: Job<T> | undefined, error: Error) => Promise<void>;
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
    startedWorkers: new WeakSet<AnyWorker>(),
};

export const createWorker = <T extends object>(
    name: string,
    processor: (job: Job<T>) => Promise<ResultType<void>>,
    options: WorkerOptions<T> = {}
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

    const getWorker = () =>
        singleton.workers.find(worker => worker.name === QUEUE_NAME) as
            Worker<T, ResultType<void>, string> | undefined;

    const createAndStartWorker = () => {
        const currentWorker = getWorker();
        if (currentWorker) {
            return currentWorker;
        }

        const worker = new Worker<T, ResultType<void>, string>(QUEUE_NAME, processor, {
            ...redisConfig,
            autorun: false,
            concurrency: options.concurrency ?? 1,
            removeOnComplete: { age: toSeconds({ hours: 6 }), count: 500 },
            removeOnFail: { age: toSeconds({ days: 1 }), count: 1_000 },
        });
        if (options.onFailed) {
            worker.on("failed", (job, error) => {
                void options
                    .onFailed?.(job, error)
                    .catch(failure =>
                        logger.error({ err: failure }, "Could not record job failure")
                    );
            });
        }
        singleton.workers.push(worker);
        logger.info(`Created worker ${QUEUE_NAME}`);
        return worker;
    };

    logger.info(
        // @ts-ignore
        `Created queue ${QUEUE_NAME} and job ${JOB_NAME} at host ${redisConfig?.connection?.host}`
    );

    const stopRepeatable = async () => {
        // Also lists repeatable jobs created with the older `queue.add(..., { repeat })` API.
        const schedulers = await queue.getJobSchedulers();
        logger.info(`Stopping ${schedulers.length} repeatable jobs...`);
        await Promise.all(schedulers.map(scheduler => queue.removeJobScheduler(scheduler.key)));
    };

    const wrapper = {
        start: () => {
            logger.info("Starting...");
            const worker = createAndStartWorker();
            if (!singleton.startedWorkers.has(worker)) {
                singleton.startedWorkers.add(worker);
                setTimeout(() => void worker.run());
            }
            return worker;
        },
        add: async (data: T, jobOptions?: JobsOptions) => {
            logger.info("Adding job...");
            await queue.add(JOB_NAME, data, jobOptions);
        },
        repeatable: async (data: T, timeInMs = toMilliseconds({ minutes: 60 })) => {
            logger.info(`Adding repeatable job every ${Math.round(timeInMs / 60_000)} minutes...`);
            const slot = options.repeatSlot?.(data, timeInMs);
            // TODO: add try catch with Result return type
            await queue.upsertJobScheduler(
                options.repeatJobId?.(data) ?? JOB_NAME,
                {
                    every: timeInMs,
                    // Without an offset, the first run starts right away.
                    offset:
                        slot === undefined ? undefined : ((slot % timeInMs) + timeInMs) % timeInMs,
                },
                { name: JOB_NAME, data, opts: options.jobOptions }
            );
        },
        stopRepeatable,
        removeRepeatableById: (jobId: string) => queue.removeJobScheduler(jobId),
        activeCount: async () => {
            logger.info("Getting active count...");
            return await queue.getActiveCount();
        },
        getQueue: () => queue,
        getWorker,
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
            await getWorker()?.close();
        },
    };

    return wrapper;
};
