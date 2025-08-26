import { httpsCallable } from "firebase/functions";
import { functions, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { getContentLibrary } from "./contentLibraryService.js";

// Daily Update API functions (callable v2)
const sendDailyUpdates = httpsCallable(functions, "sendDailyUpdates");
// Parent-targeted student-specific sender (legacy, HTTP onRequest). Keep for backward compatibility where used.
const sendStudentDailyUpdate = httpsCallable(functions, "sendStudentDailyUpdate");
// New student-targeted callables (match backend exported names)
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
   * @returns {Promise<Object>} Formatted data sources with email content library
   */
  async prepareDataSources(contexts) {
    const {
      students = [],
      attendance = [],
      assignments = [],
      grades = [],
      behavior = [],
      lessons = [],
      teacher,
      schoolName,
      // Pass through unified email preferences from UI
      emailPreferences,
    } = contexts;

    // Load email content library for the current teacher
    let emailContentLibrary = {};
    try {
      const currentUser = auth.currentUser;
      if (currentUser?.uid) {
        emailContentLibrary = await getContentLibrary(currentUser.uid);
        console.log("Frontend: Loaded email content library for teacher:", currentUser.uid);
      } else {
        console.warn("Frontend: No authenticated user found, using empty email content library");
      }
    } catch (error) {
      console.error("Frontend: Error loading email content library:", error);
      emailContentLibrary = {}; // Fallback to empty object
    }

    // Enhanced content shuffling system to prevent repetition
    const computeOverrides = () => {
      const overridesByStudent = {};
      try {
        const currentUser = auth.currentUser;
        const teacherId = currentUser?.uid || 'teacher';
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const quotes = Array.isArray(emailContentLibrary?.motivationalQuotes) ? emailContentLibrary.motivationalQuotes : [];
        const challenges = Array.isArray(emailContentLibrary?.dailyChallenges) ? emailContentLibrary.dailyChallenges : [];
        const greetings = Array.isArray(emailContentLibrary?.greetings) ? emailContentLibrary.greetings : [];
        const gradeSectionHeaders = Array.isArray(emailContentLibrary?.gradeSectionHeaders) ? emailContentLibrary.gradeSectionHeaders : [];
        const assignmentSectionHeaders = Array.isArray(emailContentLibrary?.assignmentSectionHeaders) ? emailContentLibrary.assignmentSectionHeaders : [];
        const behaviorSectionHeaders = Array.isArray(emailContentLibrary?.behaviorSectionHeaders) ? emailContentLibrary.behaviorSectionHeaders : [];
        const lessonSectionHeaders = Array.isArray(emailContentLibrary?.lessonSectionHeaders) ? emailContentLibrary.lessonSectionHeaders : [];

        // Enhanced shuffling function that maintains proper rotation
        const getShuffledContent = (contentArray, contentType, studentId) => {
          if (!contentArray || contentArray.length === 0) return null;
          
          try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') return null;
            
            const shuffleKey = `${teacherId}:${contentType}:${monthKey}:shuffled`;
            const positionKey = `${teacherId}:${studentId}:${contentType}:${monthKey}:position`;
            
            // Get or create shuffled array for this month
            let shuffledArray;
            const storedShuffle = localStorage.getItem(shuffleKey);
            if (storedShuffle) {
              shuffledArray = JSON.parse(storedShuffle);
            } else {
              // Create new shuffled array for this month
              shuffledArray = [...contentArray];
              // Fisher-Yates shuffle with seeded randomness for consistency
              const seed = teacherId.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0) + parseInt(monthKey.replace('-', ''), 10);
              
              let currentIndex = shuffledArray.length;
              let randomValue = seed;
              
              while (currentIndex !== 0) {
                // Simple LCG for seeded randomness
                randomValue = (randomValue * 1664525 + 1013904223) % Math.pow(2, 32);
                const randomIndex = Math.floor((randomValue / Math.pow(2, 32)) * currentIndex);
                currentIndex--;
                [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[currentIndex]];
              }
              
              localStorage.setItem(shuffleKey, JSON.stringify(shuffledArray));
              console.log(`Created new shuffled ${contentType} array for month ${monthKey}:`, shuffledArray);
            }
            
            // Get student's current position and increment
            const storedPosition = localStorage.getItem(positionKey);
            const currentPosition = storedPosition ? parseInt(storedPosition, 10) : 0;
            const nextPosition = (currentPosition + 1) % shuffledArray.length;
            
            // If we've completed a full cycle, reshuffle for variety
            if (nextPosition === 0 && currentPosition > 0) {
              // Recalculate seed for reshuffle
              const reshuffleSeed = teacherId.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0) + parseInt(monthKey.replace('-', ''), 10);
              
              // Create a new shuffle
              const newShuffledArray = [...contentArray];
              let currentIndex = newShuffledArray.length;
              let randomValue = reshuffleSeed + currentPosition; // Add some variance
              
              while (currentIndex !== 0) {
                randomValue = (randomValue * 1664525 + 1013904223) % Math.pow(2, 32);
                const randomIndex = Math.floor((randomValue / Math.pow(2, 32)) * currentIndex);
                currentIndex--;
                [newShuffledArray[currentIndex], newShuffledArray[randomIndex]] = [newShuffledArray[randomIndex], newShuffledArray[currentIndex]];
              }
              
              localStorage.setItem(shuffleKey, JSON.stringify(newShuffledArray));
              shuffledArray = newShuffledArray;
              console.log(`Reshuffled ${contentType} array after full cycle for student ${studentId}:`, newShuffledArray);
            }
            
            localStorage.setItem(positionKey, String(nextPosition));
            
            const selectedContent = shuffledArray[currentPosition];
            console.log(`Student ${studentId} gets ${contentType} ${currentPosition}/${shuffledArray.length}: "${selectedContent}"`);
            
            return selectedContent;
          } catch (error) {
            console.warn(`Error in shuffled content selection for ${contentType}:`, error);
            return null;
          }
        };

        (students || []).forEach((s) => {
          // Ensure student object is valid
          if (!s || typeof s !== 'object') return;
          
          const studentId = s.id || s.studentId;
          if (!studentId) return; // Skip students without valid IDs
          
          const studentOverride = {};
          
          // Get shuffled quote
          if (quotes.length > 0) {
            const selectedQuote = getShuffledContent(quotes, 'quotes', studentId);
            if (selectedQuote) {
              studentOverride.quote = selectedQuote;
            }
          }
          
          // Get shuffled challenge
          if (challenges.length > 0) {
            const selectedChallenge = getShuffledContent(challenges, 'challenges', studentId);
            if (selectedChallenge) {
              studentOverride.challenge = selectedChallenge;
            }
          }
          
          // Get shuffled greeting
          if (greetings.length > 0) {
            const selectedGreeting = getShuffledContent(greetings, 'greetings', studentId);
            if (selectedGreeting) {
              studentOverride.greeting = selectedGreeting;
            }
          }
          
          // Get shuffled grade section headers
          if (gradeSectionHeaders.length > 0) {
            const selectedGradeSectionHeader = getShuffledContent(gradeSectionHeaders, 'gradeSectionHeaders', studentId);
            if (selectedGradeSectionHeader) {
              studentOverride.gradeSectionHeader = selectedGradeSectionHeader;
            }
          }
          
          // Get shuffled assignment section headers
          if (assignmentSectionHeaders.length > 0) {
            const selectedAssignmentSectionHeader = getShuffledContent(assignmentSectionHeaders, 'assignmentSectionHeaders', studentId);
            if (selectedAssignmentSectionHeader) {
              studentOverride.assignmentSectionHeader = selectedAssignmentSectionHeader;
            }
          }
          
          // Get shuffled behavior section headers
          if (behaviorSectionHeaders.length > 0) {
            const selectedBehaviorSectionHeader = getShuffledContent(behaviorSectionHeaders, 'behaviorSectionHeaders', studentId);
            if (selectedBehaviorSectionHeader) {
              studentOverride.behaviorSectionHeader = selectedBehaviorSectionHeader;
            }
          }
          
          // Get shuffled lesson section headers
          if (lessonSectionHeaders.length > 0) {
            const selectedLessonSectionHeader = getShuffledContent(lessonSectionHeaders, 'lessonSectionHeaders', studentId);
            if (selectedLessonSectionHeader) {
              studentOverride.lessonSectionHeader = selectedLessonSectionHeader;
            }
          }
          
          if (Object.keys(studentOverride).length > 0) {
            overridesByStudent[studentId] = studentOverride;
          }
        });
      } catch (e) {
        console.warn('Frontend: Failed to compute overrides', e);
      }
      return overridesByStudent;
    };
    const overrides = computeOverrides();

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
      // Add email content library for backend to use
      emailContentLibrary,
      // Provide per-student overrides for quote/challenge
      overrides,
      // Forward unified email preferences so backend respects student.enabled and section toggles
      emailPreferences,
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
    const dataSources = await this.prepareDataSources(contexts);
    return await this.fetchDailyUpdateData(studentId, dataSources, date);
  }

  /**
   * Preview daily updates for all students
   * @param {Object} contexts - Object containing all context data
   * @param {Date} date - Optional date for the update (defaults to today)
   * @returns {Promise<Object>} Preview data for all students
   */
  async previewAllDailyUpdates(contexts, date = new Date()) {
    const dataSources = await this.prepareDataSources(contexts);
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
    const dataSources = await this.prepareDataSources(contexts);

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
    const dataSources = await this.prepareDataSources(contexts);
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

  /**
   * Reset content shuffling state for all students (useful for testing)
   * @param {Array} students - Array of students
   * @returns {Object} Reset result
   */
  resetContentShuffling(students = []) {
    try {
      if (typeof localStorage === 'undefined') {
        return { success: false, message: 'localStorage not available' };
      }

      const currentUser = auth.currentUser;
      const teacherId = currentUser?.uid || 'teacher';
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      let resetCount = 0;
      const contentTypes = ['quotes', 'challenges', 'greetings'];
      
      // Reset shuffled arrays
      contentTypes.forEach(contentType => {
        const shuffleKey = `${teacherId}:${contentType}:${monthKey}:shuffled`;
        if (localStorage.getItem(shuffleKey)) {
          localStorage.removeItem(shuffleKey);
          resetCount++;
        }
      });
      
      // Reset student positions
      students.forEach(student => {
        const studentId = student.id || student.studentId;
        if (studentId) {
          contentTypes.forEach(contentType => {
            const positionKey = `${teacherId}:${studentId}:${contentType}:${monthKey}:position`;
            if (localStorage.getItem(positionKey)) {
              localStorage.removeItem(positionKey);
              resetCount++;
            }
          });
        }
      });
      
      console.log(`Reset ${resetCount} shuffling state entries for ${students.length} students`);
      
      return {
        success: true,
        message: `Reset shuffling state for ${students.length} students (${resetCount} entries cleared)`,
        resetCount,
        studentCount: students.length
      };
    } catch (error) {
      console.error('Error resetting content shuffling:', error);
      return {
        success: false,
        message: 'Error resetting shuffling state: ' + error.message
      };
    }
  }
}

// Export singleton instance
export const dailyUpdateService = new FrontendDailyUpdateService();
