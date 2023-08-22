import { SideMenuContainer } from "@/components/nav/sidemenu/side-menu-container";
import { SiteHeader } from "@/components/nav/site-header";
import { CenteredContainer } from "@/components/shared/centered-container";
import { useAuth } from "@/contexts/auth-context";
import { FeedContainer } from "@/features/feed/containers/feed-container";
import { AllContainer } from "@/features/items/containers/all-container";
import { BookmarkContainer } from "@/features/items/containers/bookmark-container";
import { FavoriteContainer } from "@/features/items/containers/favorite-container";
import ErrorPage from "@/routes/error-page";
import { LandingPage } from "@/routes/landing-page";
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
                <main className="flex-1 p-4 md:p-6 overflow-y-scroll h-screen">
                    <Outlet />
                </main>
            </section>
        </>
    );
}

const router = createBrowserRouter([
    {
        path: "/",
        errorElement: <ErrorPage />,
        element: (
            <>
                <SignedInLayout />
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

// TODO: use one router instead as firebase support that
const signedOutRouter = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: (
                    <CenteredContainer>
                        <LandingPage />
                    </CenteredContainer>
                ),
            },
            // {
            //     path: "/sign-in/*",
            //     element: <SignInPage />,
            // },
            {
                path: "*",
                element: <Navigate to={"/"} />,
            },
        ],
    },
]);

export function Root() {
    const { userId } = useAuth();

    if (!userId) {
        return <RouterProvider router={signedOutRouter} />;
    }

    return <RouterProvider router={router} />;
}
