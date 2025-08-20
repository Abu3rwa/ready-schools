import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const LessonContext = createContext();

export const useLessons = () => {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLessons must be used within a LessonProvider');
  }
  return context;
};

export const LessonProvider = ({ children }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Load lessons for the current user
  useEffect(() => {
    if (!currentUser) {
      setLessons([]);
      setLoading(false);
      return;
    }

    const loadLessons = async () => {
      try {
        setLoading(true);
        const lessonsQuery = query(
          collection(db, 'lessons'),
          where('teacherId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(lessonsQuery);
        const lessonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setLessons(lessonsData);
      } catch (err) {
        console.error('Error loading lessons:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [currentUser]);

  // Add a new lesson
  const addLesson = async (lessonData) => {
    try {
      const lessonToAdd = {
        ...lessonData,
        teacherId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'lessons'), lessonToAdd);
      const newLesson = { id: docRef.id, ...lessonToAdd };
      
      setLessons(prev => [newLesson, ...prev]);
      return newLesson;
    } catch (err) {
      console.error('Error adding lesson:', err);
      setError(err.message);
      throw err;
    }
  };

  // Update a lesson
  const updateLesson = async (lessonId, updates) => {
    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(lessonRef, updateData);
      
      setLessons(prev => 
        prev.map(lesson => 
          lesson.id === lessonId 
            ? { ...lesson, ...updateData }
            : lesson
        )
      );
    } catch (err) {
      console.error('Error updating lesson:', err);
      setError(err.message);
      throw err;
    }
  };

  // Delete a lesson
  const deleteLesson = async (lessonId) => {
    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError(err.message);
      throw err;
    }
  };

  // Get lessons for a specific date
  const getLessonsByDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return lessons.filter(lesson => lesson.date === dateString);
  };

  // Get lessons for a specific gradebook
  const getLessonsByGradebook = (gradebookId) => {
    return lessons.filter(lesson => lesson.gradebookId === gradebookId);
  };

  // Get lessons for a specific subject
  const getLessonsBySubject = (subject) => {
    return lessons.filter(lesson => lesson.subject === subject);
  };

  const value = {
    lessons,
    loading,
    error,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonsByDate,
    getLessonsByGradebook,
    getLessonsBySubject
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};
