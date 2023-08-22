import { auth } from "firebase-server";
import { Context, Next } from "hono";
import { UserRepository } from "server";
import { createLogger } from "utils";

const logger = createLogger("authMiddleware");

const allowedPaths: string[] = [];

export const authMiddleware = async (c: Context, next: Next) => {
    const url = new URL(c.req.url);

    if (allowedPaths.some(path => url.pathname.startsWith(path))) {
        await next();
        return;
    }

    const authHeader = c.req.headers.get("Authorization");

    if (!authHeader) {
        logger.info("No auth header");
        return new Response("Unauthorized", { status: 401 });
    }

    if (!authHeader?.startsWith("Bearer ")) {
        logger.info("No bearer token");
        return new Response("Unauthorized", { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken) {
        logger.info("No id token");
        return new Response("Unauthorized", { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    if (!decodedToken) {
        logger.info("No decoded token");
        return new Response("Unauthorized", { status: 401 });
    }

    const userIdResponse = await UserRepository.getIdByExternalId(decodedToken.uid);

    if (!userIdResponse.success) {
        logger.info("No user id in database, creating user");

        const externalId = decodedToken.uid;
        const email = decodedToken.email;
        const name = decodedToken.name;

        if (!externalId || !email || !name) {
            logger.error("No externalId, email or name in decoded token");
            return new Response("Unauthorized", { status: 401 });
        }

        const user = await UserRepository.createUser({
            externalId,
            email,
            name,
        });

        if (!user.success) {
            logger.error("Could not create user");
            return new Response("Unauthorized", { status: 401 });
        }

        logger.info("Created user with id: ", user.data.id);

        c.set("userId", user.data.id);

        await next();
        return;
    }

    c.set("userId", userIdResponse.data);

    await next();
};
