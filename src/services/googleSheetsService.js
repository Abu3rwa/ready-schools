import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

// Initialize Firebase Functions with the correct app instance
const functions = getFunctions(app);

/**
 * Get students from Google Sheets via Firebase Cloud Function
 * @returns {Promise<Array>} Array of student objects
 */
export const getStudentsFromSheets = async () => {
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();

    const getStudentsFunction = httpsCallable(functions, "getStudents");
    const result = await getStudentsFunction();

    return result.data.students || [];
  } catch (error) {
    console.error("Error fetching students from sheets:", error);
    throw new Error("Failed to fetch students from Google Sheets");
  }
};

/**
 * Get grades from Google Sheets via Firebase Cloud Function
 * @param {string|null} studentId - Optional student ID to filter grades
 * @returns {Promise<Array>} Array of grade objects
 */
export const getGradesFromSheets = async (studentId = null) => {
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();

    const getGradesFunction = httpsCallable(functions, "getGrades");
    const result = await getGradesFunction({ studentId });

    return result.data.grades || [];
  } catch (error) {
    console.error("Error fetching grades from sheets:", error);
    throw new Error("Failed to fetch grades from Google Sheets");
  }
};

/**
 * Create an assignment in Google Sheets via Firebase Cloud Function
 * @param {Object} assignmentData - Assignment data to create
 * @returns {Promise<Object>} Result object with success status
 */
export const createAssignmentInSheets = async (assignmentData) => {
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();

    const createAssignmentFunction = httpsCallable(
      functions,
      "createAssignment"
    );
    const result = await createAssignmentFunction(assignmentData);

    return result.data;
  } catch (error) {
    console.error("Error creating assignment in sheets:", error);
    throw new Error("Failed to create assignment in Google Sheets");
  }
};

/**
 * Record attendance in Google Sheets via Firebase Cloud Function
 * @param {Object} attendanceData - Attendance data to record
 * @returns {Promise<Object>} Result object with success status
 */
export const recordAttendanceInSheets = async (attendanceData) => {
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();

    const recordAttendanceFunction = httpsCallable(
      functions,
      "recordAttendance"
    );
    const result = await recordAttendanceFunction(attendanceData);

    return result.data;
  } catch (error) {
    console.error("Error recording attendance in sheets:", error);
    throw new Error("Failed to record attendance in Google Sheets");
  }
};

/**
 * Handle sheet changes via Firebase Cloud Function
 * @param {Object} changeData - Data about the sheet change
 * @returns {Promise<Object>} Result object with success status
 */
export const handleSheetChange = async (changeData) => {
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();

    const sheetChangeHandlerFunction = httpsCallable(
      functions,
      "sheetChangeHandler"
    );
    const result = await sheetChangeHandlerFunction(changeData);

    return result.data;
  } catch (error) {
    console.error("Error handling sheet change:", error);
    throw new Error("Failed to handle sheet change");
  }
};
