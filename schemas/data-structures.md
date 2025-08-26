# Teacher Kit - Data Structure Schemas

This document defines the complete data structure schemas for the Teacher Kit application. All developers must follow these schemas to ensure consistency and prevent data structure confusion.

## 📚 Collections Overview

### Core Collections
- `students` - Student information and profiles
- `assignments` - Assignment definitions and metadata
- `grades` - Student grades and scores
- `attendance` - Student attendance records
- `behaviors` - Student behavior tracking (note: plural form)
- `subjects` - Subject definitions and metadata
- `dailyUpdateEmails` - Daily email communications
- `gradebooks` - Gradebook configurations and settings
- `lessons` - Lesson plans and curriculum
- `standards_grades` - Standards-based grading records
- `educational_standards` - Educational standards definitions
- `frameworks` - Assessment frameworks
- `academicPeriods` - Academic periods and terms
- `analytics` - Analytics and reporting data
- `users` - User accounts and profiles
- `documents` - General document storage and management
- `emailContent` - Dynamic email template content
- `contentSharingRequests` - Content sharing requests between users
- `developerPageImages` - Developer page image uploads and metadata
- `developerPageContent` - Developer page text content and settings
- `characterTraitAssessments` - Character trait daily assessments and star ratings
- `monthlyLeaderboards` - Monthly character trait leaderboard rankings

---

## 👥 Students Collection

**Collection:** `students`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Personal Information
  firstName: "string",             // Required
  lastName: "string",              // Required
  dateOfBirth: "string",           // ISO date string (YYYY-MM-DD)
  gender: "string",                // "Male", "Female", "Other", "Prefer not to say"
  studentId: "string",             // School-assigned student ID
  
  // Academic Information
  gradeLevel: "string",            // "K", "1", "2", ..., "12"
  enrollmentDate: "string",        // ISO date string
  academicYear: "string",          // e.g., "2024-2025"
  learningStyle: "string",         // "Visual", "Auditory", "Kinesthetic", "Reading/Writing", "Mixed"
  specialNeeds: ["string"],        // Array of special needs
  iepPlan: boolean,                // Has IEP/504 plan
  
  // Contact Information
  parentEmail1: "string",          // Required - Primary parent email
  parentEmail2: "string",          // Secondary parent email
  parentPhone1: "string",          // Primary parent phone
  parentPhone2: "string",          // Secondary parent phone
  studentEmail: "string",          // Student's own email (school-provided)
  
  // Medical Information
  medicalNotes: "string",          // Medical notes and conditions
  allergies: ["string"],           // Array of allergies
  medications: ["string"],         // Array of medications
  
  // Additional Information
  notes: "string",                 // General notes
  status: "string",                // "active", "inactive", "graduated", "transferred"
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📝 Assignments Collection

**Collection:** `assignments`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Assignment Details
  name: "string",                  // Required - Assignment name
  description: "string",           // Assignment description
  subject: "string",               // Required - Subject code (e.g., "ELA", "MATH")
  category: "string",              // "Homework", "Quiz", "Test", "Project", "Class Discussion"
  points: number,                  // Required - Total possible points
  dueDate: "string",               // ISO date string
  
  // Academic Information
  gradeLevel: "string",            // Target grade level
  academicYear: "string",          // Academic year
  standards: ["string"],           // Array of educational standards
  
  // Settings
  allowLateSubmission: boolean,    // Allow late submissions
  latePenaltyPercent: number,      // Late penalty percentage
  weight: number,                  // Assignment weight in grade calculation
  
  // Status
  status: "string",                // "draft", "published", "archived"
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📊 Grades Collection

**Collection:** `grades`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Grade Information
  studentId: "string",             // Required - Student document ID
  assignmentId: "string",          // Required - Assignment document ID
  subject: "string",               // Required - Subject code (e.g., "ELA", "MATH")
  
  // Score Information
  score: number,                   // Required - Points earned
  points: number,                  // Required - Total possible points
  
  // Metadata
  dateEntered: "timestamp",        // When grade was entered
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📅 Attendance Collection

