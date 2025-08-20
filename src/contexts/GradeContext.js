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
import { sampleData } from "../sampleData";

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
        console.log("User authenticated:", user.uid);
        setLoading(true);
        const gradesQuery = query(
          collection(db, "grades") // Removed userId filter temporarily
        );
        console.log("Fetching grades...");
        const unsubscribeGrades = onSnapshot(
          gradesQuery,
          (snapshot) => {
            console.log(
              "Grades snapshot received:",
              snapshot.size,
              "documents"
            );
            const gradesData = snapshot.docs.map((doc) => {
              const data = doc.data();
              console.log("Grade document:", doc.id, data);
              const { id, ...rest } = data;
              return { id: doc.id, ...rest };
            });
            console.log("Processed grades data:", gradesData);
            setGrades(gradesData);
            setLoading(false);
          },
          (err) => {
            console.log("Firebase error, loading sample data:", err.message);
            // If Firebase fails, load sample data
            const allSampleGrades = [
              ...sampleData.englishGrades,
              ...sampleData.socialStudiesGrades,
            ];
            setGrades(allSampleGrades);
            setLoading(false);
          }
        );
        return () => unsubscribeGrades();
      } else {
        // No user logged in, load sample data for development
        const allSampleGrades = [
          ...sampleData.englishGrades,
          ...sampleData.socialStudiesGrades,
        ];
        setGrades(allSampleGrades);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to add a new grade
  const addGrade = async (grade) => {
    try {
      const result = await createGrade(grade);
      // Update local state if API call succeeds
      setGrades((prevGrades) => [...prevGrades, result.grade]);
      return result;
    } catch (error) {
      // If using sample data, update only the local state
      if (error.message.includes("User not authenticated")) {
        const newGrade = {
          ...grade,
          id: Math.random().toString(36).substr(2, 9),
        };
        setGrades((prevGrades) => [...prevGrades, newGrade]);
        return { success: true, grade: newGrade };
      }
      throw error;
    }
  };

  // Function to update a grade
  const updateGrade = async (gradeId, updatedData) => {
    try {
      const result = await updateGradeAPI(gradeId, updatedData);
      // Update local state if API call succeeds
      setGrades((prevGrades) =>
        prevGrades.map((grade) =>
          grade.id === gradeId ? { ...grade, ...updatedData } : grade
        )
      );
      return result;
    } catch (error) {
      // If using sample data, update only the local state
      if (error.message.includes("User not authenticated")) {
        setGrades((prevGrades) =>
          prevGrades.map((grade) =>
            grade.id === gradeId ? { ...grade, ...updatedData } : grade
          )
        );
        return { success: true, grade: { id: gradeId, ...updatedData } };
      }
      throw error;
    }
  };

  // Function to delete a grade
  const deleteGrade = async (gradeId) => {
    try {
      const result = await deleteGradeAPI(gradeId);
      // Update local state if API call succeeds
      setGrades((prevGrades) =>
        prevGrades.filter((grade) => grade.id !== gradeId)
      );
      return result;
    } catch (error) {
      // If using sample data, update only the local state
      if (error.message.includes("User not authenticated")) {
        setGrades((prevGrades) =>
          prevGrades.filter((grade) => grade.id !== gradeId)
        );
        return { success: true, message: "Grade deleted successfully" };
      }
      throw error;
    }
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

  // Function to calculate student averages
  const calculateStudentAverages = (studentId) => {
    const studentGrades = grades.filter(grade => grade.studentId === studentId);
    
    if (studentGrades.length === 0) {
      return {
        overall: "N/A",
        subjects: {}
      };
    }

    // Calculate overall average
    const overallGrades = studentGrades.map(grade => {
      if (grade.percentage) return grade.percentage;
      if (grade.score && grade.points) return (grade.score / grade.points) * 100;
      return null;
    }).filter(grade => grade !== null);

    const overall = overallGrades.length > 0 
      ? Math.round((overallGrades.reduce((sum, grade) => sum + grade, 0) / overallGrades.length) * 10) / 10
      : "N/A";

    // Dynamically calculate subject-specific averages
    const subjectAverages = {};
    const uniqueSubjects = [...new Set(studentGrades.map(grade => grade.subject).filter(Boolean))];
    
    uniqueSubjects.forEach(subject => {
      const subjectGrades = studentGrades
        .filter(grade => grade.subject === subject)
        .map(grade => {
          if (grade.percentage) return grade.percentage;
          if (grade.score && grade.points) return (grade.score / grade.points) * 100;
          return null;
        })
        .filter(grade => grade !== null);

      subjectAverages[subject] = subjectGrades.length > 0
        ? Math.round((subjectGrades.reduce((sum, grade) => sum + grade, 0) / subjectGrades.length) * 10) / 10
        : "N/A";
    });

    return {
      overall: overall === "N/A" ? "N/A" : `${overall}%`,
      subjects: subjectAverages
    };
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
    calculateStudentAverages,
  };

  return (
    <GradeContext.Provider value={value}>{children}</GradeContext.Provider>
  );
};

export default GradeContext;
