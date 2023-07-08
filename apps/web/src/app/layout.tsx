import "@/client/styles/globals.css";
import { Metadata } from "next";
import { SiteHeader } from "@/client/components/nav/site-header";
import { TailwindIndicator } from "@/client/components/utils/tailwind-indicator";
import { ThemeProvider } from "@/client/components/utils/theme-provider";
import { siteConfig } from "@/client/config/site";
import { fontSans } from "@/client/lib/fonts";
import { cn } from "@/client/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
};

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <>
            <ClerkProvider>
                <html lang="en" suppressHydrationWarning>
                    <head />
                    <body
                        className={cn(
                            "min-h-screen bg-background font-sans antialiased",
                            fontSans.variable,
                        )}
                    >
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                        >
                            <Toaster position={"bottom-center"} />
                            <div className="relative flex min-h-screen flex-col">
                                <SiteHeader />
                                <div className="flex-1">{children}</div>
                            </div>
                            <TailwindIndicator />
                        </ThemeProvider>
                    </body>
                </html>
            </ClerkProvider>
        </>
    );
}
