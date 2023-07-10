export type RefetchOnError = () => void | undefined;
export type RefetchUpdateFn = () => Promise<undefined>;

export type Refetch<T> = (
    updatedItem: T,
    updateFn: RefetchUpdateFn,
    onError?: RefetchOnError
) => void;
