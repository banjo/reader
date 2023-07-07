import Link from "next/link";
import { buttonVariants } from "@/client/components/ui/button";
import { auth } from "@clerk/nextjs";

export const revalidate = 0;

export default function IndexPage() {
    const { userId } = auth();
    return (
        <section
            className="flex h-full-with-nav flex-col items-start justify-center gap-6 px-16
                pb-8 pt-6 md:py-10"
        >
            <div className="flex max-w-[980px] flex-col items-start gap-2">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
                    Banjo RSS
                </h1>
                <p className="max-w-[700px] text-lg text-muted-foreground">
                    A super simple RSS feed reader. Not much more than that
                    actually.
                </p>
            </div>

            <div className="flex gap-4">
                {userId ? (
                    <Link href="/dashboard" className={buttonVariants()}>
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link href="/sign-in" className={buttonVariants()}>
                            Sign in
                        </Link>
                        <Link
                            href="/sign-up"
                            className={buttonVariants({ variant: "outline" })}
                        >
                            Sign up
                        </Link>
                    </>
                )}
            </div>
        </section>
    );
}
