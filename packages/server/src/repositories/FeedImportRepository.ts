import type { Queue } from "bullmq";
import type { FeedImportEntry, FeedImportStatus } from "model";

type ImportQueue = Pick<Queue, "client" | "toKey">;
type BatchProps = { queue: ImportQueue; importId: string };
type CreateBatchProps = BatchProps & { userId: number; urls: string[] };
type ReadBatchProps = BatchProps & { userId: number };
type UpdateEntryProps = BatchProps & { index: number; entry: FeedImportEntry };

const retentionSeconds = 7 * 24 * 60 * 60;
const batchKey = ({ queue, importId }: BatchProps) => queue.toKey(`batch-${importId}`);
const registeredClients = new WeakSet<object>();

const getClient = async (queue: ImportQueue) => {
    const client = await queue.client;
    if (!registeredClients.has(client)) {
        client.defineCommand("createFeedImportBatch", {
            numberOfKeys: 1,
            lua: `
            redis.call("HSET", KEYS[1], "userId", ARGV[1], "total", ARGV[2])
            for i = 4, #ARGV, 2 do redis.call("HSET", KEYS[1], ARGV[i], ARGV[i + 1]) end
            redis.call("EXPIRE", KEYS[1], ARGV[3])
            return 1
        `,
        });
        client.defineCommand("updateFeedImportEntry", {
            numberOfKeys: 1,
            lua: 'if redis.call("EXISTS", KEYS[1]) == 1 then return redis.call("HSET", KEYS[1], ARGV[1], ARGV[2]) end return 0',
        });
        registeredClients.add(client);
    }
    return client;
};

const create = async ({ queue, importId, userId, urls }: CreateBatchProps) => {
    const client = await getClient(queue);
    const entries = urls.flatMap((url, index) => [
        String(index),
        JSON.stringify({ url, status: "queued" }),
    ]);
    await client.runCommand("createFeedImportBatch", [
        batchKey({ queue, importId }),
        String(userId),
        String(urls.length),
        String(retentionSeconds),
        ...entries,
    ]);
};

const updateEntry = async ({ queue, importId, index, entry }: UpdateEntryProps) => {
    const client = await getClient(queue);
    // Do not recreate an expired batch when a very old job is retried.
    await client.runCommand("updateFeedImportEntry", [
        batchKey({ queue, importId }),
        String(index),
        JSON.stringify(entry),
    ]);
};

const get = async ({
    queue,
    importId,
    userId,
}: ReadBatchProps): Promise<FeedImportStatus | undefined> => {
    const client = await queue.client;
    const batch = await client.hgetall(batchKey({ queue, importId }));
    if (batch.userId !== String(userId)) {
        return undefined;
    }
    const total = Number(batch.total);
    const entries: FeedImportEntry[] = Array.from({ length: total }, (_, index) =>
        JSON.parse(batch[String(index)] ?? "{}")
    );
    const imported = entries.filter(entry => entry.status === "imported").length;
    const failed = entries.filter(entry => entry.status === "failed").length;
    return { importId, total, imported, failed, finished: imported + failed === total, entries };
};

export const FeedImportRepository = { create, updateEntry, get };
