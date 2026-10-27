import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function avatarUrl(slug: string) {
    return `https://robohash.org/${slug}.png`;
}

export function randomImageUrl(seed: string | number) {
    return `https://picsum.photos/seed/${seed}/800/450`;
}
