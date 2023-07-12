export type WorkerType<T extends object> = {
    start: () => Promise<void>;
    add: (data: T) => Promise<void>;
    close: () => Promise<void>;
    repeatable: (data: T, timeInMs?: number) => Promise<void>;
    stopRepeatable: () => Promise<void>;
};
