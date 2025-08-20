import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import dayjs from 'dayjs';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

/**
 * Calculate progress trends for a student over a specified period
 * @param {string} studentId - The student's ID
 * @param {string} period - Time period (week, month, quarter, year)
 * @returns {Object} Progress trends data
 */
export const calculateProgressTrends = async (studentId, period = 'month') => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log(`Calculating progress trends for student ${studentId} over ${period}`);

    // Get date range based on period
    const dateRange = getDateRangeForPeriod(period);
    
    // Get grade progression data
    const gradeProgression = await getGradeProgression(studentId, dateRange.start, dateRange.end);
    
    // Get attendance patterns
    const attendancePatterns = await getAttendancePatterns(studentId, dateRange.start, dateRange.end);
    
    // Get behavior improvement trends
    const behaviorTrends = await getBehaviorTrends(studentId, dateRange.start, dateRange.end);
    
    // Get learning objective achievement
    const learningObjectives = await getLearningObjectiveAchievement(studentId, dateRange.start, dateRange.end);

    // Calculate trend indicators
    const trendIndicators = calculateTrendIndicators(gradeProgression, attendancePatterns, behaviorTrends);

    const progressTrends = {
      studentId,
      period,
      dateRange,
      gradeProgression,
      attendancePatterns,
      behaviorTrends,
      learningObjectives,
      trendIndicators,
      calculatedAt: new Date().toISOString()
    };

    console.log('Progress trends calculated successfully:', progressTrends);
    return progressTrends;

  } catch (error) {
    console.error('Error calculating progress trends:', error);
    throw new Error('Failed to calculate progress trends.');
  }
};

/**
 * Generate insights and recommendations for a student
 * @param {Object} studentData - Student data including trends
 * @returns {Object} Insights and recommendations
 */
export const generateInsights = async (studentData) => {
  try {
    console.log('Generating insights for student:', studentData.studentId);

    const insights = {
      academicInsights: [],
      behaviorInsights: [],
      attendanceInsights: [],
      recommendations: [],
      warnings: [],
      opportunities: []
    };

    // Analyze grade trends
    if (studentData.gradeProgression && studentData.gradeProgression.length > 0) {
      const gradeTrend = analyzeGradeTrend(studentData.gradeProgression);
      
      if (gradeTrend.declining) {
        insights.warnings.push({
          type: 'grade_decline',
          severity: 'high',
          message: 'Grades are showing a declining trend',
          subjects: gradeTrend.decliningSubjects,
          recommendations: ['Schedule parent conference', 'Implement additional support']
        });
      }
      
      if (gradeTrend.improving) {
        insights.opportunities.push({
          type: 'grade_improvement',
          message: 'Grades are showing improvement',
          subjects: gradeTrend.improvingSubjects,
          recommendations: ['Maintain current strategies', 'Set higher goals']
        });
      }
    }

    // Analyze attendance patterns
    if (studentData.attendancePatterns) {
      const attendanceInsight = analyzeAttendancePatterns(studentData.attendancePatterns);
      
      if (attendanceInsight.concerning) {
        insights.attendanceInsights.push({
          type: 'attendance_concern',
          severity: 'medium',
          message: 'Attendance patterns may be concerning',
          details: attendanceInsight.details,
          recommendations: ['Monitor attendance closely', 'Communicate with parents']
        });
      }
    }

    // Analyze behavior trends
    if (studentData.behaviorTrends) {
      const behaviorInsight = analyzeBehaviorTrends(studentData.behaviorTrends);
      
      if (behaviorInsight.improving) {
        insights.behaviorInsights.push({
          type: 'behavior_improvement',
          message: 'Behavior is showing positive trends',
          details: behaviorInsight.details,
          recommendations: ['Reinforce positive behaviors', 'Continue current strategies']
        });
      }
      
      if (behaviorInsight.concerning) {
        insights.warnings.push({
          type: 'behavior_concern',
          severity: 'medium',
          message: 'Behavior patterns may need attention',
          details: behaviorInsight.details,
          recommendations: ['Implement behavior intervention', 'Schedule behavior conference']
        });
      }
    }

    // Generate overall recommendations
    insights.recommendations = generateOverallRecommendations(insights);

    console.log('Insights generated successfully:', insights);
    return insights;

  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate insights.');
  }
};

/**
 * Get date range for a specified period
 * @param {string} period - Time period
 * @returns {Object} Start and end dates
 */
const getDateRangeForPeriod = (period) => {
  const now = dayjs();
  
  switch (period) {
    case 'week':
      return {
        start: now.startOf('week').format('YYYY-MM-DD'),
        end: now.endOf('week').format('YYYY-MM-DD')
      };
    
    case 'month':
      return {
        start: now.startOf('month').format('YYYY-MM-DD'),
        end: now.endOf('month').format('YYYY-MM-DD')
      };
    
    case 'quarter':
      return {
        start: now.startOf('quarter').format('YYYY-MM-DD'),
        end: now.endOf('quarter').format('YYYY-MM-DD')
      };
    
    case 'year':
      return {
        start: now.startOf('year').format('YYYY-MM-DD'),
        end: now.endOf('year').format('YYYY-MM-DD')
      };
    
    default:
      return {
        start: now.startOf('month').format('YYYY-MM-DD'),
        end: now.endOf('month').format('YYYY-MM-DD')
      };
  }
};

