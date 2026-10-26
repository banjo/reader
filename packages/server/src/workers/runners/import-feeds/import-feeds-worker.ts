import { Job, UnrecoverableError } from "bullmq";
import { Result } from "utils";
import { FeedImportRepository } from "../../../repositories/FeedImportRepository";
import { externalRequestRetry } from "../../../services/ExternalRequestService";
import { FeedService } from "../../../services/FeedService";
import { createWorker } from "../../create";

export type ImportFeedJob = {
    importId: string;
    index: number;
    url: string;
    userId: number;
};

export const importFeedsWorker = () =>
    createWorker<ImportFeedJob>(
        "importFeeds",
        async (job: Job<ImportFeedJob>) => {
            const { importId, index, url, userId } = job.data;
            const queue = importFeedsWorker().getQueue();
            const update = (
                status: "importing" | "retrying" | "imported" | "failed",
                message?: string
            ) =>
                FeedImportRepository.updateEntry({
                    queue,
                    importId,
                    index,
                    entry: { url, status, message },
                });
            await update("importing");
            const result = await FeedService.addFeed(url, userId, {
                requestAttempts: 1,
                scheduleExisting: true,
            });
            if (result.success) {
                await update("imported");
                return Result.okEmpty();
            }
            const retrying = result.retryable && job.attemptsMade + 1 < (job.opts.attempts ?? 1);
            await update(retrying ? "retrying" : "failed", result.message);
            if (result.retryable) {
                throw new Error(result.message);
            }
            throw new UnrecoverableError(result.message);
        },
        {
            concurrency: 5,
            jobOptions: externalRequestRetry,
            onFailed: async (job, error) => {
                if (!job || (await job.getState()) !== "failed") {
                    return;
                }
                const { importId, index, url } = job.data;
                await FeedImportRepository.updateEntry({
                    queue: importFeedsWorker().getQueue(),
                    importId,
                    index,
                    entry: { url, status: "failed", message: error.message },
                });
            },
        }
    );
