import { Job, UnrecoverableError } from "bullmq";
import { Result } from "utils";
import { FeedRepository } from "../../../repositories/FeedRepository";
import { ItemRepository } from "../../../repositories/ItemRepository";
import { ParseService } from "../../../services/ParseService";
import { externalRequestRetry } from "../../../services/ExternalRequestService";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";
import { addToUsersWorker } from "../add-to-users/add-to-users-worker";

type FetchJobData = {
    feedId: number;
};

const processor = async (job: Job<FetchJobData>) => {
    const { feedId } = job.data;
    const logger = createWorkerLogger("worker:fetch-rss-feed", job);

    logger.info(`Fetching feed with id ${feedId}`);

    const feedResult = await FeedRepository.getFeedForRefresh(feedId);

    if (!feedResult.success) {
        logger.error(`Could not find feed with id ${feedId}`);
        throw new UnrecoverableError(`Could not find feed with id ${feedId}`);
    }

    const feed = feedResult.data;

    logger.info(`Fetching ${feed.rssUrl}`);

    const updatedContent = await ParseService.shouldParseAgain({
        currentLinks: new Set(feed.contentItems.map(content => content.link)),
        url: feed.rssUrl,
        attempts: 1,
    });

    if (!updatedContent.success) {
        const message = `Could not refresh feed ${feedId}: ${updatedContent.message}`;
        if (updatedContent.retryable) {
            throw new Error(message);
        }
        throw new UnrecoverableError(message);
    }

    if (updatedContent.data.length === 0) {
        logger.info("no need to fetch again");
        return Result.okEmpty();
    }

    logger.info("Successfully fetched rss content");

    const updateContentResult = await ItemRepository.createContentIds(updatedContent.data, feed.id);

    if (!updateContentResult.success) {
        logger.error(`Failed to update content: ${updateContentResult.message}`);
        throw new Error(
            `Failed to update content for feed ${feed.id}: ${updateContentResult.message}`
        );
    }

    if (updateContentResult.data.length === 0) {
        logger.info("No new content");
        return Result.okEmpty();
    }

    await addToUsersWorker().add({
        contentIds: updateContentResult.data,
        feedId: feed.id,
    });

    return Result.okEmpty();
};

// Sequential feed ids land far apart, which spreads refreshes evenly across the hour.
const GOLDEN_RATIO_FRACTION = 0.618_033_988_75;

export const fetchRssFeedWorker = () =>
    createWorker<FetchJobData>("fetchRssFeedWorker", processor, {
        jobOptions: externalRequestRetry,
        repeatJobId: ({ feedId }) => `feed-${feedId}`,
        repeatSlot: ({ feedId }, every) =>
            Math.floor(((feedId * GOLDEN_RATIO_FRACTION) % 1) * every),
    });
