import { Job } from "bullmq";
import { Result } from "utils";
import { FeedRepository } from "../../../repositories/FeedRepository";
import { ItemRepository } from "../../../repositories/ItemRepository";
import { ParseService } from "../../../services/ParseService";
import { createWorker } from "../../create-worker";
import { createWorkerLogger } from "../../logger";
import { addToUsersWorker } from "../add-to-users/add-to-users-worker";

type FetchJobData = {
    feedId: number;
};

const processor = async (job: Job<FetchJobData>) => {
    const { feedId } = job.data;
    const logger = createWorkerLogger("worker:fetch-rss-feed", job);

    logger.info(`Fetching feed with id ${feedId}`);

    const feedResult = await FeedRepository.getFeedWithContentById(feedId);

    if (!feedResult.success) {
        logger.error(`Could not find feed with id ${feedId}`);
        throw new Error(`Could not find feed with id ${feedId}`);
    }

    const feed = feedResult.data;

    logger.info(`Fetching ${feed.rssUrl}`);

    const updatedContent = await ParseService.shouldParseAgain(feed.contentItems, feed.rssUrl);

    if (!updatedContent) {
        logger.info("no need to fetch again");
        return Result.okEmpty();
    }

    logger.info("Successfully fetched rss content");

    const updateContentResult = await ItemRepository.createContent(updatedContent, feed.id);

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

    await addToUsersWorker.add({
        content: updateContentResult.data,
        feedId: feed.id,
    });

    return Result.okEmpty();
};

export const fetchRssFeedWorker = createWorker<FetchJobData>("fetchRssFeedWorker", processor);
