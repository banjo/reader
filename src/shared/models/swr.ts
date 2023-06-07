export type Refetch<T> = (
    updatedItem: T | T[],
    updateFn: () => Promise<undefined>,
    onError?: () => void | undefined
) => void;
