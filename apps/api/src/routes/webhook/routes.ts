import { createHonoInstance } from "@app/instance";
import { raise } from "@banjoanton/utils";
import type { UserJSON, WebhookEvent } from "@clerk/clerk-sdk-node";
import { IncomingHttpHeaders } from "node:http";
import { UserService } from "server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { Result, createLogger } from "utils";

export const webhook = createHonoInstance();
const logger = createLogger("api:webhook");

webhook.post("/user", async c => {
    const payload = await c.req.text();
    const headersList = c.req.headers;
    const svixHeaders = {
        "svix-id": headersList.get("svix-id"),
        "svix-timestamp": headersList.get("svix-timestamp"),
        "svix-signature": headersList.get("svix-signature"),
    };

    const webhookSecret = process.env.WEBHOOK_SECRET ?? raise("WEBHOOK_SECRET is not set");

    const clerkWebhook = new Webhook(webhookSecret);
    let evt: WebhookEvent | null = null;

    try {
        evt = clerkWebhook.verify(
            payload,
            svixHeaders as IncomingHttpHeaders & WebhookRequiredHeaders
        ) as WebhookEvent;
    } catch (error) {
        console.error((error as Error).message);
        return c.json(Result.error("Invalid signature", "InternalError"));
    }

    if (evt.type !== "user.created") {
        return c.json(Result.error("Invalid event type", "InternalError"));
    }

    const {
        id,
        email_addresses: emailAddresses,
        first_name: firstName,
        last_name: lastName,
    } = evt.data as UserJSON;
    const email = emailAddresses[0]?.email_address;

    if (!email) {
        logger.error(`User created without email: ${id}`);
        return c.json(Result.error("Invalid email", "InternalError"));
    }

    logger.info(`User created: ${id} ${email}`);

    const name = firstName && lastName ? `${firstName} ${lastName}` : "";

    const res = await UserService.createUser({
        externalId: id,
        email,
        name: name,
    });

    if (!res.success) {
        logger.error(`Could not create user with externalId: ${id} and email: ${email}`);
        return c.json(
            Result.error(
                `Could not create user with externalId: ${id} and email: ${email}`,
                "InternalError"
            )
        );
    }

    logger.info(`Created user with externalId: ${id} and email: ${email}`);
    return c.json(Result.okEmpty());
});
