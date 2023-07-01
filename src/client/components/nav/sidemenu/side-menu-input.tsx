import { useAuthFetcher } from "@/client/hooks/backend/use-auth-fetcher";
import { useUpdateSidebar } from "@/client/hooks/backend/use-update-sidebar";
import { SearchFeed } from "@/server/mappers/FeedMapper";
import { FC, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { StylesConfig } from "react-select";
import Select from "react-select/async";

type Option = {
    value: string;
    label: string;
};

// TODO: wait for them to fix error with console on react-select:
// https://github.com/JedWatson/react-select/issues/5596
export const SideMenuInput: FC = () => {
    const [selected, setSelected] = useState<Option | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const api = useAuthFetcher();
    const fetcher = useAuthFetcher();
    const { fetchLatestInSidebar } = useUpdateSidebar();
    const ref = useRef<any>(null);

    const selectedUrl = useMemo(() => {
        return selected?.value ?? inputValue;
    }, [inputValue, selected?.value]);

    const addFeed = async () => {
        if (!inputValue && !selected) {
            return;
        }

        const url = ref.current?.state?.focusedOption?.value ?? selectedUrl;

        setIsLoading(true);
        setInputValue("");
        setSelected(null);

        const updatedUrl = url.startsWith("http") ? url : `https://${url}`;

        try {
            // eslint-disable-next-line n/no-unsupported-features/node-builtins
            new URL(updatedUrl);
        } catch {
            toast.error("Please enter a valid URL");
            setIsLoading(false);
            return;
        }

        const data = await fetcher.POST("/feed", {
            url: updatedUrl,
        });

        if (!data.success) {
            toast.error("Failed to add feed");
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        fetchLatestInSidebar();
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            await addFeed();
        }
    };

    const customStyles: StylesConfig = {
        control: provided => ({
            ...provided,
            width: "14rem", // important for width to work
        }),
    };

    const loadOptions = async (query: string) => {
        const res = await api.GET<SearchFeed[]>(`/feed/search?query=${query}`);

        if (!res.success) {
            toast.error("Failed to search for feed");
            return [];
        }

        const options = res.data.map(feed => ({
            value: feed.rssUrl,
            label: feed.name,
        }));

        return options;
    };

    // TODO: add debounce
    // TODO: fix dark mode

    return (
        <div className="flex items-center gap-2">
            <Select
                ref={ref}
                className="ml-8 flex h-10"
                styles={customStyles}
                onChange={(props: any) => {
                    const result = props as Option;
                    setSelected(result);
                }}
                onInputChange={setInputValue}
                onKeyDown={handleKeyDown}
                value={selected}
                inputValue={inputValue}
                instanceId={"side-menu-input"}
                openMenuOnClick={false}
                menuIsOpen={inputValue.length > 0}
                isLoading={isLoading}
                placeholder={isLoading ? "Adding feed..." : "Search for a feed"}
                loadOptions={loadOptions}
                noOptionsMessage={() => "No feeds found, submit an RSS URL to add a new feed"}
            />
        </div>
    );
};
