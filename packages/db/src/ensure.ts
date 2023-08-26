const raise = (error: string) => {
    throw new Error(error);
};

export const ensureDbReady = () => {
    process.env.DATABASE_URL ?? raise("DATABASE_URL is not set");
};
