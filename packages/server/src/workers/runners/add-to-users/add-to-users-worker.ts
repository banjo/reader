import { Job } from "bullmq";
import { Result } from "utils";
import { z } from "zod";
import { ItemRepository } from "../../../repositories/ItemRepository";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";

type AddToUsersJobData = {
    contentIds: number[];
    feedId: number;
};

const idSchema = z.number().int().positive();
const jobSchema = z.union([
    z.object({ feedId: idSchema, contentIds: z.array(idSchema) }),
    // Jobs queued before this release still contain full content objects.
    z
        .object({ feedId: idSchema, content: z.array(z.object({ id: idSchema })) })
        .transform(({ feedId, content }) => ({ feedId, contentIds: content.map(item => item.id) })),
]);

const processor = async (job: Job<AddToUsersJobData>) => {
    const { contentIds, feedId } = jobSchema.parse(job.data);
    const logger = createWorkerLogger("worker:add-to-users", job);

    const result = await ItemRepository.assignContentToFollowers({ feedId, contentIds });

    if (!result.success) {
        throw new Error(
            `Could not assign content to followers of feed ${feedId}: ${result.message}`
        );
    }

    logger.info(`Assigned ${contentIds.length} posts to followers of feed ${feedId}`);

    return Result.okEmpty();
};

export const addToUsersWorker = () => createWorker<AddToUsersJobData>("addToUsers", processor);
