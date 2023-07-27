import { Hono } from "hono";

export type AuthVariables = {
    userId: number;
};

export const createHonoInstance = () => {
    return new Hono<{ Variables: AuthVariables }>();
};
