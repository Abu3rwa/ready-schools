import { db } from "../firebase";
import { auth } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";

// Get current user ID
const getCurrentUserId = () => {
  return auth.currentUser ? auth.currentUser.uid : null;
};

// ============================================================================
// STANDARDS MAPPING SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all standards mappings for an assignment
 * @param {string} assignmentId - The assignment ID
 * @returns {Promise<Array>} Array of standards mappings
 */
export const getStandardsMappings = async (assignmentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const mappingsQuery = query(
      collection(db, "assignment_standards_mappings"),
      where("userId", "==", userId),
      where("assignmentId", "==", assignmentId)
    );
    
    const snapshot = await getDocs(mappingsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching standards mappings:", error);
    throw new Error("Failed to fetch standards mappings");
  }
};

/**
 * Create a new standards mapping
 * @param {Object} mappingData - Mapping data
 * @returns {Promise<Object>} Created mapping
 */
export const createStandardMapping = async (mappingData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const mappingRef = collection(db, "assignment_standards_mappings");
    const docRef = await addDoc(mappingRef, {
      ...mappingData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...mappingData,
      userId,
    };
  } catch (error) {
    console.error("Error creating standards mapping:", error);
    throw new Error("Failed to create standards mapping");
  }
};

/**
 * Update an existing standards mapping
 * @param {string} mappingId - The mapping ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated mapping
 */
export const updateStandardMapping = async (mappingId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const mappingRef = doc(db, "assignment_standards_mappings", mappingId);
    await updateDoc(mappingRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return {
      id: mappingId,
      ...updates,
    };
  } catch (error) {
    console.error("Error updating standards mapping:", error);
    throw new Error("Failed to update standards mapping");
  }
};

/**
 * Delete a standards mapping
 * @param {string} mappingId - The mapping ID
 * @returns {Promise<void>}
 */
export const deleteStandardMapping = async (mappingId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const mappingRef = doc(db, "assignment_standards_mappings", mappingId);
    await deleteDoc(mappingRef);
  } catch (error) {
    console.error("Error deleting standards mapping:", error);
    throw new Error("Failed to delete standards mapping");
  }
};

/**
 * Get all standards mappings for the current user
 * @returns {Promise<Array>} Array of all mappings
 */
export const getUserStandardsMappings = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const mappingsQuery = query(
      collection(db, "assignment_standards_mappings"),
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(mappingsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching user standards mappings:", error);
    throw new Error("Failed to fetch user standards mappings");
  }
};

// ============================================================================
// STANDARDS GRADING SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new standards grade
 * @param {Object} standardsGradeData - Standards grade data
 * @returns {Promise<Object>} Created standards grade
 */
export const createStandardsGrade = async (standardsGradeData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const gradeRef = collection(db, "standards_grades");
    const docRef = await addDoc(gradeRef, {
      ...standardsGradeData,
      userId,
      gradedBy: userId,
      gradedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...standardsGradeData,
      userId,
      gradedBy: userId,
    };
  } catch (error) {
    console.error("Error creating standards grade:", error);
    throw new Error("Failed to create standards grade");
  }
};

/**
 * Update an existing standards grade
 * @param {string} gradeId - The grade ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated standards grade
 */
export const updateStandardsGrade = async (gradeId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const gradeRef = doc(db, "standards_grades", gradeId);
    await updateDoc(gradeRef, {
      ...updates,
      gradedBy: userId,
      gradedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: gradeId,
      ...updates,
      gradedBy: userId,
    };
  } catch (error) {
    console.error("Error updating standards grade:", error);
    throw new Error("Failed to update standards grade");
  }
};

/**
 * Get standards grades for a specific assignment
 * @param {string} assignmentId - The assignment ID
 * @returns {Promise<Array>} Array of standards grades
 */
export const getStandardsGradesByAssignment = async (assignmentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const gradesQuery = query(
      collection(db, "standards_grades"),
      where("userId", "==", userId),
      where("assignmentId", "==", assignmentId)
    );
    
    const snapshot = await getDocs(gradesQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching standards grades by assignment:", error);
    throw new Error("Failed to fetch standards grades by assignment");
  }
};

/**
 * Get standards grades for a specific student
 * @param {string} studentId - The student ID
 * @param {string} standardId - Optional standard ID filter
 * @returns {Promise<Array>} Array of standards grades
 */
