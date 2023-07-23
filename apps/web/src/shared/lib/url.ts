export const getUrl = () => {
    return process.env.NODE_ENV === "development"
        ? "http://localhost:3002"
        : "https://banjo-rss-web.host.banjoanton.com";
};
