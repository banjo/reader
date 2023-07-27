import { ResponseService } from "@/server/services/ResponseService";
import { raise } from "@banjoanton/utils";
import type { UserJSON, WebhookEvent } from "@clerk/clerk-sdk-node";
import { headers } from "next/headers";
import { IncomingHttpHeaders } from "node:http";
import { UserService } from "server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { createLogger } from "utils";

const webhookSecret = process.env.WEBHOOK_SECRET ?? raise("WEBHOOK_SECRET is not set");
const logger = createLogger("WebhookUserRoute");

async function handler(request: Request) {
    const payload = await request.text();
    const headersList = headers();
    const svixHeaders = {
        "svix-id": headersList.get("svix-id"),
        "svix-timestamp": headersList.get("svix-timestamp"),
        "svix-signature": headersList.get("svix-signature"),
    };

    const webhook = new Webhook(webhookSecret);
    let evt: WebhookEvent | null = null;

    try {
        evt = webhook.verify(
            payload,
            svixHeaders as IncomingHttpHeaders & WebhookRequiredHeaders
        ) as WebhookEvent;
    } catch (error) {
        console.error((error as Error).message);
        return ResponseService.error("Invalid signature", "InternalError");
    }

    if (evt.type !== "user.created") {
        return ResponseService.error("Invalid event type", "InternalError");
    }

    const { id, email_addresses } = evt.data as UserJSON;
    const email = email_addresses[0]?.email_address;

    if (!email) {
        logger.error(`User created without email: ${id}`);
        return ResponseService.error("Invalid email", "InternalError");
    }

    logger.info(`User created: ${id} ${email}`);

    const res = await UserService.createUser(id, email);

    if (!res.success) {
        logger.error(`Could not create user with externalId: ${id} and email: ${email}`);
        return ResponseService.error(
            `Could not create user with externalId: ${id} and email: ${email}`,
            "InternalError"
        );
    }

    logger.info(`Created user with externalId: ${id} and email: ${email}`);
    return ResponseService.emptySuccess();
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
