export const getUrl = () => {
    return process.env.NODE_ENV === "development"
        ? "http://localhost:3002"
        : "https://rss.banjoanton.com"; // TODO: make this correct
};
