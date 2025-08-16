# Assignments-Gradebooks Integration Plan

## Current State Analysis

### Assignment Management
- Assignments are managed through the `AssignmentContext` and stored in Firestore
- Each assignment has properties like name, subject, points, dueDate, description, etc.
- Assignments can be created, updated, and deleted through the UI
- Standards-based assessment is supported with mappings to educational standards

### Gradebook Management
- Gradebooks are virtual constructs created from existing assignments and grades
- Each gradebook is associated with a subject
- Gradebooks contain lists of assignments and students
- Gradebooks are managed through the `GradeBookContext`

### Current Integration Points
1. Gradebooks are created virtually based on subjects from assignments
2. Assignments are linked to gradebooks by subject
3. Grades are linked to both assignments and students

## Integration Implementation Plan

### 1. Enhanced Assignment-Gradebook Synchronization

#### Current Implementation
The GradeBookContext already creates virtual grade books from assignments, which is a good start.

#### Required Enhancements
1. Ensure that when a new assignment is created, it automatically appears in the corresponding grade book
2. When an assignment is updated, the changes should be reflected in the grade book
3. When an assignment is deleted, it should be removed from the grade book

#### Implementation Approach
Modify the AssignmentContext to notify the GradeBookContext when assignments are added/updated/deleted:

```javascript
// In AssignmentContext.js
const addAssignment = async (assignment) => {
  const result = await createAssignment(assignment);
  
  // Notify GradeBookContext of the new assignment
  // This would require a callback or event system
  if (onAssignmentAdded) {
    onAssignmentAdded(result.assignment);
  }
  
  return result;
};
```

### 2. Automatic Gradebook Creation

#### Implementation Plan
When the first assignment is created for a subject, automatically create a gradebook for that subject:

1. In the GradeBookContext, add a function to create a gradebook for a subject if it doesn't exist
2. Modify the assignment creation flow to check if a gradebook exists for the subject
3. If not, create one automatically

#### Implementation Details

In GradeBookContext.js, add the following function:

```javascript
// In GradeBookContext.js
const ensureGradeBookForSubject = async (subject) => {
  // Check if gradebook already exists for this subject
  const existingGradeBook = gradeBooks.find(gb => gb.subject === subject);
  if (!existingGradeBook) {
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
      status: 'active',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      students: [],
      assignments: [],
      categories: [],
      settings: {
        gradingScale: 'weighted_categories',
        allowLateSubmissions: true,
        autoCalculateFinal: true,
        weightCategories: true,
        roundingMethod: 'nearest_whole',
        gradeDisplay: 'percentage'
      },
      totalGrades: 0
    };
    
    // Add to gradebooks list
    setGradeBooks(prev => [newGradeBook, ...prev]);
    return newGradeBook;
  }
  return existingGradeBook;
};
```

Then, modify the createVirtualGradeBooks function to use this ensureGradeBookForSubject function:

```javascript
// Modified createVirtualGradeBooks function
const createVirtualGradeBooks = () => {
  if (!assignments || !students || !grades) return [];

  const gradeBooksMap = new Map();

  // Seed grade books from assignments so subjects with no grades yet still appear
  assignments.forEach(assignment => {
    const subject = assignment.subject;
    if (!subject) return;

    // Ensure gradebook exists for subject
    if (!gradeBooksMap.has(subject)) {
      const gb = ensureGradeBookForSubject(subject);
      gradeBooksMap.set(subject, gb);
    }
  });

  // Rest of the function remains the same...
};
```

Alternatively, we can modify the approach to be more efficient by ensuring the gradebook exists when an assignment is created:

```javascript
// In AssignmentContext.js, modify addAssignment function
const addAssignment = async (assignment) => {
  // First ensure gradebook exists for the subject
  // This would require access to GradeBookContext or an event system
  // For now, we'll just create the assignment
  
  const result = await createAssignment(assignment);
  return result;
};
```

A better approach would be to use React's context system to allow the AssignmentContext to communicate with the GradeBookContext:

```javascript
// In AssignmentContext.js
import { useGradeBooks } from './GradeBookContext';

// Inside the AssignmentProvider component
const { ensureGradeBookForSubject } = useGradeBooks(); // This won't work directly due to hook rules

// We need to use a different approach, such as:
// 1. Passing a callback function as a prop to AssignmentProvider
// 2. Using a global event system
// 3. Using a shared service layer
```

