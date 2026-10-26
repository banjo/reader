import { cn } from "@/lib/utils";
import { Bookmark, Check } from "lucide-react";

type LibraryItem = {
    label: string;
    count: number;
    active?: boolean;
};

type Feed = {
    name: string;
    count: number;
    color: string;
};

type Post = {
    title: string;
    feed: string;
    time: string;
    saved?: boolean;
};

const library: LibraryItem[] = [
    { label: "All", count: 128, active: true },
    { label: "Read later", count: 12 },
    { label: "Favorites", count: 8 },
];

const feeds: Feed[] = [
    { name: "Design Notes", count: 24, color: "bg-amber-400" },
    { name: "Long Reads", count: 11, color: "bg-sky-400" },
    { name: "Tech Weekly", count: 9, color: "bg-emerald-400" },
    { name: "Field Notes", count: 6, color: "bg-rose-400" },
];

const posts: Post[] = [
    { title: "The new release is out", feed: "Long Reads", time: "2h" },
    { title: "Why we moved off the cloud", feed: "Design Notes", time: "4h", saved: true },
    { title: "How RSS still works", feed: "Tech Weekly", time: "6h" },
    { title: "Building small tools", feed: "Field Notes", time: "1d" },
];

export const ReaderPreview = () => (
    <div aria-hidden="true" className="pointer-events-none relative select-none">
        <div className="absolute -inset-8 rounded-[2.5rem] bg-brand/10 blur-3xl" />

        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                <img src="/banjoreader.svg" alt="" className="h-5 w-5 rounded-[6px]" />
                <span className="text-[11px] font-semibold tracking-tight">Banjo Reader</span>
                <span
                    className="ml-auto rounded-full border bg-background px-2 py-0.5 text-[10px]
                            text-muted-foreground"
                >
                    banjoreader.com
                </span>
            </div>

            <div className="flex">
                <aside className="hidden w-40 shrink-0 border-r p-3 sm:block">
                    <p
                        className="px-2 pb-2 text-[9px] font-semibold uppercase
                                tracking-[0.12em] text-muted-foreground"
                    >
                        Library
                    </p>
                    <ul className="space-y-0.5">
                        {library.map(item => (
                            <li
                                key={item.label}
                                className={cn(
                                    "flex items-center justify-between rounded-md px-2 py-1.5 text-[11px]",
                                    item.active
                                        ? "bg-brand/15 font-semibold text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <span>{item.label}</span>
                                <span
                                    className={cn(
                                        "text-[10px]",
                                        item.active ? "text-foreground/60" : "text-muted-foreground"
                                    )}
                                >
                                    {item.count}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <p
                        className="px-2 pb-2 pt-5 text-[9px] font-semibold uppercase
                                tracking-[0.12em] text-muted-foreground"
                    >
                        Feeds
                    </p>
                    <ul className="space-y-1">
                        {feeds.map(feed => (
                            <li
                                key={feed.name}
                                className="flex items-center gap-2 px-2 py-0.5 text-[11px]
                                        text-muted-foreground"
                            >
                                <span className={cn("h-1.5 w-1.5 rounded-full", feed.color)} />
                                <span className="truncate">{feed.name}</span>
                                <span className="ml-auto text-[10px]">{feed.count}</span>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between border-b px-4 py-2.5">
                        <span className="text-xs font-semibold">All</span>
                        <span className="text-[10px] text-muted-foreground">128 unread</span>
                    </div>
                    <ul className="divide-y">
                        {posts.map(post => (
                            <li key={post.title} className="flex items-start gap-3 px-4 py-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold leading-snug">
                                        {post.title}
                                    </p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        {post.feed} &middot; {post.time}
                                    </p>
                                </div>
                                {post.saved ? (
                                    <Bookmark className="mt-0.5 h-3 w-3 shrink-0 fill-brand text-brand" />
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

        <div
            className="mt-3 flex w-fit items-center gap-2 rounded-lg border bg-background px-3
                    py-2 shadow-lg sm:absolute sm:-bottom-5 sm:-left-6 sm:mt-0"
        >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15">
                <Check className="h-3 w-3 text-foreground" />
            </span>
            <span className="text-[10px] font-medium">12 feeds imported</span>
        </div>
    </div>
);
