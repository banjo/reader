import { SideMenuContainer } from "@/components/nav/sidemenu/side-menu-container";
import { SiteHeader } from "@/components/nav/site-header";
import { CenteredContainer } from "@/components/shared/centered-container";
import { FeedContainer } from "@/features/feed/containers/feed-container";
import { AllContainer } from "@/features/items/containers/all-container";
import { BookmarkContainer } from "@/features/items/containers/bookmark-container";
import { FavoriteContainer } from "@/features/items/containers/favorite-container";
import { LandingPage } from "@/routes/landing-page";
import { raise } from "@banjoanton/utils";
import {
    ClerkProvider,
    RedirectToSignIn,
    SignedIn,
    SignedOut,
    SignIn,
    SignUp,
} from "@clerk/clerk-react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";

function Layout() {
    return (
        <>
            <SiteHeader />
            <Outlet />
        </>
    );
}

function SignedInLayout() {
    return (
        <>
            <SiteHeader />
            <section className="flex">
                <SideMenuContainer prefix="/dashboard" />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </section>
        </>
    );
}

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <>
                <SignedIn>
                    <SignedInLayout />
                </SignedIn>
                <SignedOut>
                    <RedirectToSignIn />
                </SignedOut>
            </>
        ),
        children: [
            {
                path: "/",
                element: <Navigate to={"/dashboard"} />,
            },
            {
                path: "/dashboard",
                element: <div>Dashboard</div>,
            },
            {
                path: "/dashboard/bookmarks",
                element: <BookmarkContainer />,
            },
            {
                path: "/dashboard/favorites",
                element: <FavoriteContainer />,
            },
            {
                path: "/dashboard/all",
                element: <AllContainer />,
            },
            {
                path: "/dashboard/feed/:slug",
                element: <FeedContainer />,
            },
            {
                path: "*",
                element: <Navigate to={"/dashboard"} />,
            },
        ],
    },
]);

// Need two routers due to Clerk not supporting React Router Dom 6.4 correctly yet
const signedOutRouter = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/",
                element: (
                    <CenteredContainer>
                        <LandingPage />
                    </CenteredContainer>
                ),
            },
            {
                path: "/sign-in/*",
                element: (
                    <CenteredContainer>
                        <SignIn routing="path" path="/sign-in" />
                    </CenteredContainer>
                ),
            },
            {
                path: "/sign-up/*",
                element: (
                    <CenteredContainer>
                        <SignUp routing="path" path="/sign-up" />{" "}
                    </CenteredContainer>
                ),
            },
            {
                path: "*",
                element: <Navigate to={"/"} />,
            },
        ],
    },
]);

const clerkPubKey =
    // @ts-ignore
    import.meta.env.VITE_REACT_APP_CLERK_PUBLISHABLE_KEY ?? raise("Missing Publishable Key");

export function Root() {
    return (
        <ClerkProvider publishableKey={clerkPubKey}>
            <SignedIn>
                <RouterProvider router={router} />
            </SignedIn>
            <SignedOut>
                <RouterProvider router={signedOutRouter} />
            </SignedOut>
        </ClerkProvider>
    );
}
