import { Job } from "bullmq";
import { Result } from "utils";
import { ContentRepository } from "../../../repositories/ContentRepository";
import { ParseService } from "../../../services/ParseService";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";

const batchSize = 100;

const processor = async (job: Job) => {
    const logger = createWorkerLogger("worker:verify-images", job);
    let cursorId: number | undefined;
    let checked = 0;
    let cleared = 0;

    for (;;) {
        const contentResult = await ContentRepository.getContentWithImage({
            cursorId,
            limit: batchSize,
        });

        if (!contentResult.success) {
            logger.error("Could not find content with images");
            throw new Error("Could not find content with images");
        }

        const content = contentResult.data;

        if (content.length === 0) {
            break;
        }

        for (const item of content) {
            if (!item.imageUrl) {
                continue;
            }

            const image = await ParseService.validateImage(item.imageUrl, { attempts: 1 });
            checked++;

            if (image.success || !ParseService.isClearableImageError(image)) {
                continue;
            }

            // Leave it unchecked so the hourly image scan makes one new attempt.
            const update = await ContentRepository.updateContentImageStatus(item.id, {
                imageUrl: null,
                hasFetchedImage: false,
            });

            if (!update.success) {
                logger.error(`Could not clear image for content ${item.id}`);
                throw new Error(`Could not clear image for content ${item.id}`);
            }

            cleared++;
            logger.info(`Cleared broken image for content ${item.id}: ${item.imageUrl}`);
        }

        cursorId = content[content.length - 1]?.id;

        if (content.length < batchSize) {
            break;
        }
    }

    logger.info(`Checked ${checked} images and cleared ${cleared}`);
    return Result.okEmpty();
};

export const verifyImagesWorker = () => createWorker("verifyImages", processor, { concurrency: 1 });
