import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth } from "../firebase";

/**
 * Student Image Service
 * Provides functions to handle student image uploads to Firebase Storage
 */

/**
 * Upload a student image to Firebase Storage
 * @param {string} studentId - The student ID
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - URL of the uploaded image
 */
export const uploadStudentImage = async (studentId, file) => {
  try {
    console.log('🔐 Checking authentication...');
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error("User not authenticated");
    }
    console.log('✅ User authenticated:', user.uid);

    console.log('📁 Validating file:', { name: file.name, size: file.size, type: file.type });
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum size is 5MB.");
    }
    console.log('✅ File validation passed');

    const storage = getStorage();
    const fileExtension = file.name.split(".").pop();
    const fileName = `student-images/${studentId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    console.log('☁️ Uploading to Firebase Storage...');
    console.log('📁 Storage path:', fileName);
    
    // Upload the file with retry logic
    const uploadWithRetry = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`🔄 Upload attempt ${attempt}/${retries}`);
          await uploadBytes(storageRef, file);
          console.log(`✅ File uploaded successfully on attempt ${attempt}`);
          return;
        } catch (uploadError) {
          console.error(`❌ Upload attempt ${attempt} failed:`, uploadError);
          
          if (uploadError.message.includes('not been set up') || uploadError.message.includes('Get Started')) {
            throw new Error('Firebase Storage is not enabled. Please contact your administrator.');
          }
          
          if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
            throw new Error('Permission denied. Please ensure you are logged in and try again.');
          }
          
          if (attempt === retries) {
            throw new Error(`Upload failed after ${retries} attempts: ${uploadError.message}`);
          }
          
          // Wait before retry
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    
    await uploadWithRetry();
    
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading student image:", error);
    throw error;
  }
};

/**
 * Delete a student image from Firebase Storage
 * @param {string} imageUrl - The URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteStudentImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    const storage = getStorage();
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('✅ Student image deleted successfully');
  } catch (error) {
    console.error("Error deleting student image:", error);
    // Don't throw error for deletion failures to avoid blocking other operations
  }
};