**Collection:** `attendance`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Attendance Information
  studentId: "string",             // Required - Student document ID
  date: "string",                  // Required - ISO date string (YYYY-MM-DD)
  status: "string",                // Required - "present", "absent", "tardy", "excused"
  
  // Additional Information
  notes: "string",                 // Attendance notes
  timeIn: "string",                // Time student arrived (HH:MM)
  timeOut: "string",               // Time student left (HH:MM)
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 🧠 Behaviors Collection

**Collection:** `behaviors`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Behavior Information
  studentId: "string",             // Required - Student document ID
  date: "string",                  // Required - ISO date string
  description: "string",           // Required - Behavior description
  
  // Skills-Based Framework
  skills: [                        // Array of skills involved
    {
      skill: "string",             // Skill name (e.g., "Resilience", "Self-Regulation")
      type: "string"               // "strength" or "growth"
    }
  ],
  
  // Actions Taken
  restorativeAction: "string",     // Action taken to address behavior
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📚 Subjects Collection

**Collection:** `subjects`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Subject Information
  code: "string",                  // Required - Subject code (e.g., "ELA", "MATH")
  name: "string",                  // Required - Full subject name (e.g., "English Language Arts")
  color: "string",                 // Hex color code for UI display
  
  // Academic Information
  gradeLevel: "string",            // Target grade level
  academicYear: "string",          // Academic year
  description: "string",           // Subject description
  
  // Settings
  isActive: boolean,               // Is subject currently active
  weight: number,                  // Subject weight in overall grade
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📧 Daily Update Emails Collection

**Collection:** `dailyUpdateEmails`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Email Information
  studentId: "string",             // Required - Student document ID
  studentName: "string",           // Student name for display
  type: "string",                  // Required - "daily_update"
  date: "string",                  // Required - ISO date string (YYYY-MM-DD)
  
  // Content
  subject: "string",               // Email subject
  content: "string",               // Email content (plain text)
  html: "string",                  // Email content (HTML)
  
  // Recipients
  recipients: ["string"],          // Array of recipient email addresses
  cc: ["string"],                  // Array of CC email addresses
  bcc: ["string"],                 // Array of BCC email addresses
  replyTo: "string",               // Reply-to email address
  
  // Status
  sentStatus: "string",            // "Sent", "Failed", "Pending"
  sentAt: "timestamp",             // When email was sent
  
  // Metadata
  metadata: {                      // Additional metadata
    schoolName: "string",          // School name
    teacherName: "string",         // Teacher name
    bcc: ["string"],               // BCC recipients
    cc: ["string"],                // CC recipients
    replyTo: "string",             // Reply-to address
    createdAt: "timestamp",        // Creation timestamp
    sentAt: "timestamp",           // Sent timestamp
    updatedAt: "timestamp"         // Update timestamp
  },
  
  // Associated Data
  assignments: [                   // Array of assignments for the day
    {
      id: "string",                // Assignment ID
      name: "string",              // Assignment name
      description: "string",       // Assignment description
      category: "string",          // Assignment category
      subject: "string",           // Subject code
      points: number,              // Points
      dueDate: "string",           // Due date
      createdAt: "string"          // Creation date
    }
  ],
  attendance: {                    // Attendance information
    date: "string",                // Attendance date
    status: "string",              // "Present", "Absent", "Tardy", "Not Recorded"
    notes: "string"                // Attendance notes
  },
  behavior: ["string"],            // Array of behavior records
  classwork: ["string"],           // Array of classwork activities
  grades: ["string"],              // Array of grades
  homework: ["string"],            // Array of homework
  upcomingAssignments: [           // Array of upcoming assignments
    {
      id: "string",                // Assignment ID
      name: "string",              // Assignment name
      description: "string",       // Assignment description
      category: "string",          // Assignment category
      subject: "string",           // Subject code
      points: number,              // Points
      dueDate: "string",           // Due date
      createdAt: "string"          // Creation date
    }
  ],
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📊 Gradebooks Collection

