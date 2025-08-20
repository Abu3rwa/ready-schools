import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

// Helper function to get the current user's ID
export const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

// Helper function to convert Firestore document to a plain object with id
const docToObject = (doc) => {
  const data = doc.data();
  // The document data might have its own 'id' field (from uuid), which conflicts with the document ID.
  // We prioritize the document ID from Firestore and remove the one from the data.
  const { id, ...rest } = data;
  return { id: doc.id, ...rest };
};

/**
 * Get all students from Firestore for the current user
 * @returns {Promise<Array>}
 */
export const getStudents = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const studentsCol = collection(db, "students");
    const q = query(studentsCol, where("userId", "==", userId));
    const studentSnapshot = await getDocs(q);
    const studentList = studentSnapshot.docs.map(docToObject);
    return studentList;
  } catch (error) {
    console.error("Error fetching students from Firestore:", error);
    throw new Error("Failed to fetch students.");
  }
};

/**
 * Create a new student in Firestore
 * @param {Object} studentData - Student data to create
 * @returns {Promise<Object>}
 */
export const createStudent = async (studentData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const studentsCol = collection(db, "students");
    const newStudent = { ...studentData, userId };
    const docRef = await addDoc(studentsCol, newStudent);
    return { success: true, student: { id: docRef.id, ...newStudent } };
  } catch (error) {
    console.error("Error creating student in Firestore:", error);
    throw new Error("Failed to create student.");
  }
};

/**
 * Update a student in Firestore
 * @param {string} studentId - Student ID
 * @param {Object} updates - Updated data
 * @returns {Promise<Object>}
 */
export const updateStudent = async (studentId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const studentRef = doc(db, "students", studentId);
    // You might want to add a check here to ensure the user owns this document
    await updateDoc(studentRef, updates);
    return { success: true, student: { id: studentId, ...updates } };
  } catch (error) {
    console.error("Error updating student in Firestore:", error);
    throw new Error("Failed to update student.");
  }
};

/**
 * Delete a student from Firestore
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>}
 */
export const deleteStudent = async (studentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const studentRef = doc(db, "students", studentId);
    // Add ownership check before deleting
    await deleteDoc(studentRef);
    return { success: true, message: "Student deleted successfully" };
  } catch (error) {
    console.error("Error deleting student from Firestore:", error);
    throw new Error("Failed to delete student.");
  }
};

/**
 * Get all assignments from Firestore for the current user
 * @returns {Promise<Array>}
 */
export const getAssignments = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const assignmentsCol = collection(db, "assignments");
    const q = query(assignmentsCol, where("userId", "==", userId));
    const assignmentSnapshot = await getDocs(q);
    const assignmentList = assignmentSnapshot.docs.map(docToObject);
    return assignmentList;
  } catch (error) {
    console.error("Error fetching assignments from Firestore:", error);
    throw new Error("Failed to fetch assignments.");
  }
};

/**
 * Create a new assignment in Firestore
 * @param {Object} assignmentData - Assignment data to create
 * @returns {Promise<Object>}
 */
export const createAssignment = async (assignmentData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const assignmentsCol = collection(db, "assignments");
    const newAssignment = { ...assignmentData, userId };
    const docRef = await addDoc(assignmentsCol, newAssignment);
    return { success: true, assignment: { id: docRef.id, ...newAssignment } };
  } catch (error) {
    console.error("Error creating assignment in Firestore:", error);
    throw new Error("Failed to create assignment.");
  }
};

/**
 * Update an assignment in Firestore
 * @param {string} assignmentId - Assignment ID
 * @param {Object} updates - Updated data
 * @returns {Promise<Object>}
 */
export const updateAssignment = async (assignmentId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const assignmentRef = doc(db, "assignments", assignmentId);
    await updateDoc(assignmentRef, updates);
    return { success: true, assignment: { id: assignmentId, ...updates } };
  } catch (error) {
    console.error("Error updating assignment in Firestore:", error);
    throw new Error("Failed to update assignment.");
  }
};

/**
 * Delete an assignment from Firestore
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object>}
 */
export const deleteAssignment = async (assignmentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const assignmentRef = doc(db, "assignments", assignmentId);
    await deleteDoc(assignmentRef);
    return { success: true, message: "Assignment deleted successfully" };
  } catch (error) {
    console.error("Error deleting assignment from Firestore:", error);
    throw new Error("Failed to delete assignment.");
  }
};

/**
 * Get grades from Firestore
 * @param {string|null} studentId - Optional student ID to filter grades
 * @returns {Promise<Array>}
 */
