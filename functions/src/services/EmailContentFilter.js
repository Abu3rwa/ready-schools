/**
 * Centralized Email Content Filter Service
 * 
 * This service is the single authority for all email content filtering decisions.
 * It removes fragmented filtering logic from templates and components, providing
 * a unified approach to determining what content should be included in emails.
 */

import {
  EMAIL_SECTIONS,
  validateEmailPreferences,
  EMAIL_SECTIONS_ARRAY
} from '../constants/emailSections.js';

export class EmailContentFilter {
  /**
   * Initialize the content filter with user preferences
   * @param {Object} preferences - User's unified email preferences
   * @param {string} emailType - 'parent' or 'student'
   */
  constructor(preferences, emailType = 'parent') {
    // Validate emailType parameter
    if (!['parent', 'student'].includes(emailType)) {
      throw new Error(`Invalid emailType: ${emailType}. Must be 'parent' or 'student'`);
    }

    this.emailType = emailType;

    // Validate preferences structure
    if (preferences && typeof preferences === 'object') {
      const validation = validateEmailPreferences(preferences, { recipientType: emailType });
      if (validation.warnings.length > 0) {
        console.warn(`EmailContentFilter validation warnings:`, validation.warnings);
      }
      if (!validation.isValid) {
        console.error(`EmailContentFilter validation errors:`, validation.errors);
        // Use safe defaults for invalid preferences
        this.prefs = {
          enabled: true,
          sections: {}
        };
      } else {
        this.prefs = preferences?.[emailType];
      }
    } else {
      console.warn(`EmailContentFilter: Invalid preferences provided, using defaults`);
      this.prefs = {
        enabled: true,
        sections: {}
      };
    }

    // Ensure we have valid preferences structure
    if (!this.prefs || !this.prefs.sections) {
      console.warn(`EmailContentFilter: Invalid preferences structure for ${emailType} emails`);
      this.prefs = {
        enabled: true,
        sections: {}
      };
    }

    console.log(`EmailContentFilter initialized for ${emailType} emails:`, {
      enabled: this.prefs.enabled,
      sectionsCount: Object.keys(this.prefs.sections).length,
      sections: this.prefs.sections
    });
  }

  /**
   * Primary filtering method - determines if a section should be included in the email
   * @param {string} sectionName - Section name from EMAIL_SECTIONS
   * @param {Object} data - Email data containing content for all sections
   * @returns {boolean} true if section should be included
   */
  shouldIncludeSection(sectionName, data) {
    // Input validation
    if (!sectionName || typeof sectionName !== 'string') {
      console.warn('EmailContentFilter: Invalid sectionName provided:', sectionName);
      return false;
    }

    // Validate section exists
    if (!EMAIL_SECTIONS_ARRAY.includes(sectionName)) {
      console.warn(`EmailContentFilter: Unknown section: ${sectionName}`);
      return false;
    }

    // Validate data parameter
    if (data && typeof data !== 'object') {
      console.warn('EmailContentFilter: Data parameter must be an object');
      return false;
    }

    // Rule 1: Email type must be enabled
    if (!this.prefs?.enabled) {
      console.log(`EmailContentFilter: ${this.emailType} emails are disabled`);
      return false;
    }

    // Rule 2: Section must be enabled in preferences
    const sectionPrefs = this.prefs.sections[sectionName];
    if (!sectionPrefs?.enabled) {
      console.log(`EmailContentFilter: Section ${sectionName} is disabled for ${this.emailType} emails`);
      
      // EMERGENCY OVERRIDE: Force include attendance if no other sections are enabled
      if (sectionName === EMAIL_SECTIONS.ATTENDANCE && data && data.attendance && data.attendance.status && data.attendance.status !== "Not Recorded") {
        const allSectionsDisabled = EMAIL_SECTIONS_ARRAY.every(section => {
          const prefs = this.prefs.sections[section];
          return !prefs?.enabled;
        });
        
        if (allSectionsDisabled) {
          console.warn(`EmailContentFilter: EMERGENCY OVERRIDE - Forcing attendance section to be included to prevent empty emails`);
          return true;
        }
      }
      
      return false;
    }

    // Rule 3: If section should not be shown when empty, check if it's empty
    if (!sectionPrefs.showEmpty && this.isSectionEmpty(sectionName, data)) {
      console.log(`EmailContentFilter: Section ${sectionName} is empty and showEmpty is false for ${this.emailType} emails`);
      return false;
    }

    console.log(`EmailContentFilter: Section ${sectionName} will be included for ${this.emailType} emails`);
    return true;
  }

