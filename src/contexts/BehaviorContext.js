import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  recordBehavior,
  updateBehavior as apiUpdateBehavior,
  deleteBehavior as apiDeleteBehavior,
} from "../services/behaviorService"; // Corrected service path

// Create the context
const BehaviorContext = createContext();

// Create a custom hook to use the behavior context
export const useBehavior = () => {
  const context = useContext(BehaviorContext);
  if (!context) {
    throw new Error("useBehavior must be used within a BehaviorProvider");
  }
  return context;
};

// Fallback taxonomy used if Firestore collection is empty/unavailable
const FALLBACK_SKILLS_TAXONOMY = {
  "Self-Regulation": ["Managing impulsivity", "Staying on task"],
  "Collaboration": ["Active listening", "Contributing to group goals", "Resolving conflicts"],
  "Resilience & Perseverance": ["Persisting through challenges", "Learning from setbacks"],
  "Empathy & Perspective-Taking": ["Considering others' feelings", "Showing compassion"],
  "Critical Thinking & Problem-Solving": ["Asking thoughtful questions", "Finding creative solutions"],
  "Leadership & Initiative": ["Taking ownership", "Inspiring others", "Proposing ideas"],
};

// Enhanced validation function
const validateBehaviorData = (behaviorData) => {
  const errors = [];
  
  if (!behaviorData.studentId) {
    errors.push("Student ID is required");
  }
  
  if (!behaviorData.date) {
    errors.push("Date is required");
  }
  
  if (!behaviorData.description || behaviorData.description.trim().length < 10) {
    errors.push("Description must be at least 10 characters long");
  }
  
  if (!behaviorData.skills || behaviorData.skills.length === 0) {
    errors.push("At least one skill must be selected");
  }
  
  return errors;
};

// Create the provider component
export const BehaviorProvider = ({ children }) => {
  const [behavior, setBehavior] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skillsTaxonomy, setSkillsTaxonomy] = useState(FALLBACK_SKILLS_TAXONOMY);

  // Set up real-time listener for behavior records
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const behaviorsCol = collection(db, "behaviors");
        const q = query(behaviorsCol, where("userId", "==", user.uid));

        const unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const behaviorData = snapshot.docs.map((doc) => {
              const data = doc.data();
              const { id, ...rest } = data;
              return { id: doc.id, ...rest };
            });
            setBehavior(behaviorData);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        setBehavior([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load skills taxonomy from Firestore (read-only) with fallback
  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return; // wait until authenticated
        const skillsCol = collection(db, "skills_taxonomy");
        const snapshot = await new Promise((resolve, reject) => {
          const unsubscribe = onSnapshot(
            skillsCol,
            (snap) => {
              unsubscribe();
              resolve(snap);
            },
            (err) => {
              unsubscribe();
              reject(err);
            }
          );
        });
        if (!snapshot.empty) {
          const taxonomy = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const categoryName = data.name || doc.id;
            taxonomy[categoryName] = Array.isArray(data.subSkills) ? data.subSkills : [];
          });
          setSkillsTaxonomy(taxonomy);
        } else {
          setSkillsTaxonomy(FALLBACK_SKILLS_TAXONOMY);
        }
      } catch (e) {
        setSkillsTaxonomy(FALLBACK_SKILLS_TAXONOMY);
      }
    };
    loadTaxonomy();
  }, []);

  // Function to log a new behavior incident
  const logBehavior = async (behaviorData) => {
    // Validate input data
    const validationErrors = validateBehaviorData(behaviorData);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(", ");
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    // Expects behaviorData in the new format: { studentId, date, description, skills, restorativeAction }
    try {
      const result = await recordBehavior(behaviorData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to update a behavior record
  const updateBehavior = async (behaviorId, updatedData) => {
    // Expects updatedData in the new format
    try {
      const result = await apiUpdateBehavior(behaviorId, updatedData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to delete a behavior record
  const deleteBehavior = async (behaviorId) => {
    try {
      const result = await apiDeleteBehavior(behaviorId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to get behavior records for a specific student
  const getBehaviorByStudent = (studentId) => {
    return behavior.filter((record) => record.studentId === studentId);
  };

  // Function to get the skills taxonomy
  const getSkillsTaxonomy = () => skillsTaxonomy;

  // Function to add a reflection to a behavior record
  const addReflection = async (behaviorId, reflectionData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const reflectionsCollection = collection(db, "behaviors", behaviorId, "reflections");
      const docData = {
        ...reflectionData,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(reflectionsCollection, docData);
      return { id: docRef.id, ...docData };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Create the value object to be provided by the context
  const value = {
    behavior,
    loading,
    error,
    logBehavior,
    updateBehavior,
    deleteBehavior,
    getBehaviorByStudent,
    getSkillsTaxonomy,
    addReflection,
  };

  return (
    <BehaviorContext.Provider value={value}>
      {children}
    </BehaviorContext.Provider>
  );
};

export default BehaviorContext;
