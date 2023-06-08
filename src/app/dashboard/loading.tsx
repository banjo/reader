import { Skeleton } from "@/client/components/ui/skeleton";
import { range } from "@banjoanton/utils";

export default function Loading() {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-32 w-full rounded-md" />
            {range(20).map(i => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
        </div>
    );
}
