import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  getStudents,
  createStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
} from "../services/apiService";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Create the context
const StudentContext = createContext();

// Create a custom hook to use the student context
export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudents must be used within a StudentProvider");
  }
  return context;
};

// Create the provider component
export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch students on component mount
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const data = await getStudents();
        setStudents(data);
      } catch (error) {
        console.log("Loading sample students data");
        const { sampleData } = await import("../sampleData");
        setStudents(sampleData.students);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Function to add a new student
  const addStudent = async (studentData) => {
    try {
      const result = await createStudent(studentData);
      const newStudent = result.student;
      setStudents((prevStudents) => [...prevStudents, newStudent]);
      return newStudent;
    } catch (err) {
      console.error("Error adding student:", err);
      throw err;
    }
  };

  // Function to update a student
  const updateStudent = async (id, updatedData) => {
    try {
      const result = await apiUpdateStudent(id, updatedData);
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === id ? { ...student, ...updatedData } : student
        )
      );
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent((prevSelected) => ({
          ...prevSelected,
          ...updatedData,
        }));
      }
      return result.student;
    } catch (err) {
      console.error("Error updating student:", err);
      throw err;
    }
  };

  // Function to delete a student
  const deleteStudent = async (id) => {
    try {
      await apiDeleteStudent(id);
      setStudents((prevStudents) =>
        prevStudents.filter((student) => student.id !== id)
      );
      setSelectedStudent(null); // Clear selection if deleted
      return true;
    } catch (err) {
      console.error("Error deleting student:", err);
      throw err;
    }
  };

  // Function to select a student
  const selectStudent = (id) => {
    const student = students.find((s) => s.id === id);
    setSelectedStudent(student || null);
    return student;
  };

  // Function to clear the selected student
  const clearSelectedStudent = () => {
    setSelectedStudent(null);
  };

  // Function to add a goal for a student
  const addGoal = async (studentId, goalData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const goalsCollection = collection(db, "students", studentId, "goals");
      const docData = {
        ...goalData,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(goalsCollection, docData);
      return { id: docRef.id, ...docData };
    } catch (err) {
      console.error("Error adding goal:", err);
      throw err;
    }
  };

  // Function to update a goal
  const updateGoal = async (studentId, goalId, updatedData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const goalDoc = doc(db, "students", studentId, "goals", goalId);
      await updateDoc(goalDoc, updatedData);
      return { id: goalId, ...updatedData };
    } catch (err) {
      console.error("Error updating goal:", err);
      throw err;
    }
  };

  // Function to get goals for a student
  const getGoals = async (studentId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const goalsCollection = collection(db, "students", studentId, "goals");
      const q = query(goalsCollection, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const goals = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return goals;
    } catch (err) {
      console.error("Error fetching goals:", err);
      throw err;
    }
  };

  // Function to delete a goal
  const deleteGoal = async (studentId, goalId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const goalDoc = doc(db, "students", studentId, "goals", goalId);
      await deleteDoc(goalDoc);
      return { id: goalId };
    } catch (err) {
      console.error("Error deleting goal:", err);
      throw err;
    }
  };

  // Create the value object to be provided by the context
  const value = {
    students,
    selectedStudent,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    selectStudent,
    clearSelectedStudent,
    addGoal,
    updateGoal,
    getGoals,
    deleteGoal,
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
};

export default StudentContext;
