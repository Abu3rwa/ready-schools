import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getContentLibrary,
  updateContentLibrary,
  checkAndMigrateTeacherContent 
} from '../services/contentLibraryService';
 
const EmailContentContext = createContext();

export const useEmailContent = () => {
  const context = useContext(EmailContentContext);
  if (!context) {
    throw new Error('useEmailContent must be used within an EmailContentProvider');
  }
  return context;
};

export const EmailContentProvider = ({ children, teacherId }) => {
  const [contentLibrary, setContentLibrary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load content library on mount and when teacherId changes
  useEffect(() => {
    if (teacherId) {
      loadContentLibrary();
    }
  }, [teacherId]);

  const loadContentLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the migration function to check for existing content and migrate if needed
      const data = await checkAndMigrateTeacherContent(teacherId);
      setContentLibrary(data);
    } catch (err) {
      setError('Failed to load content library: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTemplate = async (contentType, content) => {
    try {
      setError(null);
      
      // Get current content for this type
      const currentContent = contentLibrary[contentType] || [];
      const updatedContent = [...currentContent, content];
      
      // Update the content library
      const result = await updateContentLibrary(teacherId, { [contentType]: updatedContent });
      
      if (result.success) {
        // Update local state
        setContentLibrary(prev => ({
          ...prev,
          [contentType]: updatedContent
        }));
        return true;
      } else {
        setError('Failed to add template: ' + result.message);
        return false;
      }
    } catch (err) {
      setError('Failed to add template: ' + err.message);
      return false;
    }
  };

  const updateTemplate = async (contentType, index, newContent) => {
    try {
      setError(null);
      
      // Get current content for this type
      const currentContent = [...(contentLibrary[contentType] || [])];
      currentContent[index] = newContent;
      
      // Update the content library
      const result = await updateContentLibrary(teacherId, { [contentType]: currentContent });
      
      if (result.success) {
        // Update local state
        setContentLibrary(prev => ({
          ...prev,
          [contentType]: currentContent
        }));
        return true;
      } else {
        setError('Failed to update template: ' + result.message);
        return false;
      }
    } catch (err) {
      setError('Failed to update template: ' + err.message);
      return false;
    }
  };

  const deleteTemplate = async (contentType, index) => {
    try {
      setError(null);
      
      // Get current content for this type
      const currentContent = [...(contentLibrary[contentType] || [])];
      currentContent.splice(index, 1);
      
      // Update the content library
      const result = await updateContentLibrary(teacherId, { [contentType]: currentContent });
      
      if (result.success) {
        // Update local state
        setContentLibrary(prev => ({
          ...prev,
          [contentType]: currentContent
        }));
        return true;
      } else {
        setError('Failed to delete template: ' + result.message);
        return false;
      }
    } catch (err) {
      setError('Failed to delete template: ' + err.message);
      return false;
    }
  };

  const refreshContentLibrary = async () => {
    try {
      setError(null);
      await loadContentLibrary();
    } catch (err) {
      setError('Failed to refresh content library: ' + err.message);
    }
  };

  const bulkUpdate = async (contentType, contentArray) => {
    try {
      setError(null);
      
      // Update the entire content type
      const result = await updateContentLibrary(teacherId, { [contentType]: contentArray });
      
      if (result.success) {
        // Update local state
        setContentLibrary(prev => ({
          ...prev,
          [contentType]: contentArray
        }));
        return true;
      } else {
        setError('Failed to bulk update: ' + result.message);
        return false;
      }
    } catch (err) {
      setError('Failed to bulk update: ' + err.message);
      return false;
    }
  };

  const clearError = () => setError(null);

  const value = {
    contentLibrary,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    bulkUpdate,
    loadContentLibrary,
    clearError,
    setError,
    refreshContentLibrary
  };

  return (
    <EmailContentContext.Provider value={value}>
      {children}
    </EmailContentContext.Provider>
  );
};
