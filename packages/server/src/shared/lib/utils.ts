import { ItemWithContent } from "db";

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
