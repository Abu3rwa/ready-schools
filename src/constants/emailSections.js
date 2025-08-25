/**
 * Standardized email section identifiers
 * This file provides a single source of truth for email section names
 * to ensure consistency across parent and student emails
 */

export const EMAIL_SECTIONS = {
  // Core sections
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  SUBJECT_GRADES: 'subjectGrades',
  BEHAVIOR: 'behavior',
  ASSIGNMENTS: 'assignments',
  UPCOMING: 'upcoming',
  LESSONS: 'lessons',
  REMINDERS: 'reminders',
};

/**
 * Default preferences for email sections
 * These define the default behavior when no explicit preference is set
 */
export const DEFAULT_EMAIL_PREFERENCES = {
  // Parent email defaults - show sections unless explicitly disabled
  parent: {
    [EMAIL_SECTIONS.ATTENDANCE]: true,
    [EMAIL_SECTIONS.GRADES]: true,
    [EMAIL_SECTIONS.SUBJECT_GRADES]: true,
    [EMAIL_SECTIONS.BEHAVIOR]: true,
    [EMAIL_SECTIONS.ASSIGNMENTS]: true,
    [EMAIL_SECTIONS.UPCOMING]: true,
    [EMAIL_SECTIONS.LESSONS]: true,
    [EMAIL_SECTIONS.REMINDERS]: true,
  },
  // Student email defaults - show sections unless explicitly disabled
  student: {
    [EMAIL_SECTIONS.ATTENDANCE]: true,
    [EMAIL_SECTIONS.GRADES]: true,
    [EMAIL_SECTIONS.SUBJECT_GRADES]: true,
    [EMAIL_SECTIONS.BEHAVIOR]: true,
    [EMAIL_SECTIONS.ASSIGNMENTS]: true,
    [EMAIL_SECTIONS.UPCOMING]: true,
    [EMAIL_SECTIONS.LESSONS]: true,
    [EMAIL_SECTIONS.REMINDERS]: true,
  },
};

/**
 * Helper function to get default preference for a section
 * @param {string} emailType - 'parent' or 'student'
 * @param {string} section - section name from EMAIL_SECTIONS
 * @returns {boolean} default preference
 */
export const getDefaultPreference = (emailType, section) => {
  return DEFAULT_EMAIL_PREFERENCES[emailType]?.[section] ?? true;
};

/**
 * Helper function to normalize preferences object
 * Ensures all sections have explicit boolean values
 * @param {Object} preferences - raw preferences object
 * @param {string} emailType - 'parent' or 'student'
 * @returns {Object} normalized preferences
 */
export const normalizePreferences = (preferences = {}, emailType = 'parent') => {
  const normalized = {};
  
  // Ensure preferences is an object (handle null/undefined cases)
  const safePreferences = preferences || {};
  
  Object.values(EMAIL_SECTIONS).forEach(section => {
    // For parent emails: use !== false logic (default to true unless explicitly false)
    if (emailType === 'parent') {
      normalized[section] = safePreferences[section] !== false;
    }
    // For student emails: use ?? true logic (default to true if undefined)
    else {
      normalized[section] = safePreferences[section] ?? true;
    }
  });
  
  return normalized;
};
