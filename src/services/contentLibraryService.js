/**
 * Frontend Content Library Service
 * Manages email content library with both database and localStorage fallback
 */

import emailContentService from './emailContentService.js';

// Default fallback content (same as backend)
const DEFAULT_CONTENT = {
  greetings: [
    "Hi {firstName}! Here's your daily update. ✨",
    "Hello {firstName}! Check out your progress today. 🚀",
    "Hey {firstName}! Here's what happened in class today. 📚"
  ],
  gradeSectionHeaders: [
    "📊 Your Grades Today",
    "🏆 Academic Progress",
    "📈 Performance Summary"
  ],
  assignmentSectionHeaders: [
    "⏰ Upcoming Assignments",
    "🗓️ What's Next?",
    "📝 Work Ahead"
  ],
  behaviorSectionHeaders: [
    "🌟 Character Spotlight",
    "💫 Positive Choices",
    "🌈 Social Growth"
  ],
  lessonSectionHeaders: [
    "📚 Today's Learning",
    "🔍 Classroom Highlights",
    "📖 Lessons Explored"
  ],
  motivationalQuotes: [
    "Every expert was once a beginner! 🌟",
    "Progress, not perfection! 💪",
    "You're doing amazing things! 🎯"
  ],
  dailyChallenges: [
    "Try something new today that makes you curious! 🔍",
    "Be kind to someone who needs encouragement! 💝",
    "Take on a challenge that helps you grow! 🌱"
  ],
  visualThemes: [
    {
      name: "Ocean Blue",
      primary: "#1459a9",
      secondary: "#ed2024",
      header: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)",
      winsBorder: "#1459a9",
      assignmentsBorder: "#ed2024",
      starsBorder: "#ed2024"
    },
    {
      name: "Forest Green",
      primary: "#2e7d32",
      secondary: "#f57c00",
      header: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
      winsBorder: "#2e7d32",
      assignmentsBorder: "#f57c00",
      starsBorder: "#f57c00"
    },
    {
      name: "Sunset Orange",
      primary: "#ef6c00",
      secondary: "#5d4037",
      header: "linear-gradient(135deg, #ef6c00 0%, #e65100 100%)",
      winsBorder: "#ef6c00",
      assignmentsBorder: "#5d4037",
      starsBorder: "#5d4037"
    }
  ],
  motivationalQuotes: [
    "Every expert was once a beginner. Keep learning! 🌱",
    "Mistakes are proof you're trying. Keep going! 💪",
    "Your effort today builds tomorrow's success. 🚀",
    "Small progress is still progress. Celebrate it! 🎉"
  ],
  achievementBadges: [
    {
      name: "Attendance Champion",
      icon: "✅",
      description: "Perfect attendance this week!",
      color: "#4caf50"
    },
    {
      name: "Grade Collector",
      icon: "🏅",
      description: "Outstanding performance on recent assignments",
      color: "#2196f3"
    },
    {
      name: "Kindness Hero",
      icon: "❤️",
      description: "Demonstrated exceptional kindness",
      color: "#e91e63"
    }
  ]
};

const CACHE_DURATION_MS = 600000; // 10 minutes

// In-memory cache for content library (teacher-specific)
let contentCache = {};

/**
 * Gets the storage key for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {string} Storage key
 */
const getStorageKey = (teacherId) => {
  return `teacher_${teacherId}`;
};

/**
 * Gets the complete email content library for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Content library object
 */
