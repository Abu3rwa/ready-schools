# Database Design for Version 2

## Overview

This document outlines the database design for Version 2 of the Teacher Dashboard, focusing on transforming the application into a multi-tenant SaaS platform with monetization capabilities using Firestore as the primary database.

## Multi-Tenancy Approach

Firestore will be structured with organizations (schools) as the top-level partition. Each organization will have its own collection of data, ensuring complete data isolation between institutions.

## Core Data Collections

### 1. Organizations Collection

```
organizations/{orgId}
```

```javascript
{
  // Basic Information
  name: "School Name",
  type: "school|district|network",
  subdomain: "schoolname", // For custom URLs
  customDomain: "portal.school.edu", // Custom domain if applicable
  
  // Status and Subscription
  status: "trial|active|suspended|cancelled",
  subscription: {
    plan: "basic|standard|premium",
    status: "active|cancelled|past_due|unpaid",
    stripeSubscriptionId: "sub_123456789",
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
    trialEnd: Timestamp,
    billingCycle: "monthly|annual"
  },
  
  // Branding
  logoUrl: "https://storage.googleapis.com/...",
  primaryColor: "#3f51b5",
  secondaryColor: "#f50057",
  
  // Contact Information
  address: {
    line1: "123 School Street",
    line2: "Suite 100",
    city: "City",
    state: "State",
    postalCode: "12345",
    country: "US"
  },
  phone: "+1-555-123-4567",
  website: "https://school.edu",
  
  // Settings
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  academicYear: {
    start: Timestamp,
    end: Timestamp
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "userId"
}
```

### 2. Users Collection

```
users/{userId}
```

```javascript
{
  organizationId: "orgId", // Reference to organization
  email: "teacher@school.edu",
  emailVerified: true,
  
  // Profile Information
  firstName: "John",
  lastName: "Doe",
  displayName: "Mr. Doe",
  title: "Teacher|Administrator|Principal",
  avatarUrl: "https://storage.googleapis.com/...",
  
  // Role & Permissions
  role: "super_admin|org_admin|teacher|substitute|observer",
  permissions: ["permission1", "permission2"], // Granular permissions
  
  // Settings
  timezone: "America/New_York",
  language: "en-US",
  preferences: {
    // User-specific preferences
  },
  
  // Status
  status: "active|inactive|suspended|pending",
  lastLoginAt: Timestamp,
  lastActiveAt: Timestamp,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "userId"
}
```

### 3. Academic Structure Collections

#### Academic Years Collection

```
organizations/{orgId}/academicYears/{yearId}
```

```javascript
{
  name: "2024-2025",
  startDate: Timestamp,
  endDate: Timestamp,
  isActive: true,
  createdAt: Timestamp
}
```

#### Grade Levels Collection

```
organizations/{orgId}/gradeLevels/{gradeId}
```

```javascript
{
  name: "9th Grade",
  code: "9",
  sortOrder: 9,
  isActive: true,
  createdAt: Timestamp
}
```

#### Subjects Collection

```
organizations/{orgId}/subjects/{subjectId}
```

```javascript
{
  name: "Mathematics",
  code: "MATH",
  description: "Mathematics curriculum",
  color: "#2196f3",
  isActive: true,
  createdAt: Timestamp
}
```

#### Classes Collection

```
organizations/{orgId}/classes/{classId}
```

