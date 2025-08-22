import { getFirestore } from 'firebase-admin/firestore';
import { validateTemplate } from '../utils/deterministicSelector';

// Cache configuration
const CACHE_DURATION_MS = 600000; // 10 minutes
let contentCache = {
  library: null,
  timestamp: 0
};

/**
 * Default content templates to use as fallbacks
 */
export const DEFAULT_CONTENT = {
  greetings: [
    "Hi {firstName}! Check out your amazing progress. ✨",
    "Hey {firstName}! Here's a look at what you accomplished today. 🚀",
    "Another great day, {firstName}! Let's celebrate your progress. 🎉"
  ],
  gradeSectionHeaders: [
    "📊 Your Amazing Grades",
    "🏆 Scores & Achievements",
    "📈 Your Academic Progress"
  ],
  assignmentSectionHeaders: [
    "⏰ Assignments Coming Up",
    "🗓️ What's Next?",
    "📝 Your Upcoming Work"
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
    }
  ]
};

/**
 * Fetches the email content library from Firestore with caching
 * @returns {Promise<Object>} The content library or empty object on error
 */
export const getEmailContentLibrary = async () => {
  try {
    // Return cached content if still valid
    if (Date.now() - contentCache.timestamp < CACHE_DURATION_MS) {
      return contentCache.library;
    }

    // Fetch fresh content from Firestore
    const library = {};
    const snapshot = await getFirestore().collection('emailContent').get();
    
    snapshot.forEach(doc => {
      const templates = doc.data().templates || [];
      
      // Validate templates based on content type
      const isTheme = doc.id === 'visualThemes';
      const validTemplates = templates.filter(t => validateTemplate(t, isTheme ? 'theme' : 'text'));
      
      // Use default content if no valid templates found
      library[doc.id] = validTemplates.length > 0 
        ? validTemplates 
        : DEFAULT_CONTENT[doc.id] || [];
    });

    // Update cache
    contentCache = {
      library,
      timestamp: Date.now()
    };

    return library;
  } catch (error) {
    console.error("Error fetching email content library:", error);
    // Return default content on error
    return DEFAULT_CONTENT;
  }
};

/**
 * Updates a content template in the email content library
 * @param {string} contentType - Type of content (e.g., 'greetings', 'visualThemes')
 * @param {Array} templates - Array of templates to save
 * @returns {Promise<boolean>} Success status
 */
export const updateEmailContent = async (contentType, templates) => {
  try {
    // Validate input
    if (!contentType || !Array.isArray(templates)) {
      throw new Error('Invalid input parameters');
    }

    // Validate all templates
    const isTheme = contentType === 'visualThemes';
    const validTemplates = templates.filter(t => validateTemplate(t, isTheme ? 'theme' : 'text'));

    if (validTemplates.length === 0) {
      throw new Error('No valid templates provided');
    }

    // Update Firestore
    await getFirestore()
      .collection('emailContent')
      .doc(contentType)
      .set({ templates: validTemplates });

    // Invalidate cache
    contentCache.timestamp = 0;

    return true;
  } catch (error) {
    console.error(`Error updating ${contentType} content:`, error);
    return false;
  }
};

/**
 * Initializes the email content library with default content if empty
 * @returns {Promise<void>}
 */
export const initializeEmailContent = async () => {
  try {
    const snapshot = await getFirestore().collection('emailContent').get();
    
    if (snapshot.empty) {
      console.log('Initializing email content library with default content...');
      
      // Create all default content documents
      const batch = getFirestore().batch();
      
      Object.entries(DEFAULT_CONTENT).forEach(([contentType, templates]) => {
        const docRef = getFirestore().collection('emailContent').doc(contentType);
        batch.set(docRef, { templates });
      });
      
      await batch.commit();
      console.log('Email content library initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing email content library:', error);
  }
};