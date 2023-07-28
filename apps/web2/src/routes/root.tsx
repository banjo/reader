import { SiteHeader } from "@/components/site-header";
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

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <>
                <SignedIn>
                    <Layout />
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
                element: <LandingPage />,
            },
            {
                path: "/sign-in/*",
                element: <SignIn routing="path" path="/sign-in" />,
            },
            {
                path: "/sign-up/*",
                element: <SignUp routing="path" path="/sign-up" />,
            },
            {
                path: "*",
                element: <Navigate to={"/"} />,
            },
        ],
    },
]);

const clerkPubKey =
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
