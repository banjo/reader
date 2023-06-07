export type Refetch<T> = (updatedItem: T, updateFn: () => Promise<undefined>) => void;
