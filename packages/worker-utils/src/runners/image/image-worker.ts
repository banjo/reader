import { Job } from "bullmq";
import { ContentRepository } from "server";
import { Result } from "utils";
import { createWorker } from "../../create-worker";
import { createWorkerLogger } from "../../logger";
import { addImageWorker } from "../add-image/add-image-worker";

const processor = async (job: Job) => {
    const logger = createWorkerLogger("ImageWorker", job);

    logger.info(`Fethcing images for all content`);

    const contentResult = await ContentRepository.getContentWithoutImage();

    if (!contentResult.success) {
        logger.error(`Could not find content`);
        throw new Error(`Could not find content`);
    }

    const content = contentResult.data;

    logger.info(`Fetched ${content.length} content items without image`);

    await Promise.all(
        content.map(async item => {
            await addImageWorker.add({
                contentId: item.id,
                url: item.link,
            });
        })
    );

    logger.info(`Added ${content.length} to add image worker`);

    return Result.okEmpty();
};

export const imageWorker = createWorker("imageWorker", processor);
