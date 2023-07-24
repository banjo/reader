import { Job } from "bullmq";
import { Result } from "utils";
import { FeedRepository } from "../../../repositories/FeedRepository";
import { ItemRepository } from "../../../repositories/ItemRepository";
import { ParseService } from "../../../services/ParseService";
import { createWorker } from "../../create-worker";
import { addToUsersWorker } from "../add-to-users/add-to-users-worker";

type FetchJobData = {
    feedId: number;
};

export const processor = async (job: Job<FetchJobData>) => {
    const { feedId } = job.data;
    job.log(`Fetching feed with id ${feedId}`);

    const feedResult = await FeedRepository.getFeedWithContentById(feedId);

    if (!feedResult.success) {
        job.log(`Could not find feed with id ${feedId}`);
        throw new Error(`Could not find feed with id ${feedId}`);
    }

    const feed = feedResult.data;

    job.log(`Fetching ${feed.rssUrl}`);

    const updatedContent = await ParseService.shouldParseAgain(feed.contentItems, feed.rssUrl);

    if (!updatedContent) {
        job.log("no need to fetch again");
        return Result.okEmpty();
    }

    job.log("Successfully fetched rss content");

    const updateContentResult = await ItemRepository.createContent(updatedContent, feed.id);

    if (!updateContentResult.success) {
        job.log(`Failed to update content: ${updateContentResult.message}`);
        throw new Error(
            `Failed to update content for feed ${feed.id}: ${updateContentResult.message}`
        );
    }

    if (updateContentResult.data.length === 0) {
        job.log("No new content");
        return Result.okEmpty();
    }

    await addToUsersWorker.add({
        content: updateContentResult.data,
        feedId: feed.id,
    });

    return Result.okEmpty();
};

export const fetchWorker = createWorker<FetchJobData>("fetchWorker", processor);
