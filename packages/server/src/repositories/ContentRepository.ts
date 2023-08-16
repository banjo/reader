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
    status: { imageUrl?: string; hasFetchedImage?: boolean }
): AsyncResultType<ItemContent> => {
    let content: ItemContent | null;
    try {
        content = await prisma.itemContent.update({
            where: {
                id: contentId,
            },
            data: {
                imageUrl: status.imageUrl ?? undefined,
                hasFetchedImage: status.hasFetchedImage ?? undefined,
            },
        });
    } catch (error: unknown) {
        logger.error(`Could not update content with id ${contentId} - ${error}`);
        return Result.error(`Could not update content with id ${contentId}`, "InternalError");
    }

    return Result.ok(content);
};

const getContentWithoutImage = async (): AsyncResultType<ItemContent[]> => {
    let items: ItemContent[];
    try {
        items = await prisma.itemContent.findMany({
            where: {
                hasFetchedImage: false,
            },
        });

        return Result.ok(items);
    } catch (error: unknown) {
        logger.error(`Could not find content without image - ${error}`);
        return Result.error(`Could not find content without image`, "InternalError");
    }
};

export const ContentRepository = {
    getAllContentById,
    updateContentImageStatus,
    getContentWithoutImage,
};
