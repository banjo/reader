import { ItemContent, prisma } from "db";
import { AsyncResultType } from "model";
import { Result, createLogger } from "utils";

const logger = createLogger("ContentRepository");

const getAllContentById = async (feedId: number): AsyncResultType<ItemContent[]> => {
    let items: ItemContent[];
    try {
        items = await prisma.itemContent.findMany({
            where: {
                feedId: feedId,
            },
        });

        return Result.ok(items);
    } catch (error: unknown) {
        logger.error(`Could not find content for feed with id ${feedId} - ${error}`);
        return Result.error(`Could not find content for feed with id ${feedId}`, "InternalError");
    }
};

const updateContentImageStatus = async (
    contentId: number,
    status: { imageUrl?: string | null; hasFetchedImage?: boolean }
): AsyncResultType<ItemContent> => {
    let content: ItemContent | null;
    try {
        content = await prisma.itemContent.update({
            where: {
                id: contentId,
            },
            data: {
                imageUrl: status.imageUrl === undefined ? undefined : status.imageUrl,
                hasFetchedImage: status.hasFetchedImage ?? undefined,
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not update content with id ${contentId} - ${error}`);
        return Result.error(`Could not update content with id ${contentId}`, "InternalError");
    }

    return Result.ok(content);
};

const getContentWithoutImage = async ({
    cursorId,
    limit = 200,
}: {
    cursorId?: number;
    limit?: number;
} = {}): AsyncResultType<ItemContent[]> => {
    let items: ItemContent[];
    try {
        items = await prisma.itemContent.findMany({
            where: {
                hasFetchedImage: false,
                ...(cursorId ? { id: { gt: cursorId } } : {}),
            },
            orderBy: {
                id: "asc",
            },
            take: limit,
        });

        return Result.ok(items);
    } catch (error: unknown) {
        logger.error(`Could not find content without image - ${error}`);
        return Result.error(`Could not find content without image`, "InternalError");
    }
};

const getContentWithImage = async ({
    cursorId,
    limit = 200,
}: {
    cursorId?: number;
    limit?: number;
} = {}): AsyncResultType<ItemContent[]> => {
    let items: ItemContent[];
    try {
        items = await prisma.itemContent.findMany({
            where: {
                imageUrl: { not: null },
                ...(cursorId ? { id: { gt: cursorId } } : {}),
            },
            orderBy: {
                id: "asc",
            },
            take: limit,
        });

        return Result.ok(items);
    } catch (error: unknown) {
        logger.error(`Could not find content with image - ${error}`);
        return Result.error(`Could not find content with image`, "InternalError");
    }
};

export type ContentForRefresh = {
    id: number;
    link: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    hasFetchedImage: boolean;
    feed: { name: string };
};

const getContentForRefresh = async ({
    olderThan,
    limit = 500,
}: {
    olderThan: Date;
    limit?: number;
}): AsyncResultType<ContentForRefresh[]> => {
    let items: ContentForRefresh[];
    try {
        items = await prisma.itemContent.findMany({
            where: {
                lastFetch: { lt: olderThan },
                items: { some: {} },
            },
            orderBy: [{ lastFetch: "asc" }, { id: "asc" }],
            take: limit,
            select: {
                id: true,
                link: true,
                title: true,
                description: true,
                imageUrl: true,
                hasFetchedImage: true,
                feed: { select: { name: true } },
            },
        });

        return Result.ok(items);
    } catch (error: unknown) {
        logger.error(`Could not find content for refresh - ${error}`);
        return Result.error(`Could not find content for refresh`, "InternalError");
    }
};

const updateContentFromRefresh = async (
    contentId: number,
    update: {
        title?: string;
        description?: string;
        imageUrl?: string;
        hasFetchedImage?: boolean;
        lastFetch: Date;
    }
): AsyncResultType<ItemContent> => {
    let content: ItemContent;
    try {
        content = await prisma.itemContent.update({
            where: { id: contentId },
            data: {
                title: update.title,
                description: update.description,
                imageUrl: update.imageUrl,
                hasFetchedImage: update.hasFetchedImage,
                lastFetch: update.lastFetch,
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not refresh content with id ${contentId} - ${error}`);
        return Result.error(`Could not refresh content with id ${contentId}`, "InternalError");
    }

    return Result.ok(content);
};

export const ContentRepository = {
    getAllContentById,
    updateContentImageStatus,
    updateContentFromRefresh,
    getContentWithoutImage,
    getContentWithImage,
    getContentForRefresh,
};
