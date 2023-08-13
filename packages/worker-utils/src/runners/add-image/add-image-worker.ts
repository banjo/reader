import { Job } from "bullmq";
import { ContentRepository, ParseService } from "server";
import { Result } from "utils";
import { createWorker } from "../../create-worker";
import { createWorkerLogger } from "../../logger";

type AddImageWorker = {
    contentId: number;
    url: string;
};

const processor = async (job: Job<AddImageWorker>) => {
    const { contentId, url } = job.data;
    const logger = createWorkerLogger("AddImageWorker", job);

    logger.info(`Adding image to content with id ${contentId} with image url ${url}`);

    const parseResult = await ParseService.parseImage(url);

    if (!parseResult.success) {
        logger.error(`Failed to parse image ${url} - ${parseResult.message}`);
        throw new Error(`Failed to parse image ${url} - ${parseResult.message}`);
    }

    logger.info(`Successfully parsed image ${url}`);

    const addToDbResult = await ContentRepository.updateContentImage(contentId, parseResult.data);

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

export const addImageWorker = createWorker<AddImageWorker>("addImage", processor);
