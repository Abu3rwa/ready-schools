import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Grade Calculation Service
 * Handles category-based weighted calculations, formulas, and automatic grade computation
 */

// Grade calculation types
export const CALCULATION_TYPES = {
  WEIGHTED_AVERAGE: 'weighted_average',
  SIMPLE_AVERAGE: 'simple_average',
  POINTS_BASED: 'points_based',
  FORMULA: 'formula'
};

// Formula types
export const FORMULA_TYPES = {
  SUM: 'sum',
  AVERAGE: 'average',
  WEIGHTED_AVERAGE: 'weighted_average',
  CUSTOM: 'custom'
};

// Rounding methods
export const ROUNDING_METHODS = {
  NEAREST_WHOLE: 'nearest_whole',
  ROUND_UP: 'round_up',
  ROUND_DOWN: 'round_down',
  NEAREST_TENTH: 'nearest_tenth',
  NEAREST_HUNDREDTH: 'nearest_hundredth'
};

/**
 * Calculate weighted average for a category
 * @param {Array} grades - Array of grade objects
 * @param {Object} category - Category configuration
 * @param {Array} assignments - Array of assignment objects (optional)
 * @returns {Object} Calculation result
 */
export const calculateCategoryAverage = (grades, category, assignments = []) => {
  if (!grades || grades.length === 0) {
    return {
      average: 0,
      totalPoints: 0,
      earnedPoints: 0,
      percentage: 0,
      count: 0
    };
  }

  const validGrades = grades.filter(grade => 
    grade.score !== null && 
    grade.score !== undefined && 
    grade.score !== '' &&
    !isNaN(parseFloat(grade.score))
  );

  if (validGrades.length === 0) {
    return {
      average: 0,
      totalPoints: 0,
      earnedPoints: 0,
      percentage: 0,
      count: 0
    };
  }

  let totalPoints = 0;
  let earnedPoints = 0;

  validGrades.forEach(grade => {
    // Find the assignment for this grade
    const assignment = assignments?.find(a => a.id === grade.assignmentId);
    if (assignment && assignment.points) {
      const maxPoints = parseFloat(assignment.points);
      const score = parseFloat(grade.score);
      
      totalPoints += maxPoints;
      // Since score is stored as percentage, convert to points
      const earnedPointsForAssignment = (score / 100) * maxPoints;
      earnedPoints += earnedPointsForAssignment;
    }
  });

  const average = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const percentage = applyRounding(average, category.roundingMethod || ROUNDING_METHODS.NEAREST_WHOLE);

  return {
    average: percentage,
    totalPoints,
    earnedPoints,
    percentage,
    count: validGrades.length,
    totalAssignments: grades.length
  };
};

/**
 * Calculate final grade using weighted categories
 * @param {Object} gradeBook - Gradebook configuration
 * @param {Array} grades - All grades for the gradebook
 * @param {Array} assignments - All assignments for the gradebook
 * @returns {Object} Final grade calculation
 */
export const calculateFinalGrade = (gradeBook, grades, assignments) => {
  if (!gradeBook || !gradeBook.categories || gradeBook.categories.length === 0) {
    return {
      finalGrade: 0,
      letterGrade: 'N/A',
      categoryBreakdown: [],
      totalWeight: 0,
      weightedSum: 0
    };
  }

  const categoryBreakdown = [];
  let totalWeight = 0;
  let weightedSum = 0;

  // Calculate each category
  gradeBook.categories.forEach(category => {
    const categoryGrades = grades.filter(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      return assignment && assignment.category === category.name;
    });

    const categoryCalculation = calculateCategoryAverage(categoryGrades, category, assignments);
    const weight = category.weight || 0;
    
    categoryBreakdown.push({
      category: category.name,
      weight,
      average: categoryCalculation.percentage,
      totalPoints: categoryCalculation.totalPoints,
      earnedPoints: categoryCalculation.earnedPoints,
      count: categoryCalculation.count,
      weightedContribution: (categoryCalculation.percentage * weight) / 100
    });

    totalWeight += weight;
    weightedSum += (categoryCalculation.percentage * weight) / 100;
  });

  // Calculate final grade
  const finalGrade = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  const roundedFinalGrade = applyRounding(finalGrade, gradeBook.settings?.roundingMethod || ROUNDING_METHODS.NEAREST_WHOLE);
  const letterGrade = calculateLetterGrade(roundedFinalGrade, gradeBook.settings?.gradingScale);

  return {
    finalGrade: roundedFinalGrade,
    letterGrade,
    categoryBreakdown,
    totalWeight,
    weightedSum,
    calculationMethod: gradeBook.settings?.gradingScale || CALCULATION_TYPES.WEIGHTED_AVERAGE
  };
};

