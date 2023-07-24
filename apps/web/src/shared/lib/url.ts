const PROD_URL = process.env.WEB_PROD_URL;

export const getUrl = () => {
    console.log("process.env.NODE_ENV", process.env.NODE_ENV);
    console.log("PROD_URL", PROD_URL);

    return process.env.NODE_ENV === "development" ? "http://localhost:3002" : PROD_URL;
};
