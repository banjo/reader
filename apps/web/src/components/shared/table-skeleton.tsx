import { Skeleton } from "@/components/ui/skeleton";
import { range } from "@banjoanton/utils";

export const TableSkeleton = () => {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-20 w-full rounded-md" />
            <div className="flex flex-col gap-2">
                {range(20).map(i => (
                    <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
            </div>
        </div>
    );
};