export const getContentLibrary = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const storageKey = getStorageKey(teacherId);
    
    // Check in-memory cache first
    if (contentCache[teacherId] && (Date.now() - contentCache[teacherId].timestamp) < CACHE_DURATION_MS) {
      return contentCache[teacherId].library;
    }

    // Try to get from database first
    try {
      console.log('Fetching content library from database for teacher:', teacherId);
      const databaseLibrary = await emailContentService.getContentLibrary(teacherId);
      
      console.log('Database returned library:', {
        teacherId,
        hasData: !!databaseLibrary,
        keys: databaseLibrary ? Object.keys(databaseLibrary) : [],
        contentDetails: databaseLibrary ? Object.entries(databaseLibrary).map(([key, value]) => ({
          key,
          type: Array.isArray(value) ? 'array' : typeof value,
          length: Array.isArray(value) ? value.length : 'N/A',
          hasContent: Array.isArray(value) ? value.length > 0 : !!value
        })) : []
      });
      
      // Check if database has meaningful content (not just empty arrays)
      const hasContent = Object.values(databaseLibrary).some(value =>
        Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined
      );
      
      if (hasContent) {
        console.log('Found content in database for teacher:', teacherId);
        // Store in localStorage for faster access
        localStorage.setItem(storageKey, JSON.stringify(databaseLibrary));
        // Update cache
        contentCache[teacherId] = { library: databaseLibrary, timestamp: Date.now() };
        return databaseLibrary;
      } else {
        console.log('Database returned empty content for teacher:', teacherId);
      }
    } catch (dbError) {
      console.warn('Error fetching from database, falling back to localStorage:', dbError);
    }

    // Try to get from localStorage as fallback
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      console.log('Found content in localStorage for teacher:', teacherId);
      const library = JSON.parse(stored);
      // Update cache
      contentCache[teacherId] = { library, timestamp: Date.now() };
      return library;
    }

    // Initialize with default content if nothing exists
    console.log('No content found, initializing with defaults for teacher:', teacherId);
    const defaultLibrary = await initializeContentLibrary(teacherId);
    return defaultLibrary;
  } catch (error) {
    console.error('Error getting content library:', error);
    return DEFAULT_CONTENT;
  }
};

/**
 * Gets content for a specific type and teacher
 * @param {string} teacherId - Teacher ID
 * @param {string} contentType - The type of content to retrieve
 * @param {string} studentId - Optional student ID for deterministic selection
 * @param {string} date - Optional date for deterministic selection
 * @returns {Promise<Array|Object>} Content for the specified type
 */
export const getContentByType = async (teacherId, contentType, studentId = null, date = null) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const library = await getContentLibrary(teacherId);
    const templates = library[contentType] || [];

    if (studentId && date) {
      // Deterministic selection for specific student and date
      const selectedContent = selectDeterministicItem(templates, studentId, date);
      return {
        selected: selectedContent,
        allTemplates: templates,
        contentType: contentType,
        studentId: studentId,
        date: date
      };
    }

    return {
      templates: templates,
      contentType: contentType,
      count: templates.length
    };
  } catch (error) {
    console.error('Error getting content by type:', error);
    return { templates: [], contentType, count: 0 };
  }
};

/**
 * Initializes the email content library with default templates for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Initialized content library
 */
export const initializeContentLibrary = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const storageKey = getStorageKey(teacherId);
    
    // Check if already initialized
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      const library = JSON.parse(existing);
      contentCache[teacherId] = { library, timestamp: Date.now() };
      return library;
    }

    // Initialize with default content
    const library = { ...DEFAULT_CONTENT };
    
    // Store in localStorage
    localStorage.setItem(storageKey, JSON.stringify(library));
    
    // Update cache
    contentCache[teacherId] = { library, timestamp: Date.now() };
    
    return library;
  } catch (error) {
    console.error('Error initializing content library:', error);
    return DEFAULT_CONTENT;
  }
};

/**
 * Updates specific content types in the library for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @param {Object} updates - Object containing updates for content types
 * @returns {Promise<Object>} Update result
 */
