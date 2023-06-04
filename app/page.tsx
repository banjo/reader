import { buttonVariants } from "@/components/ui/button";
import { auth } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;

// const getFeed = async (): Promise<Feed[]> => {
//     const feed = await fetch(`${getUrl()}/api/feed`);
//     const res: Result<Feed[]> = await feed.json();

//     if (!res.success) throw new Error(res.error);

//     return res.data;
// };

export default function IndexPage() {
    const { userId } = auth();

    if (userId) {
        redirect("/dashboard");
    }

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
