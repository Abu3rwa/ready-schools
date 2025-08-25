import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { app, db, auth } from "../firebase";
import { initializeDefaultFrameworks } from "../services/frameworkService";

// Create the context
const AuthContext = createContext();

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // If user exists in Firebase Auth, check if they have a document in Firestore
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          // If user doesn't have a document in Firestore, create one
          if (!userDoc.exists()) {
            const newUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              admin: false, // Default to non-admin
              createdAt: new Date(),
              // Initialize Gmail configuration fields
              gmail_configured: false,
              gmail_access_token: null,
              gmail_refresh_token: null,
              gmail_token_expiry: null,
              gmail_token_last_refresh: null,
              gmail_token_error: null,
              gmail_token_error_time: null,
            };
            
            await setDoc(userRef, newUserData);
            setUserProfile(newUserData);

            // Initialize default frameworks for new user
            try {
              console.log("Initializing default frameworks for new user...");
              const frameworks = await initializeDefaultFrameworks();
              console.log("Default frameworks created:", frameworks);
            } catch (err) {
              console.error("Error initializing default frameworks:", err);
              // Don't throw the error - we want the user to be able to log in even if framework creation fails
              // They can retry framework creation later
            }
          } else {
            // Load existing user profile data
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.warn("Firestore operation failed (possibly offline):", error);
          // Check if this is an offline error
          if (error.code === 'unavailable' || error.message.includes('offline')) {
            console.log("App is offline - user can still be authenticated but Firestore operations will be limited");
            // Set a flag or show notification that app is in offline mode
            // You could dispatch this to a global state or context if needed
          } else {
            console.error("Unexpected Firestore error:", error);
          }
          // Don't prevent user authentication due to Firestore errors
          // The user document can be created/updated when connection is restored
        }
      } else {
        setUserProfile(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Real sign in function (email/password)
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // setCurrentUser is handled by onAuthStateChanged
      setLoading(false);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Real sign out function
  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!currentUser;
  };

  // Check if user is admin
  const isAdmin = userProfile?.admin === true;

  // Update Gmail tokens
  const updateGmailTokens = async (tokens) => {
    if (!currentUser) {
      throw new Error("No authenticated user");
    }
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        gmail_configured: true,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: tokens.expiry_date,
        gmail_token_last_refresh: new Date().toISOString(),
        gmail_token_error: null,
        gmail_token_error_time: null,
      }, { merge: true });
      
      console.log("Gmail tokens updated successfully");
    } catch (error) {
      console.error("Error updating Gmail tokens:", error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes for additional permissions if needed
      provider.addScope("https://www.googleapis.com/auth/userinfo.email");
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
      // Add Gmail send permission - THIS IS THE MISSING PIECE!
      provider.addScope("https://www.googleapis.com/auth/gmail.send");

      // Keep it simple: let Firebase handle redirects; only prompt account selection
      provider.setCustomParameters({
        prompt: "select_account",
      });

      console.log("Starting Google sign-in process...");
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful:", result.user.email);
      // User creation in Firestore is handled by the onAuthStateChanged listener
      setLoading(false);
      return result.user;
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Create the value object to be provided by the context
  const value = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    error,
    signIn,
    signOut,
    signInWithGoogle,
    isAuthenticated,
    updateGmailTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
