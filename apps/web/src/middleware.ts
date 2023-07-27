import { getUrl } from "@/shared/lib/url";
import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
    publicRoutes: ["/"],
    afterAuth: async (auth, req) => {
        const url = req.url;

        if (url.includes("/api/auth")) {
            return NextResponse.next();
        }

        if (url.includes("/api/webhook")) {
            return NextResponse.next();
        }

        if (url.includes("/api")) {
            const externalId = req.headers.get("X-External-User-Id");

            if (!externalId) {
                return new Response("Unauthorized", { status: 401 });
            }

            const headersList = new Headers();
            headersList.set("X-External-User-Id", externalId);

            const response = await fetch(`${getUrl()}/api/auth`, {
                headers: headersList,
            });
            const result = await response.json();

            if (result.userId === null) {
                return new Response("Unauthorized", { status: 401 });
            }

            req.headers.set("X-User-Id", result.userId.toString());
            return NextResponse.next();
        }

        return NextResponse.next();
    },
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
