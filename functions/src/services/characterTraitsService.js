import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Get the character trait for the current month from a user's profile
 * @param {string} userId - The user ID to fetch traits from
 * @param {Date} date - The date to determine the current month (defaults to now)
 * @returns {Object|null} The character trait object or null if none found
 */
export const getCurrentMonthTrait = async (userId, date = new Date()) => {
  try {
    if (!userId) return null;
    
    const currentMonth = date.getMonth() + 1; // getMonth() returns 0-11
    
    // Get user document
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return null;
    
    const userData = userSnap.data();
    const characterTraits = userData.characterTraits || [];
    
    // Find trait assigned to current month
    const currentTrait = characterTraits.find(trait => 
      trait.months && trait.months.includes(currentMonth)
    );
    
    return currentTrait || null;
  } catch (error) {
    console.error("Error fetching current month trait:", error);
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
  // This ensures each student gets a unique quote per month
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
  // This ensures each student gets a unique challenge per month
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
