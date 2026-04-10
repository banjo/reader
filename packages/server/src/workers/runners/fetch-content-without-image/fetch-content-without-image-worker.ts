import { Job } from "bullmq";
import { Result } from "utils";
import { ContentRepository } from "../../../repositories/ContentRepository";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";
import { addImageWorker } from "../add-image/add-image-worker";

const processor = async (job: Job) => {
    const logger = createWorkerLogger("worker:fetch-content-without-image", job);
    const batchSize = 200;
    let cursorId: number | undefined;
    let totalQueued = 0;

    logger.info(`Fetching images for all content`);

    for (;;) {
        const contentResult = await ContentRepository.getContentWithoutImage({
            cursorId,
            limit: batchSize,
        });

        if (!contentResult.success) {
            logger.error(`Could not find content`);
            throw new Error(`Could not find content`);
        }

        const content = contentResult.data;

        if (content.length === 0) {
            break;
        }

        logger.info(`Fetched batch of ${content.length} content items without image`);

        for (const item of content) {
            await addImageWorker().add({
                contentId: item.id,
                url: item.link,
            });
        }

        totalQueued += content.length;
        cursorId = content[content.length - 1]?.id;

        if (content.length < batchSize) {
            break;
        }
    }

    logger.info(`Added ${totalQueued} to add image worker`);

    return Result.okEmpty();
};

export const fetchContentWithoutImageWorker = () =>
    createWorker("fetchContentWithoutImageWorker", processor);
