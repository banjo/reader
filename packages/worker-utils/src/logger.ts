import { Job } from "bullmq";
import { createLogger as createGlobalLogger } from "utils";

export const createWorkerLogger = (name: string, job: Job) => {
    const logger = createGlobalLogger(name);

    return {
        info: (message: string) => {
            logger.info(message);
            job.log(message);
        },
        error: (message: string) => {
            logger.error(message);
            job.log(message);
        },
    };
};