**Collection:** `gradebooks`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Gradebook Information
  name: "string",                  // Required - Gradebook name
  description: "string",           // Gradebook description
  subject: "string",               // Subject name (e.g., "English Language Arts")
  gradeLevel: "string",            // Grade level (e.g., "5th Grade")
  academicYear: "string",          // Academic year (e.g., "2025-26")
  academicYearId: "string",        // Reference to academic period
  
  // Settings
  settings: {                      // Gradebook settings
    allowLateSubmissions: boolean, // Allow late submissions
    autoCalculateFinal: boolean,   // Auto-calculate final grades
    gradeDisplay: "string",        // "points", "percentage", "letter"
    roundingMethod: "string",      // "nearest_whole", "round_up", "round_down"
    weightCategories: boolean      // Use category weighting
  },
  
  // Categories
  categories: [                    // Array of grade categories
    {
      name: "string",              // Category name
      weight: "string",            // Category weight percentage
      color: "string"              // Category color
    }
  ],
  categoryWeights: {               // Category weight mapping
    [categoryName: string]: "string" // Category name to weight percentage
  },
  
  // Students
  students: ["string"],            // Array of student IDs
  
  // Assignments
  assignments: ["string"],         // Array of assignment IDs
  
  // Status
  status: "string",                // "active", "inactive", "archived"
  lastModified: "timestamp",       // Last modification timestamp
  teacherId: "string",             // Teacher ID
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📚 Lessons Collection

**Collection:** `lessons`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Lesson Information
  title: "string",                 // Required - Lesson title
  description: "string",           // Lesson description
  subjectCode: "string",           // Required - Subject code (e.g., "ELA", "MATH")
  
  // Academic Information
  gradeLevel: "string",            // Target grade level
  academicYear: "string",          // Academic year
  standards: ["string"],           // Array of educational standards
  
  // Content
  learningObjectives: ["string"],  // Learning objectives
  materials: ["string"],           // Required materials
  activities: ["string"],          // Lesson activities
  homework: "string",              // Homework assignment
  notes: "string",                 // Lesson notes
  
  // Schedule
  date: "string",                  // Lesson date (ISO date string)
  duration: number,                // Duration in minutes
  
  // Associated Data
  gradebookId: "string",           // Associated gradebook ID
  teacherId: "string",             // Teacher ID
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 🎯 Standards Grades Collection

**Collection:** `standards_grades`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Standards Grade Information
  studentId: "string",             // Required - Student document ID
  standardId: "string",            // Required - Educational standard ID
  subject: "string",               // Required - Subject code (e.g., "ELA", "MATH")
  assignmentId: "string",          // Associated assignment ID
  
  // Assessment Information
  proficiencyLevel: number,        // Proficiency level (1-4 scale)
  date: "string",                  // Assessment date (ISO date string)
  
  // Grading Information
  gradedAt: "timestamp",           // When grade was entered
  gradedBy: "string",              // User ID who entered the grade
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📖 Educational Standards Collection

**Collection:** `educational_standards`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Standard Information
  code: "string",                  // Required - Standard code (e.g., "CCSS.ELA-LITERACY.RL.5.1")
  description: "string",           // Required - Standard description
  subjectCode: "string",           // Required - Subject code (e.g., "ELA", "MATH")
  
  // Academic Information
  gradeLevel: "string",            // Target grade level
  academicYear: "string",          // Academic year
  framework: "string",             // Standards framework (e.g., "Common Core", "State Standards")
  
  // Categorization
  domain: "string",                // Learning domain
  strand: "string",                // Learning strand
  
  // Status
  isActive: boolean,               // Is standard currently active
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 🏗️ Frameworks Collection

**Collection:** `frameworks`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Framework Information
  name: "string",                  // Required - Framework name
  description: "string",           // Framework description
  type: "string",                  // "assessment", "grading", "curriculum"
  
  // Configuration
  settings: {                      // Framework-specific settings
    [key: string]: any             // Dynamic settings object
  },
  
  // Status
  isActive: boolean,               // Is framework currently active
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📅 Academic Periods Collection

