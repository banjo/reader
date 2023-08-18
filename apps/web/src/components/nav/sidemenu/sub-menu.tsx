import { FC, ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export const SubMenu: FC<Props> = ({ children }) => {
    return <div className="flex flex-col items-center justify-start gap-1 py-2">{children}</div>;
};
