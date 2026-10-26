import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ReaderPreview } from "@/features/landing/components/reader-preview";
import { cn } from "@/lib/utils";
import { Bookmark, Filter, type LucideIcon, Rss, Search, Star, Upload } from "lucide-react";

type Feature = {
    title: string;
    description: string;
    Icon: LucideIcon;
};

const features: Feature[] = [
    {
        title: "Feeds",
        description: "RSS and Atom feeds in one list.",
        Icon: Rss,
    },
    {
        title: "Search",
        description: "Find a feed by name or paste a URL.",
        Icon: Search,
    },
    {
        title: "Read later",
        description: "Save posts to read when you have time.",
        Icon: Bookmark,
    },
    {
        title: "Favorites",
        description: "Keep the posts you want to come back to.",
        Icon: Star,
    },
    {
        title: "OPML import",
        description: "Move your subscriptions over from another reader.",
        Icon: Upload,
    },
    {
        title: "Filters",
        description: "Show unread, read, saved, or favorite posts.",
        Icon: Filter,
    },
];

export function LandingPage() {
    const { signInWithGoogle } = useAuth();

    return (
        <main className="min-h-full-with-nav">
            <section>
                <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-14 sm:pt-20">
                    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                        <div>
                            <img src="/banjoreader.svg" alt="" className="h-12 w-12 rounded-xl" />

                            <h1
                                className="mt-6 text-4xl font-extrabold leading-tight tracking-tight
                                    sm:text-5xl"
                            >
                                A simple RSS reader.
                            </h1>

                            <p
                                className="mt-4 max-w-lg text-base leading-relaxed
                                    text-muted-foreground sm:text-lg"
                            >
                                Follow the blogs and sites you like. Read them in one place.
                            </p>

                            <div className="mt-7">
                                <button
                                    type="button"
                                    onClick={signInWithGoogle}
                                    className={cn(
                                        buttonVariants({ variant: "brand", size: "lg" }),
                                        "h-12 px-6 text-xl font-bold"
                                    )}
                                >
                                    Continue with Google
                                </button>
                            </div>

                            <p className="mt-3 text-xs text-muted-foreground">
                                Free to use. No ads.
                            </p>
                        </div>

                        <ReaderPreview />
                    </div>
                </div>
            </section>

            <section className="border-t">
                <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
                    <h2 className="text-2xl font-bold tracking-tight">Features</h2>

                    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map(({ title, description, Icon }, index) => (
                            <li
                                key={title}
                                className="rounded-2xl border bg-card p-5 transition-colors
                                    hover:border-foreground/20 hover:bg-muted/30 sm:p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <span
                                        className="flex h-10 w-10 items-center justify-center rounded-xl
                                            bg-brand text-white"
                                    >
                                        <Icon className="h-[18px] w-[18px]" />
                                    </span>
                                    <span
                                        className="text-[11px] font-medium tracking-widest
                                            text-muted-foreground"
                                    >
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-medium">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {description}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="mx-auto w-full max-w-6xl px-6 pb-16">
                <div
                    className="flex flex-col gap-6 rounded-2xl border bg-brand/5 p-6
                        sm:flex-row sm:items-center sm:justify-between sm:p-8"
                >
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Free to use.</h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            No subscription and no ads.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={signInWithGoogle}
                        className={cn(
                            buttonVariants({ variant: "brand", size: "lg" }),
                            "h-12 shrink-0 px-5 text-xl font-bold"
                        )}
                    >
                        Continue with Google
                    </button>
                </div>
            </section>

            <footer
                className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between
                    gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row"
            >
                <span className="font-semibold text-foreground">Banjo Reader</span>
                <span>A simple RSS reader.</span>
            </footer>
        </main>
    );
}
