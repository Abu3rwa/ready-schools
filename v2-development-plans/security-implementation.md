# Security Implementation for Version 2

## Overview

This document outlines the security implementation for Version 2 of the Teacher Dashboard, focusing on transforming the application into a multi-tenant SaaS platform with robust security measures to protect educational data and ensure compliance with privacy regulations.

## Security Architecture

### Multi-Tenant Data Isolation

The security model is built around strict data isolation between organizations (schools):

1. **Firestore Security Rules**: Enforce organization boundaries at the database level
2. **Client-Side Filtering**: Ensure all client requests include organization context
3. **Server-Side Validation**: Validate organization context in all Cloud Functions
4. **Token-Based Authorization**: Include organization ID in Firebase Authentication tokens

### Authentication Flow

```javascript
// Client-side authentication with organization context
const authenticateUser = async (email, password, organizationId) => {
  try {
    // Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verify organization membership
    const userDoc = await getDoc(doc(db, `organizations/${organizationId}/users`, userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error('User not authorized for this organization');
    }
    
    // Add custom claims to token
    const idToken = await userCredential.user.getIdToken(true);
    
    return {
      user: userCredential.user,
      organizationId: organizationId,
      token: idToken
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};
```

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if user belongs to organization
    function belongsToOrganization(orgId) {
      return request.auth != null 
        && request.auth.token.orgId == orgId;
    }
    
    // Function to check if user has specific role
    function hasRole(orgId, role) {
      return belongsToOrganization(orgId) 
        && request.auth.token.role == role;
    }
    
    // Function to check if user has permission
    function hasPermission(orgId, permission) {
      return belongsToOrganization(orgId) 
        && request.auth.token.permissions.hasAny([permission, 'admin']);
    }
    
    // Organization-level documents
    match /organizations/{orgId} {
      allow read: if belongsToOrganization(orgId);
      allow write: if hasRole(orgId, 'org_admin') || hasRole(orgId, 'super_admin');
      
      // Users collection
      match /users/{userId} {
        allow read: if belongsToOrganization(orgId);
        allow write: if hasRole(orgId, 'org_admin') || hasRole(orgId, 'super_admin');
      }
      
      // Students collection
      match /students/{studentId} {
        allow read: if belongsToOrganization(orgId);
        allow write: if hasPermission(orgId, 'manage_students');
      }
      
      // Classes collection
      match /classes/{classId} {
        allow read: if belongsToOrganization(orgId);
        allow write: if hasPermission(orgId, 'manage_classes');
      }
      
      // Other collections follow similar patterns...
    }
    
    // Global admin access
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'super_admin';
    }
  }
}
```

## Data Protection

### Encryption at Rest

Firebase automatically encrypts data at rest. For additional protection of sensitive data:

```javascript
// Client-side encryption for highly sensitive data
import crypto from 'crypto';

