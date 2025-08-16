import { db } from "../firebase";
import { auth } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// Get all frameworks for the current user
export const getFrameworks = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const frameworksQuery = query(
      collection(db, "frameworks"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(frameworksQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching frameworks:", error);
    throw new Error("Failed to fetch frameworks");
  }
};

// Create a new framework
export const createFramework = async (frameworkData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const frameworksRef = collection(db, "frameworks");
    const docRef = await addDoc(frameworksRef, {
      ...frameworkData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...frameworkData,
      userId,
    };
  } catch (error) {
    console.error("Error creating framework:", error);
    throw new Error("Failed to create framework");
  }
};

// Update an existing framework
export const updateFramework = async (frameworkId, frameworkData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const frameworkRef = doc(db, "frameworks", frameworkId);
    await updateDoc(frameworkRef, {
      ...frameworkData,
      userId,
      updatedAt: serverTimestamp(),
    });

    return {
      id: frameworkId,
      ...frameworkData,
      userId,
    };
  } catch (error) {
    console.error("Error updating framework:", error);
    throw new Error("Failed to update framework");
  }
};

// Delete a framework
export const deleteFramework = async (frameworkId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const frameworkRef = doc(db, "frameworks", frameworkId);
    await deleteDoc(frameworkRef);
  } catch (error) {
    console.error("Error deleting framework:", error);
    throw new Error("Failed to delete framework");
  }
};

// Initialize default frameworks for a new user
export const initializeDefaultFrameworks = async () => {
  try {
    const defaultFrameworks = [
      {
        code: "CCSS",
        name: "Common Core State Standards",
        description: "Common Core State Standards Initiative",
      },
      {
        code: "NGSS",
        name: "Next Generation Science Standards",
        description: "Next Generation Science Standards",
      },
      {
        code: "STATE",
        name: "State Standards",
        description: "State-specific Educational Standards",
      },
    ];

    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const results = await Promise.all(
      defaultFrameworks.map((framework) => createFramework(framework))
    );

    return results;
  } catch (error) {
    console.error("Error initializing default frameworks:", error);
    throw new Error("Failed to initialize default frameworks");
  }
};
