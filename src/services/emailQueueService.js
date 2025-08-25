/**
 * Enhanced Email Queue Service
 * Replaces backend advanced email functions with frontend implementation
 */

const STORAGE_KEY = 'emailQueue';
const PREVIEW_STORAGE_KEY = 'emailPreviews';
const BATCH_STORAGE_KEY = 'batchEmails';

/**
 * Queue an email for sending
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Queue result
 */
export const queueEmail = async (emailData) => {
  try {
    const queue = getEmailQueue();
    
    const emailItem = {
      id: Date.now().toString(),
      ...emailData,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };
    
    queue.push(emailItem);
    saveEmailQueue(queue);
    
    return {
      success: true,
      message: 'Email queued successfully',
      emailId: emailItem.id
    };
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
};

/**
 * Get all queued emails
 * @returns {Array} Email queue
 */
export const getEmailQueue = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting email queue:', error);
    return [];
  }
};

/**
 * Save email queue to localStorage
 * @param {Array} queue - Email queue
 */
const saveEmailQueue = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving email queue:', error);
  }
};

/**
 * Process email queue
 * @returns {Promise<Object>} Processing result
 */
export const processEmailQueue = async () => {
  try {
    const queue = getEmailQueue();
    const pendingEmails = queue.filter(email => email.status === 'queued');
    
    if (pendingEmails.length === 0) {
      return {
        success: true,
        message: 'No emails to process',
        processed: 0
      };
    }
    
    let processed = 0;
    let failed = 0;
    
    for (const email of pendingEmails) {
      try {
        // Simulate email sending (replace with actual email service call)
        await sendSingleEmail(email);
        
        // Update status
        email.status = 'sent';
        email.sentAt = new Date().toISOString();
        processed++;
      } catch (error) {
        email.attempts++;
        email.lastError = error.message;
        
        if (email.attempts >= email.maxAttempts) {
          email.status = 'failed';
          email.failedAt = new Date().toISOString();
        }
        failed++;
      }
    }
    
    // Save updated queue
    saveEmailQueue(queue);
    
    return {
      success: true,
      message: `Queue processed: ${processed} sent, ${failed} failed`,
      processed,
      failed
    };
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw error;
  }
};

/**
 * Send a single email
 * @param {Object} email - Email data
 * @returns {Promise<Object>} Send result
 */
const sendSingleEmail = async (email) => {
  try {
    // This would integrate with your existing email service
    // For now, we'll simulate the process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/failure
    if (Math.random() > 0.1) { // 90% success rate
      return { success: true };
    } else {
      throw new Error('Simulated email failure');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Clear email queue
 * @param {string} status - Status to clear (optional)
 * @returns {Promise<Object>} Clear result
 */
export const clearEmailQueue = async (status = null) => {
  try {
    const queue = getEmailQueue();
    
    if (status) {
      const filteredQueue = queue.filter(email => email.status !== status);
      saveEmailQueue(filteredQueue);
    } else {
      saveEmailQueue([]);
    }
    
    return {
      success: true,
      message: 'Email queue cleared successfully'
    };
  } catch (error) {
    console.error('Error clearing email queue:', error);
    throw error;
  }
};

/**
 * Get email queue statistics
 * @returns {Object} Queue statistics
 */
export const getQueueStats = () => {
  try {
    const queue = getEmailQueue();
    
    const stats = {
      total: queue.length,
      queued: queue.filter(email => email.status === 'queued').length,
      sent: queue.filter(email => email.status === 'sent').length,
      failed: queue.filter(email => email.status === 'failed').length,
      processing: queue.filter(email => email.status === 'processing').length
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      total: 0,
      queued: 0,
      sent: 0,
      failed: 0,
      processing: 0
    };
  }
};

/**
 * Send batch emails
 * @param {Array} emails - Array of email data
 * @returns {Promise<Object>} Batch result
 */
export const sendBatchEmails = async (emails) => {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('Emails array is required and cannot be empty');
    }
    
    const batchId = Date.now().toString();
    const batchData = {
      id: batchId,
      emails: emails.map((email, index) => ({
        ...email,
        id: `${batchId}-${index}`,
        batchId,
        status: 'queued',
        queuedAt: new Date().toISOString()
      })),
      totalEmails: emails.length,
      status: 'processing',
      createdAt: new Date().toISOString()
    };
    
    // Store batch data
    const batches = getBatchEmails();
    batches.push(batchData);
    saveBatchEmails(batches);
    
    // Queue individual emails
    for (const email of batchData.emails) {
      await queueEmail(email);
    }
    
    return {
      success: true,
      message: `Batch of ${emails.length} emails queued successfully`,
      batchId
    };
  } catch (error) {
    console.error('Error sending batch emails:', error);
    throw error;
  }
};

/**
 * Get batch emails
 * @returns {Array} Batch emails
 */
const getBatchEmails = () => {
  try {
    const stored = localStorage.getItem(BATCH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting batch emails:', error);
    return [];
  }
};

/**
 * Save batch emails to localStorage
 * @param {Array} batches - Batch emails
 */
const saveBatchEmails = (batches) => {
  try {
    localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batches));
  } catch (error) {
    console.error('Error saving batch emails:', error);
  }
};

/**
 * Get batch email status
 * @param {string} batchId - Batch ID
 * @returns {Object} Batch status
 */
