import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { ReactNode } from "react";

export type MenuEntries<T> =
    | {
          type: "select";
          content: ReactNode | ((item: T) => ReactNode);
          onSelect: (item: T) => void;
          disabled?: boolean;
      }
    | {
          type: "label";
          label: string;
      }
    | {
          type: "separator";
      };

type Props<T> = {
    children: ReactNode;
    side?: "left" | "right" | "top" | "bottom";
    align?: "start" | "center" | "end";
    menuEntries: MenuEntries<T>[];
    item: T;
};

export const Dropdown = <T,>({
    children,
    side = "bottom",
    align = "center",
    menuEntries,
    item,
}: Props<T>) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
            <DropdownMenuContent side={side} align={align}>
                {menuEntries.map((entry, index) => {
                    switch (entry.type) {
                        case "select": {
                            return (
                                <DropdownMenuItem
                                    key={index}
                                    onSelect={() => entry.onSelect(item)}
                                    disabled={entry.disabled}
                                >
                                    {entry.content instanceof Function
                                        ? entry.content(item)
                                        : entry.content}
                                </DropdownMenuItem>
                            );
                        }
                        case "label": {
                            return <DropdownMenuLabel key={index}>{entry.label}</DropdownMenuLabel>;
                        }
                        case "separator": {
                            return <DropdownMenuSeparator key={index} />;
                        }
                        // No default
                    }
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
