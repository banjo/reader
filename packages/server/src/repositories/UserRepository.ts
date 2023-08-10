import { prisma, User } from "db";
import { AsyncResultType } from "model";
import { createLogger, Result } from "utils";

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

type CreateUserProps = {
    externalId: string;
    email: string;
    name: string;
};
const createUser = async ({ name, externalId, email }: CreateUserProps): AsyncResultType<User> => {
    const user = await prisma.user.create({
        data: {
            externalId,
            email,
            name,
        },
    });

    return Result.ok(user);
};

export const UserRepository = {
    getIdByExternalId,
    getUsersByFeedId,
    createUser,
};
