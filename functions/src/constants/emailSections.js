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
 * Default preferences structure for the new unified email system
 * This structure supports both parent and student emails with individual section controls
 * and showEmpty flags for controlling display of empty sections
 */
export const DEFAULT_EMAIL_PREFERENCES = {
  parent: {
    enabled: true,
    sections: {
      [EMAIL_SECTIONS.ATTENDANCE]: { enabled: true, showEmpty: true },
      [EMAIL_SECTIONS.GRADES]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.SUBJECT_GRADES]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.BEHAVIOR]: { enabled: true, showEmpty: true },
      [EMAIL_SECTIONS.ASSIGNMENTS]: { enabled: true, showEmpty: true },
      [EMAIL_SECTIONS.UPCOMING]: { enabled: true, showEmpty: true },
      [EMAIL_SECTIONS.LESSONS]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.REMINDERS]: { enabled: true, showEmpty: true },
    }
  },
  student: {
    enabled: false,
    sections: {
      [EMAIL_SECTIONS.ATTENDANCE]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.GRADES]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.SUBJECT_GRADES]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.BEHAVIOR]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.ASSIGNMENTS]: { enabled: true, showEmpty: true },
      [EMAIL_SECTIONS.UPCOMING]: { enabled: true, showEmpty: true },
      [EMAIL_SECTIONS.LESSONS]: { enabled: true, showEmpty: false },
      [EMAIL_SECTIONS.REMINDERS]: { enabled: true, showEmpty: true },
    }
  }
};

/**
 * Legacy preference normalization for backward compatibility
 * Converts old flat preference structure to new unified structure
 * @param {Object} preferences - Legacy preferences object (flat boolean values)
 * @param {string} emailType - 'parent' or 'student'
 * @returns {Object} normalized preferences in new structure
 */
