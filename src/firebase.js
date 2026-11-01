import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/gu, (letter) => `_${letter}`).toUpperCase()}`);

export const firebaseConfigError = missingConfig.length
  ? `Firebase is not configured. Add ${missingConfig.join(', ')} to your local .env file.`
  : null;

let app;
let auth;
let db;
let initializationError = null;

if (!firebaseConfigError) {
  try {
    app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    initializationError = `Firebase could not initialize: ${error.message}`;
  }
}

export const firebaseError = firebaseConfigError ?? initializationError;
export const isFirebaseConfigured = !firebaseError;
export { auth, db };
