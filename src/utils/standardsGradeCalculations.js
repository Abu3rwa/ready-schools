import dayjs from "dayjs";
import { PROFICIENCY_SCALES } from '../constants/proficiencyScales';

/**
 * Standards-Based Grading Calculation Utilities
 * Provides functions for calculating standards proficiency, composite grades,
 * mastery levels, and progress tracking for standards-based grading.
 */
export class StandardsGradeCalculator {
  constructor() {
    this.proficiencyLevels = {
      1: { name: "Beginning", color: "#d32f2f", description: "Student is beginning to understand the concept" },
      2: { name: "Developing", color: "#f57c00", description: "Student is developing understanding of the concept" },
      3: { name: "Proficient", color: "#1976d2", description: "Student demonstrates proficiency in the concept" },
      4: { name: "Advanced", color: "#2e7d32", description: "Student demonstrates advanced mastery of the concept" }
    };
  }

  /**
   * Converts a proficiency level to a percentage based on a given scale.
   * @param {number} proficiencyLevel - The proficiency level (e.g., 1, 2, 3, 4).
   * @param {string} scaleType - The type of proficiency scale (e.g., 'four_point', 'five_point').
   * @returns {number} The corresponding percentage.
   */
  convertProficiencyToPercentage(proficiencyLevel, scaleType = 'four_point') {
    const scale = PROFICIENCY_SCALES[scaleType];
    if (!scale) {
      console.warn(`Proficiency scale '${scaleType}' not found. Using default linear conversion.`);
      return (proficiencyLevel / 4) * 100; // Fallback to linear if scale not found
    }
    const levelData = scale.find(item => item.level === proficiencyLevel);
    return levelData ? levelData.percentageMapping : (proficiencyLevel / 4) * 100; // Fallback

    this.masteryThresholds = {
      basic: 2.0,
      proficient: 3.0,
      advanced: 3.5,
      mastery: 3.8
    };
  }

