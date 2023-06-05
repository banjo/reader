import { buttonVariants } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";
import { FeedModel } from "@/prisma/zod";
import { safeParseArray } from "@/shared/lib/zod";
import { Feed } from "@prisma/client";
import Link from "next/link";

export const revalidate = 0;

const getFeed = async () => {
    const res = await fetcher.GET<Feed[]>("feed");

    if (!res.success) {
        return [];
    }

    const parsedResult = safeParseArray(res.data, FeedModel);

    if (!parsedResult.success) {
        return [];
    }

    return parsedResult.data;
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