/**
 * Calculate letter grade based on percentage
 * @param {number} percentage - Grade percentage
 * @param {string} gradingScale - Grading scale type
 * @returns {string} Letter grade
 */
export const calculateLetterGrade = (percentage, gradingScale = 'standard') => {
  const scales = {
    standard: {
      97: 'A+', 93: 'A', 90: 'A-',
      87: 'B+', 83: 'B', 80: 'B-',
      77: 'C+', 73: 'C', 70: 'C-',
      67: 'D+', 63: 'D', 60: 'D-',
      0: 'F'
    },
    plus_minus: {
      97: 'A+', 93: 'A', 90: 'A-',
      87: 'B+', 83: 'B', 80: 'B-',
      77: 'C+', 73: 'C', 70: 'C-',
      67: 'D+', 63: 'D', 60: 'D-',
      0: 'F'
    },
    simple: {
      90: 'A', 80: 'B', 70: 'C', 60: 'D', 0: 'F'
    }
  };

  const scale = scales[gradingScale] || scales.standard;
  const thresholds = Object.keys(scale).map(Number).sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (percentage >= threshold) {
      return scale[threshold];
    }
  }

  return 'F';
};

/**
 * Apply rounding to a number based on method
 * @param {number} value - Value to round
 * @param {string} method - Rounding method
 * @returns {number} Rounded value
 */
export const applyRounding = (value, method = ROUNDING_METHODS.NEAREST_WHOLE) => {
  switch (method) {
    case ROUNDING_METHODS.NEAREST_WHOLE:
      return Math.round(value);
    case ROUNDING_METHODS.ROUND_UP:
      return Math.ceil(value);
    case ROUNDING_METHODS.ROUND_DOWN:
      return Math.floor(value);
    case ROUNDING_METHODS.NEAREST_TENTH:
      return Math.round(value * 10) / 10;
    case ROUNDING_METHODS.NEAREST_HUNDREDTH:
      return Math.round(value * 100) / 100;
    default:
      return Math.round(value);
  }
};

/**
 * Calculate formula-based grade
 * @param {Object} formula - Formula configuration
 * @param {Array} grades - Grades to use in calculation
 * @param {Array} assignments - Assignments reference
 * @returns {Object} Formula calculation result
 */
export const calculateFormulaGrade = (formula, grades, assignments) => {
  const { type, parameters, expression } = formula;

  switch (type) {
    case FORMULA_TYPES.SUM:
      return calculateSumFormula(grades, parameters);
    case FORMULA_TYPES.AVERAGE:
      return calculateAverageFormula(grades, parameters);
    case FORMULA_TYPES.WEIGHTED_AVERAGE:
      return calculateWeightedAverageFormula(grades, parameters);
    case FORMULA_TYPES.CUSTOM:
      return calculateCustomFormula(grades, assignments, expression);
    default:
      return { result: 0, error: 'Unknown formula type' };
  }
};

/**
 * Calculate sum formula
 * @param {Array} grades - Grades array
 * @param {Object} parameters - Formula parameters
 * @returns {Object} Sum calculation result
 */
const calculateSumFormula = (grades, parameters) => {
  const { categories = [], assignments = [] } = parameters;
  
  let totalPoints = 0;
  let earnedPoints = 0;

  grades.forEach(grade => {
    const assignment = grade.assignment;
    if (assignment) {
      const includeByCategory = categories.length === 0 || categories.includes(assignment.category);
      const includeByAssignment = assignments.length === 0 || assignments.includes(assignment.id);
      
      if (includeByCategory && includeByAssignment) {
        const maxPoints = parseFloat(assignment.points) || 0;
        const score = parseFloat(grade.score) || 0;
        
        totalPoints += maxPoints;
        earnedPoints += score;
      }
    }
  });

  return {
    result: earnedPoints,
    totalPoints,
    earnedPoints,
    percentage: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
  };
};

