import dayjs from "dayjs";

// Enhanced Grade Calculation Utilities
export class GradeCalculator {
  constructor(customGradeScale = null) {
    this.defaultGradeScale = {
      A: { min: 90, max: 100, gpa: 4.0 },
      "A-": { min: 87, max: 89, gpa: 3.7 },
      "B+": { min: 83, max: 86, gpa: 3.3 },
      B: { min: 80, max: 82, gpa: 3.0 },
      "B-": { min: 77, max: 79, gpa: 2.7 },
      "C+": { min: 73, max: 76, gpa: 2.3 },
      C: { min: 70, max: 72, gpa: 2.0 },
      "C-": { min: 67, max: 69, gpa: 1.7 },
      "D+": { min: 63, max: 66, gpa: 1.3 },
      D: { min: 60, max: 62, gpa: 1.0 },
      "D-": { min: 57, max: 59, gpa: 0.7 },
      F: { min: 0, max: 56, gpa: 0.0 },
    };
    this.gradeScale = customGradeScale || this.defaultGradeScale;
  }

  // Calculate percentage from score and points
  calculatePercentage(score, points) {
    if (!points || points === 0) return 0;
    return Math.round((score / points) * 100 * 100) / 100; // Round to 2 decimal places
  }

  // Get letter grade from percentage
  getLetterGrade(percentage) {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return "N/A";
    }

