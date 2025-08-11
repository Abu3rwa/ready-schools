# API Design and Microservices for Version 2

## Overview

This document outlines the API design and microservices architecture for Version 2 of the Teacher Dashboard, focusing on transforming the application into a multi-tenant SaaS platform with monetization capabilities using Firebase Cloud Functions.

## Firebase Cloud Functions Architecture

Since we're using Firebase, our "microservices" will be implemented as Firebase Cloud Functions, organized by feature domain:

```
functions/
├── src/
│   ├── auth/
│   ├── billing/
│   ├── schools/
│   ├── users/
│   ├── students/
│   ├── classes/
│   ├── grades/
│   ├── attendance/
│   ├── communication/
│   ├── reports/
│   └── integrations/
├── package.json
└── index.js
```

## API Design Principles

1. **RESTful Design**: Follow REST conventions for predictable APIs
2. **Resource-Oriented**: Organize endpoints around resources
3. **Consistent Naming**: Use consistent naming conventions
4. **Error Handling**: Standardized error responses
5. **Security**: Authentication and authorization at every endpoint
6. **Rate Limiting**: Implement rate limiting to prevent abuse
7. **Versioning**: API versioning for future compatibility

## Core API Services

### 1. Authentication Service

```javascript
// Callable Functions for Authentication
export const login = functions.https.onCall(async (data, context) => {
  // Handle login with email/password or Google
});

export const logout = functions.https.onCall(async (data, context) => {
  // Handle logout and token invalidation
});

export const refreshToken = functions.https.onCall(async (data, context) => {
  // Refresh authentication tokens
});

export const forgotPassword = functions.https.onCall(async (data, context) => {
  // Handle password reset requests
});

export const verifyEmail = functions.https.onCall(async (data, context) => {
  // Handle email verification
});
```

### 2. Organization Management Service

```javascript
// Callable Functions for Organization Management
export const createOrganization = functions.https.onCall(async (data, context) => {
  // Create a new organization (school)
});

export const updateOrganization = functions.https.onCall(async (data, context) => {
  // Update organization details
});

export const getOrganization = functions.https.onCall(async (data, context) => {
  // Get organization details
});

export const listOrganizations = functions.https.onCall(async (data, context) => {
  // List organizations for super admins
});

export const inviteTeacher = functions.https.onCall(async (data, context) => {
  // Invite a teacher to an organization
});

export const removeTeacher = functions.https.onCall(async (data, context) => {
  // Remove a teacher from an organization
});
```

### 3. User Management Service

```javascript
// Callable Functions for User Management
export const createUser = functions.https.onCall(async (data, context) => {
  // Create a new user within an organization
});

export const updateUser = functions.https.onCall(async (data, context) => {
  // Update user details
});

export const getUser = functions.https.onCall(async (data, context) => {
  // Get user details
});

export const listUsers = functions.https.onCall(async (data, context) => {
  // List users within an organization
});

export const updateUserRole = functions.https.onCall(async (data, context) => {
  // Update user role and permissions
});

export const deactivateUser = functions.https.onCall(async (data, context) => {
  // Deactivate a user account
});
```

### 4. Student Management Service

```javascript
// Callable Functions for Student Management
export const createStudent = functions.https.onCall(async (data, context) => {
  // Create a new student record
});

export const updateStudent = functions.https.onCall(async (data, context) => {
  // Update student details
});

export const getStudent = functions.https.onCall(async (data, context) => {
  // Get student details
});

export const listStudents = functions.https.onCall(async (data, context) => {
  // List students within an organization
});

export const enrollStudent = functions.https.onCall(async (data, context) => {
  // Enroll a student in a class
});

export const unenrollStudent = functions.https.onCall(async (data, context) => {
  // Unenroll a student from a class
});

export const createGuardian = functions.https.onCall(async (data, context) => {
  // Create a guardian for a student
});

export const updateGuardian = functions.https.onCall(async (data, context) => {
  // Update guardian details
});
```

### 5. Academic Management Service