export const getGrades = async (studentId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const gradesCol = collection(db, "grades");
    let q = query(gradesCol, where("userId", "==", userId));
    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }
    const gradeSnapshot = await getDocs(q);
    const gradeList = gradeSnapshot.docs.map(docToObject);
    return gradeList;
  } catch (error) {
    console.error("Error fetching grades from Firestore:", error);
    throw new Error("Failed to fetch grades.");
  }
};

/**
 * Create a new grade in Firestore
 * @param {Object} gradeData - Grade data to create
 * @returns {Promise<Object>}
 */
export const createGrade = async (gradeData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const gradesCol = collection(db, "grades");
    const newGrade = { ...gradeData, userId };
    const docRef = await addDoc(gradesCol, newGrade);
    return { success: true, grade: { id: docRef.id, ...newGrade } };
  } catch (error) {
    console.error("Error creating grade in Firestore:", error);
    throw new Error("Failed to create grade.");
  }
};

/**
 * Update a grade in Firestore
 * @param {string} gradeId - Grade ID (Firestore document ID)
 * @param {Object} updates - Updated grade data
 * @returns {Promise<Object>}
 */
export const updateGrade = async (gradeId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const gradeRef = doc(db, "grades", gradeId);
    const updatesWithUserId = { ...updates, userId };
    await updateDoc(gradeRef, updatesWithUserId);
    return { success: true, grade: { id: gradeId, ...updates } };
  } catch (error) {
    console.error("Error updating grade in Firestore:", error);
    throw new Error("Failed to update grade.");
  }
};

/**
 * Delete a grade from Firestore
 * @param {string} gradeId - Grade ID (Firestore document ID)
 * @returns {Promise<Object>}
 */
export const deleteGrade = async (gradeId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const gradeRef = doc(db, "grades", gradeId);
    await deleteDoc(gradeRef);
    return { success: true, message: "Grade deleted successfully" };
  } catch (error) {
    console.error("Error deleting grade from Firestore:", error);
    throw new Error("Failed to delete grade.");
  }
};

/**
 * Get English grades from Firestore
 * @param {string|null} studentId - Optional student ID to filter grades
 * @returns {Promise<Array>}
 */
export const getEnglishGrades = async (studentId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const gradesCol = collection(db, "grades");
    let q = query(
      gradesCol,
      where("userId", "==", userId),
      where("subject", "==", "English")
    );
    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }
    const gradeSnapshot = await getDocs(q);
    const gradeList = gradeSnapshot.docs.map(docToObject);
    return gradeList;
  } catch (error) {
    console.error("Error fetching English grades from Firestore:", error);
    throw new Error("Failed to fetch English grades.");
  }
};

/**
 * Get Social Studies grades from Firestore
 * @param {string|null} studentId - Optional student ID to filter grades
 * @returns {Promise<Array>}
 */
export const getSocialStudiesGrades = async (studentId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const gradesCol = collection(db, "grades");
    let q = query(
      gradesCol,
      where("userId", "==", userId),
      where("subject", "==", "Social Studies")
    );
    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }
    const gradeSnapshot = await getDocs(q);
    const gradeList = gradeSnapshot.docs.map(docToObject);
    return gradeList;
  } catch (error) {
    console.error(
      "Error fetching Social Studies grades from Firestore:",
      error
    );
    throw new Error("Failed to fetch Social Studies grades.");
  }
};

/**
 * Get attendance records from Firestore
 * @param {string|null} studentId - Optional student ID to filter attendance
 * @param {string|null} date - Optional date to filter attendance
 * @returns {Promise<Array>}
 */
export const getAttendance = async (studentId = null, date = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const attendanceCol = collection(db, "attendance");
    let q = query(attendanceCol, where("userId", "==", userId));
    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }
    if (date) {
      q = query(q, where("date", "==", date));
    }
    const attendanceSnapshot = await getDocs(q);
    const attendanceList = attendanceSnapshot.docs.map(docToObject);
    return attendanceList;
  } catch (error) {
    console.error("Error fetching attendance from Firestore:", error);
    throw new Error("Failed to fetch attendance.");
  }
};

/**
 * Record attendance in Firestore
 * @param {Object} attendanceData - Attendance data to record
 * @returns {Promise<Object>}
 */
export const recordAttendance = async (attendanceData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const attendanceCol = collection(db, "attendance");
    const newAttendance = { ...attendanceData, userId };
    const docRef = await addDoc(attendanceCol, newAttendance);
    return { success: true, attendance: { id: docRef.id, ...newAttendance } };
  } catch (error) {
    console.error("Error recording attendance in Firestore:", error);
    throw new Error("Failed to record attendance.");
  }
};