    for (const [grade, range] of Object.entries(this.gradeScale)) {
      if (percentage >= range.min && percentage <= range.max) {
        return grade;
      }
    }
    return "F";
  }

  // Get GPA from letter grade
  getGPA(letterGrade) {
    return this.gradeScale[letterGrade]?.gpa || 0;
  }

  // Calculate weighted grade
  calculateWeightedGrade(grades, weights) {
    if (!grades || !weights || grades.length !== weights.length) {
      return 0;
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    grades.forEach((grade, index) => {
      const weight = weights[index] || 0;
      totalWeightedScore += grade * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  // Calculate class average
  calculateClassAverage(grades) {
    if (!grades || grades.length === 0) return 0;

    const validGrades = grades.filter(
      (grade) => grade !== null && grade !== undefined && !isNaN(grade)
    );

    if (validGrades.length === 0) return 0;

    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round((sum / validGrades.length) * 100) / 100;
  }

  // Calculate grade trend (improvement/decline)
  calculateGradeTrend(grades, dates) {
    if (!grades || grades.length < 2) return 0;

    const sortedData = grades
      .map((grade, index) => ({ grade, date: dates[index] }))
      .filter((item) => item.grade !== null && item.grade !== undefined)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedData.length < 2) return 0;

    const firstGrade = sortedData[0].grade;
    const lastGrade = sortedData[sortedData.length - 1].grade;

    return Math.round((lastGrade - firstGrade) * 100) / 100;
  }

  // Calculate semester/quarter averages
  calculatePeriodAverage(grades, period) {
    const periodGrades = grades.filter((grade) => grade.period === period);
    return this.calculateClassAverage(periodGrades.map((g) => g.percentage));
  }

  // Apply late penalty
  applyLatePenalty(score, dueDate, submissionDate, penaltyPercent = 10) {
    if (!dueDate || !submissionDate) return score;

    const due = dayjs(dueDate);
    const submitted = dayjs(submissionDate);

    if (submitted.isAfter(due)) {
      const penalty = (score * penaltyPercent) / 100;
      return Math.max(0, score - penalty);
    }

    return score;
  }

  // Calculate grade distribution
  calculateGradeDistribution(grades) {
    const distribution = {
      A: 0,
      "A-": 0,
      "B+": 0,
      B: 0,
      "B-": 0,
      "C+": 0,
      C: 0,
      "C-": 0,
      "D+": 0,
      D: 0,
      "D-": 0,
      F: 0,
    };

    grades.forEach((grade) => {
      const letterGrade = this.getLetterGrade(grade);
      if (distribution.hasOwnProperty(letterGrade)) {
        distribution[letterGrade]++;
      }
    });

    return distribution;
  }

  // Generate enhanced grade object
  generateEnhancedGrade(gradeData) {
    const {
      score,
      points,
      dueDate,
      submissionDate,
      latePenaltyPercent = 10,
      weight = 1,
      category = "Assignment",
      subject,
      studentId,
      assignmentId,
    } = gradeData;

    // Apply late penalty if applicable
    const finalScore = this.applyLatePenalty(
      score,
      dueDate,
      submissionDate,
      latePenaltyPercent
    );

    // Calculate percentage
    const percentage = this.calculatePercentage(finalScore, points);

    // Get letter grade
    const letterGrade = this.getLetterGrade(percentage);

    // Calculate GPA
    const gpa = this.getGPA(letterGrade);

    return {
      id: `${studentId}_${assignmentId}`,
      studentId,
      assignmentId,
      subject,
      category,
      weight,
      points,
      score: finalScore,
      percentage,
      letterGrade,
      gpa,
      dateEntered: submissionDate || dayjs().toISOString(),
      dateModified: dayjs().toISOString(),
      isLate:
        dueDate && submissionDate
          ? dayjs(submissionDate).isAfter(dayjs(dueDate))
          : false,
      latePenalty: score - finalScore,
      semester: this.getSemester(submissionDate),
      quarter: this.getQuarter(submissionDate),
    };
  }

  // Get semester from date
  getSemester(date) {
    if (!date) return "Unknown";
    const month = dayjs(date).month();
    const year = dayjs(date).year();

    if (month >= 8 || month <= 0) {
      // August to December
      return `Fall ${year}`;
    } else if (month >= 1 && month <= 4) {
      // January to April
      return `Spring ${year}`;
    } else {
      // May to July
      return `Summer ${year}`;
    }
  }

  // Get quarter from date
  getQuarter(date) {
    if (!date) return "Unknown";
    const month = dayjs(date).month();

    if (month >= 8 && month <= 10) return "Q1";
    if (month === 11 || month <= 1) return "Q2";
    if (month >= 2 && month <= 4) return "Q3";
    return "Q4";
  }

  // Validate grade data
  validateGrade(gradeData) {
    const errors = [];

    if (!gradeData.score || gradeData.score < 0) {
      errors.push("Score must be a positive number");
    }

    if (!gradeData.points || gradeData.points <= 0) {
      errors.push("Points must be greater than 0");
    }

    if (gradeData.score > gradeData.points) {
      errors.push("Score cannot exceed maximum points");
    }

    if (!gradeData.studentId) {
      errors.push("Student ID is required");
    }

    if (!gradeData.assignmentId) {
      errors.push("Assignment ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Calculate performance level
  getPerformanceLevel(percentage) {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Above Average";
    if (percentage >= 70) return "Average";
    if (percentage >= 60) return "Below Average";
    return "Needs Improvement";
  }

  // Generate grade analytics
  generateGradeAnalytics(grades) {
    if (!grades || grades.length === 0) {
      return {
        average: 0,
        median: 0,
        highest: 0,
        lowest: 0,
        standardDeviation: 0,
        distribution: {},
        trend: 0,
      };
    }

    const percentages = grades
      .map((g) => g.percentage)
      .filter((p) => !isNaN(p));

    const average = this.calculateClassAverage(percentages);
    const sorted = [...percentages].sort((a, b) => a - b);
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    // Calculate standard deviation
    const variance =
      percentages.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) /
      percentages.length;
    const standardDeviation = Math.sqrt(variance);

    const distribution = this.calculateGradeDistribution(percentages);

    // Calculate trend (simple linear regression)
    const trend = this.calculateGradeTrend(
      percentages,
      grades.map((g) => g.dateEntered)
    );

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      distribution,
      trend: Math.round(trend * 100) / 100,
    };
  }
}

// Export singleton instance
export const gradeCalculator = new GradeCalculator();

// Export individual functions for backward compatibility
export const calculatePercentage = (score, points) =>
  gradeCalculator.calculatePercentage(score, points);
export const getLetterGrade = (percentage) =>
  gradeCalculator.getLetterGrade(percentage);
export const calculateClassAverage = (grades) =>
  gradeCalculator.calculateClassAverage(grades);
export const generateEnhancedGrade = (gradeData) =>
  gradeCalculator.generateEnhancedGrade(gradeData);
export const validateGrade = (gradeData) =>
  gradeCalculator.validateGrade(gradeData);

// Add standalone standard deviation function
export const calculateStandardDeviation = (grades) => {
  if (!grades || grades.length === 0) return 0;
  
  const validGrades = grades.filter(grade => 
    grade !== null && grade !== undefined && !isNaN(grade)
  );
  
  if (validGrades.length === 0) return 0;
  
  const average = validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
  const variance = validGrades.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / validGrades.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.round(standardDeviation * 100) / 100;
};
