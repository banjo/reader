import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getUrl } from "./shared/lib/url";

export default authMiddleware({
    publicRoutes: ["/"],
    afterAuth: async (auth, req) => {
        if (req.url?.includes("/api")) {
            const externalId = req.headers.get("X-External-User-Id");

            if (!externalId) {
                return new Response("Unauthorized", { status: 401 });
            }

            const headersList = new Headers(req.headers);

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
