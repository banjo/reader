import { PrismaClient } from "db";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient;
}

export {};