### 3. Assignment Visibility in Grade Books

#### Current Implementation
The GradeBookContext already creates virtual grade books from assignments, but we need to ensure that assignments are properly linked to grade books.

#### Implementation Plan
Ensure assignments are properly linked to grade books:

1. When an assignment is created, add its ID to the corresponding grade book's assignments array
2. When an assignment is deleted, remove its ID from the grade book
3. When an assignment is updated, update any relevant information in the grade book

#### Implementation Details

In GradeBookContext.js, add the following function:

```javascript
// In GradeBookContext.js
const addAssignmentToGradeBook = async (gradeBookId, assignmentId) => {
  setGradeBooks(prev => 
    prev.map(gb => 
      gb.id === gradeBookId 
        ? { ...gb, assignments: [...gb.assignments, assignmentId], lastModified: new Date().toISOString() }
        : gb
    )
  );
};

// Also add a function to remove an assignment from a grade book
const removeAssignmentFromGradeBook = async (gradeBookId, assignmentId) => {
  setGradeBooks(prev => 
    prev.map(gb => 
      gb.id === gradeBookId 
        ? { ...gb, assignments: gb.assignments.filter(id => id !== assignmentId), lastModified: new Date().toISOString() }
        : gb
    )
  );
};
```

Then, modify the assignment creation flow to call these functions:

```javascript
// In AssignmentContext.js, modify addAssignment function
const addAssignment = async (assignment) => {
  const result = await createAssignment(assignment);
  
  // Notify GradeBookContext to add assignment to grade book
  // This would require a callback or event system
  if (onAssignmentAdded) {
    onAssignmentAdded(result.assignment);
  }
  
  return result;
};
```

### 4. Bidirectional Updates

#### Current Implementation
Currently, there is no bidirectional synchronization between assignments and grade books.

#### Implementation Plan
Ensure changes in either system are reflected in the other:

1. When an assignment is updated in the Assignments system, update the corresponding information in the grade book
2. When grade information is updated in the Gradebook system, ensure it's properly linked to the assignment
3. Implement real-time synchronization using Firestore listeners

#### Implementation Details

To implement bidirectional updates, we need to:

1. Create functions in GradeBookContext to handle assignment updates:
```javascript
// In GradeBookContext.js
const updateAssignmentInGradeBook = (assignmentId, updates) => {
  setGradeBooks(prev => 
    prev.map(gb => ({
      ...gb,
      assignments: gb.assignments.map(assignment => 
        assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
      ),
      lastModified: new Date().toISOString()
    }))
  );
};
```

2. Modify AssignmentContext to notify GradeBookContext of updates:
```javascript
// In AssignmentContext.js
const updateAssignment = async (id, updatedData) => {
  const result = await updateAssignmentAPI(id, updatedData);
  
  // Notify GradeBookContext of the update
  if (onAssignmentUpdated) {
    onAssignmentUpdated(id, updatedData);
  }
  
  return result;
};
```

3. Implement real-time synchronization using Firestore listeners:
```javascript
// In GradeBookContext.js
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "assignments"),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          // Update assignment in grade book
          updateAssignmentInGradeBook(change.doc.id, change.doc.data());
        }
      });
    }
  );
  
  return () => unsubscribe();
}, []);
```

### 5. Standards-Based Assessment Unification

#### Current State
Both assignments and grade books support standards-based assessment, but they may not be fully integrated.

#### Implementation Plan
1. Ensure standards mappings created for assignments are accessible in grade books
2. Share proficiency scales between assignments and grade books
3. Create combined analytics that show both traditional grades and standards proficiency

#### Implementation Details

To unify standards-based assessment between assignments and grade books:

1. Ensure standards mappings created for assignments are accessible in grade books:

```javascript
// In EnhancedAssignmentForm.jsx, when saving standards mappings:
if (standardsGradingEnabled && selectedStandards.length > 0 && savedAssignment?.id) {
  const mappingPromises = selectedStandards.map(standard => 
    createStandardMapping({
      assignmentId: savedAssignment.id,
      standardId: standard.standardId,
      alignmentStrength: standard.alignmentStrength || 0.75,
      coverageType: standard.coverageType || 'full',
      weight: standard.weight || 1.0,
    })
  );
  
  await Promise.all(mappingPromises);
}
```

