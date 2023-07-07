import { FC, ReactNode } from "react";

type Props = {
    withNav?: boolean;
    children: ReactNode;
};

export const CenteredContainer: FC<Props> = ({ withNav = true, children }) => {
    return (
        <div
            className={`flex
            ${withNav ? "h-full-with-nav" : "h-screen"}
            items-center justify-center first-letter:h-full-with-nav`}
        >
            {children}
        </div>
    );
};
