import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { generateWeeklyReport } from './weeklyUpdateService.js';
import { generateMonthlyReport } from './monthlyUpdateService.js';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

/**
 * Send weekly update email to parent
 * @param {string} studentId - The student's ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {Object} parentPreferences - Parent's email preferences
 * @returns {Object} Email delivery result
 */
export const sendWeeklyUpdate = async (studentId, startDate, endDate, parentPreferences = {}) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log(`Sending weekly update for student ${studentId} from ${startDate} to ${endDate}`);

    // Generate weekly report data
    const weeklyReport = await generateWeeklyReport(studentId, startDate, endDate);
    
    // Filter content based on parent preferences
    const filteredContent = filterContentByPreferences(weeklyReport.reportData, parentPreferences);
    
    // Generate email content
    const emailContent = generateWeeklyEmailContent(filteredContent, startDate, endDate);
    
    // Save to weekly reports collection
    const weeklyReportRef = await saveWeeklyReport(weeklyReport);
    
    // Send email via Gmail API (placeholder for now)
    const emailResult = await sendEmailViaGmail(studentId, emailContent, 'weekly');
    
    // Update report with delivery status
    await updateWeeklyReportStatus(weeklyReportRef.id, 'sent', emailResult);

    return {
      success: true,
      reportId: weeklyReportRef.id,
      emailResult,
      message: 'Weekly update sent successfully'
    };

  } catch (error) {
    console.error('Error sending weekly update:', error);
    throw new Error('Failed to send weekly update.');
  }
};

/**
 * Send monthly update email to parent
 * @param {string} studentId - The student's ID
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 * @param {Object} parentPreferences - Parent's email preferences
 * @returns {Object} Email delivery result
 */
export const sendMonthlyUpdate = async (studentId, month, year, parentPreferences = {}) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log(`Sending monthly update for student ${studentId} for ${month}/${year}`);

    // Generate monthly report data
    const monthlyReport = await generateMonthlyReport(studentId, month, year);
    
    // Filter content based on parent preferences
    const filteredContent = filterContentByPreferences(monthlyReport.reportData, parentPreferences);
    
    // Generate email content
    const emailContent = generateMonthlyEmailContent(filteredContent, month, year);
    
    // Save to monthly reports collection
    const monthlyReportRef = await saveMonthlyReport(monthlyReport);
    
    // Send email via Gmail API (placeholder for now)
    const emailResult = await sendEmailViaGmail(studentId, emailContent, 'monthly');
    
    // Update report with delivery status
    await updateMonthlyReportStatus(monthlyReportRef.id, 'sent', emailResult);

    return {
      success: true,
      reportId: monthlyReportRef.id,
      emailResult,
      message: 'Monthly update sent successfully'
    };

  } catch (error) {
    console.error('Error sending monthly update:', error);
    throw new Error('Failed to send monthly update.');
  }
};

/**
 * Filter content based on parent preferences
 * @param {Object} content - Original content
 * @param {Object} preferences - Parent preferences
 * @returns {Object} Filtered content
 */
const filterContentByPreferences = (content, preferences) => {
  const filtered = { ...content };

  // Apply frequency rules
  if (preferences.frequency === 'summary') {
    filtered.lessons = filtered.lessons.slice(0, 3); // Only top 3 lessons
    filtered.behavior = filtered.behavior.slice(0, 2); // Only top 2 behavior items
  }

  // Apply subject filtering
  if (preferences.subjects && preferences.subjects.length > 0) {
    filtered.lessons = filtered.lessons.filter(lesson => 
      preferences.subjects.includes(lesson.subject)
    );
  }

  // Apply content focus
  if (preferences.contentFocus === 'academic') {
    filtered.behavior = []; // Remove behavior content
  } else if (preferences.contentFocus === 'behavior') {
    filtered.lessons = []; // Remove lesson content
  }

  return filtered;
};

/**
 * Generate weekly email content
 * @param {Object} content - Filtered content
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Email content
 */
