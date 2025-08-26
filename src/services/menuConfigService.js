import { doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

/**
 * Menu Configuration Service
 * Manages admin-controlled menu items with feature status
 */

export const FEATURE_STATUS = {
  ACTIVE: 'active',
  NEW: 'new',
  BETA: 'beta',
  COMING_SOON: 'coming_soon',
  DEPRECATED: 'deprecated',
  MAINTENANCE: 'maintenance',
  PREMIUM: 'premium',
  ADMIN_ONLY: 'admin_only'
};

export const PERMISSION_LEVELS = {
  USER: 'user',
  ADMIN: 'admin',
  PREMIUM: 'premium'
};

/**
 * Get menu configuration from Firebase
 * @returns {Promise<Array>} Array of menu configurations
 */
export const getMenuConfiguration = async () => {
  try {
    const menuCollection = collection(db, "menuConfig");
    const snapshot = await getDocs(menuCollection);
    
    const menuItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by order
    return menuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error("Error fetching menu configuration:", error);
    return getDefaultMenuConfiguration(); // Fallback to default
  }
};

/**
 * Ensure menu item exists, create from default if not
 * @param {string} itemId - Menu item ID
 * @returns {Promise<void>}
 */
export const ensureMenuItemExists = async (itemId) => {
  try {
    const menuRef = doc(db, "menuConfig", itemId);
    const existingDoc = await getDoc(menuRef);
    
    if (!existingDoc.exists()) {
      // Find the item in default configuration
      const defaultItems = getDefaultMenuConfiguration();
      const defaultItem = defaultItems.find(item => item.id === itemId);
      
      if (defaultItem) {
        await setDoc(menuRef, {
          ...defaultItem,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log("Menu item created from default:", itemId);
      } else {
        console.warn("Menu item not found in default configuration:", itemId);
      }
    }
  } catch (error) {
    console.error("Error ensuring menu item exists:", error);
    throw error;
  }
};

/**
 * Update menu item configuration
 * @param {string} itemId - Menu item ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateMenuConfiguration = async (itemId, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Ensure the menu item exists before updating
    await ensureMenuItemExists(itemId);

    const menuRef = doc(db, "menuConfig", itemId);
    
    // Use setDoc with merge to handle both existing and non-existing documents
    await setDoc(menuRef, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: user.uid
    }, { merge: true });
    
    console.log("Menu configuration updated:", itemId);
  } catch (error) {
    console.error("Error updating menu configuration:", error);
    throw error;
  }
};

/**
 * Create new menu item
 * @param {Object} menuItem - Menu item configuration
 * @returns {Promise<string>} Document ID
 */
export const createMenuItem = async (menuItem) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const menuCollection = collection(db, "menuConfig");
    const docRef = await addDoc(menuCollection, {
      ...menuItem,
      createdAt: new Date(),
      createdBy: user.uid,
      updatedAt: new Date(),
      updatedBy: user.uid
    });
    
    console.log("Menu item created:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating menu item:", error);
    throw error;
  }
};

/**
 * Delete menu item
 * @param {string} itemId - Menu item ID
 * @returns {Promise<void>}
 */
export const deleteMenuItem = async (itemId) => {
  try {
    const menuRef = doc(db, "menuConfig", itemId);
    await deleteDoc(menuRef);
    console.log("Menu item deleted:", itemId);
  } catch (error) {
    console.error("Error deleting menu item:", error);
    throw error;
  }
};

/**
 * Initialize default menu configuration
 * @returns {Promise<void>}
 */
export const initializeDefaultMenuConfig = async () => {
  try {
    const defaultItems = getDefaultMenuConfiguration();
    
    for (const item of defaultItems) {
      const menuRef = doc(db, "menuConfig", item.id);
      const existingDoc = await getDoc(menuRef);
      
      if (!existingDoc.exists()) {
        await setDoc(menuRef, {
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    console.log("Default menu configuration initialized");
  } catch (error) {
    console.error("Error initializing menu configuration:", error);
    throw error;
  }
};

/**
 * Get default menu configuration (fallback)
 * @returns {Array} Default menu items
 */
export const getDefaultMenuConfiguration = () => {
  return [
    {
      id: 'dashboard',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.dashboard',
      icon: 'DashboardIcon',
      path: '/',
      order: 1,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#3498DB',
      description: 'Main dashboard view'
    },
    {
      id: 'students',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.students',
      icon: 'PeopleIcon',
      path: '/students',
      order: 2,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#2ECC71',
      description: 'Student management system'
    },
    {
      id: 'gradebooks',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.gradebooks',
      icon: 'AssessmentIcon',
      path: '/gradebooks',
      order: 3,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#F39C12',
      description: 'Gradebook management'
    },
    {
      id: 'assignments',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.assignments',
      icon: 'AssignmentIcon',
      path: '/assignments',
      order: 4,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#E74C3C',
      description: 'Assignment management'
    },
    {
      id: 'lessons',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.lessons',
      icon: 'BookIcon',
      path: '/lessons',
      order: 5,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#FF6B6B',
      description: 'Lesson planning'
    },
    {
      id: 'attendance',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.attendance',
      icon: 'EventNoteIcon',
      path: '/attendance',
      order: 6,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#9B59B6',
      description: 'Attendance tracking'
    },
    {
      id: 'behavior',
      enabled: true,
      status: FEATURE_STATUS.COMING_SOON,
      label: 'navigation.behavior',
      icon: 'PsychologyIcon',
      path: '/behavior',
      order: 7,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#1ABC9C',
      description: 'Behavior management (Coming Soon)',
      statusDate: new Date() // For testing purposes
    },
    {
      id: 'character-traits',
      enabled: true,
      status: FEATURE_STATUS.PREMIUM,
      label: 'navigation.characterTraits',
      icon: 'EmojiEventsIcon',
      path: '/character-traits',
      order: 8,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#FFD700',
      description: 'Character trait assessment (Premium Feature)'
    },
    {
      id: 'communication',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.communication',
      icon: 'EmailIcon',
      path: '/communication',
      order: 9,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#E67E22',
      description: 'Communication tools'
    },
    {
      id: 'reports',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.reports',
      icon: 'AssessmentIcon',
      path: '/reports',
      order: 10,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#E74C3C',
      description: 'Reporting system'
    },
    {
      id: 'standards',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.standards',
      icon: 'SchoolIcon',
      path: '/standards',
      order: 11,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#B266FF',
      description: 'Standards management'
    },
    {
      id: 'profile',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.profile',
      icon: 'AccountBoxIcon',
      path: '/profile',
      order: 12,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#3498DB',
      description: 'User profile'
    },
    {
      id: 'developer',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.developer',
      icon: 'CodeIcon',
      path: '/developer',
      order: 13,
      permissions: [PERMISSION_LEVELS.ADMIN],
      color: '#FF6B35',
      description: 'Developer tools'
    },
    {
      id: 'settings',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.settings',
      icon: 'SettingsIcon',
      path: '/settings',
      order: 14,
      permissions: [PERMISSION_LEVELS.USER, PERMISSION_LEVELS.ADMIN],
      color: '#95A5A6',
      description: 'Application settings'
    },
    {
      id: 'admin-users',
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      label: 'navigation.adminUsers',
      icon: 'AdminIcon',
      path: '/admin/users',
      order: 15,
      permissions: [PERMISSION_LEVELS.ADMIN],
      color: '#2C3E50',
      description: 'User administration'
    }
  ];
};

/**
 * Filter menu items based on user permissions and status
 * @param {Array} menuItems - All menu items
 * @param {Object} user - Current user object
 * @param {Object} userProfile - User profile with admin flag
 * @returns {Array} Filtered menu items with access levels
 */
export const filterMenuItems = (menuItems, user, userProfile) => {
  if (!Array.isArray(menuItems)) return [];
  
  return menuItems.filter(item => {
    // Check if enabled
    if (!item.enabled) return false;
    
    // Check basic permissions
    const userRole = userProfile?.admin ? PERMISSION_LEVELS.ADMIN : 
                    userProfile?.premium ? PERMISSION_LEVELS.PREMIUM : PERMISSION_LEVELS.USER;
    if (!item.permissions?.includes(PERMISSION_LEVELS.USER) && !item.permissions?.includes(userRole)) return false;
    
    // Show premium and coming_soon features to all users (access control handled in UI)
    if (item.status === FEATURE_STATUS.PREMIUM || item.status === FEATURE_STATUS.COMING_SOON) {
      return true;
    }
    
    // Check status-based visibility for other statuses
    switch (item.status) {
      case FEATURE_STATUS.ADMIN_ONLY:
        return userProfile?.admin === true;
      case FEATURE_STATUS.MAINTENANCE:
        return userProfile?.admin === true; // Only admins can see maintenance features
      default:
        return true;
    }
  }).map(item => {
    // Add access level information to each item
    const userRole = userProfile?.admin ? PERMISSION_LEVELS.ADMIN : 
                    userProfile?.premium ? PERMISSION_LEVELS.PREMIUM : PERMISSION_LEVELS.USER;
    
    return {
      ...item,
      accessLevel: getAccessLevel(item, userRole)
    };
  }).sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Get access level for a menu item based on user role
 * @param {Object} item - Menu item
 * @param {string} userRole - User role (user, premium, admin)
 * @returns {string} Access level (full, restricted, preview)
 */
export const getAccessLevel = (item, userRole) => {
  // Admin has full access to everything
  if (userRole === PERMISSION_LEVELS.ADMIN) {
    return 'full';
  }
  
  // Check specific feature status
  switch (item.status) {
    case FEATURE_STATUS.COMING_SOON:
      // Only admins can access coming soon features
      return 'preview';
    case FEATURE_STATUS.PREMIUM:
      // Premium users can access, regular users see preview
      return userRole === PERMISSION_LEVELS.PREMIUM ? 'full' : 'preview';
    case FEATURE_STATUS.ADMIN_ONLY:
      return 'restricted'; // Non-admins shouldn't see this, but just in case
    default:
      return 'full';
  }
};

/**
 * Get status badge info for display
 * @param {string} status - Feature status
 * @param {Date} statusDate - Status date for auto-expiry
 * @returns {Object} Badge info
 */
export const getStatusBadge = (status, statusDate) => {
  const now = new Date();
  const statusTime = new Date(statusDate);
  const daysDiff = (now - statusTime) / (1000 * 60 * 60 * 24);
  
  // Auto-expire "new" status after 7 days
  if (status === FEATURE_STATUS.NEW && daysDiff > 7) {
    return null; // No badge for expired "new" status
  }
  
  switch (status) {
    case FEATURE_STATUS.NEW:
      return { text: 'NEW', color: 'success', icon: '🆕' };
    case FEATURE_STATUS.BETA:
      return { text: 'BETA', color: 'warning', icon: '🧪' };
    case FEATURE_STATUS.COMING_SOON:
      return { text: 'SOON', color: 'info', icon: '🔜' };
    case FEATURE_STATUS.DEPRECATED:
      return { text: 'DEPRECATED', color: 'error', icon: '⚠️' };
    case FEATURE_STATUS.MAINTENANCE:
      return { text: 'MAINTENANCE', color: 'warning', icon: '🔧' };
    case FEATURE_STATUS.PREMIUM:
      return { text: 'PREMIUM', color: 'secondary', icon: '💎' };
    case FEATURE_STATUS.ADMIN_ONLY:
      return { text: 'ADMIN', color: 'default', icon: '👨‍💼' };
    default:
      return null;
  }
};