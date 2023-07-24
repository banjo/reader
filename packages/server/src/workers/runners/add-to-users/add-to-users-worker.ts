import { Job } from "bullmq";
import { ItemContent } from "db";
import { Result } from "utils";
import { ItemRepository } from "../../../repositories/ItemRepository";
import { UserRepository } from "../../../repositories/UserRepository";
import { createWorker } from "../../create-worker";

type AddToUsersJobData = {
    content: ItemContent[];
    feedId: number;
};

const processor = async (job: Job<AddToUsersJobData>) => {
    const { content, feedId } = job.data;

    const users = await UserRepository.getUsersByFeedId(feedId);

    if (!users) {
        job.log(`No users found for feedId: ${feedId}`);
        return Result.okEmpty();
    }

    job.log(`Adding ${content.length} items to ${users.length} users`);

    await Promise.all(
        users.map(async user => {
            const result = await ItemRepository.createItemsFromContent(content, feedId, user.id);

            if (!result.success) {
                job.log(`Failed to add items to user ${user.id} - ${result.message}`);
                throw new Error(`Failed to add items to user ${user.id}: ${result.message}`);
            }

            job.log(`Added ${content.length} items to user with id ${user.id}`);
        })
    );

    job.log(`Successfully added ${content.length} items to ${users.length} users`);

    return Result.okEmpty();
};

export const addToUsersWorker = createWorker<AddToUsersJobData>("addToUsers", processor);
