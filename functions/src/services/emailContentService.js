/**
 * Email Content Service - Backend
 * Manages teacher-to-teacher content sharing only
 */

import { getFirestore } from 'firebase-admin/firestore';

/**
 * Gets Firestore instance (initialized when needed)
 * @returns {FirebaseFirestore} Firestore instance
 */
const getAdminDb = () => {
  return getFirestore();
};

/**
 * Shares content with another teacher by creating a sharing request
 * @param {string} sourceTeacherId - ID of the teacher sharing content
 * @param {string} targetTeacherId - ID of the teacher receiving content
 * @param {Array} contentTypes - Array of content types to share
 * @param {string} strategy - Merge strategy: 'merge', 'add_only', 'replace'
 * @returns {Promise<Object>} Sharing result
 */
export const shareContentWithTeacher = async (sourceTeacherId, targetTeacherId, contentTypes, strategy = 'merge') => {
  try {
    const adminDb = getAdminDb();
    
    // Validate parameters 
    if (!sourceTeacherId || !targetTeacherId || !contentTypes || !Array.isArray(contentTypes)) {
      throw new Error('Invalid parameters for content sharing');
    }

    if (sourceTeacherId === targetTeacherId) {
      throw new Error('Cannot share content with yourself');
    }

    // Check if target teacher exists
    const targetTeacherDoc = await adminDb.collection('users').doc(targetTeacherId).get();
    if (!targetTeacherDoc.exists) {
      throw new Error('Target teacher not found');
    }

    // Create sharing request
    const requestData = {
      sourceTeacherId,
      targetTeacherId,
      contentTypes,
      strategy,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      metadata: {
        sourceTeacherName: 'Teacher', // Could be enhanced with actual names
        requestId: `${sourceTeacherId}_${targetTeacherId}_${Date.now()}`
      }
    };

    const requestRef = await adminDb.collection('contentSharingRequests').add(requestData);
    
    return {
      success: true,
      message: 'Content sharing request created successfully',
      requestId: requestRef.id,
      request: requestData
    };
  } catch (error) {
    console.error('Error sharing content with teacher:', error);
    throw error;
  }
};

/**
 * Gets pending sharing requests for a teacher
 * @param {string} teacherId - ID of the teacher
 * @returns {Promise<Array>} Array of pending requests
 */
export const getPendingSharingRequests = async (teacherId) => {
  try {
    const adminDb = getAdminDb();
    const requestsSnapshot = await adminDb
      .collection('contentSharingRequests')
      .where('targetTeacherId', '==', teacherId)
      .where('status', '==', 'pending')
      .where('expiresAt', '>', new Date())
      .orderBy('expiresAt')
      .get();

    const requests = [];
    requestsSnapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return requests;
  } catch (error) {
    console.error('Error getting pending sharing requests:', error);
    throw error;
  }
};

/**
 * Accepts a sharing request
 * @param {string} requestId - ID of the sharing request
 * @param {string} teacherId - ID of the teacher accepting
 * @returns {Promise<Object>} Acceptance result
 */
export const acceptSharingRequest = async (requestId, teacherId) => {
  try {
    const adminDb = getAdminDb();
    const requestRef = adminDb.collection('contentSharingRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new Error('Sharing request not found');
    }

    const requestData = requestDoc.data();
    
    if (requestData.targetTeacherId !== teacherId) {
      throw new Error('You can only accept requests sent to you');
    }

    if (requestData.status !== 'pending') {
      throw new Error('Request is no longer pending');
    }

    // Update request status
    await requestRef.update({
      status: 'accepted',
      acceptedAt: new Date()
    });

    return {
      success: true,
      message: 'Sharing request accepted successfully',
      requestId,
      contentTypes: requestData.contentTypes,
      strategy: requestData.strategy
    };
  } catch (error) {
    console.error('Error accepting sharing request:', error);
    throw error;
  }
};

/**
 * Rejects a sharing request
 * @param {string} requestId - ID of the sharing request
 * @param {string} teacherId - ID of the teacher rejecting
 * @returns {Promise<Object>} Rejection result
 */
export const rejectSharingRequest = async (requestId, teacherId) => {
  try {
    const adminDb = getAdminDb();
    const requestRef = adminDb.collection('contentSharingRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new Error('Sharing request not found');
    }

    const requestData = requestDoc.data();
    
    if (requestData.targetTeacherId !== teacherId) {
      throw new Error('You can only reject requests sent to you');
    }

    if (requestData.status !== 'pending') {
      throw new Error('Request is no longer pending');
    }

    // Update request status
    await requestRef.update({
      status: 'rejected',
      rejectedAt: new Date()
    });
  
  return {
      success: true,
      message: 'Sharing request rejected successfully',
      requestId
    };
  } catch (error) {
    console.error('Error rejecting sharing request:', error);
    throw error;
  }
};

/**
 * Exports content library for a teacher (for sharing purposes)
 * @param {string} teacherId - ID of the teacher
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result
 */
export const exportContentLibrary = async (teacherId, options = {}) => {
  try {
    // This is now handled by the frontend contentLibraryService
    // Keeping this for backward compatibility but it returns a message
    return {
      success: true,
      message: 'Content export is now handled by the frontend. Use the content library service instead.',
      note: 'This function is deprecated. Content management has been moved to the frontend.'
    };
  } catch (error) {
    console.error('Error exporting content library:', error);
    throw error;
  }
};

/**
 * Imports content library for a teacher (for sharing purposes)
 * @param {string} teacherId - ID of the teacher
 * @param {Object} importData - Data to import
 * @param {string} strategy - Import strategy
 * @returns {Promise<Object>} Import result
 */
export const importContentLibrary = async (teacherId, importData, strategy = 'merge') => {
  try {
    // This is now handled by the frontend contentLibraryService
    // Keeping this for backward compatibility but it returns a message
    return {
      success: true,
      message: 'Content import is now handled by the frontend. Use the content library service instead.',
      note: 'This function is deprecated. Content management has been moved to the frontend.',
      strategy
    };
  } catch (error) {
    console.error('Error importing content library:', error);
    throw error;
  }
};