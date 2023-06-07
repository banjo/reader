export type Refetch<T> = (
    updatedItem: T,
    updateFn: () => Promise<undefined>,
    onError?: () => void | undefined
) => void;
