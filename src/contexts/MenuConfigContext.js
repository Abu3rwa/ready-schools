import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getMenuConfiguration, 
  filterMenuItems, 
  initializeDefaultMenuConfig 
} from '../services/menuConfigService';
import { useAuth } from './AuthContext';

const MenuConfigContext = createContext();

export const useMenuConfig = () => {
  const context = useContext(MenuConfigContext);
  if (!context) {
    throw new Error('useMenuConfig must be used within a MenuConfigProvider');
  }
  return context;
};

export const MenuConfigProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, userProfile } = useAuth();

  // Load menu configuration
  const loadMenuConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get menu configuration from Firebase
      const items = await getMenuConfiguration();
      setMenuItems(items);
      
      // Filter items based on user permissions
      const filtered = filterMenuItems(items, currentUser, userProfile);
      setVisibleMenuItems(filtered);
      
    } catch (err) {
      console.error('Error loading menu configuration:', err);
      setError(err.message);
      
      // Fallback to default configuration if Firebase fails
      try {
        const { getDefaultMenuConfiguration } = await import('../services/menuConfigService');
        const defaultItems = getDefaultMenuConfiguration();
        setMenuItems(defaultItems);
        
        const filtered = filterMenuItems(defaultItems, currentUser, userProfile);
        setVisibleMenuItems(filtered);
      } catch (fallbackErr) {
        console.error('Fallback menu configuration also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize menu configuration on first load
  const initializeMenuConfig = async () => {
    try {
      if (userProfile?.admin) {
        await initializeDefaultMenuConfig();
      }
    } catch (err) {
      console.warn('Failed to initialize menu configuration:', err);
      // Don't block the app if this fails
    }
  };

  // Load menu when user changes
  useEffect(() => {
    if (currentUser) {
      loadMenuConfiguration();
    } else {
      setMenuItems([]);
      setVisibleMenuItems([]);
      setLoading(false);
    }
  }, [currentUser, userProfile]);

  // Initialize menu config for admins
  useEffect(() => {
    if (userProfile?.admin) {
      initializeMenuConfig();
    }
  }, [userProfile?.admin]);

  // Refresh menu configuration
  const refreshMenuConfig = () => {
    loadMenuConfiguration();
  };

  const value = {
    menuItems,
    visibleMenuItems,
    loading,
    error,
    refreshMenuConfig
  };

  return (
    <MenuConfigContext.Provider value={value}>
      {children}
    </MenuConfigContext.Provider>
  );
};

export default MenuConfigContext;