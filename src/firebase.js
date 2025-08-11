// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ-7aj31jfFfwOx2uHMkVp3Wzwef6jYzA",
  authDomain: "smile3-8c8c5.firebaseapp.com",
  projectId: "smile3-8c8c5",
  storageBucket: "smile3-8c8c5.firebasestorage.app",
  messagingSenderId: "610841874714",
  appId: "1:610841874714:web:99f1823fc74cc7943cdca3",
  measurementId: "G-M3P5N10C5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Export the initialized app, db, auth, and functions
export { app, db, auth, functions };
