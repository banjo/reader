import { Dropdown, MenuEntries } from "@/components/shared/dropdown";
import { DropdownRow } from "@/components/shared/dropdown-row";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { TitleMenu } from "@/components/table/table-container-content";
import { tableTypeIconMapper, tableTypes } from "@/components/table/table.types";
import {
    TableActionsContent,
    TableFiltersContent,
} from "@/components/table/use-table-filters-content";
import { TableActionsItems, TableFiltersItems } from "@/components/table/use-table-filters-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paginate } from "@/hooks/shared/use-pagination";
import { avatarUrl } from "@/lib/utils";
import { capitalize } from "@banjoanton/utils";
import { FeedWithContent, FeedWithItems } from "db";
import { articleSearchMaxLength } from "model";
import { FC } from "react";

type FilterBarProps = {
    filters: TableFiltersItems;
    actions: TableActionsItems;
    title: string;
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    isSubscribed: boolean;
    feed?: FeedWithItems;
    paginate?: Paginate;
};

type FilterBarPropsContent = {
    filters: TableFiltersContent;
    actions: TableActionsContent;
    title: string;
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    isSubscribed: false;
    feed?: FeedWithContent;
    paginate?: Paginate;
};

const SearchIcon = Icons.search;
const CloseIcon = Icons.close;

const ArticleSearchField: FC<{
    value: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
}> = ({ value, onSearchChange, onClearSearch }) => (
    <div className="relative order-last flex h-9 w-full min-w-0 items-center sm:order-none sm:w-64">
        <SearchIcon
            className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground"
            aria-hidden
        />
        <Input
            type="search"
            value={value}
            maxLength={articleSearchMaxLength}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search articles"
            aria-label="Search articles"
            className="h-9 pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
        {value.length > 0 ? (
            <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onClearSearch}
            >
                <CloseIcon className="h-4 w-4" />
            </button>
        ) : null}
    </div>
);

export const FilterBar: FC<FilterBarProps | FilterBarPropsContent> = ({
    filters,
    actions,
    title,
    titleMenuOptions,
    isSubscribed,
    feed,
    paginate,
}) => {
    const handleSearchChange = (value: string) => {
        filters.setSearch(value);
    };
    const handleClearSearch = () => {
        filters.clearSearch();
    };

    const paginationControls = paginate && (
        <div className="ml-6 flex gap-2">
            <ResponsiveIcon
                Icon={Icons.chevronLeft}
                onClick={() => paginate.prevPage()}
                disabled={!paginate.hasPrevPage()}
                tooltip="Previous"
            />

            <ResponsiveIcon
                Icon={Icons.chevronRight}
                onClick={() => paginate.nextPage()}
                disabled={!paginate.hasNextPage()}
                tooltip="Next"
            />
        </div>
    );

    return (
        <div className="flex min-h-16 w-full flex-wrap items-center justify-end gap-3 rounded-md border border-border p-3 sm:gap-4 sm:p-4">
            <div className="mr-auto flex min-w-0 items-center">
                {feed && (
                    <img
                        className="h-10 w-10 shrink-0"
                        height={40}
                        width={40}
                        alt="feed avatar"
                        src={feed.imageUrl ?? avatarUrl(feed.internalIdentifier)}
                        onError={e => {
                            e.currentTarget.src = avatarUrl(feed.internalIdentifier);
                        }}
                    />
                )}

                {titleMenuOptions && isSubscribed ? (
                    <>
                        <Dropdown
                            align="start"
                            side="bottom"
                            menuEntries={titleMenuOptions}
                            item={{ title }}
                            buttonClasses="mr-auto"
                        >
                            <div className="mr-auto flex cursor-pointer items-center gap-1 ml-2">
                                {/* <span className="text-lg font-medium">{title}</span> */}
                                <Icons.chevronDown className="h-5 w-5" />
                            </div>
                        </Dropdown>
                    </>
                ) : (
                    <span className="ml-2 mr-auto flex min-w-0 items-center truncate text-lg font-medium">
                        {title}
                    </span>
                )}
            </div>

            <ArticleSearchField
                value={filters.search}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
            />

            {isSubscribed && (
                <div className="mr-2 flex shrink-0 items-center gap-4">
                    <Dropdown
                        align="start"
                        side="bottom"
                        menuEntries={tableTypes.map(type => ({
                            content: (
                                <DropdownRow
                                    icon={tableTypeIconMapper[type]}
                                    text={capitalize(type)}
                                />
                            ),
                            onSelect: () => actions.selectTableType(type),
                            type: "select",
                        }))}
                        item={{}}
                        buttonClasses="mr-auto"
                    >
                        <ResponsiveIcon Icon={Icons.layout} tooltip="Layout" size="sm" />
                    </Dropdown>

                    <ResponsiveIcon
                        Icon={Icons.refresh}
                        onClick={actions.refresh}
                        tooltip="Refresh"
                    />

                    {feed && (
                        <ResponsiveIcon
                            Icon={Icons.check}
                            onClick={() => actions.markAllAsRead(feed.id)}
                            disabled={filters.hasReadAll}
                            tooltip="Mark all as read"
                        />
                    )}

                    <ResponsiveIcon
                        Icon={filters.showUnreadOnly ? Icons.eyeOff : Icons.eye}
                        onClick={filters.toggleShowUnreadOnly}
                        tooltip="Show unread only"
                    />

                    {paginationControls}
                </div>
            )}

            {feed && !isSubscribed && (
                <>
                    {paginationControls}
                    <Button onClick={async () => await actions.subscribe(feed.internalIdentifier)}>
                        Subscribe
                    </Button>
                </>
            )}
        </div>
    );
};
