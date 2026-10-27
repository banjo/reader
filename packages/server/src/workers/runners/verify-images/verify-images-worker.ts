import { Job } from "bullmq";
import { Result } from "utils";
import { ContentRepository } from "../../../repositories/ContentRepository";
import { ParseService } from "../../../services/ParseService";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const limit = parsePositiveInt(process.env.VERIFY_IMAGES_LIMIT, 2_000);
const olderThanDays = parsePositiveInt(process.env.VERIFY_IMAGES_OLDER_THAN_DAYS, 14);
const requestConcurrency = parsePositiveInt(process.env.VERIFY_IMAGES_CONCURRENCY, 5);

type VerifyResult = "valid" | "cleared" | "checked";

const verifyImage = async (
    content: { id: number; imageUrl: string | null },
    logger: ReturnType<typeof createWorkerLogger>
): Promise<VerifyResult> => {
    const now = new Date();

    if (!content.imageUrl) {
        return "checked";
    }

    const image = await ParseService.validateImage(content.imageUrl, { attempts: 1 });

    if (image.success) {
        const update = await ContentRepository.updateContentImageStatus(content.id, {
            imageCheckedAt: now,
        });

        if (!update.success) {
            throw new Error(`Could not record image check for content ${content.id}`);
        }

        return "valid";
    }

    if (!ParseService.isClearableImageError(image)) {
        const update = await ContentRepository.updateContentImageStatus(content.id, {
            imageCheckedAt: now,
        });

        if (!update.success) {
            throw new Error(`Could not record image check for content ${content.id}`);
        }

        logger.info(`Kept unverified image for content ${content.id}: ${image.message}`);
        return "checked";
    }

    // Leave it unchecked so the hourly image scan makes one new attempt.
    const update = await ContentRepository.updateContentImageStatus(content.id, {
        imageUrl: null,
        hasFetchedImage: false,
        imageCheckedAt: now,
    });

    if (!update.success) {
        throw new Error(`Could not clear image for content ${content.id}`);
    }

    logger.info(`Cleared broken image for content ${content.id}: ${content.imageUrl}`);
    return "cleared";
};

const processor = async (job: Job) => {
    const logger = createWorkerLogger("worker:verify-images", job);
    const olderThan = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const contentResult = await ContentRepository.getContentWithImage({ olderThan, limit });

    if (!contentResult.success) {
        logger.error("Could not find content with images");
        throw new Error("Could not find content with images");
    }

    const content = contentResult.data;
    logger.info(
        `Verifying up to ${limit} images not checked since ${olderThan.toISOString()} (${content.length} eligible)`
    );

    const counts: Record<VerifyResult, number> = {
        valid: 0,
        cleared: 0,
        checked: 0,
    };

    for (let index = 0; index < content.length; index += requestConcurrency) {
        const batch = content.slice(index, index + requestConcurrency);
        const results = await Promise.all(batch.map(item => verifyImage(item, logger)));

        for (const result of results) {
            counts[result]++;
        }
    }

    logger.info(
        `Image verification finished: ${counts.valid} valid, ${counts.cleared} cleared, ${counts.checked} unchecked`
    );
    return Result.okEmpty();
};

export const verifyImagesWorker = () => createWorker("verifyImages", processor, { concurrency: 1 });