/**
 * Record bulk attendance in Firestore
 * @param {string} date - Date for attendance
 * @param {Array} attendanceRecords - Array of attendance records
 * @returns {Promise<Object>}
 */
export const recordBulkAttendance = async (date, attendanceRecords) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    // Validate input data
    if (!date) throw new Error("Date is required for attendance records.");
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      throw new Error("Attendance records array is required and cannot be empty.");
    }

    // Validate each attendance record
    const validationErrors = [];
    attendanceRecords.forEach((record, index) => {
      if (!record.studentId) {
        validationErrors.push(`Record ${index + 1}: Missing studentId`);
      }
      if (!record.status) {
        validationErrors.push(`Record ${index + 1}: Missing status`);
      }
    });

    if (validationErrors.length > 0) {
      throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
    }

    const attendanceCol = collection(db, "attendance");
    const newRecords = attendanceRecords.map((record) => ({
      ...record,
      date,
      userId,
      timeEntered: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    console.log('Preparing to save attendance records:', {
      date,
      userId,
      recordCount: newRecords.length,
      sampleRecord: newRecords[0]
    });

    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    
    newRecords.forEach((record) => {
      const docRef = doc(attendanceCol);
      batch.set(docRef, record);
    });
    
    await batch.commit();
    console.log('Successfully saved attendance records:', newRecords.length);
    return { success: true, recorded: newRecords.length, errors: [] };
  } catch (error) {
    console.error("Error recording bulk attendance in Firestore:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to record bulk attendance: ${error.message}`);
  }
};

/**
 * Update an attendance record in Firestore
 * @param {string} attendanceId - Attendance ID
 * @param {Object} updates - Updated data
 * @returns {Promise<Object>}
 */
export const updateAttendance = async (attendanceId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const attendanceRef = doc(db, "attendance", attendanceId);
    await updateDoc(attendanceRef, updates);
    return { success: true, attendance: { id: attendanceId, ...updates } };
  } catch (error) {
    console.error("Error updating attendance in Firestore:", error);
    throw new Error("Failed to update attendance.");
  }
};

/**
 * Delete an attendance record from Firestore
 * @param {string} attendanceId - Attendance ID
 * @returns {Promise<Object>}
 */
export const deleteAttendance = async (attendanceId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const attendanceRef = doc(db, "attendance", attendanceId);
    await deleteDoc(attendanceRef);
    return { success: true, message: "Attendance record deleted successfully" };
  } catch (error) {
    console.error("Error deleting attendance in Firestore:", error);
    throw new Error("Failed to delete attendance.");
  }
};

/**
 * Get communication records for all students or a specific student from Firestore
 * @param {string|null} studentId - Optional student ID to filter communications
 * @returns {Promise<Array>}
 */
export const getCommunications = async (studentId = null) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const communicationsCol = collection(db, "communications");
    let q = query(communicationsCol, where("userId", "==", userId));
    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }
    const communicationSnapshot = await getDocs(q);
    const communicationList = communicationSnapshot.docs.map(docToObject);
    return communicationList;
  } catch (error) {
    console.error("Error fetching communications from Firestore:", error);
    throw new Error("Failed to fetch communications.");
  }
};

export const createCommunication = async (communicationData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const communicationsCol = collection(db, "communications");
    const newCommunication = { ...communicationData, userId };
    const docRef = await addDoc(communicationsCol, newCommunication);
    return {
      success: true,
      communication: { id: docRef.id, ...newCommunication },
    };
  } catch (error) {
    console.error("Error creating communication in Firestore:", error);
    throw new Error("Failed to create communication.");
  }
};

/**
 * Get application settings from Firestore
 * @returns {Promise<Object>}
 */
export const getSettings = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated.");

    const settingsDoc = doc(db, "settings", userId); // User-specific settings
    const settingsSnapshot = await getDoc(settingsDoc);
    if (settingsSnapshot.exists()) {
      return settingsSnapshot.data();
    }
    return {}; // Return empty object if settings not found
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    throw new Error("Failed to fetch settings.");
  }
};

/**
 * Generate report (placeholder - actual report generation logic would be complex)
 * @param {Object} reportConfig - Report configuration
 * @returns {Promise<Object>}
 */
export const generateReport = async (reportConfig) => {
  console.log("Generating report with config:", reportConfig);
  return { success: true, report: "Report generated successfully (Firestore)" };
};