/**
 * Calculate average formula
 * @param {Array} grades - Grades array
 * @param {Object} parameters - Formula parameters
 * @returns {Object} Average calculation result
 */
const calculateAverageFormula = (grades, parameters) => {
  const { categories = [], assignments = [] } = parameters;
  
  const validGrades = grades.filter(grade => {
    const assignment = grade.assignment;
    if (!assignment) return false;
    
    const includeByCategory = categories.length === 0 || categories.includes(assignment.category);
    const includeByAssignment = assignments.length === 0 || assignments.includes(assignment.id);
    
    return includeByCategory && includeByAssignment && 
           grade.score !== null && 
           grade.score !== undefined && 
           !isNaN(parseFloat(grade.score));
  });

  if (validGrades.length === 0) {
    return { result: 0, count: 0, average: 0 };
  }

  const total = validGrades.reduce((sum, grade) => sum + parseFloat(grade.score), 0);
  const average = total / validGrades.length;

  return {
    result: average,
    count: validGrades.length,
    average
  };
};

/**
 * Calculate weighted average formula
 * @param {Array} grades - Grades array
 * @param {Object} parameters - Formula parameters
 * @returns {Object} Weighted average calculation result
 */
const calculateWeightedAverageFormula = (grades, parameters) => {
  const { weights = {} } = parameters;
  
  let totalWeight = 0;
  let weightedSum = 0;

  Object.keys(weights).forEach(category => {
    const categoryGrades = grades.filter(grade => {
      const assignment = grade.assignment;
      return assignment && assignment.category === category;
    });

    if (categoryGrades.length > 0) {
      const categoryAvg = calculateCategoryAverage(categoryGrades, { name: category });
      const weight = weights[category] || 0;
      
      totalWeight += weight;
      weightedSum += (categoryAvg.percentage * weight) / 100;
    }
  });

  const result = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  return {
    result,
    totalWeight,
    weightedSum
  };
};

/**
 * Calculate custom formula using expression
 * @param {Array} grades - Grades array
 * @param {Array} assignments - Assignments array
 * @param {string} expression - Custom expression
 * @returns {Object} Custom calculation result
 */
const calculateCustomFormula = (grades, assignments, expression) => {
  try {
    // Create a safe evaluation context
    const context = {
      grades,
      assignments,
      sum: (arr) => arr.reduce((a, b) => a + b, 0),
      average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
      max: (arr) => Math.max(...arr),
      min: (arr) => Math.min(...arr),
      count: (arr) => arr.length
    };

    // This is a simplified implementation
    // In production, you'd want a more robust expression parser
    const result = eval(`(function() { 
      const { grades, assignments, sum, average, max, min, count } = arguments[0];
      return ${expression};
    })`)(context);

    return { result, error: null };
  } catch (error) {
    return { result: 0, error: error.message };
  }
};

/**
 * Get student grade summary for a gradebook
 * @param {string} studentId - Student ID
 * @param {Object} gradeBook - Gradebook configuration
 * @param {Array} grades - All grades
 * @param {Array} assignments - All assignments
 * @returns {Object} Student grade summary
 */
export const getStudentGradeSummary = (studentId, gradeBook, grades, assignments) => {
  const studentGrades = grades.filter(grade => grade.studentId === studentId);
  const finalGrade = calculateFinalGrade(gradeBook, studentGrades, assignments);

  const categoryGrades = {};
  gradeBook.categories.forEach(category => {
    const categoryGradesList = studentGrades.filter(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      return assignment && assignment.category === category.name;
    });

    categoryGrades[category.name] = calculateCategoryAverage(categoryGradesList, category, assignments);
  });

  return {
    studentId,
    finalGrade: finalGrade.finalGrade,
    letterGrade: finalGrade.letterGrade,
    categoryGrades,
    categoryBreakdown: finalGrade.categoryBreakdown,
    totalAssignments: studentGrades.length,
    completedAssignments: studentGrades.filter(g => g.score !== null && g.score !== undefined).length
  };
};

/**
 * Get gradebook analytics
 * @param {Object} gradeBook - Gradebook configuration
 * @param {Array} grades - All grades
 * @param {Array} assignments - All assignments
 * @param {Array} students - All students
 * @returns {Object} Gradebook analytics
 */
