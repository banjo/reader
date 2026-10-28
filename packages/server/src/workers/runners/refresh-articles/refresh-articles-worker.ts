import { toMilliseconds } from "@banjoanton/utils";
import { Job } from "bullmq";
import { Result } from "utils";
import { ContentForRefresh, ContentRepository } from "../../../repositories/ContentRepository";
import { ParseService } from "../../../services/ParseService";
import { createWorker } from "../../create";
import { createWorkerLogger } from "../../logger";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const limit = parsePositiveInt(process.env.REFRESH_ARTICLES_LIMIT, 500);
const olderThanDays = parsePositiveInt(process.env.REFRESH_ARTICLES_OLDER_THAN_DAYS, 30);
const requestConcurrency = 3;

type RefreshResult = "unchanged" | "updated" | "retry" | "failed";

const refreshContent = async (
    item: ContentForRefresh,
    logger: ReturnType<typeof createWorkerLogger>
): Promise<RefreshResult> => {
    const metadata = await ParseService.parseArticleMetadata(item.link, {
        attempts: 1,
        siteName: item.feed.name,
    });
    const now = new Date();

    if (!metadata.success) {
        if (metadata.retryable) {
            // Keep lastFetch unchanged so the next run tries again.
            return "retry";
        }

        await ContentRepository.updateContentFromRefresh(item.id, { lastFetch: now });
        logger.info(`Could not refresh content ${item.id}: ${metadata.message}`);
        return "failed";
    }

    const parsed = metadata.data;
    const isSiteName = parsed.title?.toLowerCase() === item.feed.name.toLowerCase();
    const title =
        parsed.title && parsed.title !== item.title && !isSiteName && parsed.title.length >= 3
            ? parsed.title
            : undefined;
    const description =
        parsed.description && parsed.description !== item.description
            ? parsed.description
            : undefined;
    const imageUrl =
        parsed.imageUrl && parsed.imageUrl !== item.imageUrl ? parsed.imageUrl : undefined;
    const hasFetchedImage = item.hasFetchedImage ? undefined : true;

    if (!title && !description && !imageUrl && hasFetchedImage === undefined) {
        await ContentRepository.updateContentFromRefresh(item.id, { lastFetch: now });
        return "unchanged";
    }

    const update = await ContentRepository.updateContentFromRefresh(item.id, {
        title,
        description,
        imageUrl,
        hasFetchedImage,
        lastFetch: now,
    });

    if (!update.success) {
        throw new Error(`Could not refresh content ${item.id}: ${update.message}`);
    }

    const changed = [
        title ? "title" : null,
        description ? "description" : null,
        imageUrl ? "image" : null,
    ].filter(Boolean);

    logger.info(`Refreshed content ${item.id}: ${changed.join(", ") || "checked"}`);
    return "updated";
};

const processor = async (job: Job) => {
    const logger = createWorkerLogger("worker:refresh-articles", job);
    const olderThan = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const contentResult = await ContentRepository.getContentForRefresh({
        olderThan,
        limit,
    });

    if (!contentResult.success) {
        logger.error("Could not find content to refresh");
        throw new Error("Could not find content to refresh");
    }

    const content = contentResult.data;
    logger.info(
        `Refreshing up to ${limit} articles not checked since ${olderThan.toISOString()} (${content.length} eligible)`
    );

    const counts: Record<RefreshResult, number> = {
        unchanged: 0,
        updated: 0,
        retry: 0,
        failed: 0,
    };

    for (let index = 0; index < content.length; index += requestConcurrency) {
        const batch = content.slice(index, index + requestConcurrency);
        const results = await Promise.all(batch.map(item => refreshContent(item, logger)));
        for (const result of results) {
            counts[result]++;
        }
    }

    logger.info(
        `Article refresh finished: ${counts.updated} updated, ${counts.unchanged} unchanged, ${counts.retry} retryable, ${counts.failed} failed`
    );
    return Result.okEmpty();
};

export const refreshArticlesWorker = () =>
    createWorker("refreshArticles", processor, {
        concurrency: 1,
        repeatSlot: () => toMilliseconds({ hours: 2 }),
    });
