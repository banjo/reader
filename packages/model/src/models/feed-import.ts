export type FeedImportEntry = {
    url: string;
    status: "queued" | "importing" | "retrying" | "imported" | "failed";
    message?: string;
};

export type FeedImportAccepted = {
    importId: string;
    total: number;
};

export type FeedImportStatus = FeedImportAccepted & {
    imported: number;
    failed: number;
    finished: boolean;
    entries: FeedImportEntry[];
};

export const feedImportLimit = 1_000;
