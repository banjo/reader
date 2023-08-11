import { ErrorPage } from "@/components/shared/error";
import { Root } from "@/routes/root";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
        <ErrorBoundary fallback={<ErrorPage />}>
            <QueryClientProvider client={queryClient}>
                <Root />
            </QueryClientProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