const encryptData = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decryptData = (encryptedData, key) => {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### Data in Transit

All communication uses HTTPS/TLS encryption:

```javascript
// Firebase SDK automatically uses HTTPS
// Custom functions should enforce HTTPS
export const secureFunction = functions.https.onRequest((req, res) => {
  // Ensure request is over HTTPS
  if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    res.redirect('https://' + req.get('host') + req.url);
    return;
  }
  
  // Process secure request
  // ...
});
```

## Identity and Access Management

### Role-Based Access Control (RBAC)

```javascript
// Define roles and permissions
const roles = {
  super_admin: {
    name: "Super Administrator",
    permissions: [
      "manage_all_organizations",
      "manage_billing",
      "view_all_data",
      "manage_users",
      "manage_system_settings"
    ]
  },
  org_admin: {
    name: "Organization Administrator",
    permissions: [
      "manage_teachers",
      "manage_students",
      "manage_classes",
      "view_reports",
      "manage_settings"
    ]
  },
  teacher: {
    name: "Teacher",
    permissions: [
      "view_assigned_students",
      "record_grades",
      "record_attendance",
      "send_messages"
    ]
  },
  substitute: {
    name: "Substitute Teacher",
    permissions: [
      "view_assigned_classes",
      "record_attendance"
    ]
  },
  observer: {
    name: "Observer",
    permissions: [
      "view_assigned_data"
    ]
  }
};

// Function to set custom claims for a user
const setCustomUserClaims = async (userId, organizationId, role) => {
  const roleConfig = roles[role];
  if (!roleConfig) {
    throw new Error('Invalid role');
  }
  
  const customClaims = {
    orgId: organizationId,
    role: role,
    permissions: roleConfig.permissions
  };
  
  await admin.auth().setCustomUserClaims(userId, customClaims);
};
```

### Authentication Token Management

```javascript
// Refresh custom claims when user details change
const refreshCustomClaims = async (userId) => {
  // Get current user data
  const userDoc = await admin.firestore().doc(`users/${userId}`).get();
  const userData = userDoc.data();
  
  // Update custom claims
  const customClaims = {
    orgId: userData.organizationId,
    role: userData.role,
    permissions: roles[userData.role].permissions
  };
  
  await admin.auth().setCustomUserClaims(userId, customClaims);
  
  // Force token refresh on client
  return admin.auth().revokeRefreshTokens(userId);
};
```

## Compliance and Privacy

### FERPA Compliance

To ensure compliance with the Family Educational Rights and Privacy Act:

```javascript
// Data retention and deletion policies
const deleteStudentData = async (studentId, organizationId) => {
  // Create deletion record
  await admin.firestore().collection('deletion_logs').add({
    studentId: studentId,
    organizationId: organizationId,
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    deletedBy: admin.auth().currentUser.uid
  });
  
  // Delete student data with proper audit trail
  const batch = admin.firestore().batch();
  
  // Delete student document
  batch.delete(admin.firestore().doc(`organizations/${organizationId}/students/${studentId}`));
  
  // Delete related documents
  const relatedDocs = await admin.firestore()
    .collection(`organizations/${organizationId}/studentGrades`)
    .where('studentId', '==', studentId)
    .get();
    
  relatedDocs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};
```

### COPPA Compliance

For compliance with the Children's Online Privacy Protection Act:

```javascript
// Age verification for users
const verifyAgeForCOPPA = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  
  return age;
};

// Parental consent verification
const verifyParentalConsent = async (studentId, parentId) => {
  // Send consent request to parent
  // Store consent record
  await admin.firestore().collection('parental_consents').add({
    studentId: studentId,
    parentId: parentId,
    consentGivenAt: admin.firestore.FieldValue.serverTimestamp(),
    consentFormVersion: '1.0'
  });
};
```

## Security Monitoring and Auditing

### Audit Logging

```javascript
// Audit logging for security events
const logSecurityEvent = async (event, userId, organizationId, details = {}) => {
  await admin.firestore().collection('security_logs').add({
    event: event,
    userId: userId,
    organizationId: organizationId,
    details: details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: null // Would be captured from request context
  });
};

// Example usage in Cloud Functions
export const updateUserRole = functions.https.onCall(async (data, context) => {
  // Authenticate and authorize
  if (!context.auth) {
    await logSecurityEvent('unauthorized_access_attempt', null, null, {
      function: 'updateUserRole',
      data: data
    });
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  
  // Log the role update
  await logSecurityEvent('user_role_updated', context.auth.uid, context.auth.token.orgId, {
    targetUserId: data.userId,
    newRole: data.role
  });
  
  // Perform the role update
  // ...
});
```

### Intrusion Detection

```javascript
// Rate limiting for brute force protection
const rateLimiters = new Map();

const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const limiter = rateLimiters.get(identifier) || { attempts: 0, resetTime: 0 };
  
  if (now > limiter.resetTime) {
    limiter.attempts = 0;
    limiter.resetTime = now + windowMs;
  }
  
  limiter.attempts++;
  rateLimiters.set(identifier, limiter);
  
  if (limiter.attempts > maxAttempts) {
    // Log security event
    logSecurityEvent('rate_limit_exceeded', null, null, {
      identifier: identifier
    });
    
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }
};
```

## Vulnerability Management

### Input Validation

```javascript
// Input validation for all API endpoints
const validateInput = (data, schema) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required field check
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Type check
    if (value !== undefined && rules.type) {
      if (typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
    }
    
    // Length check
    if (value !== undefined && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${field} must be no more than ${rules.maxLength} characters`);
    }
    
    // Format check (for emails, etc.)
    if (value !== undefined && rules.format && rules.format === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }
    }
  }
  
  if (errors.length > 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Validation failed', errors);
  }
};

// Example usage
const userSchema = {
  email: { required: true, type: 'string', format: 'email' },
  firstName: { required: true, type: 'string', maxLength: 50 },
  lastName: { required: true, type: 'string', maxLength: 50 },
  role: { required: true, type: 'string', allowedValues: ['teacher', 'admin', 'substitute'] }
};

export const createUser = functions.https.onCall(async (data, context) => {
  // Validate input
  validateInput(data, userSchema);
  
  // Continue with user creation
  // ...
});
```

### Cross-Site Scripting (XSS) Protection

```javascript
// Sanitize user input to prevent XSS
import sanitizeHtml from 'sanitize-html';

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}
    });
  }
  return input;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
```

## Incident Response

### Security Incident Handling

```javascript
// Security incident response procedures
const handleSecurityIncident = async (incidentType, details) => {
  // Log the incident
  await admin.firestore().collection('security_incidents').add({
    type: incidentType,
    details: details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: 'reported'
  });
  
  // Notify security team
  // Send alert to administrators
  // Depending on severity, notify external parties
};

// Example: Handling unauthorized access attempt
export const handleUnauthorizedAccess = functions.https.onCall(async (data, context) => {
  await handleSecurityIncident('unauthorized_access', {
    userId: context.auth?.uid,
    organizationId: context.auth?.token?.orgId,
    function: data.function,
    ipAddress: null // Would be captured from request
  });
  
  throw new functions.https.HttpsError('permission-denied', 'Access denied');
});
```

## Security Testing

### Penetration Testing Plan

1. **Authentication Testing**
   - Test password strength requirements
   - Test account lockout mechanisms
   - Test session management

2. **Authorization Testing**
   - Test role-based access controls
   - Test organization boundary enforcement
   - Test privilege escalation attempts

3. **Data Protection Testing**
   - Test data encryption
   - Test secure data transmission
   - Test data backup and recovery

4. **Input Validation Testing**
   - Test for SQL injection
   - Test for XSS vulnerabilities
   - Test for CSRF protection

5. **Configuration Testing**
   - Test security headers
   - Test HTTPS enforcement
   - Test security rule effectiveness

## Implementation Roadmap

1. **Phase 1**: Implement Firestore security rules and basic authentication
2. **Phase 2**: Implement role-based access control and custom claims
3. **Phase 3**: Implement audit logging and security monitoring
4. **Phase 4**: Implement compliance features (FERPA, COPPA)
5. **Phase 5**: Implement advanced security features and incident response
6. **Phase 6**: Conduct security testing and penetration testing

This security implementation provides a comprehensive foundation for protecting educational data while ensuring compliance with relevant regulations.