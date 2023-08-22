import type { User } from "@prisma/client";
import { prisma } from ".";

const users: User[] = [
    {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "anton.odman@gmail.com",
        externalId: "Y3Qls16qV7dRWrsqRxyLu4ra8wl1",
        name: "Anton Ödman",
    },
    {
        id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "anton.odman@layer10.se",
        externalId: "user_2Qy7IIYAUZW4r4X45dGGOkl4RlC",
        name: "Anton Ödman",
    },
];

// const feeds: Feed[] = [
//     {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         id: 1,
//         description: "This is the description",
//         rssUrl: "https://www.randomFeed.com/rss.xml",
//         url: "https://www.randomFeed.com",
//         name: "Banjoanton",
//         internalIdentifier: randomUUID(),
//         imageUrl: "https://robohash.org/do.png",
//         ttl: 10_000,
//     },
//     {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         id: 2,
//         description: "This is the description 2",
//         url: "https://www.rande.com",
//         rssUrl: "https://www.rande.com/rss.xml",
//         name: "Josh Comeau",
//         internalIdentifier: randomUUID(),
//         imageUrl: "https://robohash.org/dolare.png",
//         ttl: 10_000,
//     },
// ];

// const feeds: Feed[] = [
//     {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         description: "Feber",
//         id: 1,
//         imageUrl: "https://feber.se/images/feber.png",
//         internalIdentifier: randomUUID(),
//         name: "Feber",
//         rssUrl: "https://feber.se/rss/",
//         ttl: 10_000,
//         url: "https://feber.se",
//     },

// const itemContents: ItemContent[] = [
//     {
//         id: 1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         imageUrl: "https://picsum.photos/1080/720",
//         title: "Nesting Rounded Corners in CSS",
//         description: "This is the description",
//         link: "https://www.randomFeed.com/post/css/nesting-rounded-corners",
//         content: "This is the content",
//         htmlContent: "This is the htmlContent",
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
//     {
//         id: 2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         imageUrl: null,
//         title: "Some other title",
//         description: "This is another slighly longer description",
//         link: "https://www.randomFeed.com/post/css/nesting-rounded-corners",
//         content: "This is some other content",
//         htmlContent: "<p><strong>This is some other htmlContent</strong></p>",
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
//     {
//         id: 3,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         title: "Exploring CSS Grids",
//         description: "Another intriguing post about CSS",
//         imageUrl: null,
//         link: "https://www.example.com/post/css/grids",
//         content: "example content about CSS.Grids",
//         htmlContent: "<p>Quick example of htmlContent for <em>CSS Grids</em></p>",
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
//     {
//         id: 4,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         title: "JavaScript Asynchronous Patterns",
//         imageUrl: "https://picsum.photos/1080/720",
//         description: "A deep dive into async patterns in JS",
//         link: "https://www.example.com/post/js/async-patterns",
//         content: "Asynchronous JavaScript can be tricky, let's explore it.",
//         htmlContent: "<h2>Defining <i>Asynchronous</i> in JavaScript</h2>",
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
//     {
//         id: 5,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         title: "React Component Best Practices",
//         imageUrl: "https://picsum.photos/1080/720",
//         description: "Tips and tricks for React components",
//         link: "https://www.example.com/post/react/best-practices",
//         content: "Reviewing the best practices for React components",
//         htmlContent:
//             '<p>Some <span style="text-decoration: underline;">ideas</span> for React components</p>',
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
//     {
//         id: 6,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         title: "Intro to Vue.js",
//         description: "A beginner's guide to Vue.js",
//         link: "https://www.example.com/post/vue/beginners-guide",
//         content: "Get started with Vue.js and learn the basics",
//         imageUrl: "https://picsum.photos/1080/720",
//         htmlContent: "<p><strong>Vue.js</strong> can make your life easier!</p>",
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
//     {
//         id: 7,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 2,
//         imageUrl: "https://picsum.photos/1080/720",
//         title: "Intro to Vue.js",
//         description: "A beginner's guide to Vue.js",
//         link: "https://www.example.com/post/vue/beginners-guide",
//         content: "Get started with Vue.js and learn the basics",
//         htmlContent: "<p><strong>Vue.js</strong> can make your life easier!</p>",
//         lastFetch: new Date(),
//         pubDate: new Date(),
//     },
// ];

// const items: Item[] = [
//     {
//         id: 1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         userId: 1,
//         isRead: false,
//         isBookmarked: true,
//         isFavorite: true,
//         contentId: 1,
//     },
//     {
//         id: 2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         userId: 1,
//         isRead: false,
//         isBookmarked: true,
//         isFavorite: true,
//         contentId: 2,
//     },
//     {
//         id: 3,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         userId: 1,
//         isFavorite: true,
//         isRead: false,
//         isBookmarked: false,
//         contentId: 3,
//     },
//     {
//         id: 4,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         userId: 1,
//         isRead: false,
//         isBookmarked: true,
//         isFavorite: true,
//         contentId: 4,
//     },
//     {
//         id: 5,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         userId: 1,
//         isFavorite: false,
//         isRead: true,
//         isBookmarked: false,
//         contentId: 5,
//     },
//     {
//         id: 6,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 1,
//         userId: 1,
//         isRead: false,
//         isBookmarked: true,
//         isFavorite: false,
//         contentId: 6,
//     },
//     {
//         id: 7,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         feedId: 2,
//         userId: 1,
//         isRead: false,
//         isBookmarked: true,
//         isFavorite: false,
//         contentId: 7,
//     },
// ];

async function main() {
    // for (const feed of feeds) {
    //     await prisma.feed.upsert({
    //         where: { id: feed.id },
    //         update: {},
    //         create: feed,
    //     });
    // }

    for (const user of users) {
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                ...user,
                // feeds: {
                //     connect: feeds.map(feed => ({ id: feed.id })),
                // },
            },
        });
    }

    // for (const content of itemContents) {
    //     await prisma.itemContent.upsert({
    //         where: { id: content.id },
    //         update: {},
    //         create: content,
    //     });
    // }

    // for (const item of items) {
    //     await prisma.item.upsert({
    //         where: { id: item.id },
    //         update: {},
    //         create: item,
    //     });
    // }

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
