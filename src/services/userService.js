import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from "../firebase";

/**
 * User Service
 * Provides functions to handle user profile operations
 */

/**
 * Get a user's profile data
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User profile not found");
    }

    return userDoc.data();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Update a user's profile data
 * @param {string} userId - The user ID to update
 * @param {Object} profileData - New profile data
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    // Validate data before updating
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // Remove any fields that should not be directly modified
    const { 
      uid, 
      createdAt, 
      admin, 
      gmail_access_token, 
      gmail_refresh_token,
      gmail_token_expiry,
      gmail_token_last_refresh,
      gmail_token_error,
      gmail_token_error_time,
      ...safeProfileData 
    } = profileData;
    
    // Add timestamp for update
    const updateData = {
      ...safeProfileData,
      updatedAt: new Date()
    };
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updateData);
    
    // If we're updating displayName or photoURL, also update in Firebase Auth
    if (auth.currentUser && (profileData.displayName || profileData.photoURL)) {
      const authUpdateData = {};
      if (profileData.displayName) authUpdateData.displayName = profileData.displayName;
      if (profileData.photoURL) authUpdateData.photoURL = profileData.photoURL;
      
      await updateProfile(auth.currentUser, authUpdateData);
    }
    
    // Return the updated profile
    return getUserProfile(userId);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Upload a profile image
 * @param {string} userId - The user ID
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - URL of the uploaded image
 */
export const uploadProfileImage = async (userId, file) => {
  try {
    const storage = getStorage();
    const fileExtension = file.name.split(".").pop();
    const fileName = `profile-images/${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update the user's photoURL
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      
      // Also update in Firestore
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { 
        photoURL: downloadURL,
        updatedAt: new Date()
      });
    }
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};

/**
 * Update user preferences
 * @param {string} userId - The user ID 
 * @param {Object} preferences - New preferences object
 * @returns {Promise<Object>} - Updated preferences
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { 
      preferences,
      updatedAt: new Date()
    });
    
    return preferences;
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};