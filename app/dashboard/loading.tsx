import { Skeleton } from "@/components/ui/skeleton";
import { range } from "@banjoanton/utils";

export default function Loading() {
    return (
        <div className="flex flex-col gap-10">
            {range(7).map(i => (
                <Skeleton key={i} className="h-28 w-full rounded-md" />
            ))}
        </div>
    );
}
