import { buttonVariants } from "@/components/ui/button";
import { Feed } from "@prisma/client";
import Link from "next/link";
import { fetcher } from "../lib/fetcher";

export const revalidate = 0;

// const getFeed = async (externalUserId: string): Promise<Feed[]> => {
//     const userId = await UserRepository.getIdByExternalId(externalUserId);

//     if (!userId.success) {
//         return [];
//     }

//     const feed = await FeedRepository.getAllUserFeeds(userId.data);

//     if (!feed.success) {
//         return [];
//     }

//     return feed.data;
// };

const getFeed = async () => {
    const res = await fetcher.GET<Feed[]>("/api/feed");

    console.log({ res });

    if (res) {
        return res;
    }

    return [];
};

export default async function IndexPage() {
    // if (userId) {
    //     redirect("/dashboard");
    // }

    const feed = await getFeed();

    return (
        <section
            className="container flex flex-col items-start justify-center gap-6 pb-8
                pt-6 md:py-10"
        >
            <div className="flex max-w-[980px] flex-col items-start gap-2">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
                    Banjo RSS
                </h1>
                <p className="max-w-[700px] text-lg text-muted-foreground">
                    A super simple RSS feed reader. Not much more than that actually.
                </p>
                {feed.length}
            </div>
            <div className="flex gap-4">
                <Link href="/sign-in" className={buttonVariants()}>
                    Sign in
                </Link>
                <Link href="/sign-up" className={buttonVariants({ variant: "outline" })}>
                    Sign up
                </Link>
            </div>
        </section>
    );
}
