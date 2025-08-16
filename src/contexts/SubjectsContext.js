import React, { createContext, useState, useContext, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../services/subjectsService';
import { useAuth } from './AuthContext';

const SubjectsContext = createContext();

export const useSubjects = () => {
  const context = useContext(SubjectsContext);
  if (!context) {
    throw new Error('useSubjects must be used within a SubjectsProvider');
  }
  return context;
};

export const SubjectsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadSubjects();
    } else {
      setSubjects([]);
      setLoading(false);
    }
  }, [currentUser]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const userSubjects = await getSubjects();
      setSubjects(userSubjects);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async (subjectData) => {
    try {
      const newSubject = await createSubject(subjectData);
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const editSubject = async (id, updates) => {
    try {
      const updatedSubject = await updateSubject(id, updates);
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updatedSubject } : s));
      return updatedSubject;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeSubject = async (id) => {
    try {
      await deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    subjects,
    loading,
    error,
    loadSubjects,
    addSubject,
    editSubject,
    removeSubject,
  };

  return (
    <SubjectsContext.Provider value={value}>
      {children}
    </SubjectsContext.Provider>
  );
};
