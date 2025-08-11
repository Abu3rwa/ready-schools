import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// Daily Update API functions (callable v2)
const sendDailyUpdates = httpsCallable(functions, "sendDailyUpdates");
const sendStudentDailyUpdate = httpsCallable(functions, "sendStudentDailyUpdate");
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
      const result = await sendStudentDailyUpdate({
        studentId,
        date: date.toISOString(),
        dataSources,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error sending student daily update:", error);
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
      const result = await getDailyUpdateData({
        studentId,
        date: date.toISOString(),
        dataSources,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Frontend: Error getting daily update data:", error);
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
      teacher,
      schoolName,
    } = contexts;

    return {
      students: students.map((student) => ({
        id: student.id || student.studentId, // fallback to studentId if id missing
        firstName: student.firstName,
        lastName: student.lastName,
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

      // Send emails through cloud function
      const result = await this.sendDailyUpdatesToAllParents(dataSources, date);

      if (result.success) {
        // Save each daily update email to the frontend
        const { dailyUpdates = [] } = previewResult.data;
        const savedEmails = [];

        for (const update of dailyUpdates) {
          try {
            // Save each email to the frontend collection
            const emailData = {
              studentId: update.studentId,
              studentName: update.studentName,
              date: date.toISOString().split('T')[0],
              subject: `Daily Update - ${update.studentName}`,
              content: update.emailContent || '',
              sentStatus: 'Sent',
              type: 'daily_update',
              attendance: update.attendance,
              grades: update.grades,
              behavior: update.behavior,
              assignments: update.assignments,
              metadata: {
                createdAt: new Date().toISOString(),
                sentAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                teacherName: contexts.teacher?.name || 'Teacher',
                schoolName: contexts.schoolName || 'School'
              }
            };

            // Add to saved emails array
            savedEmails.push(emailData);
          } catch (saveError) {
            console.error('Error saving email:', saveError);
          }
        }

        // Update the result to include saved emails
        result.data = {
          ...result.data,
          savedEmails
        };

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
}

// Export singleton instance
export const dailyUpdateService = new FrontendDailyUpdateService();