  /**
   * Determine if a section has no meaningful content
   * @param {string} sectionName - Section name from EMAIL_SECTIONS
   * @param {Object} data - Email data containing content for all sections
   * @returns {boolean} true if section is empty
   */
  isSectionEmpty(sectionName, data) {
    if (!data) {
      return true;
    }

    switch (sectionName) {
      case EMAIL_SECTIONS.ATTENDANCE:
        return !data.attendance ||
          data.attendance.status === "Not Recorded" ||
          data.attendance.status === null ||
          data.attendance.status === undefined;

      case EMAIL_SECTIONS.GRADES:
        return !data.grades ||
          !Array.isArray(data.grades) ||
          data.grades.length === 0;

      case EMAIL_SECTIONS.SUBJECT_GRADES:
        return !data.subjectGrades ||
          typeof data.subjectGrades !== 'object' ||
          Object.keys(data.subjectGrades).length === 0;

      case EMAIL_SECTIONS.BEHAVIOR:
        return !data.behavior ||
          !Array.isArray(data.behavior) ||
          data.behavior.length === 0;

      case EMAIL_SECTIONS.ASSIGNMENTS:
        return !data.assignments ||
          !Array.isArray(data.assignments) ||
          data.assignments.length === 0;

      case EMAIL_SECTIONS.UPCOMING:
        return !data.upcomingAssignments ||
          !Array.isArray(data.upcomingAssignments) ||
          data.upcomingAssignments.length === 0;

      case EMAIL_SECTIONS.LESSONS:
        return !data.lessons ||
          !Array.isArray(data.lessons) ||
          data.lessons.length === 0;

      case EMAIL_SECTIONS.REMINDERS:
        return !data.reminders ||
          !Array.isArray(data.reminders) ||
          data.reminders.length === 0;

      default:
        // Unknown sections are considered not empty to be safe
        console.warn(`EmailContentFilter: Unknown section ${sectionName}, assuming not empty`);
        return false;
    }
  }

  /**
   * Get all sections that should be included based on preferences and data
   * @param {Object} data - Email data containing content for all sections
   * @returns {Array<string>} Array of section names that should be included
   */
  getIncludedSections(data) {
    // Input validation
    if (data && typeof data !== 'object') {
      console.warn('EmailContentFilter: Invalid data provided to getIncludedSections');
      return [];
    }

    try {
      return EMAIL_SECTIONS_ARRAY.filter(section =>
        this.shouldIncludeSection(section, data)
      );
    } catch (error) {
      console.error('EmailContentFilter: Error in getIncludedSections:', error);
      return [];
    }
  }

  /**
   * Check if any content would be included with current preferences and data
   * @param {Object} data - Email data containing content for all sections
   * @returns {boolean} true if at least one section would be included
   */
  hasAnyContent(data) {
    // Input validation
    if (data && typeof data !== 'object') {
      console.warn('EmailContentFilter: Invalid data provided to hasAnyContent');
      return false;
    }

    try {
      const includedSections = this.getIncludedSections(data);
      
      // If no sections are included, force enable attendance as a fallback
      if (includedSections.length === 0) {
        console.warn(`EmailContentFilter: No sections enabled for ${this.emailType} emails. This will prevent emails from being sent.`);
        console.warn(`EmailContentFilter: Consider enabling at least one section in email preferences.`);
        
        // EMERGENCY FALLBACK: Force enable attendance if it has data
        if (data && data.attendance && data.attendance.status && data.attendance.status !== "Not Recorded") {
          console.warn(`EmailContentFilter: EMERGENCY FALLBACK - Forcing attendance section to be included to prevent empty emails`);
          return true;
        }
      }
      
      return includedSections.length > 0;
    } catch (error) {
      console.error('EmailContentFilter: Error in hasAnyContent:', error);
      return false;
    }
  }

