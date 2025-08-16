import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const initializeGmailFields = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      gmail_configured: false,
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_token_expiry: null,
    });
    console.log("Gmail fields initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing Gmail fields:", error);
    return false;
  }
};
