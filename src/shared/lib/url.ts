export const getUrl = () => {
    return process.env.NODE_ENV === "development"
        ? "http://localhost:3002"
        : "http://localhost:3002"; // TODO: make this correct
};
