import { raise } from "@banjoanton/utils";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import "dotenv/config";

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID ?? raise("FIREBASE_PROJECT_ID missing"),
    privateKey: process.env.FIREBASE_PRIVATE_KEY ?? raise("FIREBASE_PRIVATE_KEY missing"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? raise("FIREBASE_CLIENT_EMAIL missing"),
};

const app = initializeApp({
    credential: cert({
        projectId: serviceAccount.projectId,
        privateKey: serviceAccount.privateKey.replace(/\\n/g, "\n"),
        clientEmail: serviceAccount.clientEmail,
    }),
});

export const auth = getAuth(app);
