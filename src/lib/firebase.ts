import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase must only initialize in the browser.
// During Next.js static generation (server-side), window is undefined
// and calling getAuth() causes auth/invalid-api-key on every page.
const isBrowser = typeof window !== 'undefined';

const app: FirebaseApp | null = isBrowser
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth: Auth = (app ? getAuth(app) : null) as Auth;