export const getBatchStatus = (batchId) => {
  try {
    const batches = getBatchEmails();
    const batch = batches.find(b => b.id === batchId);
    
    if (!batch) {
      return null;
    }
    
    const queue = getEmailQueue();
    const batchEmails = queue.filter(email => email.batchId === batchId);
    
    const stats = {
      total: batch.totalEmails,
      queued: batchEmails.filter(email => email.status === 'queued').length,
      sent: batchEmails.filter(email => email.status === 'sent').length,
      failed: batchEmails.filter(email => email.status === 'failed').length,
      processing: batchEmails.filter(email => email.status === 'processing').length
    };
    
    return {
      ...batch,
      stats,
      progress: Math.round((stats.sent / stats.total) * 100)
    };
  } catch (error) {
    console.error('Error getting batch status:', error);
    return null;
  }
};

/**
 * Create email preview
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Preview result
 */
export const createEmailPreview = async (emailData) => {
  try {
    const previewId = Date.now().toString();
    const preview = {
      id: previewId,
      ...emailData,
      createdAt: new Date().toISOString(),
      type: 'preview'
    };
    
    // Store preview
    const previews = getEmailPreviews();
    previews.push(preview);
    saveEmailPreviews(previews);
    
    return {
      success: true,
      message: 'Email preview created successfully',
      previewId,
      preview
    };
  } catch (error) {
    console.error('Error creating email preview:', error);
    throw error;
  }
};

/**
 * Get email previews
 * @returns {Array} Email previews
 */
const getEmailPreviews = () => {
  try {
    const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting email previews:', error);
    return [];
  }
};

/**
 * Save email previews to localStorage
 * @param {Array} previews - Email previews
 */
const saveEmailPreviews = (previews) => {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(previews));
  } catch (error) {
    console.error('Error saving email previews:', error);
  }
};

/**
 * Get email preview by ID
 * @param {string} previewId - Preview ID
 * @returns {Object|null} Email preview
 */
export const getEmailPreview = (previewId) => {
  try {
    const previews = getEmailPreviews();
    return previews.find(p => p.id === previewId) || null;
  } catch (error) {
    console.error('Error getting email preview:', error);
    return null;
  }
};

/**
 * Delete email preview
 * @param {string} previewId - Preview ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteEmailPreview = async (previewId) => {
  try {
    const previews = getEmailPreviews();
    const filteredPreviews = previews.filter(p => p.id !== previewId);
    saveEmailPreviews(filteredPreviews);
    
    return {
      success: true,
      message: 'Email preview deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting email preview:', error);
    throw error;
  }
};

/**
 * Clear old previews (older than 7 days)
 * @returns {Promise<Object>} Clear result
 */
export const clearOldPreviews = async () => {
  try {
    const previews = getEmailPreviews();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const filteredPreviews = previews.filter(preview => 
      new Date(preview.createdAt) > sevenDaysAgo
    );
    
    saveEmailPreviews(filteredPreviews);
    
    const cleared = previews.length - filteredPreviews.length;
    
    return {
      success: true,
      message: `Cleared ${cleared} old previews`,
      cleared
    };
  } catch (error) {
    console.error('Error clearing old previews:', error);
    throw error;
  }
};

/**
 * Send student daily update
 * @param {string} studentId - Student ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Send result
 */
export const sendStudentDailyUpdate = async (studentId, updateData) => {
  try {
    // Create email data for daily update
    const emailData = {
      to: updateData.email || 'student@example.com',
      subject: `Daily Update - ${new Date().toLocaleDateString()}`,
      template: 'dailyUpdate',
      data: {
        studentId,
        ...updateData
      }
    };
    
    // Queue the email
    const result = await queueEmail(emailData);
    
    return {
      success: true,
      message: 'Student daily update queued successfully',
      emailId: result.emailId
    };
  } catch (error) {
    console.error('Error sending student daily update:', error);
    throw error;
  }
};

/**
 * Preview student daily update
 * @param {string} studentId - Student ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Preview result
 */
export const previewStudentDailyUpdate = async (studentId, updateData) => {
  try {
    const previewData = {
      to: updateData.email || 'student@example.com',
      subject: `Daily Update - ${new Date().toLocaleDateString()}`,
      template: 'dailyUpdate',
      data: {
        studentId,
        ...updateData
      }
    };
    
    const result = await createEmailPreview(previewData);
    
    return {
      success: true,
      message: 'Student daily update preview created',
      previewId: result.previewId,
      preview: result.preview
    };
  } catch (error) {
    console.error('Error previewing student daily update:', error);
    throw error;
  }
};

/**
 * Queue student daily update
 * @param {string} studentId - Student ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Queue result
 */
export const queueStudentDailyUpdate = async (studentId, updateData) => {
  try {
    // Create email data for daily update
    const emailData = {
      to: updateData.email || 'student@example.com',
      subject: `Daily Update - ${new Date().toLocaleDateString()}`,
      template: 'dailyUpdate',
      data: {
        studentId,
        ...updateData
      },
      priority: 'high',
      scheduledFor: updateData.scheduledFor || new Date().toISOString()
    };
    
    // Queue the email
    const result = await queueEmail(emailData);
    
    return {
      success: true,
      message: 'Student daily update queued successfully',
      emailId: result.emailId
    };
  } catch (error) {
    console.error('Error queuing student daily update:', error);
    throw error;
  }
};
