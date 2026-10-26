import type { FeedImportStatus } from "model";

const storageKey = (userId: string) => `banjo-feed-import:${userId}`;

const load = (userId: string) => {
    try {
        const value = localStorage.getItem(storageKey(userId));
        return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
    } catch {
        return undefined;
    }
};

const save = ({ userId, importId }: { userId: string; importId?: string }) => {
    try {
        if (importId) {
            localStorage.setItem(storageKey(userId), importId);
            return;
        }
        localStorage.removeItem(storageKey(userId));
    } catch {
        // Importing still works when browser storage is unavailable.
    }
};

const queryKey = ({ userId, importId }: { userId: string; importId?: string }) => [
    "feed-import",
    userId,
    importId,
];
const refetchInterval = (status?: FeedImportStatus) => (status?.finished ? false : 2_000);

export const FeedImport = { load, save, queryKey, refetchInterval };
