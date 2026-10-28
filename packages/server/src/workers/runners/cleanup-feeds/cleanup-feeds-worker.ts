import { toMilliseconds } from "@banjoanton/utils";
import { Job } from "bullmq";
import { Result } from "utils";
import { FeedRepository } from "../../../repositories/FeedRepository";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";
import { fetchRssFeedWorker } from "../fetch-rss-feed/fetch-rss-feed-worker";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const olderThanDays = parsePositiveInt(process.env.CLEANUP_ORPHANED_FEEDS_AFTER_DAYS, 30);
const limit = parsePositiveInt(process.env.CLEANUP_ORPHANED_FEEDS_LIMIT, 100);

type CleanupLogger = {
    info: (message: string) => void;
    error: (message: string) => void;
};

export type CleanupResult = {
    found: number;
    deleted: number;
    skipped: number;
    failed: number;
};

export const cleanupOrphanedFeeds = async (logger: CleanupLogger): Promise<CleanupResult> => {
    const olderThan = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const feedsResult = await FeedRepository.getOrphanedFeeds({ olderThan, limit });

    if (!feedsResult.success) {
        throw new Error(feedsResult.message);
    }

    const result: CleanupResult = {
        found: feedsResult.data.length,
        deleted: 0,
        skipped: 0,
        failed: 0,
    };

    logger.info(`Found ${result.found} feeds without subscribers older than ${olderThanDays} days`);

    for (const feed of feedsResult.data) {
        try {
            const removed = await fetchRssFeedWorker().removeRepeatableById(`feed-${feed.id}`);

            if (!removed) {
                logger.info(`No repeatable refresh job found for feed ${feed.id}`);
            }
        } catch (error) {
            logger.error(
                `Could not remove refresh job for feed ${feed.id}: ${
                    error instanceof Error ? error.message : error
                }`
            );
            result.failed++;
            continue;
        }

        const deleteResult = await FeedRepository.deleteFeed(feed.id);

        if (!deleteResult.success) {
            logger.error(`Could not delete feed ${feed.id}: ${deleteResult.message}`);
            result.failed++;
            continue;
        }

        if (!deleteResult.data) {
            logger.info(
                `Feed ${feed.id} has subscribers or saved posts, keeping it and restoring its refresh job`
            );
            try {
                await fetchRssFeedWorker().repeatable({ feedId: feed.id });
            } catch (error) {
                logger.error(
                    `Could not restore refresh job for feed ${feed.id}: ${
                        error instanceof Error ? error.message : error
                    }`
                );
                result.failed++;
                continue;
            }

            result.skipped++;
            continue;
        }

        result.deleted++;
        logger.info(`Deleted orphaned feed ${feed.id} (${feed.rssUrl})`);
    }

    return result;
};

const processor = async (job: Job) => {
    const logger = createWorkerLogger("worker:cleanup-feeds", job);
    const result = await cleanupOrphanedFeeds(logger);

    logger.info(
        `Orphaned feed cleanup finished: ${result.deleted} deleted, ${result.skipped} skipped, ${result.failed} failed`
    );

    return Result.okEmpty();
};

export const cleanupFeedsWorker = () =>
    createWorker("cleanupFeeds", processor, {
        concurrency: 1,
        repeatJobId: () => "cleanup-feeds",
        repeatSlot: () => toMilliseconds({ hours: 4 }),
    });
