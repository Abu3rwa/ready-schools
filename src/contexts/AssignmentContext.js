import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getAssignments,
  createAssignment,
  updateAssignment as updateAssignmentAPI,
  deleteAssignment as deleteAssignmentAPI,
} from "../services/apiService";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import eventEmitter from "../services/eventEmitter";
import { 
  getAssignmentStandards, 
  createStandardMapping, 
  updateStandardMapping, 
  deleteStandardMapping,
  getProficiencyScale 
} from "../services/standardsIntegrationService";

// Create the context
const AssignmentContext = createContext();

// Create a custom hook to use the assignment context
export const useAssignments = () => {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error("useAssignments must be used within an AssignmentProvider");
  }
  return context;
};

// Enhanced assignment categories with weights and metadata
const ASSIGNMENT_CATEGORIES = {
  "Tests and Quizzes": {
    subcategories: [
      "Unit Test",
      "Chapter Quiz",
      "Midterm Exam",
      "Final Exam",
      "Pop Quiz",
      "Vocabulary Quiz",
      "Math Quiz",
      "Science Quiz",
      "History Quiz",
      "Literature Quiz",
    ],
    defaultWeight: 40,
    color: "#F44336",
    description: "Assessments and evaluations"
  },
  "Homework and Classwork": {
    subcategories: [
      "Reading Assignment",
      "Worksheet",
      "Problem Set",
      "Class Discussion",
      "Group Work",
      "Individual Practice",
      "Review Questions",
      "Study Guide",
    ],
    defaultWeight: 15,
    color: "#4CAF50",
    description: "Regular assignments and in-class work"
  },
  "Projects and Presentations": {
    subcategories: [
      "Research Project",
      "Oral Presentation",
      "Poster Presentation",
      "Creative Project",
      "Science Fair Project",
      "History Project",
      "Art Project",
      "Technology Project",
    ],
    defaultWeight: 25,
    color: "#FF9800",
    description: "Extended projects and presentations"
  },
  "Labs and Experiments": {
    subcategories: [
      "Science Lab",
      "Computer Lab",
      "Field Trip",
      "Experiment Report",
      "Lab Analysis",
      "Data Collection",
    ],
    defaultWeight: 20,
    color: "#2196F3",
    description: "Laboratory work and experiments"
  },
  "Essays and Papers": {
    subcategories: [
      "Argumentative Essay",
      "Research Paper",
      "Creative Writing",
      "Book Report",
      "Literary Analysis",
      "Compare/Contrast Essay",
      "Persuasive Essay",
      "Narrative Essay",
    ],
    defaultWeight: 30,
    color: "#9C27B0",
    description: "Written assignments and papers"
  },
  "Participation and Attendance": {
    subcategories: [
      "Class Participation",
      "Discussion Participation",
      "Group Participation",
      "Attendance",
      "Classroom Behavior",
    ],
    defaultWeight: 10,
    color: "#607D8B",
    description: "Class participation and attendance"
  },
  "Extra Credit Opportunities": {
    subcategories: [
      "Bonus Assignment",
      "Extra Credit Project",
      "Challenge Problem",
      "Enrichment Activity",
    ],
    defaultWeight: 5,
    color: "#795548",
    description: "Optional extra credit work"
  },
};

// Assignment templates with category weights
const ASSIGNMENT_TEMPLATES = [
  {
    id: "template-1",
    name: "Standard Quiz",
    category: "Tests and Quizzes",
    subcategory: "Chapter Quiz",
    categoryWeight: 40,
    points: 50,
    timeEstimate: 30,
    difficultyLevel: "medium",
    instructions:
      "Complete the quiz covering the material from the assigned chapter.",
    gradingCriteria: {
      accuracy: 80,
      completion: 20,
    },
    latePolicy: {
      allowed: true,
      penalty: 10,
      gracePeriod: 24,
    },
  },
  {
    id: "template-2",
    name: "Research Paper",
    category: "Essays and Papers",
    subcategory: "Research Paper",
    categoryWeight: 30,
    points: 100,
    timeEstimate: 480,
    difficultyLevel: "hard",
    instructions:
      "Write a research paper on the assigned topic. Include proper citations and bibliography.",
    gradingCriteria: {
      content: 40,
      organization: 20,
      research: 20,
      mechanics: 20,
    },
    latePolicy: {
      allowed: false,
      penalty: 0,
      gracePeriod: 0,
    },
  },
  {
    id: "template-3",
    name: "Homework Assignment",
    category: "Homework and Classwork",
    subcategory: "Problem Set",
    categoryWeight: 15,
    points: 25,
    timeEstimate: 45,
    difficultyLevel: "easy",
    instructions: "Complete the assigned problems from the textbook.",
    gradingCriteria: {
      accuracy: 70,
      work_shown: 30,
    },
    latePolicy: {
      allowed: true,
      penalty: 5,
      gracePeriod: 48,
    },
  },
];

