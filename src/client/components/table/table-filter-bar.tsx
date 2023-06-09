import { TableActions, TableFilters } from "@/client/components/table/useTableFilters";
import { Button } from "@/client/components/ui/button";
import { Switch } from "@/client/components/ui/switch";
import { FC } from "react";

type FilterBarProps = {
    filters: TableFilters;
    actions: TableActions;
    title: string;
};

export const FilterBar: FC<FilterBarProps> = ({ filters, actions, title }) => {
    const { showUnreadOnly, toggleShowUnreadOnly, hasReadAll } = filters;
    const { markAllAsRead } = actions;

    return (
        <div className="flex h-32 w-full items-center justify-end gap-8 rounded-md border border-border p-4">
            <span className="mr-auto text-lg font-medium">{title}</span>

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
