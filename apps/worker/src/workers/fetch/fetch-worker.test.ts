import { processor } from "@/workers/fetch/fetch-worker";
import { Job, Queue } from "bullmq";
import { describe, expect, it, vi } from "vitest";

// mock prisma
vi.mock("db", () => ({
    prisma: {
        feed: {
            findMany: vi.fn().mockResolvedValue([
                {
                    url: "https://example.com/rss.xml",
                },
            ]),
        },
    },
}));

describe("fetch-worker", async () => {
    const url = "https://example.com/rss.xml";
    const data = { url };

    const name = "fetch";
    const mockQ = new Queue(name);
    const mockJob = new Job(mockQ, name, data);

    it("processor", async () => {
        const res = await processor(mockJob);
        expect(res).toEqual({ url });
    });
});