  /**
   * Calculate average standards proficiency from an array of standards grades
   * @param {Array} standardsGrades - Array of standards grade objects
   * @returns {number} Average proficiency level (1-4 scale)
   */
  calculateStandardsProficiency(standardsGrades) {
    if (!standardsGrades || standardsGrades.length === 0) return 0;

    const validGrades = standardsGrades.filter(grade => 
      grade.proficiencyLevel && 
      grade.proficiencyLevel >= 1 && 
      grade.proficiencyLevel <= 4
    );

    if (validGrades.length === 0) return 0;

    const total = validGrades.reduce((sum, grade) => sum + grade.proficiencyLevel, 0);
    return Math.round((total / validGrades.length) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate composite grade combining traditional and standards grades
   * @param {Object} traditionalGrade - Traditional grade object
   * @param {Array} standardsGrades - Array of standards grade objects
   * @param {Object} weights - Weight configuration { traditional: 0.5, standards: 0.5 }
   * @returns {Object} Composite grade result
   */
  calculateCompositeGrade(traditionalGrade, standardsGrades, weights = { traditional: 0.5, standards: 0.5 }) {
    const result = {
      traditionalScore: 0,
      standardsScore: 0,
      compositeScore: 0,
      weights: weights,
      breakdown: {}
    };

    // Calculate traditional score percentage
    if (traditionalGrade && traditionalGrade.score && traditionalGrade.points) {
      result.traditionalScore = (traditionalGrade.score / traditionalGrade.points) * 100;
    }

    // Calculate standards score percentage using configurable mapping
    const standardsAverage = this.calculateStandardsProficiency(standardsGrades);
    // Assuming a default 'four_point' scale for now, will be configurable later
    result.standardsScore = this.convertProficiencyToPercentage(standardsAverage, 'four_point');

    // Calculate composite score
    result.compositeScore = (
      (result.traditionalScore * weights.traditional) + 
      (result.standardsScore * weights.standards)
    );

    // Round all scores to 2 decimal places
    result.traditionalScore = Math.round(result.traditionalScore * 100) / 100;
    result.standardsScore = Math.round(result.standardsScore * 100) / 100;
    result.compositeScore = Math.round(result.compositeScore * 100) / 100;

    // Add breakdown information
    result.breakdown = {
      traditionalWeight: weights.traditional,
      standardsWeight: weights.standards,
      standardsCount: standardsGrades.length,
      standardsAverage: standardsAverage
    };

    return result;
  }

  /**
   * Calculate mastery level based on proficiency scores
   * @param {Array} standardsGrades - Array of standards grade objects
   * @param {number} masteryThreshold - Threshold for mastery (default 3.0)
   * @returns {Object} Mastery level information
   */
  calculateMasteryLevel(standardsGrades, masteryThreshold = 3.0) {
    if (!standardsGrades || standardsGrades.length === 0) {
      return {
        level: "No Data",
        percentage: 0,
        count: 0,
        total: 0
      };
    }

    const average = this.calculateStandardsProficiency(standardsGrades);
    const masteredCount = standardsGrades.filter(grade => 
      grade.proficiencyLevel >= masteryThreshold
    ).length;

    const result = {
      average: average,
      masteredCount: masteredCount,
      totalCount: standardsGrades.length,
      masteryPercentage: Math.round((masteredCount / standardsGrades.length) * 100),
      level: this.getMasteryLevelName(average, masteryThreshold)
    };

    return result;
  }

  /**
   * Get mastery level name based on average proficiency
   * @param {number} average - Average proficiency level
   * @param {number} threshold - Mastery threshold
   * @returns {string} Mastery level name
   */
  getMasteryLevelName(average, threshold = 3.0) {
    if (average >= 3.8) return "Advanced Mastery";
    if (average >= 3.5) return "High Mastery";
    if (average >= threshold) return "Mastered";
    if (average >= threshold - 0.5) return "Approaching Mastery";
    if (average >= 2.0) return "Developing";
    return "Beginning";
  }

  /**
   * Generate standards progress report for a student
   * @param {string} studentId - Student ID
   * @param {string} standardId - Standard ID (optional for specific standard)
   * @param {Array} assignments - Array of assignments
   * @param {Array} standardsGrades - Array of standards grades
   * @param {Object} timeRange - Time range filter { start: Date, end: Date }
   * @returns {Object} Progress report data
   */
  generateStandardsProgress(studentId, standardId, assignments, standardsGrades, timeRange = null) {
    // Filter grades by student and optional standard
    let filteredGrades = standardsGrades.filter(grade => grade.studentId === studentId);
    
    if (standardId) {
      filteredGrades = filteredGrades.filter(grade => grade.standardId === standardId);
    }

    // Filter by time range if provided
    if (timeRange && timeRange.start && timeRange.end) {
      filteredGrades = filteredGrades.filter(grade => {
        const gradeDate = dayjs(grade.gradedAt?.toDate() || grade.createdAt?.toDate());
        return gradeDate.isAfter(timeRange.start) && gradeDate.isBefore(timeRange.end);
      });
    }

    // Group grades by standard
    const gradesByStandard = {};
    filteredGrades.forEach(grade => {
      if (!gradesByStandard[grade.standardId]) {
        gradesByStandard[grade.standardId] = [];
      }
      gradesByStandard[grade.standardId].push(grade);
    });

    // Calculate progress for each standard
    const progressData = Object.entries(gradesByStandard).map(([stdId, grades]) => {
      const sortedGrades = grades.sort((a, b) => 
        dayjs(a.gradedAt?.toDate() || a.createdAt?.toDate())
          .diff(dayjs(b.gradedAt?.toDate() || b.createdAt?.toDate()))
      );

      const trend = this.calculateProgressTrend(sortedGrades);
      const mastery = this.calculateMasteryLevel(grades);

      return {
        standardId: stdId,
        grades: sortedGrades,
        trend: trend,
        mastery: mastery,
        assignmentsCount: grades.length,
        latestGrade: sortedGrades[sortedGrades.length - 1],
        firstGrade: sortedGrades[0]
      };
    });

    // Calculate overall progress
    const overallProgress = {
      totalStandards: progressData.length,
      masteredStandards: progressData.filter(p => p.mastery.level === "Mastered").length,
      averageProficiency: this.calculateStandardsProficiency(filteredGrades),
      trend: this.calculateOverallTrend(progressData),
      recommendations: this.generateRecommendations(progressData)
    };

    return {
      studentId,
      standardId,
      timeRange,
      progressData,
      overallProgress
    };
  }

  /**
   * Calculate progress trend for a series of grades
   * @param {Array} grades - Array of grades sorted by date
   * @returns {Object} Trend information
   */
  calculateProgressTrend(grades) {
    if (grades.length < 2) {
      return {
        direction: "stable",
        slope: 0,
        improvement: 0,
        consistency: 1
      };
    }

    const proficiencyLevels = grades.map(g => g.proficiencyLevel);
    const firstLevel = proficiencyLevels[0];
    const lastLevel = proficiencyLevels[proficiencyLevels.length - 1];
    const improvement = lastLevel - firstLevel;

    // Calculate slope (simple linear regression)
    const n = proficiencyLevels.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0 to n-1
    const sumY = proficiencyLevels.reduce((sum, val) => sum + val, 0);
    const sumXY = proficiencyLevels.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate consistency (standard deviation)
    const mean = sumY / n;
    const variance = proficiencyLevels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (stdDev / 2)); // Normalize to 0-1

    return {
      direction: improvement > 0 ? "improving" : improvement < 0 ? "declining" : "stable",
      slope: Math.round(slope * 1000) / 1000,
      improvement: Math.round(improvement * 100) / 100,
      consistency: Math.round(consistency * 100) / 100
    };
  }

  /**
   * Calculate overall trend across multiple standards
   * @param {Array} progressData - Array of progress data for each standard
   * @returns {Object} Overall trend information
   */
  calculateOverallTrend(progressData) {
    if (progressData.length === 0) {
      return {
        direction: "stable",
        averageImprovement: 0,
        improvingStandards: 0,
        totalStandards: 0
      };
    }

    const improvements = progressData.map(p => p.trend.improvement);
    const averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    const improvingStandards = improvements.filter(imp => imp > 0).length;

    return {
      direction: averageImprovement > 0.1 ? "improving" : averageImprovement < -0.1 ? "declining" : "stable",
      averageImprovement: Math.round(averageImprovement * 100) / 100,
      improvingStandards,
      totalStandards: progressData.length,
      improvementPercentage: Math.round((improvingStandards / progressData.length) * 100)
    };
  }

  /**
   * Generate recommendations based on progress data
   * @param {Array} progressData - Array of progress data for each standard
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(progressData) {
    const recommendations = [];

    // Find standards that need attention
    const strugglingStandards = progressData.filter(p => 
      p.mastery.average < 2.5 || p.trend.direction === "declining"
    );

    if (strugglingStandards.length > 0) {
      recommendations.push({
        type: "intervention",
        priority: "high",
        message: `${strugglingStandards.length} standard(s) need additional support`,
        standards: strugglingStandards.map(s => s.standardId)
      });
    }

    // Find standards ready for advancement
    const masteredStandards = progressData.filter(p => 
      p.mastery.average >= 3.5 && p.trend.direction === "improving"
    );

    if (masteredStandards.length > 0) {
      recommendations.push({
        type: "advancement",
        priority: "medium",
        message: `${masteredStandards.length} standard(s) show strong mastery`,
        standards: masteredStandards.map(s => s.standardId)
      });
    }

    // Overall performance recommendations
    const overallAverage = progressData.reduce((sum, p) => sum + p.mastery.average, 0) / progressData.length;
    
    if (overallAverage < 2.0) {
      recommendations.push({
        type: "general",
        priority: "high",
        message: "Overall performance indicates need for foundational review"
      });
    } else if (overallAverage > 3.5) {
      recommendations.push({
        type: "general",
        priority: "low",
        message: "Strong overall performance - consider enrichment activities"
      });
    }

    return recommendations;
  }

  /**
   * Calculate standards distribution across proficiency levels
   * @param {Array} standardsGrades - Array of standards grades
   * @returns {Object} Distribution data
   */
  calculateStandardsDistribution(standardsGrades) {
    const distribution = {
      1: { count: 0, percentage: 0, name: "Beginning" },
      2: { count: 0, percentage: 0, name: "Developing" },
      3: { count: 0, percentage: 0, name: "Proficient" },
      4: { count: 0, percentage: 0, name: "Advanced" }
    };

    if (!standardsGrades || standardsGrades.length === 0) {
      return distribution;
    }

    standardsGrades.forEach(grade => {
      if (grade.proficiencyLevel >= 1 && grade.proficiencyLevel <= 4) {
        distribution[grade.proficiencyLevel].count++;
      }
    });

    const total = standardsGrades.length;
    Object.keys(distribution).forEach(level => {
      distribution[level].percentage = Math.round((distribution[level].count / total) * 100);
    });

    return distribution;
  }

  /**
   * Get proficiency level information
   * @param {number} level - Proficiency level (1-4)
   * @returns {Object} Proficiency level details
   */
  getProficiencyLevelInfo(level) {
    return this.proficiencyLevels[level] || {
      name: "Unknown",
      color: "#666666",
      description: "Unknown proficiency level"
    };
  }

  /**
   * Validate standards grade data
   * @param {Object} gradeData - Grade data to validate
   * @returns {Object} Validation result
   */
  validateStandardsGrade(gradeData) {
    const errors = [];

    if (!gradeData.proficiencyLevel || gradeData.proficiencyLevel < 1 || gradeData.proficiencyLevel > 4) {
      errors.push("Proficiency level must be between 1 and 4");
    }

    if (gradeData.score !== undefined && (gradeData.score < 0 || gradeData.score > 100)) {
      errors.push("Score must be between 0 and 100");
    }

    if (!gradeData.studentId) {
      errors.push("Student ID is required");
    }

    if (!gradeData.assignmentId) {
      errors.push("Assignment ID is required");
    }

    if (!gradeData.standardId) {
      errors.push("Standard ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const standardsGradeCalculator = new StandardsGradeCalculator();

// Export individual functions for backward compatibility
export const calculateStandardsProficiency = (standardsGrades) =>
  standardsGradeCalculator.calculateStandardsProficiency(standardsGrades);

export const calculateCompositeGrade = (traditionalGrade, standardsGrades, weights) =>
  standardsGradeCalculator.calculateCompositeGrade(traditionalGrade, standardsGrades, weights);

export const calculateMasteryLevel = (standardsGrades, masteryThreshold) =>
  standardsGradeCalculator.calculateMasteryLevel(standardsGrades, masteryThreshold);

export const generateStandardsProgress = (studentId, standardId, assignments, standardsGrades, timeRange) =>
  standardsGradeCalculator.generateStandardsProgress(studentId, standardId, assignments, standardsGrades, timeRange);

export const validateStandardsGrade = (gradeData) =>
  standardsGradeCalculator.validateStandardsGrade(gradeData); 