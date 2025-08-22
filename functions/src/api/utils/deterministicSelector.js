import dayjs from 'dayjs';

/**
 * Deterministically selects an item from an array based on student ID, date, and content type.
 * This ensures the same student gets consistent but unique content each day.
 * 
 * @param {Array} array - Array of items to select from
 * @param {string} studentId - Student's unique identifier
 * @param {Date|string} date - Date to use for selection (defaults to today)
 * @param {string} contentType - Type of content being selected (e.g., 'greeting', 'header')
 * @returns {any} Selected item from the array, or null if array is empty/invalid
 */
export const selectDeterministicItem = (array, studentId, date = new Date(), contentType) => {
  // Validate inputs
  if (!array || !Array.isArray(array) || array.length === 0) return null;
  if (!studentId) return array[0]; // Fallback to first item if no student ID

  // Create a deterministic seed string
  const dateString = dayjs(date).format('YYYY-MM-DD');
  const seed = `${studentId}-${dateString}-${contentType}`;

  // Generate a hash from the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // Use the hash to select an item from the array
  return array[Math.abs(hash) % array.length];
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