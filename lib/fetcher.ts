import { auth } from "@clerk/nextjs";
import ky from "ky-universal";
import { getUrl } from "./url";

/**
 * HELPERS
 */

const getHeaders = () => {
    const { userId } = auth();

    if (!userId) {
        throw new Error("User is not authenticated");
    }

    const updatedHeaders = new Headers();
    updatedHeaders.set("X-External-User-Id", userId);
    return updatedHeaders;
};

/**
 * FETCHER
 **/

const GET = async <T>(path: string): Promise<T | null> => {
    try {
        const res = await ky
            .get(`${getUrl()}${path}`, { headers: getHeaders() })
            .json<{ data: T; success: boolean }>();

        return res.data;
    } catch (error: any) {
        console.log(error.message);
        return null;
    }
};

export const fetcher = { GET };