const generateWeeklyEmailContent = (content, startDate, endDate) => {
  const startDateFormatted = new Date(startDate).toLocaleDateString();
  const endDateFormatted = new Date(endDate).toLocaleDateString();

  return {
    subject: `Weekly Progress Report - ${startDateFormatted} to ${endDateFormatted}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Weekly Progress Report</h2>
        <p style="color: #7f8c8d;">${startDateFormatted} - ${endDateFormatted}</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50;">Weekly Overview</h3>
          <p><strong>Days Present:</strong> ${content.attendance?.present || 0}</p>
          <p><strong>Lessons Covered:</strong> ${content.lessons?.length || 0}</p>
          <p><strong>Homework Completed:</strong> ${content.statistics?.academic?.totalHomework || 0}</p>
        </div>
        
        ${content.lessons && content.lessons.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #2c3e50;">This Week's Lessons</h3>
          ${content.lessons.map(lesson => `
            <div style="border-left: 3px solid #3498db; padding-left: 15px; margin: 10px 0;">
              <p><strong>${lesson.subject}:</strong> ${lesson.title}</p>
              <p style="color: #7f8c8d;">${lesson.objectives || 'No objectives specified'}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${content.behavior && content.behavior.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #2c3e50;">Behavior & Engagement</h3>
          ${content.behavior.map(behavior => `
            <p style="color: #27ae60;">✓ ${behavior.description || behavior}</p>
          `).join('')}
        </div>
        ` : ''}
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #856404;">Upcoming Week</h3>
          <p>Important dates and assignments will be included here.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          This is an automated weekly progress report. 
          Please contact your child's teacher for specific questions.
        </p>
      </div>
    `,
    text: `Weekly Progress Report for ${startDateFormatted} to ${endDateFormatted}`
  };
};

/**
 * Generate monthly email content
 * @param {Object} content - Filtered content
 * @param {number} month - Month number
 * @param {number} year - Year
 * @returns {Object} Email content
 */
const generateMonthlyEmailContent = (content, month, year) => {
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });

  return {
    subject: `Monthly Progress Report - ${monthName} ${year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Monthly Progress Report</h2>
        <p style="color: #7f8c8d;">${monthName} ${year}</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50;">Monthly Overview</h3>
          <p><strong>Attendance Rate:</strong> ${content.overview?.attendanceRate || 0}%</p>
          <p><strong>Average Grade:</strong> ${content.overview?.avgGrade || 'N/A'}</p>
          <p><strong>Behavior Score:</strong> ${content.overview?.behaviorScore || 0}/100</p>
        </div>
        
        ${content.achievements && content.achievements.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #2c3e50;">Achievement Highlights</h3>
          ${content.achievements.map(achievement => `
            <div style="background-color: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <p style="color: #155724; margin: 0;">🏆 ${achievement.description}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${content.recommendations && content.recommendations.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #2c3e50;">Growth Opportunities</h3>
          ${content.recommendations.map(rec => `
            <div style="border-left: 3px solid #e74c3c; padding-left: 15px; margin: 10px 0;">
              <p><strong>${rec.area}:</strong> ${rec.action}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          This is an automated monthly progress report. 
          Please contact your child's teacher for specific questions.
        </p>
      </div>
    `,
    text: `Monthly Progress Report for ${monthName} ${year}`
  };
};

/**
 * Save weekly report to database
 */
const saveWeeklyReport = async (weeklyReport) => {
  try {
    const weeklyReportsCol = collection(db, 'weeklyReports');
    return await addDoc(weeklyReportsCol, weeklyReport);
  } catch (error) {
    console.error('Error saving weekly report:', error);
    throw error;
  }
};

/**
 * Save monthly report to database
 */
const saveMonthlyReport = async (monthlyReport) => {
  try {
    const monthlyReportsCol = collection(db, 'monthlyReports');
    return await addDoc(monthlyReportsCol, monthlyReport);
  } catch (error) {
    console.error('Error saving monthly report:', error);
    throw error;
  }
};

/**
 * Update weekly report status
 */
const updateWeeklyReportStatus = async (reportId, status, emailResult) => {
  try {
    const reportRef = doc(db, 'weeklyReports', reportId);
    await updateDoc(reportRef, {
      status,
      sentAt: new Date().toISOString(),
      emailResult
    });
  } catch (error) {
    console.error('Error updating weekly report status:', error);
  }
};

/**
 * Update monthly report status
 */
const updateMonthlyReportStatus = async (reportId, status, emailResult) => {
  try {
    const reportRef = doc(db, 'monthlyReports', reportId);
    await updateDoc(reportRef, {
      status,
      sentAt: new Date().toISOString(),
      emailResult
    });
  } catch (error) {
    console.error('Error updating monthly report status:', error);
  }
};

/**
 * Send email via Gmail API (placeholder implementation)
 */
const sendEmailViaGmail = async (studentId, emailContent, type) => {
  try {
    // This would integrate with the existing Gmail API service
    // For now, returning placeholder result
    console.log(`Sending ${type} email to student ${studentId}:`, emailContent.subject);
    
    return {
      success: true,
      messageId: `placeholder-${type}-${Date.now()}`,
      sentAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    throw error;
  }
};

/**
 * Get email delivery history
 */
export const getEmailDeliveryHistory = async (studentId, type = 'all', limit = 50) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    let collectionName = 'weeklyReports';
    if (type === 'monthly') {
      collectionName = 'monthlyReports';
    }

    const reportsCol = collection(db, collectionName);
    let q = query(reportsCol, where('userId', '==', userId), where('studentId', '==', studentId));
    
    if (type === 'all') {
      // Query both collections
      const weeklyQuery = query(collection(db, 'weeklyReports'), where('userId', '==', userId), where('studentId', '==', studentId));
      const monthlyQuery = query(collection(db, 'monthlyReports'), where('userId', '==', userId), where('studentId', '==', studentId));
      
      const [weeklySnapshot, monthlySnapshot] = await Promise.all([
        getDocs(weeklyQuery),
        getDocs(monthlyQuery)
      ]);

      const weeklyReports = weeklySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'weekly' }));
      const monthlyReports = monthlySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'monthly' }));
      
      const allReports = [...weeklyReports, ...monthlyReports];
      return allReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)).slice(0, limit);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type }));

  } catch (error) {
    console.error('Error fetching email delivery history:', error);
    return [];
  }
}; 