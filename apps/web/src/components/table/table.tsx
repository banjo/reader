import { TableType } from "@/components/table/table.types";
import { FC, ReactNode } from "react";

type TableProps = {
    type: TableType;
    children: ReactNode;
};

export const Table: FC<TableProps> = ({ type = "list", children }) => {
    if (type === "card") {
        throw new Error("Card table type not implemented");
    }

    return <div className="flex flex-col gap-2">{children}</div>;
};