**Collection:** `academicPeriods`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Period Information
  name: "string",                  // Required - Period name (e.g., "Fall 2024", "Q1", "2024-2025")
  description: "string",           // Period description
  
  // Date Range
  startDate: "string",             // Required - Start date (ISO date string)
  endDate: "string",               // Required - End date (ISO date string)
  
  // Academic Information
  academicYear: "string",          // Academic year (e.g., "2024-2025")
  type: "string",                  // "semester", "quarter", "trimester", "term"
  
  // Hierarchical Structure
  semesters: [                     // Array of semester objects (optional)
    {
      id: "string",                // Semester ID
      name: "string",              // Semester name
      startDate: "string",         // Start date (ISO)
      endDate: "string",           // End date (ISO)
      terms: [                     // Array of term objects (optional)
        {
          id: "string",            // Term ID
          name: "string",          // Term name
          startDate: "string",     // Start date (ISO)
          endDate: "string"        // End date (ISO)
        }
      ]
    }
  ],
  
  // Status
  isActive: boolean,               // Is period currently active
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📈 Analytics Collection

**Collection:** `analytics`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Analytics Information
  type: "string",                  // Required - Analytics type (e.g., "student_progress", "class_performance")
  studentId: "string",             // Associated student (if applicable)
  subjectCode: "string",           // Associated subject (if applicable)
  
  // Data
  metrics: {                       // Analytics metrics
    [key: string]: number          // Dynamic metrics object
  },
  
  // Time Range
  startDate: "string",             // Start date for analytics (ISO date string)
  endDate: "string",               // End date for analytics (ISO date string)
  
  // Metadata
  calculatedAt: "timestamp",       // When analytics were calculated
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 👤 Users Collection

**Collection:** `users`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID (matches Firebase Auth UID)
  
  // User Information
  email: "string",                 // Required - User email
  displayName: "string",           // User display name
  photoURL: "string",              // User profile photo URL
  
  // Role and Permissions
  role: "string",                  // "teacher", "admin", "student", "parent"
  permissions: ["string"],         // Array of permissions
  
  // School Information
  schoolId: "string",              // Associated school ID
  schoolName: "string",            // School name
  
  // Settings
  preferences: {                   // User preferences
    [key: string]: any             // Dynamic preferences object
  },
  
  // Status
  isActive: boolean,               // Is user account active
  lastLoginAt: "timestamp",        // Last login timestamp
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📄 Documents Collection

**Collection:** `documents`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  
  // Document Information
  type: "string",                  // Document type (e.g., "daily_update")
  category: "string",              // Document category
  subject: "string",               // Document subject/title
  content: "string",               // Document content
  status: "string",                // "active", "archived", "deleted"
  
  // Classification
  tags: ["string"],                // Array of tags for organization
  
  // Associated Data
  studentId: "string",             // Associated student (if applicable)
  
  // Metadata
  metadata: {                      // Dynamic metadata object
    originalDate: "string",        // Original date (for daily updates)
    sentStatus: "string",          // Email status
    recipientType: "string",       // Type of recipient
    attendance: "object",          // Attendance data
    grades: "array",               // Grades data
    behavior: "array",             // Behavior data
    assignments: "array"           // Assignments data
  },
  
  // Timestamps
  createdAt: "string",             // ISO string timestamp
  updatedAt: "timestamp"           // Auto-generated
}
```

---

## 📧 Email Content Collection

**Collection:** `emailContent`

### Document Structure
```javascript
{
  id: "string",                    // Content type identifier (e.g., "greetings", "closings")
  
  // Content Templates
  templates: ["string"],           // Array of template strings with placeholders like {firstName}
  
  // Metadata
  lastUpdated: "timestamp",        // When templates were last modified
  isActive: boolean                // Whether templates are active
}
```

---

## 🤝 Content Sharing Requests Collection

**Collection:** `contentSharingRequests`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  
  // Request Information
  fromUserId: "string",            // Sender's user ID
  toUserId: "string",              // Recipient's user ID
  contentType: "string",           // Type of content being shared
  status: "string",                // "pending", "accepted", "rejected", "expired"
  
  // Content Details
  sharedContent: {                 // Content being shared
    [key: string]: any             // Dynamic content object
  },
  
  // Settings
  mergeStrategy: "string",         // "merge", "add-only", "replace"
  expiresAt: "timestamp",          // When request expires
  
  // Metadata
  createdAt: "timestamp",          // Auto-generated
  updatedAt: "timestamp"           // Auto-generated
}
```

