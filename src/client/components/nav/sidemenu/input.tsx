import { Icons } from "@/client/components/shared/icons";
import { Input as InputComponent } from "@/client/components/ui/input";
import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/use-update-sidebar";
import { FC } from "react";
import { toast } from "react-hot-toast";

type Props = {
    test?: boolean;
};

export const Input: FC<Props> = () => {
    const fetcher = useAuthFetcher();
    const { fetchLatestInSidebar } = useUpdateSidebar();
    const addFeed = async () => {
        const data = await fetcher.POST("/feed", {
            url: "https://cprss.s3.amazonaws.com/javascriptweekly.com.xml",
        });

        if (!data.success) {
            toast.error("Failed to add feed");
            return;
        }

        fetchLatestInSidebar();
    };

    return (
        <div className="flex items-center gap-2">
            <InputComponent
                className="ml-8 flex h-10 w-56"
                placeholder="Feed URL..."
                onSubmit={addFeed}
            />
            <button type="button" className="ml-2 hover:text-slate-400" onClick={addFeed}>
                <Icons.add className="h-6 w-6" />
            </button>
        </div>
    );
};
