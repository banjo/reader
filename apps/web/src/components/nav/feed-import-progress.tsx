import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { FeedImportStatus } from "model";

type Props = {
    status?: FeedImportStatus;
    hasError: boolean;
    dismiss: () => void;
};

const progressLabel = (status?: FeedImportStatus) => {
    if (!status) {
        return "Import details";
    }
    if (!status.finished) {
        return `Importing ${status.imported + status.failed}/${status.total}`;
    }
    return status.failed ? `Import: ${status.failed} failed` : `Imported ${status.imported} feeds`;
};

export const FeedImportProgress = ({ status, hasError, dismiss }: Props) => {
    const completed = (status?.imported ?? 0) + (status?.failed ?? 0);
    const failed = status?.entries.filter(entry => entry.status === "failed") ?? [];

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={progressLabel(status)}>
                    <span role="status">{progressLabel(status)}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Feed import</DialogTitle>
                    <DialogDescription>
                        {status?.finished
                            ? "All feeds have been processed."
                            : "Feeds are imported in the background. You can keep reading or close this tab."}
                    </DialogDescription>
                </DialogHeader>
                {hasError ? (
                    <p role="alert">
                        Could not check import progress. The import may still be running. Progress
                        is kept for seven days.
                    </p>
                ) : null}
                {status ? (
                    <p role="status">
                        {status.imported} imported · {status.failed} failed ·{" "}
                        {status.total - completed} remaining
                    </p>
                ) : (
                    <p>Checking progress…</p>
                )}
                {failed.length ? (
                    <ul
                        aria-label="Failed feeds"
                        className="flex max-h-64 flex-col gap-4 overflow-y-auto text-sm"
                    >
                        {failed.map(entry => (
                            <li key={entry.url} className="flex flex-col gap-1">
                                <span className="break-all font-medium">{entry.url}</span>
                                <span className="break-words text-muted-foreground">
                                    {entry.message}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : null}
                <DialogFooter>
                    <Button variant="outline" onClick={dismiss}>
                        {status?.finished ? "Dismiss results" : "Hide progress"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
