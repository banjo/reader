import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { FeedImportStatus } from "model";
import { FeedImport } from "../src/lib/feed-import";
import { FeedImportProgress } from "../src/components/nav/feed-import-progress";

const progress: FeedImportStatus = {
    importId: randomUUID(),
    total: 2,
    imported: 1,
    failed: 0,
    finished: false,
    entries: [
        { url: "https://first.test/rss", status: "imported" },
        { url: "https://second.test/rss", status: "retrying" },
    ],
};

test("import polling stops only after every feed has a terminal result", () => {
    assert.equal(FeedImport.refetchInterval(), 2_000);
    assert.equal(FeedImport.refetchInterval(progress), 2_000);
    assert.equal(FeedImport.refetchInterval({ ...progress, failed: 1, finished: true }), false);
    assert.notDeepEqual(
        FeedImport.queryKey({ userId: "first", importId: progress.importId }),
        FeedImport.queryKey({ userId: "second", importId: progress.importId })
    );
});

test("import tracking survives reload, is user-scoped, and tolerates disabled storage", t => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    t.after(() => {
        if (previous) {
            Object.defineProperty(globalThis, "localStorage", previous);
            return;
        }
        Reflect.deleteProperty(globalThis, "localStorage");
    });
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        },
    });
    FeedImport.save({ userId: "first", importId: progress.importId });
    assert.equal(FeedImport.load("first"), progress.importId);
    assert.equal(FeedImport.load("second"), undefined);
    FeedImport.save({ userId: "first" });
    assert.equal(FeedImport.load("first"), undefined);
    values.set("banjo-feed-import:first", "invalid");
    assert.equal(FeedImport.load("first"), undefined);
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get: () => {
            throw new Error("Storage unavailable");
        },
    });
    assert.doesNotThrow(() => FeedImport.save({ userId: "first", importId: progress.importId }));
    assert.equal(FeedImport.load("first"), undefined);
});

test("the import control distinguishes pending, failed, and successful results", () => {
    const render = (status?: FeedImportStatus) =>
        renderToStaticMarkup(
            createElement(FeedImportProgress, { status, hasError: false, dismiss: () => {} })
        );
    assert.ok(render(progress).includes("Importing 1/2"));
    assert.ok(render({ ...progress, finished: true, failed: 1 }).includes("Import: 1 failed"));
    assert.ok(render({ ...progress, finished: true, imported: 2 }).includes("Imported 2 feeds"));
    assert.ok(render().includes("Import details"));
});
