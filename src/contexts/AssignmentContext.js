import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getAssignments,
  createAssignment,
  updateAssignment as updateAssignmentAPI,
  deleteAssignment as deleteAssignmentAPI,
} from "../services/apiService";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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

// Enhanced assignment categories
const ASSIGNMENT_CATEGORIES = {
  "Tests and Quizzes": [
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
  "Homework and Classwork": [
    "Reading Assignment",
    "Worksheet",
    "Problem Set",
    "Class Discussion",
    "Group Work",
    "Individual Practice",
    "Review Questions",
    "Study Guide",
  ],
  "Projects and Presentations": [
    "Research Project",
    "Oral Presentation",
    "Poster Presentation",
    "Creative Project",
    "Science Fair Project",
    "History Project",
    "Art Project",
    "Technology Project",
  ],
  "Labs and Experiments": [
    "Science Lab",
    "Computer Lab",
    "Field Trip",
    "Experiment Report",
    "Lab Analysis",
    "Data Collection",
  ],
  "Essays and Papers": [
    "Argumentative Essay",
    "Research Paper",
    "Creative Writing",
    "Book Report",
    "Literary Analysis",
    "Compare/Contrast Essay",
    "Persuasive Essay",
    "Narrative Essay",
  ],
  "Participation and Attendance": [
    "Class Participation",
    "Discussion Participation",
    "Group Participation",
    "Attendance",
    "Classroom Behavior",
  ],
  "Extra Credit Opportunities": [
    "Bonus Assignment",
    "Extra Credit Project",
    "Challenge Problem",
    "Enrichment Activity",
  ],
};

// Assignment templates
const ASSIGNMENT_TEMPLATES = [
  {
    id: "template-1",
    name: "Standard Quiz",
    category: "Tests and Quizzes",
    subcategory: "Chapter Quiz",
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
  const [categories] = useState(ASSIGNMENT_CATEGORIES);

  // Fetch assignments on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
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
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
        return () => unsubscribeAssignments();
      } else {
        setAssignments([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to add a new assignment
  const addAssignment = async (assignment) => {
    return await createAssignment(assignment);
  };

  // Function to update an assignment
  const updateAssignment = async (id, updatedData) => {
    return await updateAssignmentAPI(id, updatedData);
  };

  // Function to delete an assignment
  const deleteAssignment = async (id) => {
    return await deleteAssignmentAPI(id);
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

  const value = {
    assignments,
    selectedAssignment,
    loading,
    error,
    categories,
    templates,
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
  };

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  );
};

export default AssignmentContext;