2. Share proficiency scales between assignments and grade books:

In both AssignmentContext and GradeBookContext, we need to ensure they use the same proficiency scales:

```javascript
// Shared proficiency scales
const PROFICIENCY_SCALES = {
  four_point: [
    { level: 1, label: "Novice", description: "With help, student can demonstrate concept with 50% accuracy" },
    { level: 2, label: "Developing", description: "Student can demonstrate concept with 75% accuracy" },
    { level: 3, label: "Proficient", description: "Student can demonstrate concept with 90% accuracy" },
    { level: 4, label: "Advanced", description: "Student can demonstrate concept with 100% accuracy and can teach others" }
  ],
  five_point: [
    { level: 1, label: "Novice", description: "With help, student can demonstrate concept with 50% accuracy" },
    { level: 2, label: "Approaching", description: "Student can demonstrate concept with 65% accuracy" },
    { level: 3, label: "Developing", description: "Student can demonstrate concept with 80% accuracy" },
    { level: 4, label: "Proficient", description: "Student can demonstrate concept with 95% accuracy" },
    { level: 5, label: "Advanced", description: "Student can demonstrate concept with 100% accuracy and can teach others" }
  ]
};

// Export for use in both contexts
export { PROFICIENCY_SCALES };
```

3. Create combined analytics that show both traditional grades and standards proficiency:

In GradeBook.js, we can enhance the analytics to show both traditional grades and standards proficiency:

```javascript
// In GradeBook.js, enhance analytics
const gradeAnalytics = useMemo(() => {
  if (!subject || !currentGrades || currentGrades.length === 0) {
    return null;
  }

  // Calculate traditional grade analytics
  const subjectGrades = currentGrades.filter(
    (grade) =>
      grade.subject === subject &&
      grade.score !== null &&
      grade.score !== undefined
  );

  // Calculate standards-based analytics
  const standardsGradesForSubject = standardsGrades.filter(
    sg => sg.subject === subject
  );

  // ... rest of analytics calculation
}, [subject, currentGrades, standardsGrades]);
```

### 6. Reporting Integration

#### Implementation Plan
1. Develop assignment-based analytics reports that can be generated from the integrated data
2. Enhance the daily update system with assignment information
3. Create integrated progress reports that show both assignment completion and grade trends

### 7. Data Consistency Measures

#### Implementation Plan
1. Ensure single source of truth for assignment details
2. Implement real-time synchronization between assignment and grade data
3. Add validation to prevent data inconsistencies

### 8. User Experience Improvements

#### Implementation Plan
1. Implement a unified dashboard that shows both assignments and grades
2. Add cross-system navigation between assignments and grade books
3. Provide contextual actions (e.g., "Grade this assignment" from the assignment list)

## Implementation Steps

### Phase 1: Core Synchronization
1. Implement enhanced assignment-gradebook synchronization
2. Ensure automatic gradebook creation when first assignment is created for a subject
3. Verify assignment visibility in corresponding grade books

### Phase 2: Bidirectional Updates
1. Implement bidirectional updates between assignments and grade books
2. Unify standards-based assessment between assignments and grade books
3. Ensure consistent standards mappings

### Phase 3: Analytics and Reporting
1. Create combined analytics showing traditional grades and standards proficiency
2. Enhance reporting integration
3. Develop assignment-based analytics reports

### Phase 4: Advanced Features
1. Enhance daily update system with assignment information
2. Create integrated progress reports
3. Implement data consistency measures

### Phase 5: User Experience
1. Ensure single source of truth for assignment details
2. Implement real-time synchronization between assignment and grade data
3. Add user experience improvements
4. Implement unified dashboard
5. Add cross-system navigation
6. Provide contextual actions

## Technical Considerations

### Performance
- Use virtualized lists for gradebook displays to handle large datasets
- Implement efficient data fetching and caching strategies
- Use React.memo and useCallback to optimize re-renders

### Data Consistency
- Implement proper error handling for all data operations
- Use Firestore transactions for critical operations
- Add validation for all user inputs

### User Experience
- Provide clear loading states and error messages
- Implement undo functionality for destructive operations
- Ensure responsive design for all screen sizes

## Testing Strategy

