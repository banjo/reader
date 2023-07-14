import { prisma } from "db";
import { createLogger } from "../lib/logger";
import { AsyncResultType, Result } from "../shared/models/result";

const logger = createLogger("UserRepository");

const getIdByExternalId = async (externalId: string): AsyncResultType<number> => {
    const user = await prisma.user.findUnique({
        where: {
            externalId,
        },
    });

    if (!user) {
        logger.error(`User not found with externalId: ${externalId}`);
        return Result.error("User not found", "NotFound");
    }

    logger.trace(`User found with externalId: ${externalId}`);
    return Result.ok(user.id);
};

const getUsersByFeedId = async (feedId: number) => {
    const users = await prisma.user.findMany({
        where: {
            feeds: {
                some: {
                    id: feedId,
                },
            },
        },
    });

    return users;
};

export const UserRepository = {
    getIdByExternalId,
    getUsersByFeedId,
};
