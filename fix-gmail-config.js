// Script to fix Gmail configuration
// Run this in Firebase Functions environment

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const fixGmailConfig = async (userId) => {
  try {
    // Calculate new expiry time (1 hour from now)
    const newExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
    
    await db.collection("users").doc(userId).update({
      gmail_configured: true,
      gmail_token_expiry: newExpiry,
      gmail_token_error: null,
      gmail_token_error_time: null,
      gmail_last_error: null,
      gmail_error_time: null,
      gmail_token_last_refresh: new Date().toISOString()
    });
    
    console.log(`Fixed Gmail configuration for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to fix Gmail configuration:`, error);
    throw error;
  }
};
