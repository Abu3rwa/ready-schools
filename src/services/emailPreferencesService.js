import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

/**
 * Update email preferences for a user
 * @param {Object} preferences - Email preferences object
 * @returns {Object} Update result
 */
export const updateEmailPreferences = async (preferences) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log('Updating email preferences for user:', userId);

    // Validate preferences
    const validatedPreferences = validatePreferences(preferences);
    
    // Check if preferences already exist
    const existingPrefs = await getEmailPreferences();
    
    if (existingPrefs) {
      // Update existing preferences
      const prefsRef = doc(db, 'emailPreferences', existingPrefs.id);
      await updateDoc(prefsRef, {
        ...validatedPreferences,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Email preferences updated successfully');
      return { success: true, message: 'Email preferences updated successfully' };
    } else {
      // Create new preferences
      const prefsCol = collection(db, 'emailPreferences');
      const prefsRef = await addDoc(prefsCol, {
        userId,
        ...validatedPreferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Email preferences created successfully');
      return { success: true, message: 'Email preferences created successfully', id: prefsRef.id };
    }

  } catch (error) {
    console.error('Error updating email preferences:', error);
    throw new Error('Failed to update email preferences.');
  }
};

/**
 * Get email preferences for current user
 * @returns {Object|null} Email preferences or null if not found
 */
export const getEmailPreferences = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const prefsCol = collection(db, 'emailPreferences');
    const q = query(prefsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const prefsDoc = snapshot.docs[0];
    return {
      id: prefsDoc.id,
      ...prefsDoc.data()
    };

  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return null;
  }
};

/**
 * Get email preferences for a specific student
 * @param {string} studentId - Student ID
 * @returns {Object|null} Student-specific email preferences
 */
export const getStudentEmailPreferences = async (studentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    // First get user preferences
    const userPrefs = await getEmailPreferences();
    
    // Then get student-specific overrides
    const studentPrefsCol = collection(db, 'studentEmailPreferences');
    const q = query(
      studentPrefsCol, 
      where('userId', '==', userId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return userPrefs; // Return user preferences if no student-specific ones
    }

    const studentPrefsDoc = snapshot.docs[0];
    const studentPrefs = studentPrefsDoc.data();

    // Merge user preferences with student-specific overrides
    return {
      ...userPrefs,
      ...studentPrefs,
      id: studentPrefsDoc.id
    };

  } catch (error) {
    console.error('Error fetching student email preferences:', error);
    return null;
  }
};

/**
 * Update student-specific email preferences
 * @param {string} studentId - Student ID
 * @param {Object} preferences - Student-specific preferences
 * @returns {Object} Update result
 */
export const updateStudentEmailPreferences = async (studentId, preferences) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    console.log(`Updating email preferences for student ${studentId}`);

    // Validate preferences
    const validatedPreferences = validatePreferences(preferences);
    
    // Check if student preferences already exist
    const existingStudentPrefs = await getStudentEmailPreferences(studentId);
    
    if (existingStudentPrefs && existingStudentPrefs.id) {
      // Update existing student preferences
      const studentPrefsRef = doc(db, 'studentEmailPreferences', existingStudentPrefs.id);
      await updateDoc(studentPrefsRef, {
        ...validatedPreferences,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Student email preferences updated successfully');
      return { success: true, message: 'Student email preferences updated successfully' };
    } else {
      // Create new student preferences
      const studentPrefsCol = collection(db, 'studentEmailPreferences');
      const studentPrefsRef = await addDoc(studentPrefsCol, {
        userId,
        studentId,
        ...validatedPreferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Student email preferences created successfully');
      return { success: true, message: 'Student email preferences created successfully', id: studentPrefsRef.id };
    }

  } catch (error) {
    console.error('Error updating student email preferences:', error);
    throw new Error('Failed to update student email preferences.');
  }
};

/**
 * Delete email preferences
 * @returns {Object} Deletion result
 */
export const deleteEmailPreferences = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const prefsCol = collection(db, 'emailPreferences');
    const q = query(prefsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const prefsDoc = snapshot.docs[0];
      await deleteDoc(doc(db, 'emailPreferences', prefsDoc.id));
    }

    console.log('Email preferences deleted successfully');
    return { success: true, message: 'Email preferences deleted successfully' };

  } catch (error) {
    console.error('Error deleting email preferences:', error);
    throw new Error('Failed to delete email preferences.');
  }
};

/**
 * Delete student-specific email preferences
 * @param {string} studentId - Student ID
 * @returns {Object} Deletion result
 */
export const deleteStudentEmailPreferences = async (studentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const studentPrefsCol = collection(db, 'studentEmailPreferences');
    const q = query(
      studentPrefsCol, 
      where('userId', '==', userId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const studentPrefsDoc = snapshot.docs[0];
      await deleteDoc(doc(db, 'studentEmailPreferences', studentPrefsDoc.id));
    }

    console.log('Student email preferences deleted successfully');
    return { success: true, message: 'Student email preferences deleted successfully' };

  } catch (error) {
    console.error('Error deleting student email preferences:', error);
    throw new Error('Failed to delete student email preferences.');
  }
};

/**
 * Get default email preferences
 * @returns {Object} Default preferences
 */
export const getDefaultEmailPreferences = () => {
  return {
    frequency: 'daily', // daily, weekly, monthly, or combinations
    contentSections: {
      lessons: true,
      grades: true,
      behavior: true,
      attendance: true,
      homework: true,
      upcoming: true
    },
    subjectFocus: 'all', // all, specific subjects, or academic focus
    detailLevel: 'balanced', // summary, detailed, or balanced
    language: 'en', // en, ar, or other supported languages
    timeZone: 'local', // local or specific timezone
    unsubscribeOptions: {
      daily: false,
      weekly: false,
      monthly: false
    }
  };
};

/**
 * Validate email preferences
 * @param {Object} preferences - Preferences to validate
 * @returns {Object} Validated preferences
 */
const validatePreferences = (preferences) => {
  const defaults = getDefaultEmailPreferences();
  
  // Ensure all required fields are present
  const validated = {
    frequency: preferences.frequency || defaults.frequency,
    contentSections: {
      ...defaults.contentSections,
      ...preferences.contentSections
    },
    subjectFocus: preferences.subjectFocus || defaults.subjectFocus,
    detailLevel: preferences.detailLevel || defaults.detailLevel,
    language: preferences.language || defaults.language,
    timeZone: preferences.timeZone || defaults.timeZone,
    unsubscribeOptions: {
      ...defaults.unsubscribeOptions,
      ...preferences.unsubscribeOptions
    }
  };

  // Validate frequency
  if (!['daily', 'weekly', 'monthly', 'weekly+monthly', 'all'].includes(validated.frequency)) {
    validated.frequency = defaults.frequency;
  }

  // Validate detail level
  if (!['summary', 'detailed', 'balanced'].includes(validated.detailLevel)) {
    validated.detailLevel = defaults.detailLevel;
  }

  // Validate language
  if (!['en', 'ar'].includes(validated.language)) {
    validated.language = defaults.language;
  }

  return validated;
};

/**
 * Check if user should receive specific email type
 * @param {string} emailType - Type of email (daily, weekly, monthly)
 * @param {Object} preferences - User preferences
 * @returns {boolean} Whether user should receive the email
 */
export const shouldReceiveEmail = (emailType, preferences) => {
  if (!preferences) return true; // Default to sending if no preferences

  switch (emailType) {
    case 'daily':
      return preferences.frequency === 'daily' || 
             preferences.frequency === 'weekly+monthly' || 
             preferences.frequency === 'all';
    
    case 'weekly':
      return preferences.frequency === 'weekly' || 
             preferences.frequency === 'weekly+monthly' || 
             preferences.frequency === 'all';
    
    case 'monthly':
      return preferences.frequency === 'monthly' || 
             preferences.frequency === 'weekly+monthly' || 
             preferences.frequency === 'all';
    
    default:
      return true;
  }
};

/**
 * Get all students with email preferences for current user
 * @returns {Array} Array of students with preferences
 */
export const getAllStudentsWithPreferences = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const studentPrefsCol = collection(db, 'studentEmailPreferences');
    const q = query(studentPrefsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      studentId: doc.data().studentId,
      preferences: doc.data()
    }));

  } catch (error) {
    console.error('Error fetching students with preferences:', error);
    return [];
  }
}; 