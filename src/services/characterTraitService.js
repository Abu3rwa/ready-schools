import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Character Trait Service
 * Handles all Firebase operations for character trait assessments
 */

export const CHARACTER_TRAIT_COLLECTIONS = {
  ASSESSMENTS: 'characterTraitAssessments',
  LEADERBOARDS: 'monthlyLeaderboards',
  USERS: 'users'
};

/**
 * Get current month's character trait from user's collection
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Character trait object or null
 */
export const getCurrentMonthTrait = async (userId) => {
  try {
    if (!userId) return null;
    
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    // Get user document
    const userRef = doc(db, CHARACTER_TRAIT_COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return null;
    
    const userData = userSnap.data();
    const characterTraits = userData.characterTraits || [];
    
    // Find trait assigned to current month
    const currentTrait = characterTraits.find(trait => 
      trait.months && trait.months.includes(currentMonth)
    );
    
    return currentTrait || null;
  } catch (error) {
    console.error('Error fetching current month trait:', error);
    return null;
  }
};

/**
 * Get a unique quote for a student for the current month
 * @param {Object} trait - The character trait object
 * @param {string} studentId - The student ID for unique selection
 * @param {Date} date - The date to determine the current month
 * @returns {string} A unique quote for the month or fallback message
 */
export const getDailyQuote = (trait, studentId, date = new Date()) => {
  if (!trait || !trait.quotes || trait.quotes.length === 0) {
    return "Every day is a new opportunity to grow and learn! 🌟";
  }
  
  // Use student ID + month for unique monthly selection
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  
  // Create a unique seed for this student + month combination
  const seed = `${studentId}-${year}-${month}`;
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Use absolute hash value to select quote
  const index = Math.abs(hash) % trait.quotes.length;
  return trait.quotes[index];
};

/**
 * Get a unique challenge for a student for the current month
 * @param {Object} trait - The character trait object
 * @param {string} studentId - The student ID for unique selection
 * @param {Date} date - The date to determine the current month
 * @returns {string} A unique challenge for the month or fallback message
 */
export const getDailyChallenge = (trait, studentId, date = new Date()) => {
  if (!trait || !trait.challenges || trait.challenges.length === 0) {
    return "Try something new today that makes you curious! 🔍";
  }
  
  // Use student ID + month for unique monthly selection
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  
  // Create a unique seed for this student + month combination
  const seed = `${studentId}-${year}-${month}`;
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Use absolute hash value to select challenge
  const index = Math.abs(hash) % trait.challenges.length;
  return trait.challenges[index];
};

/**
 * Create a new character trait assessment
 * @param {Object} assessmentData - Assessment data
 * @returns {Promise<string>} Document ID
 */
export const createAssessment = async (assessmentData) => {
  try {
    const docRef = await addDoc(collection(db, CHARACTER_TRAIT_COLLECTIONS.ASSESSMENTS), {
      ...assessmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
};

/**
 * Update an existing assessment
 * @param {string} assessmentId - Assessment document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateAssessment = async (assessmentId, updates) => {
  try {
    const docRef = doc(db, CHARACTER_TRAIT_COLLECTIONS.ASSESSMENTS, assessmentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw error;
  }
};

/**
 * Get assessments for a user and month
 * @param {string} userId - User ID
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Array>} Array of assessments
 */
export const getAssessments = async (userId, month) => {
  try {
    const q = query(
      collection(db, CHARACTER_TRAIT_COLLECTIONS.ASSESSMENTS),
      where('userId', '==', userId),
      where('month', '==', month),
      orderBy('assessmentDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const assessments = [];
    
    snapshot.forEach((doc) => {
      assessments.push({ id: doc.id, ...doc.data() });
    });
    
    return assessments;
  } catch (error) {
    console.error('Error getting assessments:', error);
    throw error;
  }
};

/**
 * Get student assessments for a specific date
 * @param {string} userId - User ID
 * @param {string} studentId - Student ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Assessment or null
 */
export const getStudentAssessmentForDate = async (userId, studentId, date) => {
  try {
    const q = query(
      collection(db, CHARACTER_TRAIT_COLLECTIONS.ASSESSMENTS),
      where('userId', '==', userId),
      where('studentId', '==', studentId),
      where('assessmentDate', '==', date)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error getting student assessment:', error);
    throw error;
  }
};

/**
 * Delete an assessment
 * @param {string} assessmentId - Assessment document ID
 * @returns {Promise<void>}
 */
export const deleteAssessment = async (assessmentId) => {
  try {
    await deleteDoc(doc(db, CHARACTER_TRAIT_COLLECTIONS.ASSESSMENTS, assessmentId));
    console.log('Assessment deleted:', assessmentId);
  } catch (error) {
    console.error('Error deleting assessment:', error);
    throw error;
  }
};

/**
 * Calculate student statistics
 * @param {Array} assessments - Array of assessments
 * @param {string} studentId - Student ID
 * @returns {Object} Student statistics
 */
export const calculateStudentStats = (assessments, studentId) => {
  const studentAssessments = assessments.filter(a => a.studentId === studentId);
  
  if (studentAssessments.length === 0) {
    return {
      totalStars: 0,
      assessmentCount: 0,
      averageScore: 0,
      lastAssessment: null
    };
  }
  
  const totalStars = studentAssessments.reduce((sum, assessment) => {
    return sum + (assessment.starRating || assessment.totalScore || 0);
  }, 0);
  
  const averageScore = totalStars / studentAssessments.length;
  const lastAssessment = studentAssessments[0]; // Assuming sorted by date desc
  
  return {
    totalStars,
    assessmentCount: studentAssessments.length,
    averageScore: Math.round(averageScore * 100) / 100,
    lastAssessment
  };
};

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month string
 */
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date string
 */
export const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Validate assessment data
 * @param {Object} assessmentData - Assessment data to validate
 * @returns {Object} Validation result
 */
export const validateAssessment = (assessmentData) => {
  const errors = [];
  
  if (!assessmentData.userId) {
    errors.push('User ID is required');
  }
  
  if (!assessmentData.studentId) {
    errors.push('Student ID is required');
  }
  
  if (!assessmentData.starRating || assessmentData.starRating < 1 || assessmentData.starRating > 5) {
    errors.push('Star rating must be between 1 and 5');
  }
  
  if (!assessmentData.assessmentDate) {
    errors.push('Assessment date is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};