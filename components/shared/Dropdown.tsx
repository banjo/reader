import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FC, ReactNode } from "react";

export type MenuEntries =
    | {
          type: "select";
          content: ReactNode;
          onSelect: (id: number) => void;
          disabled?: boolean;
      }
    | {
          type: "label";
          label: string;
      }
    | {
          type: "separator";
      };

type Props = {
    children: ReactNode;
    side?: "left" | "right" | "top" | "bottom";
    align?: "start" | "center" | "end";
    items: MenuEntries[];
};

export const Dropdown: FC<Props> = ({ children, side = "bottom", align = "center", items }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
            <DropdownMenuContent side={side} align={align}>
                {items.map((item, index) => {
                    switch (item.type) {
                        case "select": {
                            return (
                                <DropdownMenuItem
                                    key={index}
                                    onSelect={item.onSelect}
                                    disabled={item.disabled}
                                >
                                    {item.content}
                                </DropdownMenuItem>
                            );
                        }
                        case "label": {
                            return <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>;
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
