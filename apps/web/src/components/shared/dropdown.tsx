import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
    buttonClasses?: string;
    containerClasses?: string;
};

export const Dropdown = <T,>({
    children,
    side = "bottom",
    align = "center",
    menuEntries,
    item,
    buttonClasses,
    containerClasses,
}: Props<T>) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={buttonClasses}>{children}</DropdownMenuTrigger>
            <DropdownMenuContent side={side} align={align} className={cn("w-32", containerClasses)}>
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