/**
 * Get grade progression data for a student
 * @param {string} studentId - Student ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Array} Grade progression data
 */
const getGradeProgression = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing gradebook system
    // For now, returning placeholder data structure
    return [
      {
        subject: 'Math',
        date: '2024-01-01',
        grade: 85,
        assignment: 'Fractions Test'
      },
      {
        subject: 'Math',
        date: '2024-01-08',
        grade: 88,
        assignment: 'Decimals Quiz'
      }
    ];
  } catch (error) {
    console.error('Error fetching grade progression:', error);
    return [];
  }
};

/**
 * Get attendance patterns for a student
 * @param {string} studentId - Student ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Attendance patterns
 */
const getAttendancePatterns = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing attendance system
    // For now, returning placeholder data structure
    return {
      totalDays: 20,
      present: 18,
      absent: 1,
      tardy: 1,
      attendanceRate: 90,
      patterns: {
        monday: { present: 4, absent: 0, tardy: 0 },
        tuesday: { present: 4, absent: 0, tardy: 0 },
        wednesday: { present: 4, absent: 0, tardy: 0 },
        thursday: { present: 3, absent: 1, tardy: 0 },
        friday: { present: 3, absent: 0, tardy: 1 }
      }
    };
  } catch (error) {
    console.error('Error fetching attendance patterns:', error);
    return {};
  }
};

/**
 * Get behavior trends for a student
 * @param {string} studentId - Student ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Behavior trends
 */
const getBehaviorTrends = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing behavior system
    // For now, returning placeholder data structure
    return {
      totalIncidents: 5,
      positiveBehaviors: 12,
      negativeBehaviors: 3,
      behaviorScore: 85,
      trends: {
        positive: 'increasing',
        negative: 'decreasing',
        overall: 'improving'
      }
    };
  } catch (error) {
    console.error('Error fetching behavior trends:', error);
    return {};
  }
};

/**
 * Get learning objective achievement for a student
 * @param {string} studentId - Student ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Learning objective achievement
 */
