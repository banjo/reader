const getUserId = (req: Request): number => {
    const headers = new Headers(req.headers);
    const userId = headers.get("X-User-Id");

    if (!userId) {
        throw new Error("User is not authenticated");
    }

    return Number(userId);
};

export const RequestService = { getUserId };
