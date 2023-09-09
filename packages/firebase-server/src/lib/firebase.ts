import { raise } from "@banjoanton/utils";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import "dotenv/config";

const serviceAccount = {
    key: process.env.FIREBASE_ADMIN_KEY ?? raise("FIREBASE_ADMIN_KEY missing"),
};

const firebaseBuffer = Buffer.from(serviceAccount.key, "base64");
const firebaseKey = firebaseBuffer.toString("utf8");

const app = initializeApp({
    credential: cert(JSON.parse(firebaseKey)),
});

export const auth = getAuth(app);