export const normalizePreferences = (preferences = {}, emailType = 'parent') => {
  const normalized = {};
  
  // Handle null/undefined preferences
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

/**
 * Create unified email preferences structure from legacy or new data
 * @param {Object} data - User data containing email preferences
 * @returns {Object} unified email preferences structure
 */
export const createUnifiedEmailPreferences = (data = {}) => {
  const result = { ...DEFAULT_EMAIL_PREFERENCES };
  
  // Handle parent preferences
  if (data.dailyEmailIncludeSections) {
    // Convert legacy flat structure to new structure
    Object.entries(data.dailyEmailIncludeSections).forEach(([section, enabled]) => {
      if (result.parent.sections[section]) {
        result.parent.sections[section].enabled = enabled;
      }
    });
  }
  
  // Handle student preferences
  if (data.studentDailyEmail) {
    result.student.enabled = data.studentDailyEmail.enabled || false;
    
    if (data.studentDailyEmail.contentToggles) {
      Object.entries(data.studentDailyEmail.contentToggles).forEach(([section, enabled]) => {
        if (result.student.sections[section]) {
          result.student.sections[section].enabled = enabled;
        }
      });
    }
  }
  
  // Handle new unified preferences structure (if it exists)
  if (data.unifiedEmailPreferences) {
    // Merge with defaults, preserving existing structure
    if (data.unifiedEmailPreferences.parent) {
      result.parent = {
        ...result.parent,
        ...data.unifiedEmailPreferences.parent,
        sections: {
          ...result.parent.sections,
          ...data.unifiedEmailPreferences.parent.sections
        }
      };
    }
    
    if (data.unifiedEmailPreferences.student) {
      result.student = {
        ...result.student,
        ...data.unifiedEmailPreferences.student,
        sections: {
          ...result.student.sections,
          ...data.unifiedEmailPreferences.student.sections
        }
      };
    }
  }
  
  return result;
};

/**
 * Helper function to get default preference for a section
 * @param {string} emailType - 'parent' or 'student'
 * @param {string} section - section name from EMAIL_SECTIONS
 * @returns {Object} default section preference with enabled and showEmpty flags
 */
export const getDefaultSectionPreference = (emailType, section) => {
  return DEFAULT_EMAIL_PREFERENCES[emailType]?.sections?.[section] || { enabled: true, showEmpty: true };
};

/**
 * Array of valid email section names for validation
 */
export const EMAIL_SECTIONS_ARRAY = Object.values(EMAIL_SECTIONS);

/**
 * Enhanced validation for email preferences structure
 * @param {Object} preferences - email preferences to validate
 * @param {Object} options - validation options
 * @param {boolean} options.strict - strict validation mode
 * @param {string} options.recipientType - validate only specific recipient type
 * @returns {Object} validation result with isValid flag, errors array, and warnings array
 */
export const validateEmailPreferences = (preferences, options = {}) => {
  const { strict = false, recipientType = null } = options;
  const errors = [];
  const warnings = [];
  
  if (!preferences || typeof preferences !== 'object') {
    return {
      isValid: false,
      errors: ['Email preferences must be an object'],
      warnings: []
    };
  }

  // If specific recipient type is provided, validate only that
  const recipientTypes = recipientType ? [recipientType] : ['parent', 'student'];
  
  recipientTypes.forEach(type => {
    const recipientPrefs = preferences[type];
    
    if (!recipientPrefs) {
      if (strict) {
        errors.push(`Missing ${type} preferences`);
      } else {
        warnings.push(`Missing ${type} preferences - using defaults`);
      }
      return;
    }
    
    if (typeof recipientPrefs !== 'object') {
      errors.push(`${type} preferences must be an object`);
      return;
    }
    
    // Validate enabled flag
    if (recipientPrefs.hasOwnProperty('enabled')) {
      if (typeof recipientPrefs.enabled !== 'boolean') {
        errors.push(`${type}.enabled must be a boolean`);
      }
    } else if (strict) {
      errors.push(`${type}.enabled is required`);
    }
    
    // Validate sections object
    if (recipientPrefs.sections) {
      if (typeof recipientPrefs.sections !== 'object') {
        errors.push(`${type}.sections must be an object`);
      } else {
        // Validate each section
        Object.entries(recipientPrefs.sections).forEach(([sectionKey, sectionValue]) => {
          if (!EMAIL_SECTIONS_ARRAY.includes(sectionKey)) {
            if (strict) {
              errors.push(`Invalid section key: ${type}.sections.${sectionKey}`);
            } else {
              warnings.push(`Unknown section key: ${type}.sections.${sectionKey} - will be ignored`);
            }
          }
          
          if (sectionValue && typeof sectionValue === 'object') {
            // Validate enabled property
            if (sectionValue.hasOwnProperty('enabled') && typeof sectionValue.enabled !== 'boolean') {
              errors.push(`${type}.sections.${sectionKey}.enabled must be a boolean`);
            }
            
            // Validate showEmpty property
            if (sectionValue.hasOwnProperty('showEmpty') && typeof sectionValue.showEmpty !== 'boolean') {
              errors.push(`${type}.sections.${sectionKey}.showEmpty must be a boolean`);
            }
            
            // Check for unknown properties in strict mode
            if (strict) {
              const allowedProps = ['enabled', 'showEmpty'];
              Object.keys(sectionValue).forEach(prop => {
                if (!allowedProps.includes(prop)) {
                  warnings.push(`Unknown property: ${type}.sections.${sectionKey}.${prop}`);
                }
              });
            }
          } else if (sectionValue !== null && typeof sectionValue !== 'boolean') {
            // Section value should be boolean, null, or object
            errors.push(`${type}.sections.${sectionKey} must be a boolean, null, or object`);
          }
        });
        
        // Check for missing sections in strict mode
        if (strict) {
          EMAIL_SECTIONS_ARRAY.forEach(section => {
            if (!recipientPrefs.sections.hasOwnProperty(section)) {
              warnings.push(`Missing section configuration: ${type}.sections.${section}`);
            }
          });
        }
      }
    } else if (strict) {
      errors.push(`${type}.sections is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate email data completeness for sending
 * @param {Object} data - email data to validate
 * @param {Object} emailPreferences - email preferences object
 * @returns {Object} validation result with isValid flag, errors array, and warnings array
 */
export const validateEmailData = (data, emailPreferences) => {
  const errors = [];
  const warnings = [];
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Email data must be an object'],
      warnings: []
    };
  }
  
  // Required fields
  const requiredFields = ['studentName', 'date'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate date
  if (data.date) {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  // Check data availability for enabled sections
  if (emailPreferences) {
    ['parent', 'student'].forEach(type => {
      const prefs = emailPreferences[type];
      if (prefs?.enabled && prefs?.sections) {
        Object.entries(prefs.sections).forEach(([section, config]) => {
          if (config?.enabled) {
            switch (section) {
              case EMAIL_SECTIONS.ATTENDANCE:
                if (!data.attendance || !data.attendance.status) {
                  warnings.push(`${type} email has attendance section enabled but no attendance data available`);
                }
                break;
              case EMAIL_SECTIONS.GRADES:
                if (!data.grades || !Array.isArray(data.grades) || data.grades.length === 0) {
                  if (!config.showEmpty) {
                    warnings.push(`${type} email has grades section enabled but no grades data available`);
                  }
                }
                break;
              case EMAIL_SECTIONS.BEHAVIOR:
                if (!data.behavior || !Array.isArray(data.behavior) || data.behavior.length === 0) {
                  if (!config.showEmpty) {
                    warnings.push(`${type} email has behavior section enabled but no behavior data available`);
                  }
                }
                break;
              case EMAIL_SECTIONS.LESSONS:
                if (!data.lessons || !Array.isArray(data.lessons) || data.lessons.length === 0) {
                  if (!config.showEmpty) {
                    warnings.push(`${type} email has lessons section enabled but no lessons data available`);
                  }
                }
                break;
              case EMAIL_SECTIONS.UPCOMING:
                if (!data.upcomingAssignments || !Array.isArray(data.upcomingAssignments) || data.upcomingAssignments.length === 0) {
                  if (!config.showEmpty) {
                    warnings.push(`${type} email has upcoming assignments section enabled but no upcoming assignments data available`);
                  }
                }
                break;
            }
          }
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate daily update service data structure
 * @param {Object} dataSources - data sources object
 * @returns {Object} validation result
 */
export const validateDataSources = (dataSources) => {
  const errors = [];
  const warnings = [];
  
  if (!dataSources || typeof dataSources !== 'object') {
    return {
      isValid: false,
      errors: ['Data sources must be an object'],
      warnings: []
    };
  }
  
  // Check for required data sources
  const requiredSources = ['students'];
  requiredSources.forEach(source => {
    if (!dataSources[source]) {
      errors.push(`Missing required data source: ${source}`);
    } else if (!Array.isArray(dataSources[source])) {
      errors.push(`Data source ${source} must be an array`);
    } else if (dataSources[source].length === 0) {
      warnings.push(`Data source ${source} is empty`);
    }
  });
  
  // Validate optional data sources structure
  const optionalArraySources = ['attendance', 'grades', 'behavior', 'assignments', 'lessons'];
  optionalArraySources.forEach(source => {
    if (dataSources[source] && !Array.isArray(dataSources[source])) {
      errors.push(`Data source ${source} must be an array if provided`);
    }
  });
  
  // Validate teacher data
  if (dataSources.teacher) {
    if (typeof dataSources.teacher !== 'object') {
      errors.push('Teacher data must be an object');
    } else {
      if (!dataSources.teacher.name) {
        warnings.push('Teacher name is missing');
      }
      if (!dataSources.teacher.email) {
        warnings.push('Teacher email is missing');
      }
    }
  }
  
  // Validate school name
  if (!dataSources.schoolName || typeof dataSources.schoolName !== 'string') {
    warnings.push('School name is missing or invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
