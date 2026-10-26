import jwt_decode from "jwt-decode";

const refreshMarginMs = 60_000;
const invalidSessionCodes = new Set([
    "auth/user-token-expired",
    "auth/user-disabled",
    "auth/user-not-found",
    "auth/invalid-user-token",
    "auth/invalid-credential",
    "auth/requires-recent-login",
]);

export const getErrorMessage = (error: unknown): string | undefined => {
    if (typeof error === "string") {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return undefined;
};

export const isSessionInvalidError = (error: unknown): boolean => {
    const code = (error as { code?: unknown } | undefined)?.code;
    return typeof code === "string" && invalidSessionCodes.has(code);
};

export const getTokenRefreshDelayMs = (token: string, now = Date.now()): number => {
    const decoded = jwt_decode<{ exp?: number }>(token);

    if (!decoded.exp) {
        return 0;
    }

    const expiresAt = decoded.exp * 1000 - refreshMarginMs;
    return Math.max(expiresAt - now, 0);
};
