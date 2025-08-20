import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import dayjs from 'dayjs';
import { generateWeeklyReport, generateBatchWeeklyReports } from './weeklyUpdateService.js';
import { generateMonthlyReport, generateBatchMonthlyReports } from './monthlyUpdateService.js';
import { sendWeeklyUpdate, sendMonthlyUpdate } from './enhancedEmailService.js';
import { getEmailPreferences, getStudentEmailPreferences, shouldReceiveEmail } from './emailPreferencesService.js';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

/**
 * Schedule weekly emails for all active students
 * @returns {Object} Scheduling result
 */
export const scheduleWeeklyEmails = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log('Starting weekly email scheduling...');

    // Get current week dates
    const now = dayjs();
    const weekStart = now.startOf('week').format('YYYY-MM-DD');
    const weekEnd = now.endOf('week').format('YYYY-MM-DD');

    console.log(`Week range: ${weekStart} to ${weekEnd}`);

    // Get all students for the current user
    const students = await getActiveStudents(userId);
    
    if (students.length === 0) {
      console.log('No active students found for weekly emails');
      return { success: true, message: 'No active students found', processed: 0 };
    }

    console.log(`Found ${students.length} active students`);

    // Filter students based on email preferences
    const eligibleStudents = [];
    for (const student of students) {
      const preferences = await getStudentEmailPreferences(student.id);
      if (shouldReceiveEmail('weekly', preferences)) {
        eligibleStudents.push(student);
      }
    }

    console.log(`${eligibleStudents.length} students eligible for weekly emails`);

    // Process emails in batches
    const batchResults = await processBatchWeeklyEmails(eligibleStudents, weekStart, weekEnd);

    console.log('Weekly email scheduling completed:', batchResults);
    return {
      success: true,
      message: 'Weekly emails scheduled successfully',
      processed: batchResults.length,
      results: batchResults
    };

  } catch (error) {
    console.error('Error scheduling weekly emails:', error);
    throw new Error('Failed to schedule weekly emails.');
  }
};

/**
 * Schedule monthly emails for all active students
 * @returns {Object} Scheduling result
 */
export const scheduleMonthlyEmails = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log('Starting monthly email scheduling...');

    // Get current month
    const now = dayjs();
    const month = now.month() + 1; // dayjs months are 0-indexed
    const year = now.year();

    console.log(`Month/Year: ${month}/${year}`);

    // Get all students for the current user
    const students = await getActiveStudents(userId);
    
    if (students.length === 0) {
      console.log('No active students found for monthly emails');
      return { success: true, message: 'No active students found', processed: 0 };
    }

    console.log(`Found ${students.length} active students`);

    // Filter students based on email preferences
    const eligibleStudents = [];
    for (const student of students) {
      const preferences = await getStudentEmailPreferences(student.id);
      if (shouldReceiveEmail('monthly', preferences)) {
        eligibleStudents.push(student);
      }
    }

    console.log(`${eligibleStudents.length} students eligible for monthly emails`);

    // Process emails in batches
    const batchResults = await processBatchMonthlyEmails(eligibleStudents, month, year);

    console.log('Monthly email scheduling completed:', batchResults);
    return {
      success: true,
      message: 'Monthly emails scheduled successfully',
      processed: batchResults.length,
      results: batchResults
    };

  } catch (error) {
    console.error('Error scheduling monthly emails:', error);
    throw new Error('Failed to schedule monthly emails.');
  }
};

/**
 * Process weekly emails in batches
 * @param {Array} students - Array of student objects
 * @param {string} startDate - Week start date
 * @param {string} endDate - Week end date
 * @returns {Array} Batch processing results
 */
