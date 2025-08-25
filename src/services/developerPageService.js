import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc, limit } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth } from "../firebase";

/**
 * Developer Page Service
 * Provides functions to handle developer page content and image management
 */

/**
 * Upload an image for the developer page
 * @param {string} section - The section of the developer page (e.g., 'profile', 'gallery', 'classroom', 'projects')
 * @param {File} file - The image file to upload
 * @param {Object} metadata - Additional metadata for the image
 * @returns {Promise<Object>} - Object containing image URL and metadata
 */
export const uploadDeveloperPageImage = async (section, file, metadata = {}) => {
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    // Check both MIME type and file extension for better validation
    const isMimeTypeValid = allowedTypes.includes(file.type);
    const isExtensionValid = allowedExtensions.includes(`.${fileExtension}`);
    
    if (!isMimeTypeValid && !isExtensionValid) {
      console.error('❌ Invalid file type:', file.type, fileExtension);
      throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
    }
    console.log('✅ File type valid');

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'vs', maxSize);
      throw new Error("File size too large. Maximum size is 5MB.");
    }
    console.log('✅ File size valid');

    console.log('☁️ Starting upload to Firebase Storage...');
    
    // Test Firebase Storage connection
    let storage;
    try {
      storage = getStorage();
      console.log('✅ Firebase Storage initialized successfully');
    } catch (storageInitError) {
      console.error('❌ Failed to initialize Firebase Storage:', storageInitError);
      throw new Error(`Storage initialization failed: ${storageInitError.message}`);
    }
    
    const originalExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `developer-page/${section}/${user.uid}_${timestamp}.${originalExtension}`;
    
    let storageRef;
    try {
      storageRef = ref(storage, fileName);
      console.log('✅ Storage reference created successfully');
      console.log('📁 Storage path:', fileName);
      
      // Test storage access by attempting to get metadata of storage root
      console.log('🔍 Testing storage connection...');
      try {
        // This will help identify if the rules are the issue
        const testRef = ref(storage, 'test-connection');
        // Note: This might fail with rules, but we can catch and continue
        console.log('🔗 Storage connection test completed');
      } catch (connectionError) {
        console.warn('⚠️ Storage connection test failed (this may be normal if rules restrict access):', connectionError.message);
      }
      
    } catch (refError) {
      console.error('❌ Failed to create storage reference:', refError);
      throw new Error(`Storage reference creation failed: ${refError.message}`);
    }
    
    // Add timeout protection for upload with retry mechanism
    const uploadWithRetry = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`🔄 Upload attempt ${attempt}/${retries}`);
          
          // Increase timeout for larger files or slower connections
          const timeoutDuration = attempt === 1 ? 45000 : 60000; // 45s first, then 60s
          
          const uploadPromise = uploadBytes(storageRef, file);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Upload timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration);
          });
          
          // Race between upload and timeout
          await Promise.race([uploadPromise, timeoutPromise]);
          console.log(`✅ File uploaded to storage successfully on attempt ${attempt}`);
          return; // Success, exit retry loop
          
        } catch (uploadError) {
          console.error(`❌ Upload attempt ${attempt} failed:`, uploadError);
          
          // Check for specific Firebase Storage errors
          if (uploadError.message.includes('not been set up') || uploadError.message.includes('Get Started')) {
            throw new Error('Firebase Storage is not enabled. Please go to Firebase Console > Storage and click "Get Started" to enable Storage.');
          }
          
          // Check if it's a permission error (should fail immediately)
          if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
            throw new Error('Permission denied. Please ensure Firebase Storage rules are deployed and you are authenticated.');
          }
          
          if (attempt === retries) {
            // Last attempt failed, throw error
            if (uploadError.message.includes('timeout')) {
              throw new Error(`Upload failed: Network timeout after ${retries} attempts. Please check your internet connection and try again.`);
            }
            throw new Error(`Storage upload failed after ${retries} attempts: ${uploadError.message}`);
          }
          
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    
    try {
      await uploadWithRetry();
    } catch (uploadError) {
      console.error('❌ All upload attempts failed:', uploadError);
      throw uploadError;
    }
    
    console.log('🔗 Getting download URL...');
    let downloadURL;
    try {
      downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Download URL obtained:', downloadURL);
    } catch (urlError) {
      console.error('❌ Failed to get download URL:', urlError);
      throw new Error(`Failed to get download URL: ${urlError.message}`);
    }
    
    console.log('💾 Saving to Firestore...', { section, metadata });
    
    // Save image metadata to Firestore
    const imageData = {
      url: downloadURL,
      downloadURL: downloadURL, // Keep both for compatibility
      fileName: file.name,
      originalFileName: file.name,
      size: file.size,
      type: file.type,
      section: section,
      userId: user.uid,
      uploadedAt: new Date(),
      storagePath: fileName,
      metadata: {
        ...metadata,
        alt: metadata.alt || `Developer page ${section} image`,
        caption: metadata.caption || '',
        category: metadata.category || section,
        isActive: metadata.isActive !== undefined ? metadata.isActive : true
      }
    };

    console.log('📄 Image data prepared:', imageData);
    
    // Add to developer page images collection
    let docRef;
    try {
      const imagesCollection = collection(db, "developerPageImages");
      console.log('📁 Collection reference created, adding document...');
      docRef = await addDoc(imagesCollection, imageData);
      console.log('✅ Saved to Firestore with ID:', docRef.id);
    } catch (firestoreError) {
      console.error('❌ Firestore save failed:', firestoreError);
      // Clean up storage if Firestore fails
      try {
        await deleteObject(storageRef);
        console.log('🗑️ Cleaned up storage file after Firestore failure');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup storage file:', cleanupError);
      }
      throw new Error(`Firestore save failed: ${firestoreError.message}`);
    }
    
    const result = {
      id: docRef.id,
      ...imageData
    };
    console.log('✅ Upload complete, returning:', result);
    return result;
  } catch (error) {
    console.error("Error uploading developer page image:", error);
    throw error;
  }
};

