import { Job } from "bullmq";
import { ItemContent } from "db";
import { Result } from "utils";
import { ItemRepository } from "../../../repositories/ItemRepository";
import { UserRepository } from "../../../repositories/UserRepository";
import { createWorker } from "../../create-worker";
import { createWorkerLogger } from "../../logger";

type AddToUsersJobData = {
    content: ItemContent[];
    feedId: number;
};

const processor = async (job: Job<AddToUsersJobData>) => {
    const { content, feedId } = job.data;
    const logger = createWorkerLogger("worker:add-to-users", job);

    const users = await UserRepository.getUsersByFeedId(feedId);

    if (!users) {
        logger.info(`No users found for feedId: ${feedId}`);
        return Result.okEmpty();
    }

    logger.info(`Adding ${content.length} items to ${users.length} users`);

    await Promise.all(
        users.map(async user => {
            const result = await ItemRepository.createItemsFromContent(content, feedId, user.id);

            if (!result.success) {
                logger.error(`Failed to add items to user ${user.id} - ${result.message}`);
                throw new Error(`Failed to add items to user ${user.id}: ${result.message}`);
            }

            logger.info(`Added ${content.length} items to user with id ${user.id}`);
        })
    );

    logger.info(`Successfully added ${content.length} items to ${users.length} users`);

    return Result.okEmpty();
};

export const addToUsersWorker = createWorker<AddToUsersJobData>("addToUsers", processor);
