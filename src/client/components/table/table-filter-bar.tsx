import { Dropdown, MenuEntries } from "@/client/components/shared/dropdown";
import { Icons } from "@/client/components/shared/icons";
import { TitleMenu } from "@/client/components/table/table-container";
import { TableActions, TableFilters } from "@/client/components/table/use-table-filters";
import { Button } from "@/client/components/ui/button";
import { Switch } from "@/client/components/ui/switch";
import { FC } from "react";

type FilterBarProps = {
    filters: TableFilters;
    actions: TableActions;
    title: string;
    titleMenuOptions?: MenuEntries<TitleMenu>[];
};

export const FilterBar: FC<FilterBarProps> = ({ filters, actions, title, titleMenuOptions }) => {
    const { showUnreadOnly, toggleShowUnreadOnly, hasReadAll } = filters;
    const { markAllAsRead } = actions;

    return (
        <div className="flex h-32 w-full items-center justify-end gap-8 rounded-md border border-border p-4">
            {titleMenuOptions && (
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
            )}

            <Button onClick={markAllAsRead} disabled={hasReadAll}>
                Mark all as read
            </Button>

            <div className="flex items-center">
                <Switch
                    id="show-unread"
                    checked={showUnreadOnly}
                    onCheckedChange={() => toggleShowUnreadOnly()}
                />
                <label htmlFor="show-unread" className="ml-2 text-sm font-medium">
                    Show unread only
                </label>
            </div>
        </div>
    );
};
