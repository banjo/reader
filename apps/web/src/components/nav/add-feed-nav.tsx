import { Command, ResultType } from "@/components/shared/command";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { useAuthFetcher } from "@/hooks/backend/use-auth-fetcher";
import { useInvalidate } from "@/hooks/backend/use-invalidate";
import { avatarUrl } from "@/lib/utils";
import { SearchFeed } from "@/models/server";
import { useDebounce } from "@uidotdev/usehooks";
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const AddFeedNav: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCommandBoxLoading, setIsCommandBoxLoading] = useState(false);
    const [isAddLoading, setIsAddLoading] = useState(false);
    const [results, setResults] = useState<ResultType[]>([]);
    const api = useAuthFetcher();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const debouncedSearchTerm = useDebounce(searchTerm, 150);

    const { invalidate } = useInvalidate();

    useEffect(() => {
        let ignore = false;

        const getResults = async () => {
            setIsCommandBoxLoading(true);
            const loadedResults = await loadResults(debouncedSearchTerm);
            // TODO: remove this
            await new Promise(resolve => setTimeout(resolve, 500));

            setIsCommandBoxLoading(false);

            if (!ignore) setResults(loadedResults.splice(0, 5));
        };

        if (debouncedSearchTerm) {
            getResults();
        }

        return () => {
            ignore = true;
            setIsCommandBoxLoading(false);
        };
    }, [debouncedSearchTerm]);

    const toggleOpen = () => {
        setResults([]);
        setSearchTerm("");
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
        setIsAddLoading(true);

        const data = await api.POST("/feed", {
            url: updatedUrl,
        });

        setIsAddLoading(false);

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
        setSearchTerm(search);

        if (!search) {
            setResults([]);
            return;
        }
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
