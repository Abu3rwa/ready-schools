import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import * as standardsGradingService from "../services/standardsGradingService";
import { standardsGradeCalculator } from "../utils/standardsGradeCalculations";

const StandardsGradingContext = createContext();

export const useStandardsGrading = () => {
  const context = useContext(StandardsGradingContext);
  if (!context) {
    throw new Error("useStandardsGrading must be used within a StandardsGradingProvider");
  }
  return context;
};

export const StandardsGradingProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // State for standards mappings
  const [standardsMappings, setStandardsMappings] = useState({});
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [mappingsError, setMappingsError] = useState(null);

  // State for standards grades
  const [standardsGrades, setStandardsGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState(null);

  // State for grading configuration
  const [gradingMode, setGradingMode] = useState('dual'); // 'traditional', 'standards', 'dual'
  const [proficiencyScale, setProficiencyScale] = useState('four_point'); // 'four_point', 'five_point'
  const [defaultWeights, setDefaultWeights] = useState({ traditional: 0.5, standards: 0.5 });

  // State for caching and performance
  const [mappingsCache, setMappingsCache] = useState(new Map());
  const [gradesCache, setGradesCache] = useState(new Map());

  // ============================================================================
  // STANDARDS MAPPINGS MANAGEMENT
  // ============================================================================

  /**
   * Load standards mappings for an assignment
   */
  const loadStandardsMappings = useCallback(async (assignmentId) => {
    if (!currentUser || !assignmentId) return;

    // Check cache first
    if (mappingsCache.has(assignmentId)) {
      setStandardsMappings(prev => ({
        ...prev,
        [assignmentId]: mappingsCache.get(assignmentId)
      }));
      return;
    }

    setMappingsLoading(true);
    setMappingsError(null);

    try {
      const mappings = await standardsGradingService.getStandardsMappings(assignmentId);
      
      // Update cache
      setMappingsCache(prev => new Map(prev).set(assignmentId, mappings));
      
      // Update state
      setStandardsMappings(prev => ({
        ...prev,
        [assignmentId]: mappings
      }));
    } catch (error) {
      console.error("Error loading standards mappings:", error);
      setMappingsError(error.message);
    } finally {
      setMappingsLoading(false);
    }
  }, [currentUser, mappingsCache]);

  /**
   * Create a new standards mapping
   */
  const createStandardMapping = useCallback(async (mappingData) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      const newMapping = await standardsGradingService.createStandardMapping(mappingData);
      
      // Update state
      setStandardsMappings(prev => ({
        ...prev,
        [mappingData.assignmentId]: [
          ...(prev[mappingData.assignmentId] || []),
          newMapping
        ]
      }));

      // Update cache
      setMappingsCache(prev => {
        const newCache = new Map(prev);
        const existingMappings = newCache.get(mappingData.assignmentId) || [];
        newCache.set(mappingData.assignmentId, [...existingMappings, newMapping]);
        return newCache;
      });

      return newMapping;
    } catch (error) {
      console.error("Error creating standards mapping:", error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Update an existing standards mapping
   */
  const updateStandardMapping = useCallback(async (mappingId, updates) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      const updatedMapping = await standardsGradingService.updateStandardMapping(mappingId, updates);
      
      // Update state
      setStandardsMappings(prev => {
        const newMappings = { ...prev };
        Object.keys(newMappings).forEach(assignmentId => {
          newMappings[assignmentId] = newMappings[assignmentId].map(mapping =>
            mapping.id === mappingId ? { ...mapping, ...updatedMapping } : mapping
          );
        });
        return newMappings;
      });

      // Update cache
      setMappingsCache(prev => {
        const newCache = new Map(prev);
        newCache.forEach((mappings, assignmentId) => {
          newCache.set(assignmentId, mappings.map(mapping =>
            mapping.id === mappingId ? { ...mapping, ...updatedMapping } : mapping
          ));
        });
        return newCache;
      });

      return updatedMapping;
    } catch (error) {
      console.error("Error updating standards mapping:", error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Delete a standards mapping
   */
  const deleteStandardMapping = useCallback(async (mappingId, assignmentId) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      await standardsGradingService.deleteStandardMapping(mappingId);
      
      // Update state
      setStandardsMappings(prev => ({
        ...prev,
        [assignmentId]: prev[assignmentId]?.filter(mapping => mapping.id !== mappingId) || []
      }));

      // Update cache
      setMappingsCache(prev => {
        const newCache = new Map(prev);
        const existingMappings = newCache.get(assignmentId) || [];
        newCache.set(assignmentId, existingMappings.filter(mapping => mapping.id !== mappingId));
        return newCache;
      });
    } catch (error) {
      console.error("Error deleting standards mapping:", error);
      throw error;
    }
  }, [currentUser]);

  // ============================================================================
  // STANDARDS GRADES MANAGEMENT
  // ============================================================================

  /**
   * Load standards grades for an assignment
   */
  const loadStandardsGrades = useCallback(async (assignmentId) => {
    if (!currentUser || !assignmentId) return;

    // Check cache first
    if (gradesCache.has(assignmentId)) {
      setStandardsGrades(prev => {
        const existing = prev.filter(grade => grade.assignmentId !== assignmentId);
        return [...existing, ...gradesCache.get(assignmentId)];
      });
      return;
    }

    setGradesLoading(true);
    setGradesError(null);

    try {
      const grades = await standardsGradingService.getStandardsGradesByAssignment(assignmentId);
      
      // Update cache
      setGradesCache(prev => new Map(prev).set(assignmentId, grades));
      
      // Update state
      setStandardsGrades(prev => {
        const existing = prev.filter(grade => grade.assignmentId !== assignmentId);
        return [...existing, ...grades];
      });
    } catch (error) {
      console.error("Error loading standards grades:", error);
      setGradesError(error.message);
    } finally {
      setGradesLoading(false);
    }
  }, [currentUser, gradesCache]);

  /**
   * Create a new standards grade
   */
  const createStandardsGrade = useCallback(async (gradeData) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      const newGrade = await standardsGradingService.createStandardsGrade(gradeData);
      
      // Update state
      setStandardsGrades(prev => [...prev, newGrade]);

      // Update cache
      setGradesCache(prev => {
        const newCache = new Map(prev);
        const existingGrades = newCache.get(gradeData.assignmentId) || [];
        newCache.set(gradeData.assignmentId, [...existingGrades, newGrade]);
        return newCache;
      });

      return newGrade;
    } catch (error) {
      console.error("Error creating standards grade:", error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Update an existing standards grade
   */
  const updateStandardsGrade = useCallback(async (gradeId, updates) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      const updatedGrade = await standardsGradingService.updateStandardsGrade(gradeId, updates);
      
      // Update state
      setStandardsGrades(prev => 
        prev.map(grade => grade.id === gradeId ? { ...grade, ...updatedGrade } : grade)
      );

      // Update cache
      setGradesCache(prev => {
        const newCache = new Map(prev);
        newCache.forEach((grades, assignmentId) => {
          newCache.set(assignmentId, grades.map(grade =>
            grade.id === gradeId ? { ...grade, ...updatedGrade } : grade
          ));
        });
        return newCache;
      });

      return updatedGrade;
    } catch (error) {
      console.error("Error updating standards grade:", error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Delete a standards grade
   */
  const deleteStandardsGrade = useCallback(async (gradeId, assignmentId) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      await standardsGradingService.deleteStandardsGrade(gradeId);
      
      // Update state
      setStandardsGrades(prev => prev.filter(grade => grade.id !== gradeId));

      // Update cache
      setGradesCache(prev => {
        const newCache = new Map(prev);
        const existingGrades = newCache.get(assignmentId) || [];
        newCache.set(assignmentId, existingGrades.filter(grade => grade.id !== gradeId));
        return newCache;
      });
    } catch (error) {
      console.error("Error deleting standards grade:", error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Bulk create standards grades
   */
  const bulkCreateStandardsGrades = useCallback(async (gradesArray) => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      const newGrades = await standardsGradingService.bulkCreateStandardsGrades(gradesArray);
      
      // Update state
      setStandardsGrades(prev => [...prev, ...newGrades]);

      // Update cache by assignment
      setGradesCache(prev => {
        const newCache = new Map(prev);
        newGrades.forEach(grade => {
          const existingGrades = newCache.get(grade.assignmentId) || [];
          newCache.set(grade.assignmentId, [...existingGrades, grade]);
        });
        return newCache;
      });

      return newGrades;
    } catch (error) {
      console.error("Error bulk creating standards grades:", error);
      throw error;
    }
  }, [currentUser]);

  // ============================================================================
  // CALCULATION AND ANALYSIS FUNCTIONS
  // ============================================================================

  /**
   * Get standards grades for a specific student and assignment
   */
  const getStudentStandardsGrades = useCallback((studentId, assignmentId) => {
    return standardsGrades.filter(grade => 
      grade.studentId === studentId && grade.assignmentId === assignmentId
    );
  }, [standardsGrades]);

  /**
   * Get standards grades for a specific student across all assignments
   */
  const getStudentStandardsProgress = useCallback((studentId, standardId = null) => {
    let filteredGrades = standardsGrades.filter(grade => grade.studentId === studentId);
    
    if (standardId) {
      filteredGrades = filteredGrades.filter(grade => grade.standardId === standardId);
    }

    return filteredGrades;
  }, [standardsGrades]);

  /**
   * Calculate composite grade for a student and assignment
   */
  const calculateCompositeGrade = useCallback((studentId, assignmentId, traditionalGrade, weights = null) => {
    const studentStandardsGrades = getStudentStandardsGrades(studentId, assignmentId);
    const gradeWeights = weights || defaultWeights;
    
    return standardsGradeCalculator.calculateCompositeGrade(
      traditionalGrade,
      studentStandardsGrades,
      gradeWeights
    );
  }, [getStudentStandardsGrades, defaultWeights]);

  /**
   * Get mastery level for a student and standard
   */
  const getStudentMasteryLevel = useCallback((studentId, standardId, masteryThreshold = 3.0) => {
    const studentGrades = getStudentStandardsProgress(studentId, standardId);
    return standardsGradeCalculator.calculateMasteryLevel(studentGrades, masteryThreshold);
  }, [getStudentStandardsProgress]);

  /**
   * Generate comprehensive progress report for a student
   */
  const generateStudentProgressReport = useCallback((studentId, assignments, timeRange = null) => {
    const studentGrades = getStudentStandardsProgress(studentId);
    return standardsGradeCalculator.generateStandardsProgress(
      studentId,
      null,
      assignments,
      studentGrades,
      timeRange
    );
  }, [getStudentStandardsProgress]);

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear cache for a specific assignment
   */
  const clearAssignmentCache = useCallback((assignmentId) => {
    setMappingsCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(assignmentId);
      return newCache;
    });

    setGradesCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(assignmentId);
      return newCache;
    });
  }, []);

  /**
   * Clear all caches
   */
  const clearAllCaches = useCallback(() => {
    setMappingsCache(new Map());
    setGradesCache(new Map());
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Clear data when user changes
  useEffect(() => {
    if (!currentUser) {
      setStandardsMappings({});
      setStandardsGrades([]);
      clearAllCaches();
    }
  }, [currentUser, clearAllCaches]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // State
    standardsMappings,
    standardsGrades,
    mappingsLoading,
    gradesLoading,
    mappingsError,
    gradesError,
    gradingMode,
    proficiencyScale,
    defaultWeights,

    // Setters
    setGradingMode,
    setProficiencyScale,
    setDefaultWeights,

    // Mappings functions
    loadStandardsMappings,
    createStandardMapping,
    updateStandardMapping,
    deleteStandardMapping,

    // Grades functions
    loadStandardsGrades,
    createStandardsGrade,
    updateStandardsGrade,
    deleteStandardsGrade,
    bulkCreateStandardsGrades,

    // Analysis functions
    getStudentStandardsGrades,
    getStudentStandardsProgress,
    calculateCompositeGrade,
    getStudentMasteryLevel,
    generateStudentProgressReport,

    // Cache management
    clearAssignmentCache,
    clearAllCaches,
  };

  return (
    <StandardsGradingContext.Provider value={value}>
      {children}
    </StandardsGradingContext.Provider>
  );
}; 