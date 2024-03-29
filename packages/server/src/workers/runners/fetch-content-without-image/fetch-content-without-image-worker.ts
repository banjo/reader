import { Job } from "bullmq";
import { Result } from "utils";
import { ContentRepository } from "../../../repositories/ContentRepository";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";
import { addImageWorker } from "../add-image/add-image-worker";

const processor = async (job: Job) => {
    const logger = createWorkerLogger("worker:fetch-content-without-image", job);

    logger.info(`Fetching images for all content`);

    const contentResult = await ContentRepository.getContentWithoutImage();

    if (!contentResult.success) {
        logger.error(`Could not find content`);
        throw new Error(`Could not find content`);
    }

    const content = contentResult.data;

    logger.info(`Fetched ${content.length} content items without image`);

    await Promise.all(
        content.map(async item => {
            await addImageWorker().add({
                contentId: item.id,
                url: item.link,
            });
        })
    );

    logger.info(`Added ${content.length} to add image worker`);

    return Result.okEmpty();
};

export const fetchContentWithoutImageWorker = () =>
    createWorker("fetchContentWithoutImageWorker", processor);