// Create the provider component
export const AssignmentProvider = ({ children }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState(ASSIGNMENT_TEMPLATES);
  const [categories, setCategories] = useState(ASSIGNMENT_CATEGORIES);
  const [categoryWeights, setCategoryWeights] = useState({});

  // Fetch assignments, category weights, and custom categories on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);

        // Fetch assignments
        const assignmentsQuery = query(
          collection(db, "assignments"),
          where("userId", "==", user.uid)
        );
        const unsubscribeAssignments = onSnapshot(
          assignmentsQuery,
          (snapshot) => {
            const assignmentsData = snapshot.docs.map((doc) => {
              const data = doc.data();
              const { id, ...rest } = data;
              return { id: doc.id, ...rest };
            });
            setAssignments(assignmentsData);
            setLoading(false);
          },
          async (err) => {
            console.log("Loading sample assignments data");
            const { sampleData } = await import("../sampleData");
            setAssignments(sampleData.assignments);
            setLoading(false);
          }
        );

        // Fetch user settings (weights and custom categories)
        const fetchUserSettings = async () => {
          try {
            const settingsDocRef = doc(db, "users", user.uid, "settings", "assignments");
            const settingsDoc = await getDoc(settingsDocRef);
            if (settingsDoc.exists()) {
              const settings = settingsDoc.data();
              // Set weights
              setCategoryWeights(settings.categoryWeights || {});
              // Merge custom categories with defaults
              if (settings.customCategories && typeof settings.customCategories === 'object') {
                const mergedCategories = { ...ASSIGNMENT_CATEGORIES };
                for (const group in settings.customCategories) {
                  try {
                    if (mergedCategories[group] && Array.isArray(mergedCategories[group].subcategories)) {
                      // Merge with existing group, avoiding duplicates
                      const existingSubcategories = mergedCategories[group].subcategories || [];
                      const customSubcategories = Array.isArray(settings.customCategories[group]) 
                        ? settings.customCategories[group] 
                        : (settings.customCategories[group]?.subcategories || []);
                     
                      if (Array.isArray(customSubcategories)) {
                        const groupSet = new Set([...existingSubcategories, ...customSubcategories]);
                        mergedCategories[group] = {
                          ...mergedCategories[group],
                          subcategories: Array.from(groupSet)
                        };
                      }
                    } else if (mergedCategories[group]) {
                      // If the group exists but doesn't have subcategories, create it
                      const customSubcategories = Array.isArray(settings.customCategories[group]) 
                        ? settings.customCategories[group] 
                        : (settings.customCategories[group]?.subcategories || []);
                     
                      if (Array.isArray(customSubcategories)) {
                        mergedCategories[group] = {
                          ...mergedCategories[group],
                          subcategories: customSubcategories
                        };
                      }
                    } else {
                      // Create new group if it doesn't exist
                      const customSubcategories = Array.isArray(settings.customCategories[group]) 
                        ? settings.customCategories[group] 
                        : (settings.customCategories[group]?.subcategories || []);
                     
                      if (Array.isArray(customSubcategories)) {
                        mergedCategories[group] = {
                          subcategories: customSubcategories,
                          defaultWeight: 10,
                          color: "#607D8B",
                          description: "Custom category group"
                        };
                      }
                    }
                  } catch (categoryError) {
                    console.warn(`Error processing category group "${group}":`, categoryError);
                    // Skip this category group if there's an error
                    continue;
                  }
                }
                setCategories(validateCategoriesStructure(mergedCategories));
              }
            } else {
              setCategoryWeights({});
              setCategories(validateCategoriesStructure(ASSIGNMENT_CATEGORIES));
            }
          } catch (error) {
            console.error('Error fetching user settings:', error);
            // Fallback to default categories
            setCategoryWeights({});
            setCategories(validateCategoriesStructure(ASSIGNMENT_CATEGORIES));
          }
        };

        fetchUserSettings();

        return () => unsubscribeAssignments();
      } else {
        setAssignments([]);
        setCategoryWeights({});
        setCategories(validateCategoriesStructure(ASSIGNMENT_CATEGORIES));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Validation function to ensure categories structure is always valid
  const validateCategoriesStructure = (categories) => {
    const validated = {};
    for (const [group, groupData] of Object.entries(categories)) {
      if (groupData && typeof groupData === 'object') {
        // Ensure subcategories is always an array
        const subcategories = Array.isArray(groupData.subcategories) ? groupData.subcategories : [];
        
        validated[group] = {
          subcategories: subcategories,
          defaultWeight: groupData.defaultWeight || 10,
          color: groupData.color || "#607D8B",
          description: groupData.description || "Assignment category"
        };
      }
    }
    return validated;
  };

  // Function to add a new category
  const addCategory = async (group, newCategory) => {
    const user = auth.currentUser;
    if (user && group && newCategory) {
      const updatedCategories = { ...categories };
      if (updatedCategories[group]) {
        // Add to existing group if it's not already there
        if (!updatedCategories[group].subcategories.includes(newCategory)) {
          updatedCategories[group] = {
            ...updatedCategories[group],
            subcategories: [...updatedCategories[group].subcategories, newCategory]
          };
        }
      } else {
        // Create new group with default metadata
        updatedCategories[group] = {
          subcategories: [newCategory],
          defaultWeight: 10,
          color: "#607D8B",
          description: "Custom category group"
        };
      }
      
      setCategories(validateCategoriesStructure(updatedCategories));

      // Persist only the custom additions to Firestore
      const customCategories = { ...((await getDoc(doc(db, "users", user.uid, "settings", "assignments"))).data()?.customCategories || {}) };
      if (customCategories[group]) {
        if (!customCategories[group].subcategories.includes(newCategory)) {
          customCategories[group] = {
            ...customCategories[group],
            subcategories: [...customCategories[group].subcategories, newCategory]
          };
        }
      } else {
        customCategories[group] = {
          subcategories: [newCategory],
          defaultWeight: 10,
          color: "#607D8B",
          description: "Custom category group"
        };
      }

      const settingsDocRef = doc(db, "users", user.uid, "settings", "assignments");
      await setDoc(settingsDocRef, { customCategories }, { merge: true });
    }
  };

  // Function to update category weights for a subject
  const updateCategoryWeights = async (subject, weights) => {
    const user = auth.currentUser;
    if (user) {
      const updatedWeights = { ...categoryWeights, [subject]: weights };
      setCategoryWeights(updatedWeights);
      const settingsDocRef = doc(db, "users", user.uid, "settings", "assignments");
      await setDoc(settingsDocRef, { categoryWeights: updatedWeights }, { merge: true });
    }
  };

  // Function to get category weight for a specific category
  const getCategoryWeight = (category, subject) => {
    const subjectWeights = categoryWeights[subject] || {};
    return subjectWeights[category] || categories[category]?.defaultWeight || 10;
  };

  // Function to validate category weights (total should equal 100%)
  const validateCategoryWeights = (weights) => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    return {
      isValid: Math.abs(total - 100) < 0.01, // Allow small floating point differences
      total,
      difference: 100 - total
    };
  };

  // Function to get all categories with their weights for a subject
  const getCategoriesWithWeights = (subject) => {
    const subjectWeights = categoryWeights[subject] || {};
    const result = {};
    
    Object.keys(categories).forEach(categoryName => {
      const categoryData = categories[categoryName];
      const subjectWeight = subjectWeights[categoryName];
      
      result[categoryName] = {
        name: categoryName,
        subcategories: categoryData.subcategories || [],
        weight: subjectWeight !== undefined ? subjectWeight : categoryData.defaultWeight,
        defaultWeight: categoryData.defaultWeight,
        color: categoryData.color,
        description: categoryData.description
      };
    });
    
    return result;
  };

  // Function to add a new assignment
  const addAssignment = async (assignment) => {
    const result = await createAssignment(assignment);
    
    // Emit event to notify GradeBookContext of the new assignment
    if (result && result.assignment) {
      eventEmitter.emit('assignmentAdded', {
        subject: assignment.subject,
        assignmentId: result.assignment.id || result.assignment.docId,
        assignment: result.assignment
      });
    }
    
    return result;
  };

  // Function to update an assignment
  const updateAssignment = async (id, updatedData) => {
    const result = await updateAssignmentAPI(id, updatedData);
    
    // Emit event to notify GradeBookContext of the update
    if (result && result.assignment) {
      eventEmitter.emit('assignmentUpdated', {
        assignmentId: id,
        updates: updatedData,
        assignment: result.assignment
      });
    }
    
    return result;
  };

  // Function to delete an assignment
  const deleteAssignment = async (id) => {
    // Get the assignment details before deletion for event emission
    const assignmentToDelete = assignments.find(a => a.id === id);
    
    const result = await deleteAssignmentAPI(id);
    
    // Emit event to notify GradeBookContext of the deletion
    if (result && assignmentToDelete) {
      eventEmitter.emit('assignmentDeleted', {
        assignmentId: id,
        subject: assignmentToDelete.subject,
        assignment: assignmentToDelete
      });
    }
    
    return result;
  };

  // Function to select an assignment
  const selectAssignment = (id) => {
    const assignment = assignments.find((a) => a.id === id);
    setSelectedAssignment(assignment || null);
    return assignment;
  };

  // Function to clear the selected assignment
  const clearSelectedAssignment = () => {
    setSelectedAssignment(null);
  };

  // Enhanced functions for assignment analytics
  const getAssignmentAnalytics = (assignmentId) => {
    // This would integrate with grades to provide analytics
    return {
      completionRate: 0,
      averageScore: 0,
      gradeDistribution: {},
      difficultyAnalysis: "medium",
    };
  };

  // Function to create assignment from template
  const createFromTemplate = (templateId, customizations = {}) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return null;

    return {
      ...template,
      ...customizations,
      id: undefined, // Remove template ID
      createdAt: new Date().toISOString(),
      status: "draft",
    };
  };

  // Function to save assignment as template
  const saveAsTemplate = (assignment) => {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: assignment.name,
      category: assignment.category,
      subcategory: assignment.subcategory || assignment.category,
      points: assignment.points,
      timeEstimate: assignment.timeEstimate || 60,
      difficultyLevel: assignment.difficultyLevel || "medium",
      instructions: assignment.instructions || "",
      gradingCriteria: assignment.gradingCriteria || { accuracy: 100 },
      latePolicy: assignment.latePolicy || {
        allowed: true,
        penalty: 10,
        gracePeriod: 24,
      },
    };

    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  // Function to get assignments by date range
  const getAssignmentsByDateRange = (startDate, endDate) => {
    return assignments.filter((assignment) => {
      const assignmentDate = new Date(assignment.dueDate);
      return assignmentDate >= startDate && assignmentDate <= endDate;
    });
  };

  // Function to get assignments by subject
  const getAssignmentsBySubject = (subject) => {
    return assignments.filter((assignment) => assignment.subject === subject);
  };

  // Function to get assignments by category
  const getAssignmentsByCategory = (category) => {
    return assignments.filter((assignment) => assignment.category === category);
  };

  // Function to get upcoming assignments
  const getUpcomingAssignments = (days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return assignments
      .filter((assignment) => {
        const assignmentDate = new Date(assignment.dueDate);
        return assignmentDate >= today && assignmentDate <= futureDate;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  // Function to get overdue assignments
  const getOverdueAssignments = () => {
    const today = new Date();
    return assignments
      .filter((assignment) => {
        const assignmentDate = new Date(assignment.dueDate);
        return assignmentDate < today;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  // Standards-based assessment functions
  const getAssignmentStandardsData = async (assignmentId) => {
    try {
      return await getAssignmentStandards(assignmentId);
    } catch (error) {
      console.error("Error fetching assignment standards:", error);
      return [];
    }
  };

  const createAssignmentStandardMapping = async (mappingData) => {
    try {
      return await createStandardMapping(mappingData);
    } catch (error) {
      console.error("Error creating standards mapping:", error);
      throw error;
    }
  };

  const updateAssignmentStandardMapping = async (mappingId, updates) => {
    try {
      return await updateStandardMapping(mappingId, updates);
    } catch (error) {
      console.error("Error updating standards mapping:", error);
      throw error;
    }
  };

  const deleteAssignmentStandardMapping = async (mappingId) => {
    try {
      return await deleteStandardMapping(mappingId);
    } catch (error) {
      console.error("Error deleting standards mapping:", error);
      throw error;
    }
  };

  const getProficiencyScaleData = (scaleType = 'four_point') => {
    return getProficiencyScale(scaleType);
  };

  const value = {
    assignments,
    selectedAssignment,
    loading,
    error,
    categories,
    templates,
    categoryWeights,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    selectAssignment,
    clearSelectedAssignment,
    getAssignmentAnalytics,
    createFromTemplate,
    saveAsTemplate,
    getAssignmentsByDateRange,
    getAssignmentsBySubject,
    getAssignmentsByCategory,
    getUpcomingAssignments,
    getOverdueAssignments,
    updateCategoryWeights,
    addCategory,
    getCategoryWeight,
    validateCategoryWeights,
    getCategoriesWithWeights,
    // Standards-based assessment functions
    getAssignmentStandardsData,
    createAssignmentStandardMapping,
    updateAssignmentStandardMapping,
    deleteAssignmentStandardMapping,
    getProficiencyScaleData,
  };

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  );
};

export default AssignmentContext;
