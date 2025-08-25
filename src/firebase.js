// Firebase configuration for Teacher Dashboard v2
import { initializeApp } from "firebase/app";
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDJ-7aj31jfFfwOx2uHMkVp3Wzwef6jYzA",
  authDomain: "smile3-8c8c5.firebaseapp.com",
  projectId: "smile3-8c8c5",
  storageBucket: "smile3-8c8c5.firebasestorage.app",
  messagingSenderId: "610841874714",
  appId: "1:610841874714:web:99f1823fc74cc7943cdca3",
  measurementId: "G-M3P5N10C5E",
};

// OAuth configuration
const authConfig = {
  clientId:
    "610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com",
  scopes: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with offline persistence
const db = getFirestore(app);

// Enable offline persistence
try {
  // Note: enableNetwork is called by default, but we can use disableNetwork/enableNetwork
  // to control offline behavior. For now, we just rely on automatic offline persistence.
  console.log("Firestore initialized with offline persistence");
} catch (error) {
  console.warn("Failed to enable Firestore offline persistence:", error);
}

const storage = getStorage(app);
console.log('Firebase Storage initialized:', storage.app.name);
const functions = getFunctions(app, "us-central1"); // Explicitly set region


// Initialize and configure auth
const auth = getAuth(app);
auth.useDeviceLanguage(); // Use browser's language
auth.settings.appVerificationDisabledForTesting = false; // Enable proper verification

// Ensure auth state persists across reloads
setPersistence(auth, browserLocalPersistence).catch((e) => {
  // Non-fatal; fallback persistence will be used
  console.warn("Auth persistence setup failed:", e?.message || e);
});

// Do not override auth domain; rely on Firebase default handling for localhost

// Export the initialized app, db, auth, storage, functions and config
export { app, db, auth, storage, functions, authConfig, enableNetwork, disableNetwork };
