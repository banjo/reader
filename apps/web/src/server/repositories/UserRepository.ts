import createLogger from "@/server/lib/logger";
import { AsyncResultType, Result } from "@/shared/models/result";
import { prisma } from "db";

const logger = createLogger("UserRepository");

const getIdByExternalId = async (
    externalId: string,
): AsyncResultType<number> => {
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

export const UserRepository = {
    getIdByExternalId,
};
