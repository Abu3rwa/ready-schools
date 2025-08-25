import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { db, auth } from "../firebase";

/**
 * Get student daily update emails from the database
 * @param {Object} options - Query options
 * @param {string} options.studentId - Filter by specific student ID
 * @param {Date} options.startDate - Filter emails from this date
 * @param {Date} options.endDate - Filter emails to this date
 * @param {number} options.limit - Number of emails to return (default: 50)
 * @param {string} options.sentStatus - Filter by sent status ('sent', 'failed', 'draft')
 * @returns {Promise<Array>} Array of email records
 */
export const getStudentDailyUpdateEmails = async (options = {}) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const {
      studentId,
      startDate,
      endDate,
      limit: limitCount = 50,
      sentStatus = 'sent'
    } = options;

    // Build query - Student emails in separate collection
    let q = query(
      collection(db, 'studentDailyEmails'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    // Add optional filters
    if (studentId) {
      q = query(q, where('studentId', '==', studentId));
    }

    if (sentStatus) {
      q = query(q, where('sentStatus', '==', sentStatus));
    }

    if (startDate) {
      q = query(q, where('date', '>=', startDate.toISOString()));
    }

    if (endDate) {
      q = query(q, where('date', '<=', endDate.toISOString()));
    }

    const querySnapshot = await getDocs(q);
    const emails = [];

    querySnapshot.forEach((doc) => {
      emails.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return emails;
  } catch (error) {
    console.error('Error fetching student daily update emails:', error);
    throw error;
  }
};

/**
 * Get email statistics for a teacher
 * @param {Object} options - Query options
 * @param {Date} options.startDate - Start date for statistics
 * @param {Date} options.endDate - End date for statistics
 * @returns {Promise<Object>} Statistics object
 */
export const getStudentEmailStats = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    const emails = await getStudentDailyUpdateEmails({
      startDate,
      endDate,
      limit: 1000 // Get more emails for accurate stats
    });

    const stats = {
      totalEmails: emails.length,
      uniqueStudents: new Set(emails.map(e => e.studentId)).size,
      emailsByDate: {},
      emailsByStudent: {},
      successRate: 0
    };

    let successfulEmails = 0;

    emails.forEach(email => {
      // Count by date
      const date = new Date(email.date).toDateString();
      stats.emailsByDate[date] = (stats.emailsByDate[date] || 0) + 1;

      // Count by student
      stats.emailsByStudent[email.studentId] = (stats.emailsByStudent[email.studentId] || 0) + 1;

      // Count successful emails
      if (email.sentStatus === 'sent') {
        successfulEmails++;
      }
    });

    stats.successRate = emails.length > 0 ? (successfulEmails / emails.length) * 100 : 0;

    return stats;
  } catch (error) {
    console.error('Error getting student email stats:', error);
    throw error;
  }
};

/**
 * Get recent student emails for a specific student
 * @param {string} studentId - Student ID
 * @param {number} limit - Number of emails to return (default: 10)
 * @returns {Promise<Array>} Array of recent emails
 */
export const getRecentStudentEmails = async (studentId, limit = 10) => {
  try {
    return await getStudentDailyUpdateEmails({
      studentId,
      limit
    });
  } catch (error) {
    console.error('Error fetching recent student emails:', error);
    throw error;
  }
};

/**
 * Get email delivery status for a specific email
 * @param {string} emailId - Email document ID
 * @returns {Promise<Object>} Email status object
 */
export const getEmailDeliveryStatus = async (emailId) => {
  try {
    const emailDoc = await getDocs(query(
      collection(db, 'dailyUpdateEmails'),
      where('__name__', '==', emailId)
    ));

    if (emailDoc.empty) {
      throw new Error('Email not found');
    }

    const emailData = emailDoc.docs[0].data();
    return {
      id: emailDoc.docs[0].id,
      ...emailData,
      deliveryStatus: emailData.sentStatus,
      messageId: emailData.messageId,
      sentAt: emailData.metadata?.sentAt
    };
  } catch (error) {
    console.error('Error getting email delivery status:', error);
    throw error;
  }
};
