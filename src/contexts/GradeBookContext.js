import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useGrades } from './GradeContext';
import { useAssignments } from './AssignmentContext';
import { useStudents } from './StudentContext';
import eventEmitter from '../services/eventEmitter';
import { 
  getGradeBookStandards, 
  calculateCombinedAnalytics,
  getProficiencyScale 
} from '../services/standardsIntegrationService';

const GradeBookContext = createContext();

export const useGradeBooks = () => {
  const context = useContext(GradeBookContext);
  if (!context) {
    throw new Error('useGradeBooks must be used within a GradeBookProvider');
  }
  return context;
};

export const GradeBookProvider = ({ children }) => {
  const { currentUser: user } = useAuth();
  const { grades } = useGrades();
  const { assignments } = useAssignments();
  const { students } = useStudents();
  const [gradeBooks, setGradeBooks] = useState([]);
  const [currentGradeBook, setCurrentGradeBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradeBookTemplates, setGradeBookTemplates] = useState({});

  // Create virtual grade books from existing grades and assignments data
  const createVirtualGradeBooks = () => {
    if (!assignments || !students || !grades) return [];

    const gradeBooksMap = new Map();

    // Seed grade books from assignments so subjects with no grades yet still appear
    assignments.forEach(assignment => {
      const subject = assignment.subject;
      if (!subject) return;

      if (!gradeBooksMap.has(subject)) {
        // Use the enhanced ensureGradeBookForSubject function
        const gradeBook = ensureGradeBookForSubject(subject);
        if (gradeBook) {
          gradeBooksMap.set(subject, gradeBook);
        }
      }
    });

    // Attach assignments to their subject grade book
    assignments.forEach(assignment => {
      const subject = assignment.subject;
      if (!subject) return;
      const gb = gradeBooksMap.get(subject);
      if (!gb) return;
      if (!gb.assignments.includes(assignment.id)) {
        gb.assignments.push(assignment.id);
      }
    });

    // Seed/update from grades to include students and last modified
    grades.forEach(grade => {
      const subject = grade.subject;
      if (!subject) return;

      if (!gradeBooksMap.has(subject)) {
        // If there are grades for a subject with no assignment (edge), create entry
        const gradeBook = ensureGradeBookForSubject(subject);
        if (gradeBook) {
          gradeBooksMap.set(subject, gradeBook);
        }
      }

      const gb = gradeBooksMap.get(subject);
      // Track students who have grades in this subject
      if (grade.studentId && !gb.students.includes(grade.studentId)) {
        gb.students.push(grade.studentId);
      }
      gb.totalGrades = (gb.totalGrades || 0) + 1;
      gb.lastModified = new Date().toISOString();
    });

    // Sort for stable UI
    return Array.from(gradeBooksMap.values()).sort(
      (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
    );
  };

  // Load all grade books for the current user
  const loadGradeBooks = async () => {
    try {
      setLoading(true);
      
      // Create virtual grade books from existing data
      const virtualGradeBooks = createVirtualGradeBooks();
      setGradeBooks(virtualGradeBooks);
      
    } catch (err) {
      console.error('Error loading grade books:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load gradebooks when component mounts or when dependencies change
  useEffect(() => {
    if (user && assignments && students && grades) {
      loadGradeBooks();
    }
  }, [user, assignments, students, grades]);

  // Create a new grade book
  const createGradeBook = async (gradeBookData) => {
    try {
      if (!user?.uid) {
        throw new Error('User must be authenticated to create a grade book');
      }

      const newGradeBookRef = doc(collection(db, 'gradebooks'));
      const newGradeBook = {
        ...gradeBookData,
        id: newGradeBookRef.id,
        teacherId: user.uid,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'active',
        students: [],
        assignments: [],
        categoryWeights: (gradeBookData.categories || []).reduce((acc, cat) => {
          acc[cat.name] = cat.weight;
          return acc;
        }, {}),
        settings: {
          allowLateSubmissions: true,
          autoCalculateFinal: true,
          weightCategories: true,
          ...gradeBookData.settings
        }
      };

      await setDoc(newGradeBookRef, newGradeBook);
      setGradeBooks(prev => [newGradeBook, ...prev]);
      return newGradeBook;
    } catch (err) {
      console.error('Error creating grade book:', err);
      throw err;
    }
  };

  // Update a grade book
  const updateGradeBook = async (gradeBookId, updates) => {
    try {
      const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
      const updateData = {
        ...updates,
        lastModified: new Date().toISOString(),
        categoryWeights: (updates.categories || []).reduce((acc, cat) => {
          acc[cat.name] = cat.weight;
          return acc;
        }, {}),
      };

      await updateDoc(gradeBookRef, updateData);

      setGradeBooks(prev => 
        prev.map(gb => 
          gb.id === gradeBookId 
            ? { ...gb, ...updateData }
            : gb
        )
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(prev => ({ ...prev, ...updateData }));
      }
    } catch (err) {
      console.error('Error updating grade book:', err);
      throw err;
    }
  };

  // Delete a grade book
  const deleteGradeBook = async (gradeBookId) => {
    try {
      // Check if it's a virtual gradebook (which doesn't have a real Firestore doc to delete)
      const isVirtual = gradeBookId.startsWith('gradebook-');
      
      if (!isVirtual) {
        // First, delete from Firestore
        const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
        await deleteDoc(gradeBookRef);
      }

      // Then, update the local state
      setGradeBooks(prev => prev.filter(gb => gb.id !== gradeBookId));
      
      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(null);
      }
    } catch (err) {
      console.error('Error deleting grade book:', err);
      throw err;
    }
  };

  // Load a specific grade book
  const loadGradeBook = async (gradeBookId) => {
    try {
      setLoading(true);
      
      // Find the grade book in our virtual grade books
      let gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);

          if (gradeBook) {
            setCurrentGradeBook(gradeBook);
            return gradeBook;
          }

      // If not found, try to fetch from Firestore
      const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
      const gradeBookSnap = await getDoc(gradeBookRef);

      if (gradeBookSnap.exists()) {
        const fetchedGradeBook = { id: gradeBookSnap.id, ...gradeBookSnap.data() };
        setCurrentGradeBook(fetchedGradeBook);
        // Optionally add it to the local list
        setGradeBooks(prev => {
          if (prev.find(gb => gb.id === fetchedGradeBook.id)) {
            return prev.map(gb => gb.id === fetchedGradeBook.id ? fetchedGradeBook : gb);
          }
          return [...prev, fetchedGradeBook];
        });
        return fetchedGradeBook;
      } else {
        throw new Error('Grade book not found');
      }
    } catch (err) {
      console.error('Error loading grade book:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Duplicate a grade book
  const duplicateGradeBook = async (gradeBookId) => {
    try {
      const originalGradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
      if (!originalGradeBook) throw new Error('Grade book not found');

      const duplicatedData = {
        ...originalGradeBook,
        name: `${originalGradeBook.name} (Copy)`,
        status: 'active',
        students: [], // Reset students for new class
        assignments: [], // Reset assignments for new class
        categories: originalGradeBook.categories?.map(cat => ({
          ...cat,
          assignments: [] // Reset assignments for each category
        })) || []
      };

      delete duplicatedData.id; // Remove the original ID
      delete duplicatedData.createdAt;
      delete duplicatedData.lastModified;

      return await createGradeBook(duplicatedData);
    } catch (err) {
      console.error('Error duplicating grade book:', err);
      throw err;
    }
  };



  // Get grade book statistics
  const getGradeBookStats = (gradeBookId) => {
    const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
    if (!gradeBook) return null;

    return {
      totalStudents: gradeBook.students?.length || 0,
      totalAssignments: gradeBook.assignments?.length || 0,
      totalCategories: gradeBook.categories?.length || 0,
      lastModified: gradeBook.lastModified,
      status: gradeBook.status
    };
  };

  // Enhanced analytics with standards integration
  const getGradeBookAnalytics = async (gradeBookId) => {
    const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
    if (!gradeBook) return null;

    try {
      // Get traditional grades for this subject
      const subjectGrades = grades.filter(
        (grade) =>
          grade.subject === gradeBook.subject &&
          grade.score !== null &&
          grade.score !== undefined
      );

      // Get standards for this gradebook
      const standardsData = await getGradeBookStandards(gradeBookId, gradeBook.assignments);
      
      // Calculate combined analytics, passing grade book settings, all assignments, and all students
      const analytics = calculateCombinedAnalytics(subjectGrades, standardsData, assignments, students, gradeBook.settings);
      
      return {
        ...analytics,
        gradeBookInfo: {
          subject: gradeBook.subject,
          totalAssignments: gradeBook.assignments.length,
          totalStudents: gradeBook.students.length,
          proficiencyScale: getProficiencyScale()
        }
      };
    } catch (error) {
      console.error("Error calculating gradebook analytics:", error);
      return null;
    }
  };

  // Get standards data for a gradebook
  const getGradeBookStandardsData = async (gradeBookId) => {
    const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
    if (!gradeBook) return [];

    try {
      return await getGradeBookStandards(gradeBookId, gradeBook.assignments);
    } catch (error) {
      console.error("Error fetching gradebook standards:", error);
      return [];
    }
  };

  // Enhanced functions for assignment-gradebook integration
  
  // Ensure gradebook exists for a subject
  const ensureGradeBookForSubject = (subject) => {
    if (!subject) return null;
    
    // Check if gradebook already exists for this subject
    const existingGradeBook = gradeBooks.find(gb => gb.subject === subject);
    if (!existingGradeBook) {
      // Default categories for auto-created gradebooks
      const defaultCategories = [
        { name: 'Homework', weight: 20, color: '#4CAF50', description: 'Regular homework assignments' },
        { name: 'Quiz', weight: 25, color: '#2196F3', description: 'Short assessments and quizzes' },
        { name: 'Test', weight: 30, color: '#FF9800', description: 'Major tests and exams' },
        { name: 'Project', weight: 15, color: '#9C27B0', description: 'Long-term projects and presentations' },
        { name: 'Participation', weight: 10, color: '#607D8B', description: 'Class participation and engagement' }
      ];

      // Create new gradebook for the subject
      const newGradeBook = {
        id: `gradebook-${subject.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${subject} - Grade Book`,
        subject,
        gradeLevel: "All Grades",
        academicYear: new Date().getFullYear().toString(),
        semester: "Current",
        description: `Grade book for ${subject} subject`,
        teacherId: user?.uid || 'default',
        userId: user?.uid || 'default', // Add userId for consistency
        status: 'active',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        students: [],
        assignments: [],
        categories: defaultCategories,
        categoryWeights: defaultCategories.reduce((acc, cat) => {
          acc[cat.name] = cat.weight;
          return acc;
        }, {}),
        settings: {
          gradingScale: 'weighted_categories',
          allowLateSubmissions: true,
          autoCalculateFinal: true,
          weightCategories: true,
          roundingMethod: 'nearest_whole',
          gradeDisplay: 'percentage',
          traditionalWeight: 0.6, // Default weight
          standardsWeight: 0.4    // Default weight
        },
        totalGrades: 0
      };
      
      // Add to gradebooks list
      setGradeBooks(prev => [newGradeBook, ...prev]);
      return newGradeBook;
    }
    return existingGradeBook;
  };

  // Add assignment to gradebook
  const addAssignmentToGradeBook = (subject, assignmentId) => {
    if (!subject || !assignmentId) return;
    
    setGradeBooks(prev => 
      prev.map(gb => 
        gb.subject === subject 
          ? { 
              ...gb, 
              assignments: gb.assignments.includes(assignmentId) 
                ? gb.assignments 
                : [...gb.assignments, assignmentId], 
              lastModified: new Date().toISOString() 
            }
          : gb
      )
    );
  };

  // Remove assignment from gradebook
  const removeAssignmentFromGradeBook = (subject, assignmentId) => {
    if (!subject || !assignmentId) return;
    
    setGradeBooks(prev => 
      prev.map(gb => 
        gb.subject === subject 
          ? { 
              ...gb, 
              assignments: gb.assignments.filter(id => id !== assignmentId), 
              lastModified: new Date().toISOString() 
            }
          : gb
      )
    );
  };

  // Update assignment in gradebook
  const updateAssignmentInGradeBook = (subject, assignmentId, updates) => {
    if (!subject || !assignmentId) return;
    
    setGradeBooks(prev => 
      prev.map(gb => 
        gb.subject === subject 
          ? { 
              ...gb, 
              assignments: gb.assignments.map(assignment => 
                assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
              ), 
              lastModified: new Date().toISOString() 
            }
          : gb
      )
    );
  };

  // Handle assignment updates from event system
  const handleAssignmentUpdated = (assignmentId, updates) => {
    // Find which gradebook contains this assignment
    const gradeBook = gradeBooks.find(gb => 
      gb.assignments.includes(assignmentId)
    );
    
    if (gradeBook) {
      updateAssignmentInGradeBook(gradeBook.subject, assignmentId, updates);
    }
  };

  const handleAssignmentDeleted = (assignmentId) => {
    // Find which gradebook contains this assignment
    const gradeBook = gradeBooks.find(gb => 
      gb.assignments.includes(assignmentId)
    );
    
    if (gradeBook) {
      removeAssignmentFromGradeBook(gradeBook.subject, assignmentId);
    }
  };

  // Event listeners for assignment-gradebook integration
  useEffect(() => {
    const handleAssignmentAddedEvent = ({ subject, assignmentId }) => {
      addAssignmentToGradeBook(subject, assignmentId);
    };
    
    const handleAssignmentUpdatedEvent = ({ assignmentId, updates }) => {
      handleAssignmentUpdated(assignmentId, updates);
    };
    
    const handleAssignmentDeletedEvent = ({ assignmentId }) => {
      handleAssignmentDeleted(assignmentId);
    };
    
    // Subscribe to events
    eventEmitter.on('assignmentAdded', handleAssignmentAddedEvent);
    eventEmitter.on('assignmentUpdated', handleAssignmentUpdatedEvent);
    eventEmitter.on('assignmentDeleted', handleAssignmentDeletedEvent);
    
    // Cleanup event listeners
    return () => {
      eventEmitter.off('assignmentAdded', handleAssignmentAddedEvent);
      eventEmitter.off('assignmentUpdated', handleAssignmentUpdatedEvent);
      eventEmitter.off('assignmentDeleted', handleAssignmentDeletedEvent);
    };
  }, []);

  // Term-based gradebook management functions
  const createTermGradeBook = async (gradeBookData) => {
    try {
      if (!user?.uid) {
        throw new Error('User must be authenticated to create a grade book');
      }

      const {
        name,
        subject,
        gradeLevel,
        academicYear,
        semester,
        term,
        categories,
        settings = {}
      } = gradeBookData;

      const newGradeBook = {
        id: `gradebook-${academicYear}-${semester}-${term}-${subject.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        subject,
        gradeLevel,
        academicYear,
        semester,
        term,
        teacherId: user.uid, // Ensure this matches the Firestore rule
        userId: user.uid, // Also include userId for consistency
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'active',
        students: [],
        assignments: [],
        totalGrades: 0,
        
        // Configurable category structure
        categories: categories || [],
        categoryWeights: (categories || []).reduce((acc, cat) => {
          acc[cat.name] = cat.weight || 0;
          return acc;
        }, {}),
        categorySettings: {
          allowLateSubmissions: true,
          autoCalculateFinal: true,
          weightCategories: true,
          roundingMethod: 'nearest_whole',
          gradeDisplay: 'percentage'
        },
        
        // Enhanced settings
        settings: {
          gradingScale: 'weighted_categories',
          allowLateSubmissions: true,
          autoCalculateFinal: true,
          weightCategories: true,
          roundingMethod: 'nearest_whole',
          gradeDisplay: 'percentage',
          finalGradeFormula: 'weighted_average',
          ...settings
        }
      };

      // Save to Firestore first
      try {
        const gradeBookRef = doc(db, 'gradebooks', newGradeBook.id);
        await setDoc(gradeBookRef, newGradeBook);
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore, using local storage only:', firestoreError);
        // Continue with local state if Firestore fails
      }

      // Add to local state
      setGradeBooks(prev => {
        const filtered = prev.filter(gb => gb.id !== newGradeBook.id);
        return [newGradeBook, ...filtered];
      });

      return newGradeBook;
    } catch (err) {
      console.error('Error creating term grade book:', err);
      throw err;
    }
  };

  const cloneGradeBookForNewTerm = async (sourceGradeBookId, newTermData) => {
    try {
      const sourceGradeBook = gradeBooks.find(gb => gb.id === sourceGradeBookId);
      if (!sourceGradeBook) {
        throw new Error('Source grade book not found');
      }

      const {
        academicYear,
        semester,
        term
      } = newTermData;

      const clonedGradeBook = {
        ...sourceGradeBook,
        id: `gradebook-${academicYear}-${semester}-${term}-${sourceGradeBook.subject.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${sourceGradeBook.name} - ${term}`,
        academicYear,
        semester,
        term,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'active',
        students: [],
        assignments: [],
        totalGrades: 0
      };

      // Save to Firestore
      const gradeBookRef = doc(db, 'gradebooks', clonedGradeBook.id);
      await setDoc(gradeBookRef, clonedGradeBook);

      // Add to local state
      setGradeBooks(prev => {
        const filtered = prev.filter(gb => gb.id !== clonedGradeBook.id);
        return [clonedGradeBook, ...filtered];
      });

      return clonedGradeBook;
    } catch (err) {
      console.error('Error cloning grade book:', err);
      throw err;
    }
  };

  const updateGradeBookCategories = async (gradeBookId, categories) => {
    try {
      const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
      if (!gradeBook) {
        throw new Error('Grade book not found');
      }

      const updatedGradeBook = {
        ...gradeBook,
        categories,
        lastModified: new Date().toISOString()
      };

      // Save to Firestore
      const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
      await updateDoc(gradeBookRef, {
        categories,
        lastModified: new Date().toISOString()
      });

      // Update local state
      setGradeBooks(prev => 
        prev.map(gb => gb.id === gradeBookId ? updatedGradeBook : gb)
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(updatedGradeBook);
      }

      return updatedGradeBook;
    } catch (err) {
      console.error('Error updating grade book categories:', err);
      throw err;
    }
  };

  const getGradeBooksByTerm = (academicYear, semester, term) => {
    return gradeBooks.filter(gb => 
      gb.academicYear === academicYear && 
      gb.semester === semester && 
      gb.term === term
    );
  };

  const getGradeBooksBySubject = (subject) => {
    return gradeBooks.filter(gb => gb.subject === subject);
  };

  const archiveGradeBook = async (gradeBookId) => {
    try {
      const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
      await updateDoc(gradeBookRef, {
        status: 'archived',
        lastModified: new Date().toISOString()
      });

      setGradeBooks(prev => 
        prev.map(gb => 
          gb.id === gradeBookId 
            ? { ...gb, status: 'archived', lastModified: new Date().toISOString() }
            : gb
        )
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(prev => ({ ...prev, status: 'archived' }));
      }
    } catch (err) {
      console.error('Error archiving grade book:', err);
      throw err;
    }
  };

  const activateGradeBook = async (gradeBookId) => {
    try {
      const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
      await updateDoc(gradeBookRef, {
        status: 'active',
        lastModified: new Date().toISOString()
      });

      setGradeBooks(prev => 
        prev.map(gb => 
          gb.id === gradeBookId 
            ? { ...gb, status: 'active', lastModified: new Date().toISOString() }
            : gb
        )
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(prev => ({ ...prev, status: 'active' }));
      }
    } catch (err) {
      console.error('Error activating grade book:', err);
      throw err;
    }
  };

  // Category management functions
  const addCategoryToGradeBook = async (gradeBookId, categoryData) => {
    try {
      const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
      if (!gradeBook) {
        throw new Error('Grade book not found');
      }

      // Validate category data
      if (!categoryData.name || !categoryData.weight) {
        throw new Error('Category name and weight are required');
      }

      // Check if category already exists
      if (gradeBook.categories.some(cat => cat.name === categoryData.name)) {
        throw new Error('Category with this name already exists');
      }

      // Validate total weight doesn't exceed 100%
      const newTotalWeight = gradeBook.categories.reduce((sum, cat) => sum + cat.weight, 0) + categoryData.weight;
      if (newTotalWeight > 100) {
        throw new Error('Total category weight cannot exceed 100%');
      }

      const newCategory = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: categoryData.name,
        weight: categoryData.weight,
        color: categoryData.color || '#607D8B',
        description: categoryData.description || '',
        createdAt: new Date().toISOString()
      };

      const updatedGradeBook = {
        ...gradeBook,
        categories: [...gradeBook.categories, newCategory],
        categoryWeights: {
          ...gradeBook.categoryWeights,
          [newCategory.name]: newCategory.weight
        },
        lastModified: new Date().toISOString()
      };

      // Save to Firestore
      try {
        const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
        await updateDoc(gradeBookRef, {
          categories: updatedGradeBook.categories,
          categoryWeights: updatedGradeBook.categoryWeights,
          lastModified: updatedGradeBook.lastModified
        });
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore, using local storage only:', firestoreError);
      }

      // Update local state
      setGradeBooks(prev => 
        prev.map(gb => gb.id === gradeBookId ? updatedGradeBook : gb)
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(updatedGradeBook);
      }

      return newCategory;
    } catch (err) {
      console.error('Error adding category to grade book:', err);
      throw err;
    }
  };

  const updateCategoryInGradeBook = async (gradeBookId, categoryId, updates) => {
    try {
      const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
      if (!gradeBook) {
        throw new Error('Grade book not found');
      }

      const categoryIndex = gradeBook.categories.findIndex(cat => cat.id === categoryId);
      if (categoryIndex === -1) {
        throw new Error('Category not found');
      }

      const updatedCategories = [...gradeBook.categories];
      const oldCategory = updatedCategories[categoryIndex];
      const updatedCategory = { ...oldCategory, ...updates };

      // If weight is being updated, validate total weight
      if (updates.weight !== undefined) {
        const newTotalWeight = gradeBook.categories.reduce((sum, cat, idx) => {
          if (idx === categoryIndex) return sum + updates.weight;
          return sum + cat.weight;
        }, 0);
        
        if (newTotalWeight > 100) {
          throw new Error('Total category weight cannot exceed 100%');
        }
      }

      updatedCategories[categoryIndex] = updatedCategory;

      // Update category weights
      const updatedCategoryWeights = { ...gradeBook.categoryWeights };
      if (updates.name) {
        // If name changed, update the weight mapping
        delete updatedCategoryWeights[oldCategory.name];
        updatedCategoryWeights[updates.name] = updatedCategory.weight;
      } else if (updates.weight !== undefined) {
        updatedCategoryWeights[updatedCategory.name] = updates.weight;
      }

      const updatedGradeBook = {
        ...gradeBook,
        categories: updatedCategories,
        categoryWeights: updatedCategoryWeights,
        lastModified: new Date().toISOString()
      };

      // Save to Firestore
      try {
        const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
        await updateDoc(gradeBookRef, {
          categories: updatedGradeBook.categories,
          categoryWeights: updatedGradeBook.categoryWeights,
          lastModified: updatedGradeBook.lastModified
        });
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore, using local storage only:', firestoreError);
      }

      // Update local state
      setGradeBooks(prev => 
        prev.map(gb => gb.id === gradeBookId ? updatedGradeBook : gb)
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(updatedGradeBook);
      }

      return updatedCategory;
    } catch (err) {
      console.error('Error updating category in grade book:', err);
      throw err;
    }
  };

  const removeCategoryFromGradeBook = async (gradeBookId, categoryId) => {
    try {
      const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
      if (!gradeBook) {
        throw new Error('Grade book not found');
      }

      const categoryIndex = gradeBook.categories.findIndex(cat => cat.id === categoryId);
      if (categoryIndex === -1) {
        throw new Error('Category not found');
      }

      const categoryToRemove = gradeBook.categories[categoryIndex];

      // Check if category has assignments
      const hasAssignments = assignments.some(assignment => 
        assignment.subject === gradeBook.subject && assignment.category === categoryToRemove.name
      );

      if (hasAssignments) {
        throw new Error('Cannot remove category that has assignments. Please reassign or delete assignments first.');
      }

      const updatedCategories = gradeBook.categories.filter(cat => cat.id !== categoryId);
      const updatedCategoryWeights = { ...gradeBook.categoryWeights };
      delete updatedCategoryWeights[categoryToRemove.name];

      const updatedGradeBook = {
        ...gradeBook,
        categories: updatedCategories,
        categoryWeights: updatedCategoryWeights,
        lastModified: new Date().toISOString()
      };

      // Save to Firestore
      try {
        const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
        await updateDoc(gradeBookRef, {
          categories: updatedGradeBook.categories,
          categoryWeights: updatedGradeBook.categoryWeights,
          lastModified: updatedGradeBook.lastModified
        });
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore, using local storage only:', firestoreError);
      }

      // Update local state
      setGradeBooks(prev => 
        prev.map(gb => gb.id === gradeBookId ? updatedGradeBook : gb)
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(updatedGradeBook);
      }

      return categoryToRemove;
    } catch (err) {
      console.error('Error removing category from grade book:', err);
      throw err;
    }
  };

  const reorderCategoriesInGradeBook = async (gradeBookId, categoryIds) => {
    try {
      const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
      if (!gradeBook) {
        throw new Error('Grade book not found');
      }

      // Validate that all provided category IDs exist
      const existingCategoryIds = gradeBook.categories.map(cat => cat.id);
      const isValidOrder = categoryIds.every(id => existingCategoryIds.includes(id));
      if (!isValidOrder) {
        throw new Error('Invalid category order provided');
      }

      // Reorder categories based on the provided order
      const reorderedCategories = categoryIds.map(id => 
        gradeBook.categories.find(cat => cat.id === id)
      ).filter(Boolean);

      const updatedGradeBook = {
        ...gradeBook,
        categories: reorderedCategories,
        lastModified: new Date().toISOString()
      };

      // Save to Firestore
      try {
        const gradeBookRef = doc(db, 'gradebooks', gradeBookId);
        await updateDoc(gradeBookRef, {
          categories: updatedGradeBook.categories,
          lastModified: updatedGradeBook.lastModified
        });
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore, using local storage only:', firestoreError);
      }

      // Update local state
      setGradeBooks(prev => 
        prev.map(gb => gb.id === gradeBookId ? updatedGradeBook : gb)
      );

      if (currentGradeBook?.id === gradeBookId) {
        setCurrentGradeBook(updatedGradeBook);
      }

      return updatedGradeBook;
    } catch (err) {
      console.error('Error reordering categories in grade book:', err);
      throw err;
    }
  };

  const value = {
    gradeBooks,
    currentGradeBook,
    loading,
    error,
    loadGradeBooks,
    createGradeBook,
    updateGradeBook,
    deleteGradeBook,
    loadGradeBook,
    duplicateGradeBook,
    archiveGradeBook,
    activateGradeBook,
    getGradeBookStats,
    setCurrentGradeBook,
    // Term-based gradebook management
    createTermGradeBook,
    cloneGradeBookForNewTerm,
    updateGradeBookCategories,
    getGradeBooksByTerm,
    getGradeBooksBySubject,
    // New integration functions
    ensureGradeBookForSubject,
    addAssignmentToGradeBook,
    removeAssignmentFromGradeBook,
    updateAssignmentInGradeBook,
    handleAssignmentUpdated,
    handleAssignmentDeleted,
    // Enhanced analytics functions
    getGradeBookAnalytics,
    getGradeBookStandardsData,
    // Category management functions
    addCategoryToGradeBook,
    updateCategoryInGradeBook,
    removeCategoryFromGradeBook,
    reorderCategoriesInGradeBook
  };

  return (
    <GradeBookContext.Provider value={value}>
      {children}
    </GradeBookContext.Provider>
  );
};