export const getStandardsGradesByStudent = async (studentId, standardId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    let gradesQuery = query(
      collection(db, "standards_grades"),
      where("userId", "==", userId),
      where("studentId", "==", studentId)
    );

    if (standardId) {
      gradesQuery = query(gradesQuery, where("standardId", "==", standardId));
    }
    
    const snapshot = await getDocs(gradesQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching standards grades by student:", error);
    throw new Error("Failed to fetch standards grades by student");
  }
};

/**
 * Get a specific standards grade
 * @param {string} gradeId - The grade ID
 * @returns {Promise<Object>} Standards grade object
 */
export const getStandardsGrade = async (gradeId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const gradeRef = doc(db, "standards_grades", gradeId);
    const gradeDoc = await getDoc(gradeRef);
    
    if (!gradeDoc.exists()) {
      throw new Error("Standards grade not found");
    }

    return {
      id: gradeDoc.id,
      ...gradeDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching standards grade:", error);
    throw new Error("Failed to fetch standards grade");
  }
};

/**
 * Delete a standards grade
 * @param {string} gradeId - The grade ID
 * @returns {Promise<void>}
 */
export const deleteStandardsGrade = async (gradeId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const gradeRef = doc(db, "standards_grades", gradeId);
    await deleteDoc(gradeRef);
  } catch (error) {
    console.error("Error deleting standards grade:", error);
    throw new Error("Failed to delete standards grade");
  }
};

/**
 * Bulk create standards grades
 * @param {Array} gradesArray - Array of standards grade data
 * @returns {Promise<Array>} Array of created grades
 */
export const bulkCreateStandardsGrades = async (gradesArray) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const timestamp = serverTimestamp();
    const results = [];

    for (const gradeData of gradesArray) {
      const gradeRef = collection(db, "standards_grades");
      const docRef = await addDoc(gradeRef, {
        ...gradeData,
        userId,
        gradedBy: userId,
        gradedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      results.push({
        id: docRef.id,
        ...gradeData,
        userId,
        gradedBy: userId,
      });
    }

    return results;
  } catch (error) {
    console.error("Error bulk creating standards grades:", error);
    throw new Error("Failed to bulk create standards grades");
  }
};

/**
 * Get standards grades for a specific assignment and student
 * @param {string} assignmentId - The assignment ID
 * @param {string} studentId - The student ID
 * @returns {Promise<Array>} Array of standards grades
 */
export const getStandardsGradesByAssignmentAndStudent = async (assignmentId, studentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const gradesQuery = query(
      collection(db, "standards_grades"),
      where("userId", "==", userId),
      where("assignmentId", "==", assignmentId),
      where("studentId", "==", studentId)
    );
    
    const snapshot = await getDocs(gradesQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching standards grades by assignment and student:", error);
    throw new Error("Failed to fetch standards grades by assignment and student");
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate standards grade data
 * @param {Object} gradeData - Grade data to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateStandardsGrade = (gradeData) => {
  const errors = [];

  if (!gradeData.proficiencyLevel || gradeData.proficiencyLevel < 1 || gradeData.proficiencyLevel > 4) {
    errors.push("Proficiency level must be between 1 and 4");
  }

  if (gradeData.score !== undefined && (gradeData.score < 0 || gradeData.score > 100)) {
    errors.push("Score must be between 0 and 100");
  }

  if (!gradeData.studentId) {
    errors.push("Student ID is required");
  }

  if (!gradeData.assignmentId) {
    errors.push("Assignment ID is required");
  }

  if (!gradeData.standardId) {
    errors.push("Standard ID is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate standards mapping data
 * @param {Object} mappingData - Mapping data to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateStandardMapping = (mappingData) => {
  const errors = [];

  if (!mappingData.alignmentStrength || mappingData.alignmentStrength < 0.25 || mappingData.alignmentStrength > 1.0) {
    errors.push("Alignment strength must be between 0.25 and 1.0");
  }

  if (!["full", "partial", "supporting"].includes(mappingData.coverageType)) {
    errors.push("Coverage type must be full, partial, or supporting");
  }

  if (!mappingData.assignmentId) {
    errors.push("Assignment ID is required");
  }

  if (!mappingData.standardId) {
    errors.push("Standard ID is required");
  }

  if (mappingData.weight !== undefined && (mappingData.weight < 0 || mappingData.weight > 1)) {
    errors.push("Weight must be between 0 and 1");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}; 