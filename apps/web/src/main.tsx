import { ErrorPage } from "@/components/shared/error";
import { GlobalLoading } from "@/components/shared/global-loading";
import { AuthProvider } from "@/contexts/auth-context";
import { Root } from "@/routes/root";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "react-hot-toast";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
        <ErrorBoundary fallback={<ErrorPage />}>
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                    <Toaster />
                    <GlobalLoading />
                    <Root />
                </QueryClientProvider>
            </AuthProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
