import { TableType } from "@/components/table/table.types";
import { cn } from "@/lib/utils";
import { FC, ReactNode } from "react";

type TableProps = {
    type: TableType;
    children: ReactNode;
    className?: string;
};

export const Table: FC<TableProps> = ({ type = "list", children, className }) => {
    if (type === "card") {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
                {children}
            </div>
        );
    }

    return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
};