### Unit Tests
- Test assignment creation, update, and deletion
- Test gradebook creation and management
- Test standards-based assessment functionality

### Integration Tests
- Test synchronization between assignments and grade books
- Test reporting and analytics features
- Test edge cases and error conditions

### User Acceptance Tests
- Verify that teachers can create assignments and see them in grade books
- Verify that grades entered in grade books are properly linked to assignments
- Verify that reports accurately reflect assignment and grade data

## Specific Implementation for Automatic Gradebook Creation

To implement automatic gradebook creation when the first assignment is created for a subject, we need to:

1. Modify the GradeBookContext to expose a function for ensuring a gradebook exists for a subject
2. Modify the AssignmentContext to call this function when creating assignments
3. Ensure the gradebook is properly updated with assignment information

Here's the detailed implementation:

### In GradeBookContext.js:

```javascript
// Add this function to the GradeBookContext
const ensureGradeBookForSubject = (subject) => {
  // Check if gradebook already exists for this subject
  const existingGradeBook = gradeBooks.find(gb => gb.subject === subject);
  if (!existingGradeBook) {
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
      status: 'active',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      students: [],
      assignments: [],
      categories: [],
      settings: {
        gradingScale: 'weighted_categories',
        allowLateSubmissions: true,
        autoCalculateFinal: true,
        weightCategories: true,
        roundingMethod: 'nearest_whole',
        gradeDisplay: 'percentage'
      },
      totalGrades: 0
    };
    
    // Add to gradebooks list
    setGradeBooks(prev => [newGradeBook, ...prev]);
    return newGradeBook;
  }
  return existingGradeBook;
};

// Add the function to the context value
const value = {
  // ... existing values
  ensureGradeBookForSubject,
};
```

### In AssignmentContext.js:

```javascript
// Modify addAssignment to ensure gradebook exists
const addAssignment = async (assignment) => {
  // Note: We can't directly call ensureGradeBookForSubject here due to React hook rules
  // We'll need to use a different approach such as:
  // 1. Passing a callback function
  // 2. Using a global event system
  // 3. Using a shared service layer
  
  const result = await createAssignment(assignment);
  return result;
};
```

A better approach would be to use a shared service or event system to communicate between contexts.

## Specific Implementation for Assignment Visibility

To ensure assignments are properly visible in corresponding grade books:

1. Add functions to GradeBookContext to manage assignment-to-gradebook linking
2. Modify assignment creation/update/deletion to update grade book information
3. Ensure real-time synchronization between the two systems

### In GradeBookContext.js:

```javascript
// Add functions to manage assignment visibility
const addAssignmentToGradeBook = (subject, assignmentId) => {
  setGradeBooks(prev => 
    prev.map(gb => 
      gb.subject === subject 
        ? { ...gb, assignments: [...gb.assignments, assignmentId], lastModified: new Date().toISOString() }
        : gb
    )
  );
};

const removeAssignmentFromGradeBook = (subject, assignmentId) => {
  setGradeBooks(prev => 
    prev.map(gb => 
      gb.subject === subject 
        ? { ...gb, assignments: gb.assignments.filter(id => id !== assignmentId), lastModified: new Date().toISOString() }
        : gb
    )
  );
};

const updateAssignmentInGradeBook = (subject, assignmentId, updates) => {
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

// Add these functions to the context value
const value = {
  // ... existing values
  addAssignmentToGradeBook,
  removeAssignmentFromGradeBook,
  updateAssignmentInGradeBook,
};
```

### In AssignmentContext.js:

```javascript
// Modify assignment functions to update grade books
const addAssignment = async (assignment) => {
  const result = await createAssignment(assignment);
  
  // Notify GradeBookContext to add assignment to grade book
  // This would require a callback or event system
  if (onAssignmentAdded) {
    onAssignmentAdded(assignment.subject, result.assignment.id);
  }
  
  return result;
};

const updateAssignment = async (id, updatedData) => {
  const result = await updateAssignmentAPI(id, updatedData);
  
  // Notify GradeBookContext to update assignment in grade book
  if (onAssignmentUpdated) {
    onAssignmentUpdated(updatedData.subject, id, updatedData);
  }
  
  return result;
};

const deleteAssignment = async (id) => {
  const result = await deleteAssignmentAPI(id);
  
  // Notify GradeBookContext to remove assignment from grade book
  if (onAssignmentDeleted) {
    onAssignmentDeleted(assignmentSubject, id); // Need to track subject of deleted assignment
  }
  
  return result;
};
```

