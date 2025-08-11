import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { getCurrentUserId } from "./apiService";

/**
 * Get educational standards from Firestore
 * @param {Object} filters - Optional filters (framework, subject, gradeLevel)
 * @returns {Promise<Array>}
 */
export const getStandards = async (filters = {}) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const standardsCol = collection(db, "educational_standards");
    let q = query(standardsCol, where("userId", "==", userId));

    // Apply filters if provided
    if (filters.framework) {
      q = query(q, where("framework", "==", filters.framework));
    }
    if (filters.subject) {
      q = query(q, where("subject", "==", filters.subject));
    }
    if (filters.gradeLevel) {
      q = query(q, where("gradeLevel", "==", filters.gradeLevel));
    }

    const standardsSnapshot = await getDocs(q);
    const standardsList = standardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return standardsList;
  } catch (error) {
    console.error("Error fetching standards from Firestore:", error);
    throw new Error("Failed to fetch standards.");
  }
};

/**
 * Create a new educational standard in Firestore
 * @param {Object} standardData - Standard data to create
 * @returns {Promise<Object>}
 */
export const createStandard = async (standardData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    // Validate standard data
    if (!standardData.code || !standardData.framework || !standardData.description) {
      throw new Error("Missing required fields for standard");
    }

    const standardsCol = collection(db, "educational_standards");
    const newStandard = {
      ...standardData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    const docRef = await addDoc(standardsCol, newStandard);
    return { success: true, standard: { id: docRef.id, ...newStandard }};
  } catch (error) {
    console.error("Error creating standard in Firestore:", error);
    throw new Error("Failed to create standard.");
  }
};

/**
 * Update an educational standard in Firestore
 * @param {string} standardId - Standard ID
 * @param {Object} updates - Updated data
 * @returns {Promise<Object>}
 */
export const updateStandard = async (standardId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const standardRef = doc(db, "educational_standards", standardId);
    const standardDoc = await getDoc(standardRef);
    
    if (!standardDoc.exists()) {
      throw new Error("Standard not found");
    }

    const updatedStandard = {
      ...updates,
      updatedAt: new Date(),
      version: (standardDoc.data().version || 1) + 1
    };

    await updateDoc(standardRef, updatedStandard);
    return { success: true, standard: { id: standardId, ...updatedStandard }};
  } catch (error) {
    console.error("Error updating standard in Firestore:", error);
    throw new Error("Failed to update standard.");
  }
};

/**
 * Delete an educational standard from Firestore
 * @param {string} standardId - Standard ID
 * @returns {Promise<Object>}
 */
export const deleteStandard = async (standardId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const standardRef = doc(db, "educational_standards", standardId);
    await deleteDoc(standardRef);
    return { success: true, message: "Standard deleted successfully" };
  } catch (error) {
    console.error("Error deleting standard from Firestore:", error);
    throw new Error("Failed to delete standard.");
  }
};

/**
 * Get standards-assignment mappings from Firestore
 * @param {string} assignmentId - Optional assignment ID to filter mappings
 * @returns {Promise<Array>}
 */
export const getStandardsMappings = async (assignmentId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const mappingsCol = collection(db, "standards_assignments");
    let q = query(mappingsCol);
    
    if (assignmentId) {
      q = query(q, where("assignmentId", "==", assignmentId));
    }

    const mappingsSnapshot = await getDocs(q);
    const mappingsList = mappingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return mappingsList;
  } catch (error) {
    console.error("Error fetching standards mappings from Firestore:", error);
    throw new Error("Failed to fetch standards mappings.");
  }
};

/**
 * Create a standards-assignment mapping in Firestore
 * @param {Object} mappingData - Mapping data to create
 * @returns {Promise<Object>}
 */
export const createStandardMapping = async (mappingData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    if (!mappingData.standardId || !mappingData.assignmentId) {
      throw new Error("Missing required fields for mapping");
    }

    const mappingsCol = collection(db, "standards_assignments");
    const newMapping = {
      ...mappingData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(mappingsCol, newMapping);
    return { success: true, mapping: { id: docRef.id, ...newMapping }};
  } catch (error) {
    console.error("Error creating standards mapping in Firestore:", error);
    throw new Error("Failed to create standards mapping.");
  }
};