  /**
   * Get filtering summary for debugging
   * @param {Object} data - Email data containing content for all sections
   * @returns {Object} Summary of filtering decisions
   */
  getFilteringSummary(data) {
    const summary = {
      emailType: this.emailType,
      emailEnabled: this.prefs?.enabled,
      sectionsAnalysis: {},
      includedSections: [],
      excludedSections: []
    };

    Object.values(EMAIL_SECTIONS).forEach(section => {
      const sectionPrefs = this.prefs.sections[section];
      const isEmpty = this.isSectionEmpty(section, data);
      const willInclude = this.shouldIncludeSection(section, data);

      summary.sectionsAnalysis[section] = {
        enabled: sectionPrefs?.enabled || false,
        showEmpty: sectionPrefs?.showEmpty || false,
        isEmpty,
        willInclude,
        reason: !sectionPrefs?.enabled ? 'disabled' :
          (!sectionPrefs.showEmpty && isEmpty) ? 'empty_and_showEmpty_false' :
            'included'
      };

      if (willInclude) {
        summary.includedSections.push(section);
      } else {
        summary.excludedSections.push(section);
      }
    });

    return summary;
  }
}

/**
 * Factory function to create EmailContentFilter instances
 * @param {Object} preferences - User's unified email preferences
 * @param {string} emailType - 'parent' or 'student'
 * @returns {EmailContentFilter} Configured filter instance
 */
export const createEmailContentFilter = (preferences, emailType = 'parent') => {
  try {
    return new EmailContentFilter(preferences, emailType);
  } catch (error) {
    console.error('Error creating EmailContentFilter:', error);
    // Return a safe default filter
    return new EmailContentFilter({
      [emailType]: { enabled: true, sections: {} }
    }, emailType);
  }
};

/**
 * Validate that data has the required structure for content filtering
 * @param {Object} data - data object to validate
 * @returns {Object} validation result
 */
export const validateContentFilterData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Data must be an object'],
      warnings: []
    };
  }

  // Check for basic student information
  if (!data.studentName) {
    errors.push('Missing studentName in data');
  }

  if (!data.studentId) {
    warnings.push('Missing studentId in data');
  }

  // Check data arrays are properly formatted
  const arrayFields = ['grades', 'behavior', 'assignments', 'lessons', 'upcomingAssignments'];
  arrayFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      if (!Array.isArray(data[field])) {
        errors.push(`Field ${field} must be an array if provided`);
      }
    }
  });

  // Check object fields
  if (data.attendance && typeof data.attendance !== 'object') {
    errors.push('Field attendance must be an object if provided');
  }

  if (data.subjectGrades && typeof data.subjectGrades !== 'object') {
    errors.push('Field subjectGrades must be an object if provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Helper function to check if any email type has content with given preferences
 * @param {Object} preferences - User's unified email preferences
 * @param {Object} data - Email data containing content for all sections
 * @returns {Object} Results for both parent and student emails
 */
export const checkContentAvailability = (preferences, data) => {
  const parentFilter = new EmailContentFilter(preferences, 'parent');
  const studentFilter = new EmailContentFilter(preferences, 'student');

  return {
    parent: {
      enabled: parentFilter.prefs?.enabled || false,
      hasContent: parentFilter.hasAnyContent(data),
      includedSections: parentFilter.getIncludedSections(data)
    },
    student: {
      enabled: studentFilter.prefs?.enabled || false,
      hasContent: studentFilter.hasAnyContent(data),
      includedSections: studentFilter.getIncludedSections(data)
    }
  };
};