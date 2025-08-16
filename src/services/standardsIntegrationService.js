// Shared service for standards-based assessment integration
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { PROFICIENCY_SCALES } from '../constants/proficiencyScales';
import { getStandards } from './standardsService';
import { standardsGradeCalculator } from '../utils/standardsGradeCalculations';
import { GradeCalculator } from '../utils/gradeCalculations';

// Get standards mappings for an assignment
export const getAssignmentStandards = async (assignmentId) => {
  try {
    // First, get the assignment document to access its mappedStandards field
    const assignmentRef = doc(db, "assignments", assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    
    if (!assignmentDoc.exists()) {
      console.error("Assignment not found:", assignmentId);
      return [];
    }
    
    const assignmentData = assignmentDoc.data();
    
    // If the assignment has mappedStandards array, use that
    if (assignmentData.mappedStandards && Array.isArray(assignmentData.mappedStandards)) {
      try {
        // Try to fetch full standard details for better display
        const allStandards = await getStandards();
        
        return assignmentData.mappedStandards.map((standardId, index) => {
          // Find the full standard details
          const fullStandard = allStandards.find(s => s.code === standardId || s.id === standardId);
          
          return {
            id: `${assignmentId}-${index}`,
            standardId: standardId,
            standardCode: standardId,
            standardName: fullStandard ? fullStandard.name || fullStandard.description : standardId,
            standardDescription: fullStandard ? fullStandard.description : '',
            assignmentId: assignmentId,
            alignmentStrength: 0.75, // Default value
            weight: 1.0, // Default value
            coverageType: 'full' // Default value
          };
        });
      } catch (standardsError) {
        console.warn('Could not fetch full standard details, using basic info:', standardsError);
        // Fallback to basic info if we can't fetch full standards
        return assignmentData.mappedStandards.map((standardId, index) => ({
          id: `${assignmentId}-${index}`,
          standardId: standardId,
          standardCode: standardId,
          standardName: standardId,
          assignmentId: assignmentId,
          alignmentStrength: 0.75, // Default value
          weight: 1.0, // Default value
          coverageType: 'full' // Default value
        }));
      }
    }
    
    // Fallback: try to get from standardsMappings collection (legacy approach)
    const mappingsRef = collection(db, "standardsMappings");
    const q = query(mappingsRef, where("assignmentId", "==", assignmentId));
    const snapshot = await getDocs(q);
    
    const mappings = [];
    snapshot.forEach(doc => {
      mappings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return mappings;
  } catch (error) {
    console.error("Error fetching assignment standards:", error);
    return [];
  }
};

// Get standards for all assignments in a gradebook
export const getGradeBookStandards = async (gradeBookId, assignments) => {
  try {
    if (!assignments || assignments.length === 0) return [];
    
    // Get standards for all assignments in this grade book
    const allStandards = [];
    for (const assignmentId of assignments) {
      const standards = await getAssignmentStandards(assignmentId);
      allStandards.push(...standards);
    }
    
    // Remove duplicates
    const uniqueStandards = allStandards.filter((standard, index, self) => 
      index === self.findIndex(s => s.standardId === standard.standardId)
    );
    
    return uniqueStandards;
  } catch (error) {
    console.error("Error fetching grade book standards:", error);
    return [];
  }
};

// Create a new standards mapping
export const createStandardMapping = async (mappingData) => {
  try {
    const mappingsRef = collection(db, "standardsMappings");
    const docRef = await addDoc(mappingsRef, {
      ...mappingData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });
    
    return {
      id: docRef.id,
      ...mappingData
    };
  } catch (error) {
    console.error("Error creating standards mapping:", error);
    throw error;
  }
};

// Update a standards mapping
export const updateStandardMapping = async (mappingId, updates) => {
  try {
    const mappingRef = doc(db, "standardsMappings", mappingId);
    await updateDoc(mappingRef, {
      ...updates,
      lastModified: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating standards mapping:", error);
    throw error;
  }
};

// Delete a standards mapping
export const deleteStandardMapping = async (mappingId) => {
  try {
    const mappingRef = doc(db, "standardsMappings", mappingId);
    await deleteDoc(mappingRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting standards mapping:", error);
    throw error;
  }
};

// Get proficiency scale data
export const getProficiencyScale = (scaleType = 'four_point') => {
  return PROFICIENCY_SCALES[scaleType] || PROFICIENCY_SCALES.four_point;
};

// Calculate standards-based analytics
export const calculateStandardsAnalytics = (standardsGrades) => {
  if (!standardsGrades || standardsGrades.length === 0) {
    return {
      totalStandards: 0,
      averageProficiency: 0,
      proficiencyDistribution: {},
      standardsProgress: {}
    };
  }

  const totalStandards = standardsGrades.length;
  let totalProficiency = 0;
  const proficiencyDistribution = {};
  const standardsProgress = {};

  standardsGrades.forEach(grade => {
    const proficiency = grade.proficiencyLevel || 0;
    totalProficiency += proficiency;
    
    // Count proficiency levels
    proficiencyDistribution[proficiency] = (proficiencyDistribution[proficiency] || 0) + 1;
    
    // Track progress by standard
    if (!standardsProgress[grade.standardId]) {
      standardsProgress[grade.standardId] = {
        standardId: grade.standardId,
        standardName: grade.standardName,
        totalAssessments: 0,
        totalProficiency: 0,
        averageProficiency: 0
      };
    }
    
    standardsProgress[grade.standardId].totalAssessments += 1;
    standardsProgress[grade.standardId].totalProficiency += proficiency;
  });

  // Calculate averages
  const averageProficiency = totalStandards > 0 ? totalProficiency / totalStandards : 0;
  
  Object.values(standardsProgress).forEach(progress => {
    progress.averageProficiency = progress.totalAssessments > 0 
      ? progress.totalProficiency / progress.totalAssessments 
      : 0;
  });

  return {
    totalStandards,
    averageProficiency,
    proficiencyDistribution,
    standardsProgress
  };
};

// Calculate combined analytics (traditional grades + standards)
export const calculateCombinedAnalytics = (traditionalGrades, standardsGrades, allAssignments, allStudents, gradeBookSettings = {}) => {
  const traditionalAnalytics = calculateTraditionalAnalytics(traditionalGrades);
  const standardsAnalytics = calculateStandardsAnalytics(standardsGrades);
  
  // Calculate correlation between traditional grades and standards proficiency
  const correlation = calculateCorrelation(traditionalGrades, standardsGrades, allAssignments, allStudents);
  
  // Calculate overall performance combining both metrics, passing gradeBookSettings
  const overallPerformance = calculateOverallPerformance(traditionalAnalytics, standardsAnalytics, gradeBookSettings);
  
  return {
    traditional: traditionalAnalytics,
    standards: standardsAnalytics,
    combined: {
      overallPerformance,
      correlation
    }
  };
};

// Calculate traditional grade analytics
export const calculateTraditionalAnalytics = (grades) => {
  if (!grades || grades.length === 0) {
    return {
      totalGrades: 0,
      averageScore: 0,
      gradeDistribution: {},
      scoreRange: { min: 0, max: 0 }
    };
  }

  const totalGrades = grades.length;
  let totalScore = 0;
  const gradeDistribution = {};
  let minScore = Infinity;
  let maxScore = -Infinity;

  grades.forEach(grade => {
    const score = grade.score || 0;
    totalScore += score;
    
    // Track score range
    minScore = Math.min(minScore, score);
    maxScore = Math.max(maxScore, score);
    
    // Count grade distribution (assuming percentage-based)
    const gradeRange = Math.floor(score / 10) * 10;
    gradeDistribution[gradeRange] = (gradeDistribution[gradeRange] || 0) + 1;
  });

  const averageScore = totalGrades > 0 ? totalScore / totalGrades : 0;

  return {
    totalGrades,
    averageScore,
    gradeDistribution,
    scoreRange: { min: minScore, max: maxScore }
  };
};

// Calculate correlation between traditional grades and standards proficiency
export const calculateCorrelation = (traditionalGrades, standardsGrades, allAssignments, allStudents) => {
  if (!traditionalGrades || !standardsGrades || !allAssignments || !allStudents ||
      traditionalGrades.length === 0 || standardsGrades.length === 0 ||
      allAssignments.length === 0 || allStudents.length === 0) {
    return 0;
  }

  const dataPairs = [];

  allStudents.forEach(student => {
    allAssignments.forEach(assignment => {
      // Find traditional grade for this student and assignment
      const traditionalGrade = traditionalGrades.find(
        g => g.studentId === student.id && g.assignmentId === assignment.id && g.score !== null
      );

      // Find all standards grades for this student and assignment
      const assignmentStandardsGrades = standardsGrades.filter(
        sg => sg.studentId === student.id && sg.assignmentId === assignment.id && sg.proficiencyLevel !== null
      );

      if (traditionalGrade && assignmentStandardsGrades.length > 0) {
        // Calculate average proficiency for standards linked to this assignment
        const totalProficiency = assignmentStandardsGrades.reduce((sum, sg) => sum + sg.proficiencyLevel, 0);
        const averageProficiency = totalProficiency / assignmentStandardsGrades.length;

        dataPairs.push({
          x: traditionalGrade.percentage, // Use percentage for traditional score
          y: averageProficiency
        });
      }
    });
  });

  if (dataPairs.length < 2) {
    return 0; // Need at least two data points for correlation
  }

  const n = dataPairs.length;
  const sumX = dataPairs.reduce((a, b) => a + b.x, 0);
  const sumY = dataPairs.reduce((a, b) => a + b.y, 0);
  const sumXY = dataPairs.reduce((sum, pair) => sum + pair.x * pair.y, 0);
  const sumX2 = dataPairs.reduce((sum, pair) => sum + pair.x * pair.x, 0);
  const sumY2 = dataPairs.reduce((sum, pair) => sum + pair.y * pair.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

// Calculate overall performance combining both traditional and standards metrics
export const calculateOverallPerformance = (traditionalAnalytics, standardsAnalytics, gradeBookSettings) => {
  const traditionalWeight = gradeBookSettings.traditionalWeight !== undefined ? gradeBookSettings.traditionalWeight : 0.6;
  const standardsWeight = gradeBookSettings.standardsWeight !== undefined ? gradeBookSettings.standardsWeight : 0.4;
  
  const traditionalScore = traditionalAnalytics.averageScore || 0;
  const standardsScore = standardsAnalytics.averageProficiency || 0;
  
  // Normalize scores to 0-100 scale
  const normalizedTraditionalScore = Math.min(100, Math.max(0, traditionalScore));
  // Use the configurable conversion from standardsGradeCalculator
  const normalizedStandardsScore = standardsGradeCalculator.convertProficiencyToPercentage(standardsScore, getProficiencyScale().type);
  
  const overallScore = (normalizedTraditionalScore * traditionalWeight) + (normalizedStandardsScore * standardsWeight);
  
  const gradeCalculator = new GradeCalculator(gradeBookSettings.gradeScale); // Pass custom grade scale if available
  return {
    score: overallScore,
    grade: gradeCalculator.getLetterGrade(overallScore),
    traditionalContribution: normalizedTraditionalScore * traditionalWeight,
    standardsContribution: normalizedStandardsScore * standardsWeight
  };
};

// Helper function to convert percentage to letter grade
