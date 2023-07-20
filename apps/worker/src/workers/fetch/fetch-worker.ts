import { createWorker } from "@/create-worker";
import { addToUsersWorker } from "@/workers/add-to-users/add-to-users-worker";
import { Job } from "bullmq";
import { FeedWithContent } from "db";
import { ItemRepository, ParseService, Result, createLogger } from "server";

const logger = createLogger("FetchWorker");

type FetchJobData = {
    feed: FeedWithContent;
};

export const processor = async (job: Job<FetchJobData>) => {
    const { feed } = job.data;

    logger.info(`Fetching ${feed.rssUrl}`);

    const updatedContent = await ParseService.shouldParseAgain(feed.contentItems, feed.rssUrl);

    if (!updatedContent) {
        logger.info("no need to fetch again");
        return Result.okEmpty();
    }

    logger.info("Successfully fetched rss content");

    const updateContentResult = await ItemRepository.createContent(updatedContent, feed.id);

    if (!updateContentResult.success) {
        logger.error("Failed to update content", updateContentResult.message);
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

export const fetchWorker = createWorker<FetchJobData>("fetchWorker", processor);
