import { Context, Next } from "hono";
import { UserRepository } from "server";
import { createLogger } from "utils";

const logger = createLogger("authMiddleware");

const allowedPaths = ["/api/webhook"];

export const authMiddleware = async (c: Context, next: Next) => {
    const url = new URL(c.req.url);

    if (allowedPaths.some(path => url.pathname.startsWith(path))) {
        await next();
        return;
    }

    const externalUserId = c.req.headers.get("X-External-User-Id");

    if (!externalUserId) {
        logger.info("No external user id");
        return new Response("Unauthorized", { status: 401 });
    }

    const userResponse = await UserRepository.getIdByExternalId(externalUserId);

    if (!userResponse.success) {
        logger.info(`No user found with ID ${externalUserId}`);
        return new Response("Unauthorized", { status: 401 });
    }

    c.set("userId", userResponse.data);

    await next();
};
