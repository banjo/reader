import { Skeleton } from "@/components/ui/skeleton";
import { range } from "@banjoanton/utils";

export default function Loading() {
    return (
        <div className="flex flex-col gap-10">
            {range(15).map(i => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
        </div>
    );
}
