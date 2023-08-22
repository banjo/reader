import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const app = initializeApp({
    credential: applicationDefault(),
    projectId: "banjo-rss",
});

export const auth = getAuth(app);
