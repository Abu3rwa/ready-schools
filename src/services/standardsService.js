import { db } from "../firebase";
import { auth } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// Get all standards with optional filters
export const getStandards = async ({ framework, subject, gradeLevel } = {}) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    let standardsQuery = collection(db, "educational_standards");
    const filters = [where("userId", "==", userId)];

    if (framework) {
      filters.push(where("framework", "==", framework));
    }
    if (subject) {
      filters.push(where("subject", "==", subject));
    }
    if (gradeLevel) {
      filters.push(where("gradeLevel", "==", gradeLevel));
    }

    standardsQuery = query(standardsQuery, ...filters);
    const snapshot = await getDocs(standardsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching standards:", error);
    throw new Error("Failed to fetch standards");
  }
};

// Create a new standard
export const createStandard = async (standardData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    // Use the standard code as the document ID
    const standardId = standardData.code;
    if (!standardId) throw new Error("Standard code is required");

    const standardRef = doc(db, "educational_standards", standardId);
    await setDoc(standardRef, {
      ...standardData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: standardId,
      ...standardData,
      userId,
    };
  } catch (error) {
    console.error("Error creating standard:", error);
    throw new Error("Failed to create standard");
  }
};

// Update an existing standard
export const updateStandard = async (standardId, standardData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const standardRef = doc(db, "educational_standards", standardId);
    await updateDoc(standardRef, {
      ...standardData,
      userId,
      updatedAt: serverTimestamp(),
    });

    return {
      id: standardId,
      ...standardData,
      userId,
    };
  } catch (error) {
    console.error("Error updating standard:", error);
    throw new Error("Failed to update standard");
  }
};

// Delete a standard
export const deleteStandard = async (standardId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const standardRef = doc(db, "educational_standards", standardId);
    await deleteDoc(standardRef);
  } catch (error) {
    console.error("Error deleting standard:", error);
    throw new Error("Failed to delete standard");
  }
};

// Bulk import standards
export const bulkImportStandards = async (standards) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const timestamp = serverTimestamp();

    // Use setDoc with standard code as ID for each standard
    const results = await Promise.all(
      standards.map((standard) => {
        const standardId = standard.code;
        if (!standardId) throw new Error("Standard code is required");

        const standardRef = doc(db, "educational_standards", standardId);
        return setDoc(standardRef, {
          ...standard,
          userId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      })
    );

    return standards.map((standard) => ({
      id: standard.code,
      ...standard,
      userId,
    }));
  } catch (error) {
    console.error("Error bulk importing standards:", error);
    throw new Error("Failed to bulk import standards");
  }
};
