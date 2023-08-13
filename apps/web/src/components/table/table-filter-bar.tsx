import { Dropdown, MenuEntries } from "@/components/shared/dropdown";
import { Icons } from "@/components/shared/icons";
import { Tooltip } from "@/components/shared/tooltip";
import { TitleMenu } from "@/components/table/table-container-content";
import {
    TableActionsContent,
    TableFiltersContent,
} from "@/components/table/use-table-filters-content";
import { TableActionsItems, TableFiltersItems } from "@/components/table/use-table-filters-items";
import { Button } from "@/components/ui/button";
import { avatarUrl } from "@/lib/utils";
import { noop } from "@banjoanton/utils";
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

type FilterIconProps = {
    Icon: FC<{ className: string; onClick: () => void; disabled: boolean }>;
    tooltip: string;
    onClick: () => void;
    disabled?: boolean;
};
const FilterIcon: FC<FilterIconProps> = ({ Icon, disabled, onClick, tooltip }) => {
    return (
        <Tooltip tooltip={tooltip}>
            <Icon
                className={`h-6 w-6 ${disabled ? "opacity-30" : "cursor-pointer hover:opacity-70"}`}
                onClick={disabled ? noop : onClick}
                disabled={disabled ?? false}
            />
        </Tooltip>
    );
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
                        className="rounded-full"
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
                    <span className="mr-auto text-lg font-medium flex items-center ml-4">
                        {title}
                    </span>
                )}
            </div>

            {isSubscribed && (
                <div className="mr-2 flex items-center gap-4">
                    <FilterIcon
                        Icon={Icons.check}
                        onClick={actions.markAllAsRead}
                        disabled={filters.hasReadAll}
                        tooltip="Mark all as read"
                    />

                    <FilterIcon
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
