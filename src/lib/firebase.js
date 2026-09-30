import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.VITE_FIREBASE_API_KEY)) ||
  "AIzaSyDt170uwtKAY-GHCfFIzYp0ARjUXPEf0wY";

const firebaseConfig = {
  apiKey,
  authDomain:
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        process.env.VITE_FIREBASE_AUTH_DOMAIN)) ||
    "guild-league-la.firebaseapp.com",
  projectId:
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        process.env.VITE_FIREBASE_PROJECT_ID)) ||
    "guild-league-la",
  storageBucket:
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.VITE_FIREBASE_STORAGE_BUCKET)) ||
    "guild-league-la.firebasestorage.app",
  messagingSenderId:
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID)) ||
    "448595192379",
  appId:
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
        process.env.VITE_FIREBASE_APP_ID)) ||
    "1:448595192379:web:58f848ad48cec99ec80a1e",
  measurementId:
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
        process.env.VITE_FIREBASE_MEASUREMENT_ID)) ||
    "G-XVB4PDFK46",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
