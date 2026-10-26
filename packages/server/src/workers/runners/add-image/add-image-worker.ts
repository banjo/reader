import { Job } from "bullmq";
import { Result } from "utils";
import { ContentRepository } from "../../../repositories/ContentRepository";
import { ParseService } from "../../../services/ParseService";
import { externalRequestRetry } from "../../../services/ExternalRequestService";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";

type AddImageWorker = {
    contentId: number;
    url: string;
};

const processor = async (job: Job<AddImageWorker>) => {
    const { contentId, url } = job.data;
    const logger = createWorkerLogger("worker:add-image", job);

    logger.info(`Adding image to content with id ${contentId} with image url ${url}`);

    const parseResult = await ParseService.parseImage(url, { attempts: 1 });

    if (!parseResult.success) {
        logger.error(`Failed to parse image ${url}: ${parseResult.message}`);
        if (parseResult.retryable) {
            throw new Error(`Temporary image lookup failure: ${parseResult.message}`);
        }
    }

    const addToDbResult = await ContentRepository.updateContentImageStatus(contentId, {
        hasFetchedImage: true,
        imageUrl: parseResult.success ? parseResult.data : undefined,
    });

    if (!addToDbResult.success) {
        logger.error(
            `Failed to add image to content with id ${contentId} - ${addToDbResult.message}`
        );
        throw new Error(
            `Failed to add image to content with id ${contentId} - ${addToDbResult.message}`
        );
    }

    return Result.okEmpty();
};

export const addImageWorker = () =>
    createWorker<AddImageWorker>("addImage", processor, {
        concurrency: 5,
        jobOptions: externalRequestRetry,
    });
