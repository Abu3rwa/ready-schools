import { httpsCallable } from "firebase/functions";
import { functions, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// Daily Update API functions (callable v2)
const sendDailyUpdates = httpsCallable(functions, "sendDailyUpdates");
// Parent-targeted student-specific sender (legacy, HTTP onRequest). Keep for backward compatibility where used.
const sendStudentDailyUpdate = httpsCallable(functions, "sendStudentDailyUpdate");
// New student-targeted callables
const sendStudentEmails = httpsCallable(functions, "sendStudentEmails");
const sendStudentEmail = httpsCallable(functions, "sendStudentEmail");
const getDailyUpdateData = httpsCallable(functions, "getDailyUpdateData");

export class FrontendDailyUpdateService {
  constructor() {
    this.functions = functions;
  }

  /**
   * Send daily update emails to all parents
   * @param {Object} dataSources - Object containing all data sources
   * @param {Date} date - Optional date for the update (defaults to today)
   * @returns {Promise<Object>} Results of the email sending operation
   */
  async sendDailyUpdatesToAllParents(dataSources, date = new Date()) {
    try {
      const result = await sendDailyUpdates({
        date: date.toISOString(),
        dataSources,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error sending daily updates:", error);
      // Extract the detailed error message from the Firebase error
      const errorMessage = error.message || "Unknown error occurred";
      const errorDetails = error.details || {};
      console.log("Full error details:", {
        code: error.code,
        details: errorDetails,
        message: errorMessage
      });
      
      // If the error has details from the function, use that
      if (errorDetails.error) {
        return {
          success: false,
          error: errorDetails.error,
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send daily update email for a specific student
   * @param {string} studentId - Student ID
   * @param {Object} dataSources - Object containing all data sources
   * @param {Date} date - Optional date for the update (defaults to today)
   * @returns {Promise<Object>} Results of the email sending operation
   */
  async sendDailyUpdateForStudent(studentId, dataSources, date = new Date()) {
    try {
      // Ensure auth token present to populate context.auth in callable
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      await currentUser.getIdToken(true);
      // Use the student-targeted callable to send to the student's own email
      const result = await sendStudentEmail({
        studentId,
        date: date.toISOString(),
        dataSources,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error sending student daily update (student email path):", error);
      const errorDetails = error.details || {};
      
      // If the error has details from the function, use that
      if (errorDetails.error) {
        return {
          success: false,
          error: errorDetails.error,
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get daily update data without sending emails
   * @param {string} studentId - Optional student ID (if not provided, returns all students)
   * @param {Object} dataSources - Object containing all data sources
   * @param {Date} date - Optional date for the update (defaults to today)
   * @returns {Promise<Object>} Daily update data
   */
  async fetchDailyUpdateData(studentId = null, dataSources, date = new Date()) {
    try {
      // Debug: Check authentication state
      const currentUser = auth.currentUser;
      console.log("Frontend: Current user:", currentUser);
      console.log("Frontend: User ID:", currentUser?.uid);
      console.log("Frontend: User email:", currentUser?.email);
      
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      const functionData = {
        studentId,
        date: date.toISOString(),
        dataSources,
      };
      
      console.log("Frontend: Calling getDailyUpdateData with:", functionData);
      
      const result = await getDailyUpdateData(functionData);

      console.log("Frontend: Function call successful:", result);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Frontend: Error getting daily update data:", error);
      console.error("Frontend: Error details:", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Prepare data sources from context data
   * @param {Object} contexts - Object containing all context data
   * @returns {Object} Formatted data sources
   */
  prepareDataSources(contexts) {
    const {
      students = [],
      attendance = [],
      assignments = [],
      grades = [],
      behavior = [],
      lessons = [],
      teacher,
      schoolName,
    } = contexts;

    return {
      students: students.map((student) => ({
        id: student.id || student.studentId, // fallback to studentId if id missing
        firstName: student.firstName,
        lastName: student.lastName,
        studentEmail: student.studentEmail || student.email || null,
        // Include gender so the Cloud Function can personalize pronouns
        gender: student.gender || null,
        parentEmail1: student.parentEmail1,
        parentEmail2: student.parentEmail2,
        status: student.status || "active",
      })),
      attendance: attendance.map((record) => ({
        id: record.id,
        studentId: record.studentId,
        date: record.date,
        status: record.status,
        notes: record.notes,
        timeEntered: record.timeEntered,
      })),
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        name: assignment.name,
        subject: assignment.subject,
        category: assignment.category,
        points: assignment.points,
        dueDate: assignment.dueDate,
        description: assignment.description,
        createdAt: assignment.createdAt,
      })),
      grades: grades.map((grade) => ({
        id: grade.id,
        studentId: grade.studentId,
        assignmentId: grade.assignmentId,
        score: grade.score,
        points: grade.points,
        percentage: grade.percentage,
        letterGrade: grade.letterGrade,
        dateEntered: grade.dateEntered,
      })),
      behavior: behavior.map((incident) => ({
        id: incident.id,
        studentId: incident.studentId,
        date: incident.date,
        type: incident.type,
        description: incident.description,
        severity: incident.severity,
        actionTaken: incident.actionTaken,
      })),
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject,
        description: lesson.description,
        date: lesson.date,
        duration: lesson.duration,
        learningObjectives: lesson.learningObjectives || [],
        activities: lesson.activities || [],
        homework: lesson.homework,
        materials: lesson.materials || [],
        notes: lesson.notes,
        gradebookId: lesson.gradebookId,
        teacherId: lesson.teacherId,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      })),
      // Add teacher and school name to the data sources
      teacher,
      schoolName,
    };
  }

  /**
   * Preview daily update for a student
   * @param {string} studentId - Student ID
   * @param {Object} contexts - Object containing all context data
   * @param {Date} date - Optional date for the update (defaults to today)
   * @returns {Promise<Object>} Preview data
   */
  async previewDailyUpdate(studentId, contexts, date = new Date()) {
    const dataSources = this.prepareDataSources(contexts);
    return await this.fetchDailyUpdateData(studentId, dataSources, date);
  }

  /**
   * Preview daily updates for all students
   * @param {Object} contexts - Object containing all context data
   * @param {Date} date - Optional date for the update (defaults to today)
   * @returns {Promise<Object>} Preview data for all students
   */
  async previewAllDailyUpdates(contexts, date = new Date()) {
    const dataSources = this.prepareDataSources(contexts);
    return await this.fetchDailyUpdateData(null, dataSources, date);
  }

  /**
   * Send daily updates with progress tracking
   * @param {Object} contexts - Object containing all context data
   * @param {Date} date - Optional date for the update (defaults to today)
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Results of the email sending operation
   */
  async sendDailyUpdatesWithProgress(
    contexts,
    date = new Date(),
    onProgress = null
  ) {
    const dataSources = this.prepareDataSources(contexts);

    if (onProgress) {
      onProgress({
        status: "preparing",
        message: "Preparing daily updates...",
      });
    }

    try {
      // First, get the preview data to save in the frontend
      const previewResult = await this.fetchDailyUpdateData(null, dataSources, date);
      if (!previewResult.success) {
        throw new Error(previewResult.error || "Failed to prepare daily updates");
      }

      // Send parent emails through callable for parents
      const result = await this.sendDailyUpdatesToAllParents(dataSources, date);

      if (result.success) {
        // Use the saved emails from the backend function
        const savedEmails = result.data.savedEmails || [];

        if (onProgress) {
          onProgress({
            status: "completed",
            message: `Daily updates sent and saved successfully! ${result.data?.emailsSent || 0} emails sent.`,
            data: result.data,
          });
        }
      }

      return result;
    } catch (error) {
      if (onProgress) {
        onProgress({
          status: "error",
          message: `Error sending daily updates: ${error.message}`,
        });
      }
      throw error;
    }
  }

  /**
   * Send daily updates to all students (to studentEmail)
   */
  async sendStudentEmailsToAll(contexts, date = new Date()) {
    const dataSources = this.prepareDataSources(contexts);
    try {
      // Ensure auth token present to populate context.auth in callable
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      await currentUser.getIdToken(true);
      const result = await sendStudentEmails({
        date: date.toISOString(),
        dataSources,
      });
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  // get dailyUpdateEmails history from db
  async getDailyUpdateHistory (){
    const collectionRef  = collection(db, 'dailyUpdateEmails')
    const queryRef = collectionRef;
    const snapshot = await getDocs(queryRef)
     return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

  }

  /**
   * Fetch lessons for a specific date and student subjects
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Array} subjects - Array of subject names
   * @returns {Promise<Array>} Array of lessons
   */
  async fetchLessonsForDate(date, subjects = []) {
    try {
      console.log(`Fetching lessons for date: ${date}`);
      console.log(`Subjects filter:`, subjects);

      const lessonsCol = collection(db, 'lessons');
      
      // First, try to get all lessons for the date to see what's available
      const dateQuery = query(
        lessonsCol,
        where('date', '==', date)
      );
      
      const dateSnapshot = await getDocs(dateQuery);
      const allLessonsForDate = dateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${allLessonsForDate.length} total lessons for date ${date}:`, allLessonsForDate);

      // If no subjects filter, return all lessons for the date
      if (!subjects || subjects.length === 0) {
        console.log('No subjects filter, returning all lessons for date');
        return allLessonsForDate;
      }

      // Filter by subjects
      const filteredLessons = allLessonsForDate.filter(lesson => {
        const lessonSubject = lesson.subject;
        const matches = subjects.includes(lessonSubject);
        console.log(`Lesson "${lesson.title}" has subject "${lessonSubject}", matches: ${matches}`);
        return matches;
      });

      console.log(`Filtered to ${filteredLessons.length} lessons matching subjects:`, filteredLessons);
      return filteredLessons;
    } catch (error) {
      console.error('Error fetching lessons for date:', error);
      return [];
    }
  }

  /**
   * Get lesson summary for a specific date
   * @param {Array} lessons - Array of lessons
   * @returns {Object} Lesson summary object
   */
  getLessonSummary(lessons) {
    if (!lessons || lessons.length === 0) {
      return {
        totalLessons: 0,
        totalDuration: 0,
        subjects: [],
        learningObjectives: 0,
        homeworkAssigned: 0,
        materialsUsed: 0,
        totalActivities: 0
      };
    }

    const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    const subjects = [...new Set(lessons.map(lesson => lesson.subject))];
    const learningObjectives = lessons.reduce((sum, lesson) => 
      sum + (Array.isArray(lesson.learningObjectives) ? lesson.learningObjectives.length : 0), 0
    );
    const homeworkAssigned = lessons.filter(lesson => lesson.homework).length;
    const materialsUsed = lessons.reduce((sum, lesson) => 
      sum + (Array.isArray(lesson.materials) ? lesson.materials.length : 0), 0
    );
    const totalActivities = lessons.reduce((sum, lesson) => 
      sum + (Array.isArray(lesson.activities) ? lesson.activities.length : 0), 0
    );

    return {
      totalLessons: lessons.length,
      totalDuration,
      subjects,
      learningObjectives,
      homeworkAssigned,
      materialsUsed,
      totalActivities
    };
  }

  /**
   * Prepare lesson data for email template
   * @param {Array} lessons - Array of lessons
   * @returns {Object} Formatted lesson data for email
   */
  prepareLessonDataForEmail(lessons) {
    try {
      // Ensure lessons is always an array
      const safeLessons = Array.isArray(lessons) ? lessons : [];
      const lessonSummary = this.getLessonSummary(safeLessons);
      
      return {
        lessons: safeLessons.map(lesson => ({
          id: lesson.id || `lesson-${Date.now()}`,
          subject: lesson.subject || 'Unknown Subject',
          title: lesson.title || 'Untitled Lesson',
          description: lesson.description || '',
          learningObjectives: Array.isArray(lesson.learningObjectives) ? lesson.learningObjectives : [],
          activities: Array.isArray(lesson.activities) ? lesson.activities : [],
          homework: lesson.homework || '',
          materials: Array.isArray(lesson.materials) ? lesson.materials : [],
          notes: lesson.notes || '',
          duration: lesson.duration || 0,
          gradebookId: lesson.gradebookId || ''
        })),
        lessonSummary
      };
    } catch (error) {
      console.error('Error preparing lesson data for email:', error);
      // Return safe fallback data
      return {
        lessons: [],
        lessonSummary: {
          totalLessons: 0,
          totalDuration: 0,
          subjects: [],
          learningObjectives: 0,
          homeworkAssigned: 0,
          materialsUsed: 0,
          totalActivities: 0
        }
      };
    }
  }
}

// Export singleton instance
export const dailyUpdateService = new FrontendDailyUpdateService();
