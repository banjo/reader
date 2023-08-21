import { Command, ResultType } from "@/components/shared/command";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { avatarUrl } from "@/lib/utils";
import { SearchFeed } from "@/models/server";
import { useGlobalLoadingStore } from "@/stores/useGlobalLoadingStore";
import { FC, useState } from "react";
import { toast } from "react-hot-toast";

export const AddFeedNav: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCommandBoxLoading, setIsCommandBoxLoading] = useState(false);
    const [results, setResults] = useState<ResultType[]>([]);
    const api = useAuthFetcher();
    const setIsGlobalLoading = useGlobalLoadingStore(state => state.setIsLoading);

    const { invalidate } = useInvalidate();

    const toggleOpen = () => {
        setResults([]);
        setIsOpen(!isOpen);
    };

    const addFeed = async (url: string) => {
        const updatedUrl = url.startsWith("http") ? url : `https://${url}`;

        try {
            // eslint-disable-next-line n/no-unsupported-features/node-builtins
            new URL(updatedUrl);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsOpen(false);
        setIsGlobalLoading(true, "Adding feed...");

        const data = await api.POST("/feed", {
            url: updatedUrl,
        });

        setIsGlobalLoading(false);

        if (!data.success) {
            toast.error("Failed to add feed");
            return;
        }

        toast.success("Successfully added feed");
        invalidate();
    };

    const loadResults = async (query: string) => {
        const res = await api.GET<SearchFeed[]>(`/feed/search?query=${query}`);

        if (!res.success) {
            toast.error("Failed to search for feed");
            return [];
        }

        const results: ResultType[] = res.data.map(feed => ({
            text: feed.name,
            value: feed.rssUrl,
            id: feed.internalIdentifier,
            icon: (
                <>
                    <img
                        src={feed.imageUrl ?? avatarUrl(feed.internalIdentifier)}
                        alt={feed.name}
                        className="w-6 h-6 mr-4"
                    />
                </>
            ),
        }));

        return results;
    };

    const handleInputChange = async (search: string) => {
        if (!search) {
            setResults([]);
            return;
        }

        if (search.startsWith("http") || search.startsWith("www")) {
            setResults([
                {
                    text: search,
                    value: search,
                    id: search,
                    icon: (
                        <ResponsiveIcon
                            Icon={Icons.add}
                            size="sm"
                            className="mr-4"
                            enableTooltip={false}
                        />
                    ),
                },
            ]);
            return;
        }

        setIsCommandBoxLoading(true);
        const loadedResults = await loadResults(search);
        setIsCommandBoxLoading(false);

        setResults(loadedResults.splice(0, 5));
    };

    const handleSelected = async (result: ResultType) => {
        await addFeed(result.value);
    };

    return (
        <>
            <ResponsiveIcon Icon={Icons.add} size="sm" tooltip="Add feed" onClick={toggleOpen} />

            <Command
                headingText="Feeds"
                inputText="Search for a feed or add with url..."
                notFoundText="No feeds found."
                results={results}
                isOpen={isOpen}
                isLoading={isCommandBoxLoading}
                setIsOpen={setIsOpen}
                handleInputChange={handleInputChange}
                handleSelected={handleSelected}
            />
        </>
    );
};
