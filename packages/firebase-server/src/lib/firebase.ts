import { raise } from "@banjoanton/utils";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import "dotenv/config";

const serviceAccount = {
    // projectId: process.env.FIREBASE_PROJECT_ID ?? raise("FIREBASE_PROJECT_ID missing"),
    // privateKey: process.env.FIREBASE_PRIVATE_KEY ?? raise("FIREBASE_PRIVATE_KEY missing"),
    // clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? raise("FIREBASE_CLIENT_EMAIL missing"),
    key: process.env.FIREBASE_ADMIN_KEY ?? raise("FIREBASE_ADMIN_KEY missing"),
};

const firebaseBuffer = Buffer.from(serviceAccount.key, "base64");
const firebaseKey = firebaseBuffer.toString("utf8");

console.log("🪕%c Banjo | firebase.ts:17 |", "color: #E91E63", firebaseKey);

const app = initializeApp({
    credential: cert(JSON.parse(firebaseKey)),
});

export const auth = getAuth(app);
