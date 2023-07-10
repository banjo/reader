import { clsx, type ClassValue } from "clsx";
import { ItemWithContent } from "db";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function avatarUrl(slug: string) {
    return `https://robohash.org/${slug}.png`;
}

export function sortItems<T extends ItemWithContent>(items: T[]): T[] {
    return [
        ...items.sort((a, b) => {
            if (a.content.pubDate && b.content.pubDate) {
                return b.content.pubDate.getTime() - a.content.pubDate.getTime();
            }
            return 0;
        }),
    ];
}