const getLearningObjectiveAchievement = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing standards/objectives system
    // For now, returning placeholder data structure
    return {
      totalObjectives: 15,
      achieved: 12,
      inProgress: 2,
      notStarted: 1,
      achievementRate: 80,
      objectives: [
        {
          subject: 'Math',
          objective: 'Understand fractions',
          status: 'achieved',
          dateAchieved: '2024-01-15'
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching learning objective achievement:', error);
    return {};
  }
};

/**
 * Calculate trend indicators from various data sources
 * @param {Array} gradeProgression - Grade progression data
 * @param {Object} attendancePatterns - Attendance patterns
 * @param {Object} behaviorTrends - Behavior trends
 * @returns {Object} Trend indicators
 */
const calculateTrendIndicators = (gradeProgression, attendancePatterns, behaviorTrends) => {
  const indicators = {
    academicTrend: 'stable',
    attendanceTrend: 'stable',
    behaviorTrend: 'stable',
    overallTrend: 'stable',
    confidence: 0
  };

  // Calculate academic trend
  if (gradeProgression.length >= 2) {
    const recentGrades = gradeProgression.slice(-3).map(g => g.grade);
    const averageRecent = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
    const olderGrades = gradeProgression.slice(0, -3).map(g => g.grade);
    
    if (olderGrades.length > 0) {
      const averageOlder = olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length;
      if (averageRecent > averageOlder + 5) {
        indicators.academicTrend = 'improving';
      } else if (averageRecent < averageOlder - 5) {
        indicators.academicTrend = 'declining';
      }
    }
  }

  // Calculate attendance trend
  if (attendancePatterns.attendanceRate >= 95) {
    indicators.attendanceTrend = 'excellent';
  } else if (attendancePatterns.attendanceRate >= 90) {
    indicators.attendanceTrend = 'good';
  } else if (attendancePatterns.attendanceRate >= 80) {
    indicators.attendanceTrend = 'fair';
  } else {
    indicators.attendanceTrend = 'concerning';
  }

  // Calculate behavior trend
  if (behaviorTrends.behaviorScore >= 90) {
    indicators.behaviorTrend = 'excellent';
  } else if (behaviorTrends.behaviorScore >= 80) {
    indicators.behaviorTrend = 'good';
  } else if (behaviorTrends.behaviorScore >= 70) {
    indicators.behaviorTrend = 'fair';
  } else {
    indicators.behaviorTrend = 'concerning';
  }

  // Calculate overall trend
  const trendScores = {
    improving: 3,
    stable: 2,
    declining: 1,
    excellent: 3,
    good: 2,
    fair: 1,
    concerning: 0
  };

  const academicScore = trendScores[indicators.academicTrend] || 2;
  const attendanceScore = trendScores[indicators.attendanceTrend] || 2;
  const behaviorScore = trendScores[indicators.behaviorTrend] || 2;

  const overallScore = (academicScore + attendanceScore + behaviorScore) / 3;

  if (overallScore >= 2.5) {
    indicators.overallTrend = 'improving';
  } else if (overallScore >= 1.5) {
    indicators.overallTrend = 'stable';
  } else {
    indicators.overallTrend = 'declining';
  }

  indicators.confidence = Math.min(100, Math.max(0, overallScore * 33.33));

  return indicators;
};

/**
 * Analyze grade trend from progression data
 * @param {Array} gradeProgression - Grade progression data
 * @returns {Object} Grade trend analysis
 */
const analyzeGradeTrend = (gradeProgression) => {
  const analysis = {
    declining: false,
    improving: false,
    decliningSubjects: [],
    improvingSubjects: []
  };

  if (gradeProgression.length < 2) return analysis;

  // Group by subject
  const subjectGroups = {};
  gradeProgression.forEach(grade => {
    if (!subjectGroups[grade.subject]) {
      subjectGroups[grade.subject] = [];
    }
    subjectGroups[grade.subject].push(grade);
  });

  // Analyze each subject
  Object.entries(subjectGroups).forEach(([subject, grades]) => {
    if (grades.length >= 2) {
      const sortedGrades = grades.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstGrade = sortedGrades[0].grade;
      const lastGrade = sortedGrades[sortedGrades.length - 1].grade;
      
      if (lastGrade < firstGrade - 5) {
        analysis.declining = true;
        analysis.decliningSubjects.push(subject);
      } else if (lastGrade > firstGrade + 5) {
        analysis.improving = true;
        analysis.improvingSubjects.push(subject);
      }
    }
  });

  return analysis;
};

/**
 * Analyze attendance patterns
 * @param {Object} attendancePatterns - Attendance patterns data
 * @returns {Object} Attendance analysis
 */
const analyzeAttendancePatterns = (attendancePatterns) => {
  const analysis = {
    concerning: false,
    details: []
  };

  if (attendancePatterns.attendanceRate < 90) {
    analysis.concerning = true;
    analysis.details.push(`Overall attendance rate is ${attendancePatterns.attendanceRate}%`);
  }

  // Check for patterns in specific days
  if (attendancePatterns.patterns) {
    Object.entries(attendancePatterns.patterns).forEach(([day, data]) => {
      if (data.absent > 0) {
        analysis.details.push(`Frequent absences on ${day}`);
      }
      if (data.tardy > 0) {
        analysis.details.push(`Frequent tardies on ${day}`);
      }
    });
  }

  return analysis;
};

/**
 * Analyze behavior trends
 * @param {Object} behaviorTrends - Behavior trends data
 * @returns {Object} Behavior analysis
 */
const analyzeBehaviorTrends = (behaviorTrends) => {
  const analysis = {
    improving: false,
    concerning: false,
    details: []
  };

  if (behaviorTrends.trends.overall === 'improving') {
    analysis.improving = true;
    analysis.details.push('Overall behavior is improving');
  }

  if (behaviorTrends.behaviorScore < 75) {
    analysis.concerning = true;
    analysis.details.push(`Behavior score is ${behaviorTrends.behaviorScore}/100`);
  }

  if (behaviorTrends.negativeBehaviors > 5) {
    analysis.concerning = true;
    analysis.details.push(`Multiple negative behavior incidents (${behaviorTrends.negativeBehaviors})`);
  }

  return analysis;
};

/**
 * Generate overall recommendations based on insights
 * @param {Object} insights - Generated insights
 * @returns {Array} Overall recommendations
 */
const generateOverallRecommendations = (insights) => {
  const recommendations = [];

  // High priority warnings
  if (insights.warnings.some(w => w.severity === 'high')) {
    recommendations.push({
      priority: 'high',
      action: 'Schedule immediate parent conference',
      reason: 'High priority concerns identified'
    });
  }

  // Academic recommendations
  if (insights.academicInsights.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Review academic support strategies',
      reason: 'Academic performance needs attention'
    });
  }

  // Behavior recommendations
  if (insights.behaviorInsights.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Implement behavior intervention plan',
      reason: 'Behavior patterns need attention'
    });
  }

  // Attendance recommendations
  if (insights.attendanceInsights.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Monitor attendance closely',
      reason: 'Attendance patterns may be concerning'
    });
  }

  // Positive reinforcement
  if (insights.opportunities.length > 0) {
    recommendations.push({
      priority: 'low',
      action: 'Reinforce positive behaviors and achievements',
      reason: 'Student showing improvement in several areas'
    });
  }

  return recommendations;
}; 