import { Dropdown, MenuEntries } from "@/components/shared/dropdown";
import { Icons } from "@/components/shared/icons";
import { ResponsiveIcon } from "@/components/shared/responsive-icon";
import { TitleMenu } from "@/components/table/table-container-content";
import {
    TableActionsContent,
    TableFiltersContent,
} from "@/components/table/use-table-filters-content";
import { TableActionsItems, TableFiltersItems } from "@/components/table/use-table-filters-items";
import { Button } from "@/components/ui/button";
import { avatarUrl } from "@/lib/utils";
import { FeedWithContent, FeedWithItems } from "db";
import { FC } from "react";

type FilterBarProps = {
    filters: TableFiltersItems;
    actions: TableActionsItems;
    title: string;
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    isSubscribed: boolean;
    feed?: FeedWithItems;
};

type FilterBarPropsContent = {
    filters: TableFiltersContent;
    actions: TableActionsContent;
    title: string;
    titleMenuOptions?: MenuEntries<TitleMenu>[];
    isSubscribed: false;
    feed?: FeedWithContent;
};

export const FilterBar: FC<FilterBarProps | FilterBarPropsContent> = ({
    filters,
    actions,
    title,
    titleMenuOptions,
    isSubscribed,
    feed,
}) => {
    return (
        <div className="flex h-16 w-full items-center justify-end gap-4 rounded-md border border-border p-4">
            <div className="flex mr-auto">
                {feed && (
                    <img
                        height={40}
                        width={40}
                        alt="feed avatar"
                        src={feed.imageUrl ?? avatarUrl(feed.internalIdentifier)}
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
                            <div className="mr-auto flex cursor-pointer items-center gap-1">
                                {/* <span className="text-lg font-medium">{title}</span> */}
                                <Icons.chevronDown className="h-5 w-5" />
                            </div>
                        </Dropdown>
                    </>
                ) : (
                    <span className="mr-auto text-lg font-medium flex items-center">{title}</span>
                )}
            </div>

            {isSubscribed && (
                <div className="mr-2 flex items-center gap-4">
                    <ResponsiveIcon
                        Icon={Icons.refresh}
                        onClick={actions.refresh}
                        tooltip="Refresh"
                    />

                    <ResponsiveIcon
                        Icon={Icons.check}
                        onClick={actions.markAllAsRead}
                        disabled={filters.hasReadAll}
                        tooltip="Mark all as read"
                    />

                    <ResponsiveIcon
                        Icon={filters.showUnreadOnly ? Icons.eyeOff : Icons.eye}
                        onClick={filters.toggleShowUnreadOnly}
                        tooltip="Show unread only"
                    />
                </div>
            )}

            {feed && !isSubscribed && (
                <>
                    <Button onClick={async () => await actions.subscribe(feed.internalIdentifier)}>
                        Subscribe
                    </Button>
                </>
            )}
        </div>
    );
};