/**
 * Update a standards-assignment mapping in Firestore
 * @param {string} mappingId - Mapping ID
 * @param {Object} updates - Updated data
 * @returns {Promise<Object>}
 */
export const updateStandardMapping = async (mappingId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const mappingRef = doc(db, "standards_assignments", mappingId);
    const updatedMapping = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(mappingRef, updatedMapping);
    return { success: true, mapping: { id: mappingId, ...updatedMapping }};
  } catch (error) {
    console.error("Error updating standards mapping in Firestore:", error);
    throw new Error("Failed to update standards mapping.");
  }
};

/**
 * Delete a standards-assignment mapping from Firestore
 * @param {string} mappingId - Mapping ID
 * @returns {Promise<Object>}
 */
export const deleteStandardMapping = async (mappingId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const mappingRef = doc(db, "standards_assignments", mappingId);
    await deleteDoc(mappingRef);
    return { success: true, message: "Standards mapping deleted successfully" };
  } catch (error) {
    console.error("Error deleting standards mapping from Firestore:", error);
    throw new Error("Failed to delete standards mapping.");
  }
};

/**
 * Get standards progress tracking from Firestore
 * @param {string} studentId - Optional student ID to filter progress
 * @param {string} standardId - Optional standard ID to filter progress
 * @returns {Promise<Array>}
 */
export const getStandardsProgress = async (studentId = null, standardId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const progressCol = collection(db, "standards_progress");
    let q = query(progressCol);

    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }
    if (standardId) {
      q = query(q, where("standardId", "==", standardId));
    }

    const progressSnapshot = await getDocs(q);
    const progressList = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return progressList;
  } catch (error) {
    console.error("Error fetching standards progress from Firestore:", error);
    throw new Error("Failed to fetch standards progress.");
  }
};

/**
 * Update standards progress in Firestore
 * @param {Object} progressData - Progress data to update
 * @returns {Promise<Object>}
 */
export const updateStandardsProgress = async (progressData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    if (!progressData.studentId || !progressData.standardId) {
      throw new Error("Missing required fields for progress update");
    }

    const progressCol = collection(db, "standards_progress");
    const q = query(
      progressCol,
      where("studentId", "==", progressData.studentId),
      where("standardId", "==", progressData.standardId)
    );

    const progressSnapshot = await getDocs(q);
    let progressRef;
    let existingData = {};

    if (!progressSnapshot.empty) {
      progressRef = progressSnapshot.docs[0].ref;
      existingData = progressSnapshot.docs[0].data();
    } else {
      progressRef = doc(progressCol);
    }

    const updatedProgress = {
      ...existingData,
      ...progressData,
      updatedAt: new Date(),
      lastAssessed: new Date()
    };

    if (!progressSnapshot.empty) {
      await updateDoc(progressRef, updatedProgress);
    } else {
      await addDoc(progressCol, {
        ...updatedProgress,
        createdAt: new Date()
      });
    }

    return { success: true, progress: updatedProgress };
  } catch (error) {
    console.error("Error updating standards progress in Firestore:", error);
    throw new Error("Failed to update standards progress.");
  }
};

/**
 * Bulk import standards into Firestore
 * @param {Array} standards - Array of standard objects to import
 * @returns {Promise<Object>}
 */
export const bulkImportStandards = async (standards) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const batch = writeBatch(db);
    const standardsCol = collection(db, "educational_standards");
    const timestamp = new Date();

    standards.forEach(standard => {
      const docRef = doc(standardsCol);
      batch.set(docRef, {
        ...standard,
        userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1
      });
    });

    await batch.commit();
    return { 
      success: true, 
      message: `Successfully imported ${standards.length} standards` 
    };
  } catch (error) {
    console.error("Error bulk importing standards to Firestore:", error);
    throw new Error("Failed to bulk import standards.");
  }
};
