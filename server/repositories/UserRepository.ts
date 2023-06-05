import { Result } from "@/models/result";
import createLogger from "@/server/lib/logger";
import prisma from "@/server/repositories/prisma";
import "server-only";

const logger = createLogger("UserRepository");

const getIdByExternalId = async (externalId: string): Promise<Result<number>> => {
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