```javascript
// Callable Functions for Academic Management
export const createAcademicYear = functions.https.onCall(async (data, context) => {
  // Create a new academic year
});

export const updateAcademicYear = functions.https.onCall(async (data, context) => {
  // Update academic year details
});

export const createGradeLevel = functions.https.onCall(async (data, context) => {
  // Create a new grade level
});

export const updateGradeLevel = functions.https.onCall(async (data, context) => {
  // Update grade level details
});

export const createSubject = functions.https.onCall(async (data, context) => {
  // Create a new subject
});

export const updateSubject = functions.https.onCall(async (data, context) => {
  // Update subject details
});

export const createClass = functions.https.onCall(async (data, context) => {
  // Create a new class
});

export const updateClass = functions.https.onCall(async (data, context) => {
  // Update class details
});

export const assignTeacher = functions.https.onCall(async (data, context) => {
  // Assign a teacher to a class
});
```

### 6. Assessment & Grading Service

```javascript
// Callable Functions for Assessment & Grading
export const createGradingPeriod = functions.https.onCall(async (data, context) => {
  // Create a new grading period
});

export const updateGradingPeriod = functions.https.onCall(async (data, context) => {
  // Update grading period details
});

export const createAssignmentCategory = functions.https.onCall(async (data, context) => {
  // Create a new assignment category
});

export const updateAssignmentCategory = functions.https.onCall(async (data, context) => {
  // Update assignment category details
});

export const createAssignment = functions.https.onCall(async (data, context) => {
  // Create a new assignment
});

export const updateAssignment = functions.https.onCall(async (data, context) => {
  // Update assignment details
});

export const publishAssignment = functions.https.onCall(async (data, context) => {
  // Publish an assignment to students
});

export const recordGrade = functions.https.onCall(async (data, context) => {
  // Record a grade for a student
});

export const updateGrade = functions.https.onCall(async (data, context) => {
  // Update a student's grade
});

export const calculateFinalGrades = functions.https.onCall(async (data, context) => {
  // Calculate final grades for a class or student
});
```

### 7. Attendance Service

```javascript
// Callable Functions for Attendance
export const recordAttendance = functions.https.onCall(async (data, context) => {
  // Record attendance for a student
});

export const updateAttendance = functions.https.onCall(async (data, context) => {
  // Update attendance record
});

export const getAttendance = functions.https.onCall(async (data, context) => {
  // Get attendance records
});

export const generateAttendanceReport = functions.https.onCall(async (data, context) => {
  // Generate attendance report
});
```

### 8. Communication Service

```javascript
// Callable Functions for Communication
export const createThread = functions.https.onCall(async (data, context) => {
  // Create a new communication thread
});

export const sendMessage = functions.https.onCall(async (data, context) => {
  // Send a message in a thread
});

export const getThread = functions.https.onCall(async (data, context) => {
  // Get thread details and messages
});

export const listThreads = functions.https.onCall(async (data, context) => {
  // List threads for a user
});

export const markAsRead = functions.https.onCall(async (data, context) => {
  // Mark thread as read
});
```

### 9. Billing Service

```javascript
// Callable Functions for Billing
export const createSubscription = functions.https.onCall(async (data, context) => {
  // Create a new subscription in Stripe
});

export const updateSubscription = functions.https.onCall(async (data, context) => {
  // Update subscription details
});

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  // Cancel a subscription
});

export const getBillingInfo = functions.https.onCall(async (data, context) => {
  // Get billing information
});

export const processPayment = functions.https.onCall(async (data, context) => {
  // Process a payment
});

export const handleWebhook = functions.https.onRequest(async (req, res) => {
  // Handle Stripe webhook events
});
```

### 10. Reporting Service

```javascript
// Callable Functions for Reporting
export const generateReport = functions.https.onCall(async (data, context) => {
  // Generate a custom report
});

export const scheduleReport = functions.https.onCall(async (data, context) => {
  // Schedule a recurring report
});

export const getReport = functions.https.onCall(async (data, context) => {
  // Get a generated report
});

export const listReports = functions.https.onCall(async (data, context) => {
  // List reports for an organization
});
```

## HTTP Triggered Functions

Some functions will be exposed as HTTP endpoints for external integrations:

```javascript
// HTTP Functions for External Integrations
export const webhookHandler = functions.https.onRequest(async (req, res) => {
  // Handle external webhook events (e.g., Stripe, Google Classroom)
});

export const apiProxy = functions.https.onRequest(async (req, res) => {
  // Proxy for external API integrations
});
```