export const updateContentLibrary = async (teacherId, updates) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates object is required');
    }

    // Validate updates
    const validation = validateContentLibrary(updates, true);
    if (!validation.isValid) {
      throw new Error(`Invalid content structure: ${validation.errors.join(', ')}`);
    }

    // Get current library
    const currentLibrary = await getContentLibrary(teacherId);
    
    // Apply updates
    const updatedLibrary = { ...currentLibrary, ...updates };
    
    // Try to save to database first
    try {
      console.log('Saving content library to database for teacher:', teacherId);
      // Update each content type that was changed
      for (const [contentType, content] of Object.entries(updates)) {
        await emailContentService.bulkUpdate(teacherId, contentType, content);
      }
    } catch (dbError) {
      console.warn('Error saving to database, will save to localStorage only:', dbError);
    }
    
    // Store updated library in localStorage
    const storageKey = getStorageKey(teacherId);
    localStorage.setItem(storageKey, JSON.stringify(updatedLibrary));
    
    // Clear cache to ensure fresh data
    clearContentCache(teacherId);
    
    return {
      success: true,
      message: 'Content library updated successfully',
      data: updatedLibrary
    };
  } catch (error) {
    console.error('Error updating content library:', error);
    throw error;
  }
};

/**
 * Clears the content cache for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Clear result
 */
export const clearContentCache = async (teacherId) => {
  try {
    contentCache[teacherId] = { library: null, timestamp: 0 };
    return {
      success: true,
      message: 'Content cache cleared successfully'
    };
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

/**
 * Gets content library statistics for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Content statistics
 */
export const getContentStats = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }
    
    const library = await getContentLibrary(teacherId);
    
    const stats = {
      totalContentTypes: Object.keys(library).length,
      totalTemplates: Object.values(library).reduce((sum, content) => {
        return sum + (Array.isArray(content) ? content.length : 1);
      }, 0),
      contentTypes: Object.keys(library).map(type => ({
        type,
        count: Array.isArray(library[type]) ? library[type].length : 1
      })),
      lastUpdated: contentCache[teacherId]?.timestamp ? new Date(contentCache[teacherId].timestamp).toISOString() : null
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting content stats:', error);
    return {
      totalContentTypes: 0,
      totalTemplates: 0,
      contentTypes: [],
      lastUpdated: null
    };
  }
};

/**
 * Validates content library structure
 * @param {Object} content - Content to validate
 * @param {boolean} allowPartial - Whether to allow partial validation
 * @returns {Object} Validation result
 */
