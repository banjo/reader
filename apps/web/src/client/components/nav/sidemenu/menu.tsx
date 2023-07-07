import { FC, ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export const Sidemenu: FC<Props> = ({ children }) => {
    return (
        <aside className="relative h-full-with-nav w-80 border-r bg-background py-4 dark:bg-background">
            {children}
        </aside>
    );
};
