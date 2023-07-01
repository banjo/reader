import { Dropdown, MenuEntries } from "@/client/components/shared/dropdown";
import { Icons } from "@/client/components/shared/icons";
import { TitleMenu } from "@/client/components/table/table-container-items";
import {
    TableActionsContent,
    TableFiltersContent,
} from "@/client/components/table/use-table-filters-content";
import {
    TableActionsItems,
    TableFiltersItems,
} from "@/client/components/table/use-table-filters-items";
import { Button } from "@/client/components/ui/button";
import { Switch } from "@/client/components/ui/switch";
import { FeedWithContent, FeedWithItems } from "@/shared/models/types";
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
        <div className="flex h-20 w-full items-center justify-end gap-8 rounded-md border border-border p-4">
            {titleMenuOptions && isSubscribed ? (
                <Dropdown
                    align="start"
                    side="bottom"
                    menuEntries={titleMenuOptions}
                    item={{ title }}
                    buttonClasses="mr-auto"
                >
                    <div className="mr-auto flex cursor-pointer items-center gap-1">
                        <span className="text-lg font-medium">{title}</span>
                        <Icons.chevronDown className="h-5 w-5" />
                    </div>
                </Dropdown>
            ) : (
                <span className="mr-auto text-lg font-medium">{title}</span>
            )}

            {isSubscribed && (
                <>
                    <Button onClick={actions.markAllAsRead} disabled={filters.hasReadAll}>
                        Mark all as read
                    </Button>
                    <div className="flex items-center">
                        <Switch
                            id="show-unread"
                            checked={filters.showUnreadOnly}
                            onCheckedChange={() => filters.toggleShowUnreadOnly()}
                        />
                        <label htmlFor="show-unread" className="ml-2 text-sm font-medium">
                            Show unread only
                        </label>
                    </div>
                </>
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
