import { TableType } from "@/components/table/table.types";
import { FC, ReactNode } from "react";

type TableProps = {
    type: TableType;
    children: ReactNode;
};

export const Table: FC<TableProps> = ({ type = "list", children }) => {
    if (type === "card") {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
        );
    }

    return <div className="flex flex-col gap-2">{children}</div>;
};
