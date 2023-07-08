import createLogger from "@/server/lib/logger";
import { AsyncResultType, Result } from "@/shared/models/result";
import { ItemContent } from "@prisma/client";
import { prisma } from "db";

const logger = createLogger("ContentRepository");

const getAllContentById = async (
    feedId: number,
): AsyncResultType<ItemContent[]> => {
    let items: ItemContent[];
    try {
        items = await prisma.itemContent.findMany({
            where: {
                feedId: feedId,
            },
        });

        return Result.ok(items);
    } catch (error: unknown) {
        logger.error(
            `Could not find content for feed with id ${feedId} - ${error}`,
        );
        return Result.error(
            `Could not find content for feed with id ${feedId}`,
            "InternalError",
        );
    }
};

export const ContentRepository = {
    getAllContentById,
};
