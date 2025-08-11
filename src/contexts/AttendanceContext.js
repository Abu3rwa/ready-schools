import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  recordAttendance as apiRecordAttendance,
  recordBulkAttendance as apiRecordBulkAttendance,
  updateAttendance as apiUpdateAttendance,
  deleteAttendance as apiDeleteAttendance,
} from "../services/apiService";

// Create the context
const AttendanceContext = createContext();

// Create a custom hook to use the attendance context
export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};

// Create the provider component
export const AttendanceProvider = ({ children }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time listener for attendance records
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const attendanceCol = collection(db, "attendance");
        const q = query(attendanceCol, where("userId", "==", user.uid));

        const unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const attendanceData = snapshot.docs.map((doc) => {
              const data = doc.data();
              const { id, ...rest } = data;
              return { id: doc.id, ...rest };
            });
            setAttendance(attendanceData);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        setAttendance([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to record attendance for a student
  const recordAttendance = async (attendanceData) => {
    try {
      return await apiRecordAttendance(attendanceData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to record attendance for multiple students
  const recordBulkAttendance = async (date, records) => {
    try {
      return await apiRecordBulkAttendance(date, records);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to update an attendance record
  const updateAttendance = async (attendanceId, updatedData) => {
    try {
      return await apiUpdateAttendance(attendanceId, updatedData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to delete an attendance record
  const deleteAttendance = async (attendanceId) => {
    try {
      return await apiDeleteAttendance(attendanceId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to get attendance for a specific date
  const getAttendanceByDate = (date) => {
    return attendance.filter((record) => record.date === date);
  };

  // Function to get attendance for a specific student
  const getAttendanceByStudent = (studentId) => {
    return attendance.filter((record) => record.studentId === studentId);
  };

  // Function to calculate attendance statistics
  const calculateAttendanceStats = (studentId = null) => {
    let records = attendance;

    if (studentId) {
      records = records.filter((record) => record.studentId === studentId);
    }

    const total = records.length;
    const present = records.filter(
      (record) => record.status === "Present"
    ).length;
    const absent = records.filter(
      (record) => record.status === "Absent"
    ).length;
    const tardy = records.filter((record) => record.status === "Tardy").length;

    return {
      total,
      present,
      absent,
      tardy,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
      tardyPercentage: total > 0 ? Math.round((tardy / total) * 100) : 0,
    };
  };

  // Create the value object to be provided by the context
  const value = {
    attendance,
    loading,
    error,
    recordAttendance,
    recordBulkAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceByDate,
    getAttendanceByStudent,
    calculateAttendanceStats,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export default AttendanceContext;
