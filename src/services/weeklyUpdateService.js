import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import dayjs from 'dayjs';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

/**
 * Generate a comprehensive weekly report for a student
 * @param {string} studentId - The student's ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} Weekly report data
 */
export const generateWeeklyReport = async (studentId, startDate, endDate) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log(`Generating weekly report for student ${studentId} from ${startDate} to ${endDate}`);

    // Aggregate daily updates for the week
    const dailyUpdates = await getDailyUpdatesForWeek(studentId, startDate, endDate);
    
    // Collect gradebook changes
    const gradebookChanges = await getGradebookChangesForWeek(studentId, startDate, endDate);
    
    // Compile attendance patterns
    const attendancePatterns = await getAttendancePatternsForWeek(studentId, startDate, endDate);
    
    // Gather behavior insights
    const behaviorInsights = await getBehaviorInsightsForWeek(studentId, startDate, endDate);
    
    // Identify upcoming assignments
    const upcomingAssignments = await getUpcomingAssignmentsForWeek(studentId, startDate, endDate);

    // Calculate weekly statistics
    const weeklyStats = calculateWeeklyStatistics(dailyUpdates, attendancePatterns, gradebookChanges);

    const weeklyReport = {
      studentId,
      userId,
      weekStart: startDate,
      weekEnd: endDate,
      generatedAt: new Date().toISOString(),
      reportData: {
        attendance: weeklyStats.attendance,
        lessons: dailyUpdates.lessons,
        grades: gradebookChanges,
        behavior: behaviorInsights,
        upcoming: upcomingAssignments,
        statistics: weeklyStats
      }
    };

    console.log('Weekly report generated successfully:', weeklyReport);
    return weeklyReport;

  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw new Error('Failed to generate weekly report.');
  }
};

/**
 * Get daily updates for a specific week
 */
const getDailyUpdatesForWeek = async (studentId, startDate, endDate) => {
  try {
    const dailyUpdatesCol = collection(db, 'dailyUpdateEmails');
    const q = query(
      dailyUpdatesCol,
      where('studentId', '==', studentId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => doc.data());

    // Extract lessons from daily updates
    const lessons = updates
      .filter(update => update.lessons && update.lessons.length > 0)
      .flatMap(update => update.lessons.map(lesson => ({
        ...lesson,
        date: update.date
      })));

    return {
      totalUpdates: updates.length,
      lessons: lessons,
      homework: updates.flatMap(update => update.homework || []),
      classwork: updates.flatMap(update => update.classwork || []),
      behavior: updates.flatMap(update => update.behavior || [])
    };

  } catch (error) {
    console.error('Error fetching daily updates:', error);
    return { totalUpdates: 0, lessons: [], homework: [], classwork: [], behavior: [] };
  }
};

/**
 * Get gradebook changes for the week
 */
const getGradebookChangesForWeek = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing gradebook system
    // For now, returning placeholder data structure
    return {
      subjects: [],
      gradeChanges: [],
      newAssignments: [],
      completedAssignments: []
    };
  } catch (error) {
    console.error('Error fetching gradebook changes:', error);
    return { subjects: [], gradeChanges: [], newAssignments: [], completedAssignments: [] };
  }
};

/**
 * Get attendance patterns for the week
 */
const getAttendancePatternsForWeek = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing attendance system
    // For now, returning placeholder data structure
    return {
      present: 0,
      absent: 0,
      tardy: 0,
      totalDays: 0,
      attendanceRate: 0
    };
  } catch (error) {
    console.error('Error fetching attendance patterns:', error);
    return { present: 0, absent: 0, tardy: 0, totalDays: 0, attendanceRate: 0 };
  }
};

/**
 * Get behavior insights for the week
 */
const getBehaviorInsightsForWeek = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing behavior system
    // For now, returning placeholder data structure
    return {
      positiveBehaviors: [],
      areasForImprovement: [],
      teacherObservations: [],
      behaviorScore: 0
    };
  } catch (error) {
    console.error('Error fetching behavior insights:', error);
    return { positiveBehaviors: [], areasForImprovement: [], teacherObservations: [], behaviorScore: 0 };
  }
};

/**
 * Get upcoming assignments for the week
 */
const getUpcomingAssignmentsForWeek = async (studentId, startDate, endDate) => {
  try {
    // This would integrate with the existing assignment system
    // For now, returning placeholder data structure
    return {
      dueThisWeek: [],
      dueNextWeek: [],
      importantDates: []
    };
  } catch (error) {
    console.error('Error fetching upcoming assignments:', error);
    return { dueThisWeek: [], dueNextWeek: [], importantDates: [] };
  }
};

/**
 * Calculate weekly statistics
 */
const calculateWeeklyStatistics = (dailyUpdates, attendance, grades) => {
  const totalLessons = dailyUpdates.lessons.length;
  const totalHomework = dailyUpdates.homework.length;
  const totalClasswork = dailyUpdates.classwork.length;

  return {
    attendance: {
      present: attendance.present,
      absent: attendance.absent,
      tardy: attendance.tardy,
      totalDays: attendance.totalDays,
      attendanceRate: attendance.attendanceRate
    },
    academic: {
      totalLessons,
      totalHomework,
      totalClasswork,
      lessonSubjects: [...new Set(dailyUpdates.lessons.map(lesson => lesson.subject))]
    },
    engagement: {
      behaviorScore: 0, // Will be calculated from behavior data
      participationRate: 0 // Will be calculated from daily updates
    }
  };
};

/**
 * Get all students who need weekly reports for a specific week
 */
export const getStudentsNeedingWeeklyReports = async (startDate, endDate) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    // This would query students who have daily updates in the specified week
    // For now, returning placeholder
    return [];
  } catch (error) {
    console.error('Error getting students needing weekly reports:', error);
    return [];
  }
};

/**
 * Generate weekly reports for multiple students
 */
export const generateBatchWeeklyReports = async (studentIds, startDate, endDate) => {
  try {
    const reports = [];
    
    for (const studentId of studentIds) {
      try {
        const report = await generateWeeklyReport(studentId, startDate, endDate);
        reports.push(report);
      } catch (error) {
        console.error(`Error generating report for student ${studentId}:`, error);
        // Continue with other students even if one fails
      }
    }

    return reports;
  } catch (error) {
    console.error('Error generating batch weekly reports:', error);
    throw new Error('Failed to generate batch weekly reports.');
  }
}; 