## 🔑 Key Relationships

### Subject Codes
- **Subject codes** (e.g., "ELA", "MATH") are used in grades and assignments
- **Subject names** (e.g., "English Language Arts", "Mathematics") are for display
- Always use subject codes for data relationships
- Use subject names for UI display

### Grade Calculations
- Grades use `subjectCode` to link to subjects
- Assignments use `subjectCode` to categorize
- Student averages are calculated by `subjectCode`

### Data Consistency Rules
1. **Subject codes must be consistent** across grades, assignments, lessons, and subjects collections
2. **Student IDs must exist** in students collection before creating grades/attendance/behaviors
3. **Assignment IDs must exist** in assignments collection before creating grades
4. **Standard IDs must exist** in educational_standards collection before creating standards_grades
5. **Academic period IDs must exist** in academicPeriods collection before creating gradebooks
6. **User IDs must exist** in users collection before creating contentSharingRequests
7. **Document types must be validated** before saving to documents collection
8. **Content sharing requests must have valid expiration dates**
9. **All timestamps** should use Firestore serverTimestamp() for consistency

---

## 🚨 Important Notes

### Subject Code Usage
- **Grades**: Use `subjectCode` field (e.g., "ELA")
- **Assignments**: Use `subjectCode` field (e.g., "ELA") 
- **UI Display**: Use subject name from subjects collection
- **Calculations**: Always use subject codes for grouping and calculations

### Data Validation
- Required fields must be validated before saving
- Subject codes must exist in subjects collection
- Student IDs must exist in students collection
- Assignment IDs must exist in assignments collection

### Performance Considerations
- Index on `userId` for all collections
- Index on `studentId` for grades, attendance, behaviors, standards_grades, dailyUpdateEmails, documents
- Index on `subjectCode` for grades, assignments, lessons, standards_grades
- Index on `date` for attendance, behaviors, dailyUpdateEmails, lessons
- Index on `standardId` for standards_grades
- Index on `academicPeriodId` for gradebooks
- Index on `assignmentId` for grades
- Index on `type` and `category` for documents collection
- Index on `fromUserId` and `toUserId` for contentSharingRequests
- Index on `status` and `expiresAt` for contentSharingRequests
- Index on `status` for documents collection
- Index on `userId` and `section` for developerPageImages collection
- Index on `uploadedAt` for developerPageImages collection
- Index on `metadata.isActive` for developerPageImages collection
- Index on `userId`, `month`, and `studentId` for characterTraitAssessments collection
- Index on `assessmentDate` and `emailDate` for characterTraitAssessments collection
- Index on `userId` and `month` for monthlyLeaderboards collection
- Index on `rankings.rank` and `rankings.totalStars` for monthlyLeaderboards collection

---

## 📋 Migration Notes

### From Old Structure
- Old grades used `subject` field with full names
- New structure uses `subjectCode` field with codes
- Migration needed to convert subject names to codes
- Update all grade calculations to use subject codes

### Backward Compatibility
- Support both `subject` and `subjectCode` during transition
- Gradually migrate to `subjectCode` only
- Update UI to display subject names from subjects collection

---

## 🖼️ Developer Page Images Collection

