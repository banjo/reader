import { Feed, Item, PrismaClient, User } from "@prisma/client";
import { randomUUID } from "node:crypto";
const prisma = new PrismaClient();

const users: User[] = [
    {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "anton.odman@gmail.com",
        externalId: "user_2QfHIyurHwaBLIyGO2H0Q4icCr8",
        name: "Anton Ödman",
    },
];

const feeds: Feed[] = [
    {
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 1,
        link: "https://www.banjoanton.com/rss.xml",
        name: "Banjoanton",
        publicUrl: randomUUID(),
        imageUrl: "https://robohash.org/do.png",
        ttl: 10_000,
    },
    {
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 2,
        link: "https://www.joshwcomeau.com/rss.xml",
        name: "Josh Comeau",
        publicUrl: randomUUID(),
        imageUrl: "https://robohash.org/dolare.png",
        ttl: 10_000,
    },
];

const items: Item[] = [
    {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 1,
        userId: 1,
        hasRead: false,
        hasBookmarked: false,
        title: "Nesting Rounded Corners in CSS",
        link: "https://www.banjocode.com/post/css/nesting-rounded-corners",
        content: "This is the content",
        html: "This is the html",
        lastFetch: new Date(),
        pubDate: new Date(),
    },
];

async function main() {
    for (const feed of feeds) {
        await prisma.feed.upsert({
            where: { id: feed.id },
            update: {},
            create: feed,
        });
    }

    for (const user of users) {
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                ...user,
                feeds: {
                    connect: feeds.map(feed => ({ id: feed.id })),
                },
            },
        });
    }

    for (const item of items) {
        await prisma.item.upsert({
            where: { id: item.id },
            update: {},
            create: item,
        });
    }

    console.log("Done with seed!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
        return process.exit(0);
    })
    // eslint-disable-next-line unicorn/prefer-top-level-await
    .catch(async error => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
