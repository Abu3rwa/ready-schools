import React, { createContext, useState, useEffect, useContext } from "react";
import {
  createGrade,
  updateGrade as updateGradeAPI,
  deleteGrade as deleteGradeAPI,
} from "../services/apiService";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  getDocs,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Create the context
const GradeContext = createContext();

// Create a custom hook to use the grade context
export const useGrades = () => {
  const context = useContext(GradeContext);
  if (!context) {
    throw new Error("useGrades must be used within a GradeProvider");
  }
  return context;
};

// Create the provider component
export const GradeProvider = ({ children }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch grades on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        const gradesQuery = query(
          collection(db, "grades"),
          where("userId", "==", user.uid)
        );
        const unsubscribeGrades = onSnapshot(
          gradesQuery,
          (snapshot) => {
            const gradesData = snapshot.docs.map((doc) => {
              const data = doc.data();
              const { id, ...rest } = data;
              return { id: doc.id, ...rest };
            });
            setGrades(gradesData);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
        return () => unsubscribeGrades();
      } else {
        setGrades([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to add a new grade
  const addGrade = async (grade) => {
    return await createGrade(grade);
  };

  // Function to update a grade
  const updateGrade = async (gradeId, updatedData) => {
    return await updateGradeAPI(gradeId, updatedData);
  };

  // Function to delete a grade
  const deleteGrade = async (gradeId) => {
    return await deleteGradeAPI(gradeId);
  };

  // Function to delete all grades for a specific assignment
  const deleteGradesByAssignment = async (assignmentId) => {
    const gradesToDelete = grades.filter(
      (g) => g.assignmentId === assignmentId
    );
    if (gradesToDelete.length === 0) return;

    const batch = writeBatch(db);
    gradesToDelete.forEach((grade) => {
      const gradeRef = doc(db, "grades", grade.id);
      batch.delete(gradeRef);
    });

    await batch.commit();
  };

  // Create the value object to be provided by the context
  const value = {
    grades,
    loading,
    error,
    addGrade,
    updateGrade,
    deleteGrade,
    deleteGradesByAssignment,
  };

  return (
    <GradeContext.Provider value={value}>{children}</GradeContext.Provider>
  );
};

export default GradeContext;
