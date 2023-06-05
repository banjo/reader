import "server-only";
import { Result } from "../models/result";
import prisma from "./prisma";

const getIdByExternalId = async (externalId: string): Promise<Result<number>> => {
    const user = await prisma.user.findUnique({
        where: {
            externalId,
        },
    });

    if (!user) {
        return Result.error("User not found", "NotFound");
    }

    return Result.ok(user.id);
};

export const UserRepository = {
    getIdByExternalId,
};
