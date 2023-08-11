import { FC } from "react";

export const ErrorPage: FC = () => {
    // return a centered clean looking error message
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold">Something went wrong</h1>
            <p className="text-lg text-gray-500">Please try again later</p>
        </div>
    );
};