**Collection:** `developerPageImages`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // User ID (owner)
  
  // Image Information
  url: "string",                   // Firebase Storage download URL
  fileName: "string",              // Original filename
  originalFileName: "string",      // Original filename for display
  size: number,                    // File size in bytes
  type: "string",                  // MIME type (e.g., "image/jpeg")
  section: "string",               // "profile", "classroom", "projects", "gallery"
  storagePath: "string",           // Firebase Storage path
  
  // Metadata
  metadata: {
    alt: "string",                 // Alt text for accessibility
    caption: "string",             // Image caption
    category: "string",            // Image category
    isActive: boolean,             // Whether image is active/visible
    order: number                  // Display order (optional)
  },
  
  // Timestamps
  uploadedAt: "timestamp",         // When image was uploaded
  updatedAt: "timestamp"           // Auto-generated on updates
}
```

---

## 🌟 Character Trait Assessments Collection

**Collection:** `characterTraitAssessments`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  studentId: "string",             // Student document ID
  
  // Assessment Information
  assessmentDate: "string",        // Date assessment was done (YYYY-MM-DD)
  emailDate: "string",             // Date of the email being assessed (YYYY-MM-DD)
  month: "string",                 // YYYY-MM format for leaderboard queries
  
  // Content Being Assessed (extracted from yesterday's email)
  quote: "string",                 // The quote from yesterday's email
  challenge: "string",             // The challenge from yesterday's email
  characterTrait: "string",        // Month's character trait
  
  // Assessment Scores
  quoteScore: number,              // 1-5 stars for quote understanding
  challengeScore: number,          // 1-5 stars for challenge completion
  totalScore: number,              // quoteScore + challengeScore (max 10)
  
  // Assessment Details
  quoteNotes: "string",            // Teacher notes on quote understanding
  challengeEvidence: "string",     // Student's response/evidence for challenge
  challengeNotes: "string",        // Teacher notes on challenge completion
  
  // Metadata
  assessedBy: "string",            // Teacher who did the assessment
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## 🏆 Monthly Leaderboards Collection

**Collection:** `monthlyLeaderboards`

### Document Structure
```javascript
{
  id: "string",                    // Auto-generated document ID
  userId: "string",                // Teacher's user ID (owner)
  month: "string",                 // YYYY-MM format
  
  // Leaderboard Data (updated in real-time)
  rankings: [{
    studentId: "string",
    studentName: "string",
    studentImage: "string",         // Profile image URL
    totalStars: number,             // Total stars for the month
    quoteStars: number,             // Total quote stars
    challengeStars: number,         // Total challenge stars
    assessmentCount: number,        // Number of assessments completed
    averageScore: number,           // Average daily score
    rank: number,                   // Current ranking (1st, 2nd, etc.)
    previousRank: number            // Previous ranking for animations
  }],
  
  // Summary Statistics
  totalAssessments: number,
  averageClassScore: number,
  topPerformer: "string",          // Student ID of #1
  
  // Metadata
  lastUpdated: "timestamp",
  createdAt: "timestamp"
}
```

---

## 👨‍💻 Developer Page Content Collection

**Collection:** `developerPageContent`

### Document Structure
```javascript
{
  id: "string",                    // User ID (document ID matches userId)
  userId: "string",                // User ID (owner)
  
  // Profile Information
  profile: {
    name: "string",               // Developer name
    role: "string",               // Professional role
    bio: "string",                // Biography
    experience: "string",         // Years of experience
    specialization: "string",     // Teaching specialization
    school: "string",             // Current school
    background: "string",         // Educational background
    
    // Contact Information
    contact: {
      email: "string",           // Contact email
      linkedin: "string",        // LinkedIn profile URL
      github: "string",          // GitHub profile URL
      portfolio: "string",       // Portfolio website URL
      consulting: "string"       // Consulting/speaking contact
    }
  },
  
  // Journey Information
  journey: {
    motivation: "string",          // Why built Ready-Teacher
    painPoints: "string",          // Classroom pain points
    philosophy: "string"           // Teaching philosophy
  },
  
  // Credentials
  credentials: {
    teaching: ["string"],          // Teaching credentials array
    technical: ["string"]          // Technical skills array
  },
  
  // Image References (for easy access)
  images: {
    profile: "string",            // Profile image ID
    classroom: ["string"],        // Classroom image IDs
    projects: ["string"],         // Project image IDs
    gallery: ["string"]           // Gallery image IDs
  },
  
  // Timestamps
  updatedAt: "timestamp"           // Auto-generated on updates
}
```