const processBatchWeeklyEmails = async (students, startDate, endDate) => {
  const batchSize = 10; // Process 10 students at a time
  const results = [];
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} students`);
    
    const batchPromises = batch.map(async (student) => {
      try {
        const preferences = await getStudentEmailPreferences(student.id);
        const result = await sendWeeklyUpdate(student.id, startDate, endDate, preferences);
        
        return {
          studentId: student.id,
          studentName: student.name,
          success: true,
          result
        };
      } catch (error) {
        console.error(`Error processing weekly email for student ${student.id}:`, error);
        return {
          studentId: student.id,
          studentName: student.name,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for batch to complete with rate limiting
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting: wait 2 seconds between batches to respect Gmail API limits
    if (i + batchSize < students.length) {
      console.log('Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
};

/**
 * Process monthly emails in batches
 * @param {Array} students - Array of student objects
 * @param {number} month - Month number
 * @param {number} year - Year
 * @returns {Array} Batch processing results
 */
const processBatchMonthlyEmails = async (students, month, year) => {
  const batchSize = 10; // Process 10 students at a time
  const results = [];
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} students`);
    
    const batchPromises = batch.map(async (student) => {
      try {
        const preferences = await getStudentEmailPreferences(student.id);
        const result = await sendMonthlyUpdate(student.id, month, year, preferences);
        
        return {
          studentId: student.id,
          studentName: student.name,
          success: true,
          result
        };
      } catch (error) {
        console.error(`Error processing monthly email for student ${student.id}:`, error);
        return {
          studentId: student.id,
          studentName: student.name,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for batch to complete with rate limiting
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting: wait 2 seconds between batches to respect Gmail API limits
    if (i + batchSize < students.length) {
      console.log('Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
};

/**
 * Get active students for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of active students
 */
const getActiveStudents = async (userId) => {
  try {
    // This would integrate with the existing students collection
    // For now, returning placeholder data structure
    const studentsCol = collection(db, 'students');
    const q = query(
      studentsCol, 
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Unknown Student',
      status: doc.data().status || 'active'
    }));

  } catch (error) {
    console.error('Error fetching active students:', error);
    return [];
  }
};

/**
 * Check if it's time to send weekly emails
 * @returns {boolean} Whether weekly emails should be sent
 */
export const shouldSendWeeklyEmails = () => {
  const now = dayjs();
  const dayOfWeek = now.day(); // 0 = Sunday, 6 = Saturday
  const hour = now.hour();
  
  // Send weekly emails on Sunday evening (6 PM - 8 PM)
  return dayOfWeek === 0 && hour >= 18 && hour <= 20;
};

/**
 * Check if it's time to send monthly emails
 * @returns {boolean} Whether monthly emails should be sent
 */
export const shouldSendMonthlyEmails = () => {
  const now = dayjs();
  const dayOfMonth = now.date();
  const hour = now.hour();
  
  // Send monthly emails on the last day of month (6 PM - 8 PM)
  const lastDayOfMonth = now.endOf('month').date();
  return dayOfMonth === lastDayOfMonth && hour >= 18 && hour <= 20;
};

/**
 * Get next scheduled email times
 * @returns {Object} Next scheduled times
 */
export const getNextScheduledTimes = () => {
  const now = dayjs();
  
  // Next weekly email (next Sunday at 6 PM)
  const nextWeekly = now.day(0).hour(18).minute(0).second(0);
  if (nextWeekly.isBefore(now)) {
    nextWeekly.add(1, 'week');
  }
  
  // Next monthly email (last day of current month at 6 PM)
  const nextMonthly = now.endOf('month').hour(18).minute(0).second(0);
  if (nextMonthly.isBefore(now)) {
    nextMonthly.add(1, 'month').endOf('month').hour(18).minute(0).second(0);
  }
  
  return {
    nextWeekly: nextWeekly.format('YYYY-MM-DD HH:mm:ss'),
    nextMonthly: nextMonthly.format('YYYY-MM-DD HH:mm:ss'),
    currentTime: now.format('YYYY-MM-DD HH:mm:ss')
  };
};

/**
 * Manual trigger for weekly emails (for testing or immediate sending)
 * @param {Array} studentIds - Optional array of specific student IDs
 * @returns {Object} Manual trigger result
 */
export const manualTriggerWeeklyEmails = async (studentIds = null) => {
  try {
    console.log('Manual trigger for weekly emails initiated');
    
    if (studentIds) {
      // Send to specific students
      const students = await getStudentsByIds(studentIds);
      const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
      const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD');
      
      return await processBatchWeeklyEmails(students, weekStart, weekEnd);
    } else {
      // Send to all eligible students
      return await scheduleWeeklyEmails();
    }
  } catch (error) {
    console.error('Error in manual weekly email trigger:', error);
    throw error;
  }
};

/**
 * Manual trigger for monthly emails (for testing or immediate sending)
 * @param {Array} studentIds - Optional array of specific student IDs
 * @returns {Object} Manual trigger result
 */
export const manualTriggerMonthlyEmails = async (studentIds = null) => {
  try {
    console.log('Manual trigger for monthly emails initiated');
    
    if (studentIds) {
      // Send to specific students
      const students = await getStudentsByIds(studentIds);
      const month = dayjs().month() + 1;
      const year = dayjs().year();
      
      return await processBatchMonthlyEmails(students, month, year);
    } else {
      // Send to all eligible students
      return await scheduleMonthlyEmails();
    }
  } catch (error) {
    console.error('Error in manual monthly email trigger:', error);
    throw error;
  }
};

/**
 * Get students by IDs
 * @param {Array} studentIds - Array of student IDs
 * @returns {Array} Array of student objects
 */
const getStudentsByIds = async (studentIds) => {
  try {
    const students = [];
    
    for (const studentId of studentIds) {
      try {
        const studentDoc = await getDocs(query(
          collection(db, 'students'),
          where('id', '==', studentId)
        ));
        
        if (!studentDoc.empty) {
          const studentData = studentDoc.docs[0].data();
          students.push({
            id: studentId,
            name: studentData.name || 'Unknown Student',
            status: studentData.status || 'active'
          });
        }
      } catch (error) {
        console.error(`Error fetching student ${studentId}:`, error);
      }
    }
    
    return students;
  } catch (error) {
    console.error('Error fetching students by IDs:', error);
    return [];
  }
}; 