## Communication Between Contexts

To enable communication between AssignmentContext and GradeBookContext, we can use several approaches:

1. **Event System**: Create a global event system that allows contexts to communicate
2. **Shared Service**: Create a shared service layer that both contexts can use
3. **Callback Functions**: Pass callback functions between components

### Event System Implementation:

```javascript
// Create a simple event system
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

const eventEmitter = new EventEmitter();

export default eventEmitter;
```

Then use it in both contexts:

```javascript
// In AssignmentContext.js
import eventEmitter from './eventEmitter';

const addAssignment = async (assignment) => {
  const result = await createAssignment(assignment);
  
  // Emit event to notify GradeBookContext
  eventEmitter.emit('assignmentAdded', {
    subject: assignment.subject,
    assignmentId: result.assignment.id
  });
  
  return result;
};

// In GradeBookContext.js
import eventEmitter from './eventEmitter';

useEffect(() => {
  const handleAssignmentAdded = ({ subject, assignmentId }) => {
    addAssignmentToGradeBook(subject, assignmentId);
  };
  
  eventEmitter.on('assignmentAdded', handleAssignmentAdded);
  
  return () => {
    eventEmitter.off('assignmentAdded', handleAssignmentAdded);
  };
}, []);
```

This approach provides a clean separation of concerns while enabling the necessary communication between contexts.

## Specific Implementation for Bidirectional Updates

To implement bidirectional updates between assignments and grade books:

1. Create functions in GradeBookContext to handle updates from assignments
2. Create functions in AssignmentContext to handle updates from grade books
3. Implement real-time synchronization using Firestore listeners

### In GradeBookContext.js:

```javascript
// Add functions to handle updates from assignments
const handleAssignmentUpdated = (assignmentId, updates) => {
  setGradeBooks(prev => 
    prev.map(gb => ({
      ...gb,
      assignments: gb.assignments.map(assignment => 
        assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
      ),
      lastModified: new Date().toISOString()
    }))
  );
};

const handleAssignmentDeleted = (assignmentId) => {
  setGradeBooks(prev => 
    prev.map(gb => ({
      ...gb,
      assignments: gb.assignments.filter(assignment => assignment.id !== assignmentId),
      lastModified: new Date().toISOString()
    }))
  );
};

// Add these functions to the context value
const value = {
  // ... existing values
  handleAssignmentUpdated,
  handleAssignmentDeleted,
};
```

### In AssignmentContext.js:

```javascript
// Add functions to handle updates from grade books
const handleGradeUpdated = (gradeId, updates) => {
  // Update grade in local state
  setGrades(prev => 
    prev.map(grade => 
      grade.id === gradeId ? { ...grade, ...updates } : grade
    )
  );
};

// Add this function to the context value
const value = {
  // ... existing values
  handleGradeUpdated,
};
```

### Real-time Synchronization

To implement real-time synchronization, we can use Firestore's onSnapshot listeners:

```javascript
// In GradeBookContext.js
useEffect(() => {
  // Listen for assignment changes
  const unsubscribeAssignments = onSnapshot(
    collection(db, "assignments"),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          // Update assignment in grade book
          handleAssignmentUpdated(change.doc.id, change.doc.data());
        } else if (change.type === "removed") {
          // Remove assignment from grade book
          handleAssignmentDeleted(change.doc.id);
        }
      });
    }
  );
  
  // Listen for grade changes
  const unsubscribeGrades = onSnapshot(
    collection(db, "grades"),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          // Update grade in assignments
          // This would require access to AssignmentContext or event system
        }
      });
    }
  );
  
  return () => {
    unsubscribeAssignments();
    unsubscribeGrades();
  };
}, []);
```

This implementation ensures that changes in either system are immediately reflected in the other, providing a seamless user experience.

## Specific Implementation for Standards-Based Assessment Unification

To unify standards-based assessment between assignments and grade books:

1. Ensure standards mappings created for assignments are accessible in grade books
2. Share proficiency scales between assignments and grade books
3. Create combined analytics that show both traditional grades and standards proficiency

### Shared Proficiency Scales

Create a shared file for proficiency scales:

