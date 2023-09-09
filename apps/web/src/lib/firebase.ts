import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? raise("VITE_FIREBASE_API_KEY missing"),
//     authDomain:
//         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? raise("VITE_FIREBASE_AUTH_DOMAIN missing"),
//     projectId:
//         import.meta.env.VITE_FIREBASE_PROJECT_ID ?? raise("VITE_FIREBASE_PROJECT_ID missing"),
//     storageBucket:
//         import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
//         raise("VITE_FIREBASE_STORAGE_BUCKET missing"),
//     messagingSenderId:
//         import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
//         raise("VITE_FIREBASE_MESSAGING_SENDER_ID missing"),
//     appId: import.meta.env.VITE_FIREBASE_APP_ID ?? raise("VITE_FIREBASE_APP_ID missing"),
//     measurementId:
//         import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ??
//         raise("VITE_FIREBASE_MEASUREMENT_ID missing"),
// };

const firebaseConfig = {
    apiKey: "AIzaSyBwINPEigXro7wlkGCtVYOBbKgTEzGu2GE",
    authDomain: "banjo-rss-auth.firebaseapp.com",
    projectId: "banjo-rss-auth",
    storageBucket: "banjo-rss-auth.appspot.com",
    messagingSenderId: "15126327526",
    appId: "1:15126327526:web:38f4a1c045053b26a04b27",
    measurementId: "G-ZJ3JLPEVE8",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