## Scheduled Functions

Some operations will be performed on a schedule:

```javascript
// Scheduled Functions
export const dailyAttendanceSummary = functions.pubsub
  .schedule('every 24 hours from 00:00 to 01:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Generate daily attendance summaries
  });

export const monthlyReportGeneration = functions.pubsub
  .schedule('every 30 days from 00:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Generate monthly reports for organizations
  });

export const subscriptionRenewalCheck = functions.pubsub
  .schedule('every 1 hours from 09:00 to 17:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Check for upcoming subscription renewals
  });
```

## Error Handling and Response Format

All functions will follow a consistent error handling and response format:

```javascript
// Standard response format
const successResponse = (data) => ({
  success: true,
  data: data
});

const errorResponse = (code, message, details = null) => ({
  success: false,
  error: {
    code: code,
    message: message,
    details: details
  }
});

// Example function with error handling
export const exampleFunction = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.requiredField) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field'
      );
    }
    
    // Perform operation
    const result = await performOperation(data);
    
    // Return success response
    return successResponse(result);
  } catch (error) {
    // Log error for debugging
    console.error('Error in exampleFunction:', error);
    
    // Return error response
    if (error instanceof functions.https.HttpsError) {
      // Firebase function error
      throw error;
    } else {
      // Unexpected error
      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred'
      );
    }
  }
});
```

## Security Implementation

All functions will implement proper security measures:

```javascript
// Authentication check
const authenticate = (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication required'
    );
  }
};

// Authorization check
const authorize = async (context, requiredPermission) => {
  const user = await getUser(context.auth.uid);
  if (!user.permissions.includes(requiredPermission)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Insufficient permissions'
    );
  }
};

// Organization boundary check
const checkOrganizationBoundary = (context, organizationId) => {
  if (context.auth.token.orgId !== organizationId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Access denied: organization boundary violation'
    );
  }
};
```

## Rate Limiting

To prevent abuse, rate limiting will be implemented:

```javascript
// Rate limiting implementation
const rateLimiter = new Map();

const checkRateLimit = (userId, maxRequests = 100, windowMs = 60000) => {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId) || { count: 0, resetTime: 0 };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }
  
  userLimit.count++;
  rateLimiter.set(userId, userLimit);
  
  if (userLimit.count > maxRequests) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Rate limit exceeded'
    );
  }
};
```

## Implementation Roadmap

1. **Phase 1**: Implement core authentication and organization management functions
2. **Phase 2**: Implement user and student management functions
3. **Phase 3**: Implement academic management and assessment functions
4. **Phase 4**: Implement attendance and communication functions
5. **Phase 5**: Implement billing and reporting functions
6. **Phase 6**: Implement scheduled functions and external integrations

## Testing Strategy

Each function will have corresponding unit tests:

```javascript
// Example test structure
describe('Authentication Service', () => {
  beforeEach(() => {
    // Setup test environment
  });
  
  afterEach(() => {
    // Cleanup test environment
  });
  
  test('should create a new user', async () => {
    // Test creating a new user
  });
  
  test('should reject invalid input', async () => {
    // Test error handling for invalid input
  });
  
  test('should enforce organization boundaries', async () => {
    // Test organization boundary enforcement
  });
});
```

## Monitoring and Logging

All functions will implement proper logging:

```javascript
// Logging implementation
const logger = require('firebase-functions/logger');

export const exampleFunction = functions.https.onCall(async (data, context) => {
  // Log function invocation
  logger.info('exampleFunction invoked', {
    userId: context.auth?.uid,
    organizationId: context.auth?.token?.orgId
  });
  
  try {
    // Perform operation
    const result = await performOperation(data);
    
    // Log success
    logger.info('exampleFunction completed successfully', {
      userId: context.auth?.uid,
      result: result
    });
    
    return successResponse(result);
  } catch (error) {
    // Log error
    logger.error('exampleFunction failed', {
      userId: context.auth?.uid,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
});
```

This API design provides a scalable, secure, and monetization-ready foundation for Version 2 of the Teacher Dashboard.