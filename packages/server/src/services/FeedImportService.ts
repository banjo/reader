import { randomUUID } from "node:crypto";
import type { AsyncResultType, FeedImportAccepted, FeedImportStatus } from "model";
import { createLogger, Result } from "utils";
import { FeedImportRepository } from "../repositories/FeedImportRepository";
import { importFeedsWorker } from "../workers/runners/import-feeds/import-feeds-worker";

type EnqueueProps = { urls: string[]; userId: number };
type StatusProps = { importId: string; userId: number };

const logger = createLogger("FeedImportService");

const enqueue = async ({ urls, userId }: EnqueueProps): AsyncResultType<FeedImportAccepted> => {
    const uniqueUrls = [...new Set(urls)];
    const importId = randomUUID();
    try {
        const queue = importFeedsWorker().getQueue();
        await FeedImportRepository.create({ queue, importId, userId, urls: uniqueUrls });
        await queue.addBulk(
            uniqueUrls.map((url, index) => ({
                name: "import-feed",
                data: { importId, index, url, userId },
                opts: { jobId: `${importId}-${index}` },
            }))
        );
        return Result.ok({ importId, total: uniqueUrls.length });
    } catch (error) {
        logger.error({ err: error, importId, userId }, "Could not queue feed import");
        return Result.error("Could not queue feed import", "InternalError");
    }
};

const getStatus = async ({ importId, userId }: StatusProps): AsyncResultType<FeedImportStatus> => {
    try {
        const queue = importFeedsWorker().getQueue();
        const status = await FeedImportRepository.get({ queue, importId, userId });
        if (!status) {
            return Result.error("Import not found or expired", "NotFound");
        }
        return Result.ok(status);
    } catch (error) {
        logger.error({ err: error, importId, userId }, "Could not read feed import progress");
        return Result.error("Could not read import progress", "InternalError");
    }
};

export const FeedImportService = { enqueue, getStatus };