export const getGradebookAnalytics = (gradeBook, grades, assignments, students) => {
  const studentSummaries = students.map(student => 
    getStudentGradeSummary(student.id, gradeBook, grades, assignments)
  );

  const finalGrades = studentSummaries.map(summary => summary.finalGrade).filter(grade => grade > 0);
  
  const average = finalGrades.length > 0 ? finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length : 0;
  const max = finalGrades.length > 0 ? Math.max(...finalGrades) : 0;
  const min = finalGrades.length > 0 ? Math.min(...finalGrades) : 0;

  // Calculate standard deviation
  const variance = finalGrades.length > 0 
    ? finalGrades.reduce((sum, grade) => sum + Math.pow(grade - average, 2), 0) / finalGrades.length 
    : 0;
  const standardDeviation = Math.sqrt(variance);

  // Grade distribution
  const gradeDistribution = {
    'A+': 0, 'A': 0, 'A-': 0,
    'B+': 0, 'B': 0, 'B-': 0,
    'C+': 0, 'C': 0, 'C-': 0,
    'D+': 0, 'D': 0, 'D-': 0,
    'F': 0
  };

  studentSummaries.forEach(summary => {
    if (gradeDistribution.hasOwnProperty(summary.letterGrade)) {
      gradeDistribution[summary.letterGrade]++;
    }
  });

  return {
    totalStudents: students.length,
    averageGrade: applyRounding(average, gradeBook.settings?.roundingMethod),
    highestGrade: max,
    lowestGrade: min,
    standardDeviation: applyRounding(standardDeviation, gradeBook.settings?.roundingMethod),
    gradeDistribution,
    studentSummaries,
    categoryAnalytics: getCategoryAnalytics(gradeBook, grades, assignments)
  };
};

/**
 * Get category-specific analytics
 * @param {Object} gradeBook - Gradebook configuration
 * @param {Array} grades - All grades
 * @param {Array} assignments - All assignments
 * @returns {Object} Category analytics
 */
const getCategoryAnalytics = (gradeBook, grades, assignments) => {
  const categoryAnalytics = {};

  gradeBook.categories.forEach(category => {
    const categoryGrades = grades.filter(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      return assignment && assignment.category === category.name;
    });

    const validGrades = categoryGrades
      .map(grade => parseFloat(grade.score))
      .filter(score => !isNaN(score));

    if (validGrades.length > 0) {
      const average = validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
      const max = Math.max(...validGrades);
      const min = Math.min(...validGrades);

      categoryAnalytics[category.name] = {
        average: applyRounding(average, gradeBook.settings?.roundingMethod),
        highest: max,
        lowest: min,
        count: validGrades.length,
        totalAssignments: categoryGrades.length
      };
    }
  });

  return categoryAnalytics;
};

/**
 * Validate grade calculation settings
 * @param {Object} gradeBook - Gradebook configuration
 * @returns {Object} Validation result
 */
export const validateGradeCalculationSettings = (gradeBook) => {
  const errors = [];
  const warnings = [];

  // Check if categories exist
  if (!gradeBook.categories || gradeBook.categories.length === 0) {
    errors.push('No categories defined for gradebook');
  }

  // Check category weights
  if (gradeBook.categories && gradeBook.categories.length > 0) {
    const totalWeight = gradeBook.categories.reduce((sum, category) => sum + (category.weight || 0), 0);
    
    if (totalWeight === 0) {
      warnings.push('All category weights are set to 0');
    } else if (Math.abs(totalWeight - 100) > 0.01) {
      warnings.push(`Category weights sum to ${totalWeight}% instead of 100%`);
    }
  }

  // Check for duplicate category names
  const categoryNames = gradeBook.categories?.map(c => c.name) || [];
  const uniqueNames = new Set(categoryNames);
  if (categoryNames.length !== uniqueNames.size) {
    errors.push('Duplicate category names found');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  calculateCategoryAverage,
  calculateFinalGrade,
  calculateLetterGrade,
  applyRounding,
  calculateFormulaGrade,
  getStudentGradeSummary,
  getGradebookAnalytics,
  validateGradeCalculationSettings,
  CALCULATION_TYPES,
  FORMULA_TYPES,
  ROUNDING_METHODS
}; 