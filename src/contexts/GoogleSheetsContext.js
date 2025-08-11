import React, { createContext, useState, useContext, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getStudentsFromSheets,
  getGradesFromSheets,
  createAssignmentInSheets,
  recordAttendanceInSheets,
} from "../services/googleSheetsService";

// Create the context
const GoogleSheetsContext = createContext();

// Custom hook to use the context
export const useGoogleSheets = () => useContext(GoogleSheetsContext);

// Provider component
export const GoogleSheetsProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Check authentication status
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to get students from Google Sheets
  const getStudents = async () => {
    if (!isAuthenticated) {
      setError("User not authenticated");
      return [];
    }

    try {
      setIsLoading(true);
      const students = await getStudentsFromSheets();
      setIsLoading(false);
      return students;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return [];
    }
  };

  // Function to get grades from Google Sheets
  const getGrades = async (studentId = null) => {
    if (!isAuthenticated) {
      setError("User not authenticated");
      return [];
    }

    try {
      setIsLoading(true);
      const grades = await getGradesFromSheets(studentId);
      setIsLoading(false);
      return grades;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return [];
    }
  };

  // Function to create an assignment in Google Sheets
  const createAssignment = async (assignmentData) => {
    if (!isAuthenticated) {
      setError("User not authenticated");
      return { success: false, error: "User not authenticated" };
    }

    try {
      setIsLoading(true);
      const result = await createAssignmentInSheets(assignmentData);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Function to record attendance in Google Sheets
  const recordAttendance = async (attendanceData) => {
    if (!isAuthenticated) {
      setError("User not authenticated");
      return { success: false, error: "User not authenticated" };
    }

    try {
      setIsLoading(true);
      const result = await recordAttendanceInSheets(attendanceData);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Clear any errors
  const clearError = () => setError(null);

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    error,
    user,
    getStudents,
    getGrades,
    createAssignment,
    recordAttendance,
    clearError,
  };

  return (
    <GoogleSheetsContext.Provider value={value}>
      {children}
    </GoogleSheetsContext.Provider>
  );
};

export default GoogleSheetsContext;
