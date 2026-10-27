import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useAuth } from "@/contexts/auth-context";
import { FeedImport } from "@/lib/feed-import";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FeedImportAccepted, FeedImportStatus } from "model";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";

export const useAddFeed = () => {
    const api = useAuthFetcher();
    const { userId = "" } = useAuth();
    const { invalidate } = useInvalidate();
    const [importId, setImportId] = useState(() => FeedImport.load(userId));
    const lastImported = useRef(-1);
    const announced = useRef<string>();

    const progress = useQuery({
        queryKey: FeedImport.queryKey({ userId, importId }),
        enabled: Boolean(importId),
        queryFn: async () => {
            const result = await api.GET<FeedImportStatus>(`/feed/imports/${importId}`);
            if (!result.success) {
                throw new Error(result.message);
            }
            return result.data;
        },
        refetchInterval: FeedImport.refetchInterval,
        refetchIntervalInBackground: true,
        onSuccess: status => {
            if (status.imported !== lastImported.current) {
                lastImported.current = status.imported;
                void invalidate();
            }
            if (status.finished && announced.current !== status.importId) {
                announced.current = status.importId;
                if (status.failed) {
                    toast.error(
                        `Imported ${status.imported} feeds; ${status.failed} failed. View import details for URLs.`
                    );
                    return;
                }
                toast.success(`Imported ${status.imported} feeds`);
            }
        },
    });

    const mutation = useMutation({
        mutationFn: async (urls: string[]) => {
            const result = await api.POST<FeedImportAccepted>("/feed/add-many", { urls });
            if (!result.success) {
                throw new Error(result.message);
            }
            return result.data;
        },
        onSuccess: accepted => {
            lastImported.current = -1;
            FeedImport.save({ userId, importId: accepted.importId });
            setImportId(accepted.importId);
            toast.success(`Importing ${accepted.total} feeds in the background`);
        },
    });

    const dismiss = () => {
        FeedImport.save({ userId });
        setImportId(undefined);
    };

    return {
        addMany: mutation.mutateAsync,
        isQueuing: mutation.isLoading,
        importId,
        progress,
        dismiss,
    };
};
