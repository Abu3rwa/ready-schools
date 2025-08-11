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
      const data = await getStudents();
      setStudents(data);
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
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
};

export default StudentContext;
