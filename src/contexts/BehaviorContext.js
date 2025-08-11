import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  recordBehavior,
  updateBehavior as apiUpdateBehavior,
  deleteBehavior as apiDeleteBehavior,
} from "../services/apiService";

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

// Create the provider component
export const BehaviorProvider = ({ children }) => {
  const [behavior, setBehavior] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Function to log a new behavior incident
  const logBehavior = async (behaviorData) => {
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

  // Function to get behavior records by type
  const getBehaviorByType = (type) => {
    return behavior.filter((record) => record.type === type);
  };

  // Function to calculate behavior statistics
  const calculateBehaviorStats = (studentId = null) => {
    let records = behavior;

    if (studentId) {
      records = records.filter((record) => record.studentId === studentId);
    }

    const total = records.length;
    const positive = records.filter(
      (record) => record.type === "Positive"
    ).length;
    const negative = records.filter(
      (record) => record.type === "Negative"
    ).length;

    // Calculate by severity
    const lowSeverity = records.filter(
      (record) => record.severity === "Low"
    ).length;
    const mediumSeverity = records.filter(
      (record) => record.severity === "Medium"
    ).length;
    const highSeverity = records.filter(
      (record) => record.severity === "High"
    ).length;

    return {
      total,
      positive,
      negative,
      lowSeverity,
      mediumSeverity,
      highSeverity,
      positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercentage: total > 0 ? Math.round((negative / total) * 100) : 0,
    };
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
    getBehaviorByType,
    calculateBehaviorStats,
  };

  return (
    <BehaviorContext.Provider value={value}>
      {children}
    </BehaviorContext.Provider>
  );
};

export default BehaviorContext;