const validateContentLibrary = (content, allowPartial = false) => {
  const errors = [];
  
  if (!content || typeof content !== 'object') {
    errors.push('Content must be an object');
    return { isValid: false, errors };
  }

  // Check required content types if not partial
  if (!allowPartial) {
    const requiredTypes = Object.keys(DEFAULT_CONTENT);
    for (const type of requiredTypes) {
      if (!content[type]) {
        errors.push(`Missing required content type: ${type}`);
      }
    }
  }

  // Validate existing content types
  for (const [type, value] of Object.entries(content)) {
    if (DEFAULT_CONTENT[type]) {
      if (Array.isArray(DEFAULT_CONTENT[type])) {
        if (!Array.isArray(value)) {
          errors.push(`${type} must be an array`);
        }
      } else if (typeof value !== typeof DEFAULT_CONTENT[type]) {
        errors.push(`${type} must be of type ${typeof DEFAULT_CONTENT[type]}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Deterministic content selection for consistent results
 * @param {Array} templates - Array of templates to select from
 * @param {string} studentId - Student ID for selection
 * @param {string} date - Date for selection
 * @returns {*} Selected template
 */
const selectDeterministicItem = (templates, studentId, date) => {
  if (!templates || templates.length === 0) {
    return null;
  }

  if (templates.length === 1) {
    return templates[0];
  }

  // Create a deterministic hash from studentId and date
  const hash = simpleHash(studentId + date);
  const index = hash % templates.length;
  
  return templates[index];
};

/**
 * Simple hash function for deterministic selection
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Resets the content library to default values for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Reset result
 */
export const resetContentLibrary = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const storageKey = getStorageKey(teacherId);
    
    // Remove from localStorage
    localStorage.removeItem(storageKey);
    
    // Clear cache
    clearContentCache(teacherId);
    
    // Reinitialize with defaults
    const library = await initializeContentLibrary(teacherId);
    
    return {
      success: true,
      message: 'Content library reset to defaults successfully',
      data: library
    };
  } catch (error) {
    console.error('Error resetting content library:', error);
    throw error;
  }
};

/**
 * Exports the content library for backup for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<string>} JSON string of content library
 */
export const exportContentLibrary = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }
    
    const library = await getContentLibrary(teacherId);
    return JSON.stringify(library, null, 2);
  } catch (error) {
    console.error('Error exporting content library:', error);
    throw error;
  }
};

/**
 * Imports content library from backup for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @param {string} importData - JSON string of content library
 * @returns {Promise<Object>} Import result
 */
export const importContentLibrary = async (teacherId, importData) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    let library;
    
    if (typeof importData === 'string') {
      library = JSON.parse(importData);
    } else if (typeof importData === 'object') {
      library = importData;
    } else {
      throw new Error('Invalid import data format');
    }

    // Validate imported data
    const validation = validateContentLibrary(library, false);
    if (!validation.isValid) {
      throw new Error(`Invalid content structure: ${validation.errors.join(', ')}`);
    }

    // Store imported library in teacher-specific location
    const storageKey = getStorageKey(teacherId);
    localStorage.setItem(storageKey, JSON.stringify(library));
    
    // Update cache
    contentCache[teacherId] = { library, timestamp: Date.now() };
    
    return {
      success: true,
      message: 'Content library imported successfully',
      data: library
    };
  } catch (error) {
    console.error('Error importing content library:', error);
    throw error;
  }
};

/**
 * Checks if there's existing content for a teacher and migrates it if needed
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Content library (existing or new)
 */
export const checkAndMigrateTeacherContent = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const storageKey = getStorageKey(teacherId);
    
    // Check if teacher-specific content exists
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      console.log('Found existing content for teacher', teacherId);
      const library = JSON.parse(existing);
      contentCache[teacherId] = { library, timestamp: Date.now() };
      return library;
    }

    // Check if there's old generic content that we should migrate
    const oldContent = localStorage.getItem('emailContentLibrary');
    if (oldContent) {
      console.log('Migrating old content to teacher-specific storage for', teacherId);
      const library = JSON.parse(oldContent);
      
      // Store in teacher-specific location
      localStorage.setItem(storageKey, JSON.stringify(library));
      
      // Update cache
      contentCache[teacherId] = { library, timestamp: Date.now() };
      
      // Remove old generic content
      localStorage.removeItem('emailContentLibrary');
      
      return library;
    }

    // No existing content found, initialize with defaults
    console.log('No existing content found, initializing with defaults for teacher', teacherId);
    return await populateWithTeacherContent(teacherId);
  } catch (error) {
    console.error('Error checking/migrating teacher content:', error);
    return DEFAULT_CONTENT;
  }
};

/**
 * Populates the content library with realistic teacher content for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Populated content library
 */
export const populateWithTeacherContent = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const storageKey = getStorageKey(teacherId);
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      console.log('Content library already exists for teacher', teacherId);
      return JSON.parse(existing);
    }

    const teacherContent = {
      greetings: [
        "Hi {firstName}! Here's your daily update. ✨",
        "Hello {firstName}! Check out your progress today. 🚀",
        "Hey {firstName}! Here's what happened in class today. 📚",
        "Good morning {firstName}! Let's see how you're doing! 🌅",
        "Hi there {firstName}! Ready for your daily summary? 📖"
      ],
      gradeSectionHeaders: [
        "📊 Your Grades Today",
        "🏆 Academic Progress",
        "📈 Performance Summary",
        "📋 Grade Report",
        "🎯 Achievement Update"
      ],
      assignmentSectionHeaders: [
        "⏰ Upcoming Assignments",
        "🗓️ What's Next?",
        "📝 Work Ahead",
        "📚 Homework Preview",
        "🎯 Task Overview"
      ],
      behaviorSectionHeaders: [
        "🌟 Character Spotlight",
        "💫 Positive Choices",
        "🌈 Social Growth",
        "🎭 Behavior Highlights",
        "✨ Character Development"
      ],
      lessonSectionHeaders: [
        "📚 Today's Learning",
        "🔍 Classroom Highlights",
        "📖 Lessons Explored",
        "🎓 Educational Journey",
        "📝 Learning Summary"
      ],
      visualThemes: [
        {
          name: "Ocean Blue",
          primary: "#1459a9",
          secondary: "#ed2024",
          header: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)",
          winsBorder: "#1459a9",
          assignmentsBorder: "#ed2024",
          starsBorder: "#ed2024"
        },
        {
          name: "Forest Green",
          primary: "#2e7d32",
          secondary: "#f57c00",
          header: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
          winsBorder: "#2e7d32",
          assignmentsBorder: "#f57c00",
          starsBorder: "#f57c00"
        },
        {
          name: "Sunset Orange",
          primary: "#ef6c00",
          secondary: "#5d4037",
          header: "linear-gradient(135deg, #ef6c00 0%, #e65100 100%)",
          winsBorder: "#ef6c00",
          assignmentsBorder: "#5d4037",
          starsBorder: "#5d4037"
        },
        {
          name: "Royal Purple",
          primary: "#6a1b9a",
          secondary: "#ff9800",
          header: "linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)",
          winsBorder: "#6a1b9a",
          assignmentsBorder: "#ff9800",
          starsBorder: "#ff9800"
        }
      ],
      motivationalQuotes: [
        "Every expert was once a beginner. Keep learning! 🌱",
        "Mistakes are proof you're trying. Keep going! 💪",
        "Your effort today builds tomorrow's success. 🚀",
        "Small progress is still progress. Celebrate it! 🎉",
        "Learning is a journey, not a destination. 🗺️",
        "You are capable of amazing things! ⭐",
        "Today's challenges are tomorrow's strengths. 💪",
        "Believe in yourself and anything is possible! ✨"
      ],
      dailyChallenges: [
        "Try something new today that makes you curious! 🔍",
        "Be kind to someone who needs encouragement! 💝",
        "Take on a challenge that helps you grow! 🌱",
        "Show perseverance by not giving up on a difficult task today! 💪",
        "Demonstrate respect by listening carefully to others! 👂",
        "Take responsibility by admitting a mistake and working to fix it! 🎆",
        "Display courage by standing up for what is right! 🦁",
        "Practice gratitude by thanking someone who has helped you! 🙏"
      ],
      achievementBadges: [
        {
          name: "Attendance Champion",
          icon: "✅",
          description: "Perfect attendance this week!",
          color: "#4caf50"
        },
        {
          name: "Grade Collector",
          icon: "🏅",
          description: "Outstanding performance on recent assignments",
          color: "#2196f3"
        },
        {
          name: "Kindness Hero",
          icon: "❤️",
          description: "Demonstrated exceptional kindness",
          color: "#e91e63"
        },
        {
          name: "Math Master",
          icon: "🔢",
          description: "Excellent work in mathematics",
          color: "#ff9800"
        },
        {
          name: "Reading Star",
          icon: "📚",
          description: "Outstanding reading achievements",
          color: "#9c27b0"
        },
        {
          name: "Team Player",
          icon: "🤝",
          description: "Great collaboration skills",
          color: "#607d8b"
        }
      ]
    };

    // Store the populated content
    localStorage.setItem(storageKey, JSON.stringify(teacherContent));
    
    // Update cache
    contentCache[teacherId] = { library: teacherContent, timestamp: Date.now() };
    
    console.log('Content library populated with teacher content for teacher', teacherId);
    return teacherContent;
  } catch (error) {
    console.error('Error populating content library:', error);
    return DEFAULT_CONTENT;
  }
};

/**
 * Checks if the content library needs initialization for a specific teacher
 * @param {string} teacherId - Teacher ID
 * @returns {boolean} True if needs initialization
 */
export const needsInitialization = (teacherId) => {
  try {
    if (!teacherId) {
      return true;
    }
    
    const storageKey = getStorageKey(teacherId);
    const stored = localStorage.getItem(storageKey);
    return !stored;
  } catch (error) {
    return true;
  }
};
