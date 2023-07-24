const PROD_URL = process.env.WEB_PROD_URL;

export const getUrl = () => {
    return process.env.NODE_ENV === "development" ? "http://localhost:3002" : PROD_URL;
};