```javascript
{
  academicYearId: "yearId",
  subjectId: "subjectId",
  gradeLevelId: "gradeId",
  
  // Basic Information
  name: "Algebra I - Period 3",
  code: "ALG1-P3",
  description: "Freshman Algebra I course",
  
  // Schedule
  period: "3",
  roomNumber: "205",
  schedule: {
    monday: "09:00-09:50",
    tuesday: "09:00-09:50"
    // ... other days
  },
  
  // Teachers
  primaryTeacherId: "userId",
  
  // Settings
  maxEnrollment: 30,
  isActive: true,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. Student Management Collections

#### Students Collection

```
organizations/{orgId}/students/{studentId}
```

```javascript
{
  // Personal Information
  firstName: "Jane",
  lastName: "Smith",
  middleName: "Marie",
  preferredName: "Janey",
  dateOfBirth: Timestamp,
  gender: "female|male|other",
  
  // Identification
  studentId: "S123456789",
  stateId: "STU987654321",
  
  // Contact Information
  email: "jane.smith@student.school.edu",
  phone: "+1-555-987-6543",
  address: {
    line1: "456 Home Street",
    line2: "Apt 2B",
    city: "Hometown",
    state: "State",
    postalCode: "54321"
  },
  
  // Academic Information
  gradeLevelId: "gradeId",
  enrollmentDate: Timestamp,
  graduationDate: Timestamp,
  
  // Special Programs
  specialEducation: false,
  englishLanguageLearner: false,
  giftedAndTalented: false,
  freeReducedLunch: true,
  
  // Status
  status: "enrolled|transferred|graduated|dropped|inactive",
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Student Enrollments Collection

```
organizations/{orgId}/studentEnrollments/{enrollmentId}
```

```javascript
{
  studentId: "studentId",
  classId: "classId",
  
  enrollmentDate: Timestamp,
  withdrawalDate: Timestamp,
  status: "enrolled|withdrawn|transferred",
  
  // Academic tracking
  finalGrade: "A",
  creditHours: 1.0,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Student Guardians Collection

```
organizations/{orgId}/studentGuardians/{guardianId}
```

```javascript
{
  studentId: "studentId",
  
  // Personal Information
  firstName: "Robert",
  lastName: "Smith",
  relationship: "parent|guardian|grandparent|other",
  
  // Contact Information
  email: "robert.smith@gmail.com",
  primaryPhone: "+1-555-111-2222",
  secondaryPhone: "+1-555-333-4444",
  address: {
    line1: "456 Home Street",
    line2: "Apt 2B",
    city: "Hometown",
    state: "State",
    postalCode: "54321"
  },
  
  // Preferences
  primaryContact: true,
  emergencyContact: true,
  pickupAuthorized: true,
  
  // Communication Preferences
  emailNotifications: true,
  smsNotifications: false,
  preferredLanguage: "en-US",
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5. Assessment & Grading Collections

#### Grading Periods Collection

```
organizations/{orgId}/gradingPeriods/{periodId}
```

```javascript
{
  academicYearId: "yearId",
  name: "Quarter 1",
  startDate: Timestamp,
  endDate: Timestamp,
  weight: 25.00, // percentage weight
  isActive: true,
  createdAt: Timestamp
}
```

#### Assignment Categories Collection

```
organizations/{orgId}/classes/{classId}/assignmentCategories/{categoryId}
```

```javascript
{
  name: "Homework",
  description: "Daily homework assignments",
  weight: 20.00, // percentage weight in final grade
  color: "#ff9800",
  sortOrder: 1,
  
  // Grading settings
  dropLowest: 2, // number of lowest scores to drop
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Assignments Collection

```
organizations/{orgId}/classes/{classId}/assignments/{assignmentId}
```

```javascript
{
  categoryId: "categoryId", // Optional
  gradingPeriodId: "periodId", // Optional
  
  // Basic Information
  title: "Chapter 1 Review",
  description: "Review questions for Chapter 1",
  instructions: "Complete all questions in textbook",
  
  // Grading
  pointsPossible: 100,
  gradingScale: "points|percentage|letter|pass_fail",
  
  // Dates
  assignedDate: Timestamp,
  dueDate: Timestamp,
  availableFrom: Timestamp,
  availableUntil: Timestamp,
  
  // Settings
  allowLateSubmissions: true,
  latePenaltyPerDay: 5.00,
  extraCredit: false,
  
  // Status
  status: "draft|published|closed",
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "userId"
}
```

#### Student Grades Collection

```
organizations/{orgId}/studentGrades/{gradeId}
```

```javascript
{
  studentId: "studentId",
  assignmentId: "assignmentId",
  
  // Grade Information
  pointsEarned: 85,
  pointsPossible: 100,
  letterGrade: "B",
  percentage: 85.00,
  
  // Submission Details
  submittedAt: Timestamp,
  gradedAt: Timestamp,
  lateSubmission: false,
  excused: false,
  
  // Feedback
  teacherComments: "Good work, but needs improvement in section 3",
  privateNotes: "Struggles with word problems", // only visible to teachers
  
  // Status
  status: "not_submitted|submitted|graded|returned",
  
  // Grading metadata
  gradedBy: "userId",
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 6. Attendance Management Collections

#### Attendance Records Collection

```
organizations/{orgId}/attendanceRecords/{recordId}
```

```javascript
{
  studentId: "studentId",
  classId: "classId",
  
  // Attendance Details
  attendanceDate: Timestamp,
  period: "3", // class period or "full_day"
  status: "present|absent|tardy|excused_absent|early_dismissal",
  
  // Time tracking
  arrivalTime: Timestamp,
  departureTime: Timestamp,
  minutesLate: 15,
  
  // Notes and reasons
  absenceReason: "Doctor appointment",
  teacherNotes: "Student arrived late but participated well",
  excusedBy: "userId",
  excuseReason: "Medical appointment",
  
  // Metadata
  recordedBy: "userId",
  recordedAt: Timestamp,
  updatedBy: "userId",
  updatedAt: Timestamp
}
```

### 7. Communication Collections

#### Communication Threads Collection

```
organizations/{orgId}/communicationThreads/{threadId}
```

```javascript
{
  // Thread Information
  subject: "Regarding Jane Smith's Progress",
  threadType: "teacher_parent|teacher_admin|general|announcement",
  priority: "low|normal|high|urgent",
  
  // Participants
  createdBy: "userId",
  
  // Related entities
  studentId: "studentId", // if student-related
  classId: "classId", // if class-related
  
  // Status
  status: "active|closed|archived",
  isRead: false,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastMessageAt: Timestamp
}
```

#### Thread Participants Collection

```
organizations/{orgId}/communicationThreads/{threadId}/participants/{participantId}
```

```javascript
{
  threadId: "threadId",
  userId: "userId", // nullable for guardian participants
  guardianId: "guardianId", // nullable for user participants
  
  role: "owner|participant|observer",
  joinedAt: Timestamp,
  leftAt: Timestamp,
  
  // Read status
  lastReadAt: Timestamp,
  unreadCount: 0,
  
  // Notifications
  notificationsEnabled: true
}
```

#### Messages Collection

```
organizations/{orgId}/communicationThreads/{threadId}/messages/{messageId}
```

```javascript
{
  threadId: "threadId",
  
  // Sender (either user or guardian)
  senderUserId: "userId",
  senderGuardianId: "guardianId",
  
  // Message Content
  content: "Hello, I wanted to discuss Jane's recent progress...",
  messageType: "text|attachment|system",
  
  // Attachments
  attachments: [
    {
      name: "progress_report.pdf",
      url: "https://storage.googleapis.com/...",
      type: "application/pdf",
      size: 102400
    }
  ],
  
  // Status
  isEdited: false,
  editedAt: Timestamp,
  isDeleted: false,
  deletedAt: Timestamp,
  
  createdAt: Timestamp
}
```

## Security Rules Implementation

Firestore security rules will be implemented to ensure data isolation:

```javascript
// Allow users to read/write only their organization's data
match /organizations/{orgId}/{document=**} {
  allow read, write: if request.auth != null 
    && request.auth.token.orgId == orgId;
}

// Additional rules for specific collections
match /users/{userId} {
  allow read, write: if request.auth != null 
    && request.auth.token.orgId == resource.data.organizationId;
}
```

## Indexing Strategy

To optimize query performance, the following indexes will be created:

1. Composite indexes for common queries:
   - organizations/{orgId}/students - status, gradeLevelId
   - organizations/{orgId}/classes - academicYearId, primaryTeacherId
   - organizations/{orgId}/attendanceRecords - studentId, attendanceDate
   - organizations/{orgId}/studentGrades - studentId, assignmentId

2. Single-field indexes for sorting:
   - createdAt on most collections
   - updatedAt on frequently updated collections
   - status fields for filtering

## Data Migration Strategy

1. Create new organization documents for existing users
2. Update existing collections to include organization context
3. Migrate user data to new structure with organizationId
4. Update security rules to enforce organization boundaries
5. Implement feature flagging based on subscription tier

## Backup and Recovery

- Daily automated backups using Firebase backups
- Point-in-time recovery for critical data
- Cross-region replication for disaster recovery
- Regular testing of backup restoration procedures

## Cost Optimization

- Use Firestore's document batching for bulk operations
- Implement client-side caching to reduce reads
- Use Cloud Functions for expensive operations
- Monitor and optimize queries to reduce document reads