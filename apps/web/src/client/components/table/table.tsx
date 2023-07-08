import { FC, ReactNode } from "react";
import { TableType } from "@/client/components/table/table.types";

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