```javascript
// src/constants/proficiencyScales.js
export const PROFICIENCY_SCALES = {
  four_point: [
    { level: 1, label: "Novice", description: "With help, student can demonstrate concept with 50% accuracy" },
    { level: 2, label: "Developing", description: "Student can demonstrate concept with 75% accuracy" },
    { level: 3, label: "Proficient", description: "Student can demonstrate concept with 90% accuracy" },
    { level: 4, label: "Advanced", description: "Student can demonstrate concept with 100% accuracy and can teach others" }
  ],
  five_point: [
    { level: 1, label: "Novice", description: "With help, student can demonstrate concept with 50% accuracy" },
    { level: 2, label: "Approaching", description: "Student can demonstrate concept with 65% accuracy" },
    { level: 3, label: "Developing", description: "Student can demonstrate concept with 80% accuracy" },
    { level: 4, label: "Proficient", description: "Student can demonstrate concept with 95% accuracy" },
    { level: 5, label: "Advanced", description: "Student can demonstrate concept with 100% accuracy and can teach others" }
  ]
};

export const getProficiencyLevelLabel = (scale, level) => {
  const scaleData = PROFICIENCY_SCALES[scale];
  if (!scaleData) return "Unknown";
  
  const levelData = scaleData.find(item => item.level === level);
  return levelData ? levelData.label : "Unknown";
};

export const getProficiencyLevelDescription = (scale, level) => {
  const scaleData = PROFICIENCY_SCALES[scale];
  if (!scaleData) return "Unknown";
  
  const levelData = scaleData.find(item => item.level === level);
  return levelData ? levelData.description : "Unknown";
};
```

### Standards Mappings Accessibility

Ensure standards mappings are accessible in both contexts:

```javascript
// In AssignmentContext.js
const getAssignmentStandards = async (assignmentId) => {
  try {
    const mappings = await getStandardsMappings(assignmentId);
    return mappings;
  } catch (error) {
    console.error("Error fetching assignment standards:", error);
    return [];
  }
};

// In GradeBookContext.js
const getGradeBookStandards = async (gradeBookId) => {
  try {
    // Get all assignments for this grade book
    const gradeBook = gradeBooks.find(gb => gb.id === gradeBookId);
    if (!gradeBook) return [];
    
    // Get standards for all assignments in this grade book
    const allStandards = [];
    for (const assignmentId of gradeBook.assignments) {
      const standards = await getAssignmentStandards(assignmentId);
      allStandards.push(...standards);
    }
    
    // Remove duplicates
    const uniqueStandards = allStandards.filter((standard, index, self) => 
      index === self.findIndex(s => s.standardId === standard.standardId)
    );
    
    return uniqueStandards;
  } catch (error) {
    console.error("Error fetching grade book standards:", error);
    return [];
  }
};
```

### Combined Analytics

Create combined analytics that show both traditional grades and standards proficiency:

```javascript
// In GradeBook.js or a separate analytics service
const generateCombinedAnalytics = (subject, assignments, grades, standardsGrades) => {
  // Traditional grade analytics
  const traditionalAnalytics = calculateTraditionalAnalytics(subject, assignments, grades);
  
  // Standards-based analytics
  const standardsAnalytics = calculateStandardsAnalytics(subject, assignments, standardsGrades);
  
  // Combined analytics
  return {
    traditional: traditionalAnalytics,
    standards: standardsAnalytics,
    combined: {
      // Combined metrics that show both traditional and standards data
      overallPerformance: calculateOverallPerformance(traditionalAnalytics, standardsAnalytics),
      correlation: calculateCorrelation(traditionalAnalytics, standardsAnalytics)
    }
  };
};

const calculateTraditionalAnalytics = (subject, assignments, grades) => {
  // Calculate traditional grade analytics
  // ... implementation
};

const calculateStandardsAnalytics = (subject, assignments, standardsGrades) => {
  // Calculate standards-based analytics
  // ... implementation
};

const calculateOverallPerformance = (traditional, standards) => {
  // Calculate overall performance combining both metrics
  // ... implementation
};

const calculateCorrelation = (traditional, standards) => {
  // Calculate correlation between traditional grades and standards proficiency
  // ... implementation
};
```

This implementation ensures that standards-based assessment is fully unified between assignments and grade books, providing teachers with a comprehensive view of student performance.