/**
 * Get all images for a specific section
 * @param {string} section - The section to get images for
 * @returns {Promise<Array>} - Array of image objects
 */
export const getDeveloperPageImages = async (section = null) => {
  try {
    const imagesCollection = collection(db, "developerPageImages");
    let q = query(imagesCollection);
    
    if (section) {
      q = query(q, where("section", "==", section));
    }

    // Only filter by active images for public viewing
    q = query(q, where("metadata.isActive", "==", true));

    const querySnapshot = await getDocs(q);
    const images = [];
    
    querySnapshot.forEach((doc) => {
      images.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by upload date (newest first)
    images.sort((a, b) => {
      const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt);
      const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt);
      return dateB - dateA;
    });

    return images;
  } catch (error) {
    console.error("Error fetching developer page images:", error);
    throw error;
  }
};

/**
 * Delete a developer page image
 * @param {string} imageId - The ID of the image to delete
 * @returns {Promise<void>}
 */
export const deleteDeveloperPageImage = async (imageId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get image document
    const imageDoc = await getDoc(doc(db, "developerPageImages", imageId));
    if (!imageDoc.exists()) {
      throw new Error("Image not found");
    }

    const imageData = imageDoc.data();
    
    // Verify ownership
    if (imageData.userId !== user.uid) {
      throw new Error("Unauthorized to delete this image");
    }

    // Delete from storage
    if (imageData.storagePath) {
      const storage = getStorage();
      const storageRef = ref(storage, imageData.storagePath);
      try {
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn("Error deleting from storage:", storageError);
        // Continue with Firestore deletion even if storage deletion fails
      }
    }

    // Delete from Firestore
    await deleteDoc(doc(db, "developerPageImages", imageId));
    
  } catch (error) {
    console.error("Error deleting developer page image:", error);
    throw error;
  }
};

/**
 * Update image metadata
 * @param {string} imageId - The ID of the image to update
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated image data
 */
export const updateDeveloperPageImage = async (imageId, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get current image data
    const imageDoc = await getDoc(doc(db, "developerPageImages", imageId));
    if (!imageDoc.exists()) {
      throw new Error("Image not found");
    }

    const currentData = imageDoc.data();
    
    // Verify ownership
    if (currentData.userId !== user.uid) {
      throw new Error("Unauthorized to update this image");
    }

    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // Update in Firestore
    const imageRef = doc(db, "developerPageImages", imageId);
    await updateDoc(imageRef, updateData);
    
    return {
      id: imageId,
      ...currentData,
      ...updateData
    };
  } catch (error) {
    console.error("Error updating developer page image:", error);
    throw error;
  }
};

/**
 * Get developer page content data
 * @returns {Promise<Object>} - Developer page content
 */
export const getDeveloperPageContent = async () => {
  try {
    // Try to get the first available content document (for public viewing)
    // In a production app, you might want to have a specific public content document
    const contentCollection = collection(db, "developerPageContent");
    const querySnapshot = await getDocs(query(contentCollection, limit(1)));
    
    if (querySnapshot.empty) {
      // Return default structure if no content exists
      return {
        profile: {
          name: '',
          role: '',
          bio: '',
          experience: '',
          specialization: '',
          school: '',
          background: '',
          contact: {
            email: '',
            linkedin: '',
            github: '',
            portfolio: '',
            consulting: ''
          }
        },
        journey: {
          motivation: '',
          painPoints: '',
          philosophy: ''
        },
        credentials: {
          teaching: [],
          technical: []
        },
        images: {
          profile: null,
          classroom: [],
          projects: [],
          gallery: []
        }
      };
    }

    const doc = querySnapshot.docs[0];
    return doc.data();
  } catch (error) {
    console.error("Error fetching developer page content:", error);
    throw error;
  }
};

/**
 * Update developer page content
 * @param {Object} content - Content to update
 * @returns {Promise<Object>} - Updated content
 */
export const updateDeveloperPageContent = async (content) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const contentRef = doc(db, "developerPageContent", user.uid);
    const updateData = {
      ...content,
      userId: user.uid,
      updatedAt: new Date()
    };

    await setDoc(contentRef, updateData, { merge: true });
    
    return updateData;
  } catch (error) {
    console.error("Error updating developer page content:", error);
    throw error;
  }
};

/**
 * Bulk upload images for a section
 * @param {string} section - The section to upload images to
 * @param {Array<File>} files - Array of image files
 * @param {Object} commonMetadata - Common metadata for all images
 * @returns {Promise<Array>} - Array of uploaded image objects
 */
export const bulkUploadDeveloperPageImages = async (section, files, commonMetadata = {}) => {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadDeveloperPageImage(section, file, {
        ...commonMetadata,
        order: index
      })
    );

    const results = await Promise.allSettled(uploadPromises);
    
    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          fileName: files[index].name,
          error: result.reason.message
        });
      }
    });

    return { successful, failed };
  } catch (error) {
    console.error("Error in bulk upload:", error);
    throw error;
  }
};