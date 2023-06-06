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
        isRead: false,
        isBookmarked: true,
        title: "Nesting Rounded Corners in CSS",
        description: "This is the description",
        link: "https://www.banjocode.com/post/css/nesting-rounded-corners",
        content: "This is the content",
        html: "This is the html",
        lastFetch: new Date(),
        pubDate: new Date(),
    },
    {
        id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 1,
        userId: 1,
        isRead: false,
        isBookmarked: true,
        title: "Some other title",
        description: "This is another slighly longer description",
        link: "https://www.banjocode.com/post/css/nesting-rounded-corners",
        content: "This is some other content",
        html: "<p><strong>This is some other html</strong></p>",
        lastFetch: new Date(),
        pubDate: new Date(),
    },
    {
        id: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 1,
        userId: 1,
        isRead: false,
        isBookmarked: false,
        title: "Exploring CSS Grids",
        description: "Another intriguing post about CSS",
        link: "https://www.example.com/post/css/grids",
        content: "example content about CSS.Grids",
        html: "<p>Quick example of HTML for <em>CSS Grids</em></p>",
        lastFetch: new Date(),
        pubDate: new Date(),
    },
    {
        id: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 1,
        userId: 1,
        isRead: false,
        isBookmarked: true,
        title: "JavaScript Asynchronous Patterns",
        description: "A deep dive into async patterns in JS",
        link: "https://www.example.com/post/js/async-patterns",
        content: "Asynchronous JavaScript can be tricky, let's explore it.",
        html: "<h2>Defining <i>Asynchronous</i> in JavaScript</h2>",
        lastFetch: new Date(),
        pubDate: new Date(),
    },
    {
        id: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 1,
        userId: 1,
        isRead: true,
        isBookmarked: false,
        title: "React Component Best Practices",
        description: "Tips and tricks for React components",
        link: "https://www.example.com/post/react/best-practices",
        content: "Reviewing the best practices for React components",
        html: '<p>Some <span style="text-decoration: underline;">ideas</span> for React components</p>',
        lastFetch: new Date(),
        pubDate: new Date(),
    },
    {
        id: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 1,
        userId: 1,
        isRead: false,
        isBookmarked: true,
        title: "Intro to Vue.js",
        description: "A beginner's guide to Vue.js",
        link: "https://www.example.com/post/vue/beginners-guide",
        content: "Get started with Vue.js and learn the basics",
        html: "<p><strong>Vue.js</strong> can make your life easier!</p>",
        lastFetch: new Date(),
        pubDate: new Date(),
    },
    {
        id: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedId: 2,
        userId: 1,
        isRead: false,
        isBookmarked: true,
        title: "Intro to Vue.js",
        description: "A beginner's guide to Vue.js",
        link: "https://www.example.com/post/vue/beginners-guide",
        content: "Get started with Vue.js and learn the basics",
        html: "<p><strong>Vue.js</strong> can make your life easier!</p>",
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
