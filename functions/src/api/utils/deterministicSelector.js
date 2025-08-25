import dayjs from 'dayjs';

/**
 * Deterministic Content Selector
 * Ensures consistent content selection for each student on each date
 * while providing variation across different students and dates
 */

/**
 * Selects a deterministic item from an array based on student ID, date, and content type
 * @param {Array} array - Array of content items to select from
 * @param {string} studentId - Unique student identifier
 * @param {string|Date} date - Date for content selection
 * @param {string} contentType - Type of content being selected
 * @returns {*} Selected item from array, or null if array is empty
 */
export const selectDeterministicItem = (array, studentId, date, contentType) => {
  if (!array || array.length === 0) return null;
  
  // Normalize date to YYYY-MM-DD format
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  // Create a unique seed for this combination
  const seed = `${studentId}-${dateString}-${contentType}`;
  
  // Simple but effective hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  
  // Return item at hash position, ensuring it's within array bounds
  return array[Math.abs(hash) % array.length];
};

/**
 * Selects multiple items from an array with deterministic ordering
 * @param {Array} array - Array of content items to select from
 * @param {string} studentId - Unique student identifier
 * @param {string|Date} date - Date for content selection
 * @param {string} contentType - Type of content being selected
 * @param {number} count - Number of items to select
 * @returns {Array} Array of selected items
 */
export const selectMultipleDeterministicItems = (array, studentId, date, contentType, count) => {
  if (!array || array.length === 0) return [];
  
  const selected = [];
  const available = [...array]; // Create a copy to avoid modifying original
  
  for (let i = 0; i < Math.min(count, array.length); i++) {
    const item = selectDeterministicItem(available, studentId, date, `${contentType}-${i}`);
    if (item) {
      selected.push(item);
      // Remove selected item to avoid duplicates
      const index = available.indexOf(item);
      if (index > -1) {
        available.splice(index, 1);
      }
    }
  }
  
  return selected;
};

/**
 * Validates content selection parameters
 * @param {Array} array - Array to validate
 * @param {string} studentId - Student ID to validate
 * @param {string|Date} date - Date to validate
 * @param {string} contentType - Content type to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export const validateSelectionParams = (array, studentId, date, contentType) => {
  if (!Array.isArray(array)) {
    return { isValid: false, error: 'Array parameter must be an array' };
  }
  
  if (!studentId || typeof studentId !== 'string') {
    return { isValid: false, error: 'Student ID must be a non-empty string' };
  }
  
  if (!date) {
    return { isValid: false, error: 'Date parameter is required' };
  }
  
  if (!contentType || typeof contentType !== 'string') {
    return { isValid: false, error: 'Content type must be a non-empty string' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a content template object has the required fields.
 * 
 * @param {Object} template - Template object to validate
 * @param {string} type - Type of template ('theme' or 'text')
 * @returns {boolean} True if template is valid
 */
export const validateTemplate = (template, type = 'text') => {
  if (!template) return false;

  if (type === 'theme') {
    const requiredFields = ['name', 'primary', 'secondary', 'header'];
    return requiredFields.every(field => 
      typeof template[field] === 'string' && template[field].length > 0
    );
  }

  // Text templates should be non-empty strings
  return typeof template === 'string' && template.length > 0;
};

/**
 * Processes a text template by replacing placeholders with values.
 * 
 * @param {string} template - Template string with placeholders
 * @param {Object} values - Object containing values to insert
 * @returns {string} Processed template with values inserted
 */
export const processTemplate = (template, values) => {
  if (!template || typeof template !== 'string') return '';
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] || match; // Keep original placeholder if value not found
  });
};