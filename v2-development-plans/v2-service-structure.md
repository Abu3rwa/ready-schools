# V2 Service Structure

This document outlines the proposed service structure for Version 2 of the Teacher Dashboard, organized by the Firebase Cloud Functions architecture with comprehensive multi-tenancy support.

## Multi-Tenancy Architecture

### Core Principles
- **Organization Context**: Every service must include organization context
- **Data Isolation**: Complete separation of data between organizations
- **Service Scoping**: All services are scoped to specific organizations
- **Permission Enforcement**: Role-based access control at the service level

### Base Service Pattern
```javascript
// Base service class that all services extend
class BaseService {
  constructor(organizationId) {
    this.organizationId = organizationId;
    this.validateOrganizationId(organizationId);
  }
  
  validateOrganizationId(orgId) {
    if (!orgId || typeof orgId !== 'string') {
      throw new Error('Valid organization ID is required');
    }
  }
  
  // Helper method for organization-scoped queries
  getOrganizationQuery(collection) {
    return this.firestore
      .collection(collection)
      .where('organizationId', '==', this.organizationId);
  }
  
  // Helper method for organization-scoped documents
  getOrganizationDocument(collection, docId) {
    return this.firestore
      .collection(collection)
      .doc(docId)
      .where('organizationId', '==', this.organizationId);
  }
}
```

## Frontend Services (`src/services`)

```
src/services/
├── apiService.js                 # Core API interactions with backend
├── authService.js                # Authentication and user management
├── organizationService.js        # Organization management
├── studentService.js             # Student data management
├── gradeService.js               # Grade and assessment management
├── attendanceService.js          # Attendance tracking
├── assignmentService.js          # Assignment management
├── communicationService.js       # Messaging and communication
├── dailyUpdateService.js         # Daily update generation and sending
├── emailService.js               # Email operations
├── reportService.js              # Report generation and management
├── billingService.js             # Billing and subscription management
├── cacheService.js               # Client-side caching
├── analyticsService.js           # Usage analytics and insights
├── permissionService.js          # Permission checking and RBAC
├── subscriptionService.js        # Subscription tier management
└── utils/                        # Utility functions
    ├── dataValidator.js          # Data validation utilities
    ├── errorHandler.js           # Error handling utilities
    ├── logger.js                 # Logging utilities
    ├── organizationContext.js    # Organization context utilities
    └── featureFlags.js           # Feature flagging utilities
```

### Multi-Tenancy Implementation

#### Organization Context Management
```javascript
// organizationContext.js - Manages organization context across services
class OrganizationContext {
  constructor() {
    this.currentOrganization = null;
    this.organizationCache = new Map();
  }
  
  setCurrentOrganization(orgId) {
    this.currentOrganization = orgId;
    localStorage.setItem('currentOrganization', orgId);
  }
  
  getCurrentOrganization() {
    return this.currentOrganization;
  }
  
  async validateOrganizationAccess(orgId, userId) {
    // Verify user has access to this organization
    const userDoc = await getDoc(
      doc(db, `organizations/${orgId}/users`, userId)
    );
    return userDoc.exists();
  }
}
```

#### Service Factory Pattern
```javascript
// Service factory for creating organization-scoped services
class ServiceFactory {
  static createService(serviceType, organizationId) {
    switch (serviceType) {
      case 'student':
        return new StudentService(organizationId);
      case 'grade':
        return new GradeService(organizationId);
      case 'attendance':
        return new AttendanceService(organizationId);
      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }
  }
}

// Usage in components
const studentService = ServiceFactory.createService('student', organization.id);
```

## Backend Services (`functions/src/services`)

Following the Firebase Cloud Functions architecture organized by feature domain with multi-tenancy support:

```
functions/src/services/
├── auth/                         # Authentication service
│   ├── authService.js            # Core authentication logic
│   ├── authValidators.js         # Authentication validation
│   ├── multiTenantAuth.js        # Multi-tenant authentication
│   └── permissionService.js      # Permission checking
├── billing/                      # Billing and subscription service
│   ├── billingService.js         # Billing operations
│   ├── stripeService.js          # Stripe integration
│   ├── subscriptionService.js    # Subscription management
│   └── planService.js            # Plan and feature management
├── schools/                      # Organization management service
│   ├── organizationService.js    # Organization operations
│   ├── schoolValidators.js       # Organization validation
│   ├── tenantService.js          # Multi-tenant operations
│   └── brandingService.js        # Organization branding
├── users/                        # User management service
│   ├── userService.js            # User operations
│   ├── userValidators.js         # User validation
│   ├── roleService.js            # Role and permission management
│   └── invitationService.js      # User invitation system
├── students/                     # Student management service
│   ├── studentService.js         # Student operations
│   ├── guardianService.js        # Guardian operations
│   ├── enrollmentService.js      # Enrollment management
│   └── studentValidator.js       # Student data validation
├── classes/                      # Class management service
│   ├── classService.js           # Class operations
│   ├── classValidators.js        # Class validation
│   ├── scheduleService.js        # Class scheduling
│   └── teacherAssignmentService.js # Teacher assignments
├── grades/                       # Assessment and grading service
│   ├── assignmentService.js      # Assignment operations
│   ├── gradeService.js           # Grade recording and calculation
│   ├── categoryService.js        # Assignment category management
│   ├── gradingPeriodService.js   # Grading period management
│   └── gradeValidator.js         # Grade validation
├── attendance/                   # Attendance service
│   ├── attendanceService.js      # Attendance operations
│   ├── attendanceReportService.js# Attendance reporting
│   ├── attendancePolicyService.js# Attendance policies
│   └── attendanceValidator.js    # Attendance validation
├── communication/                # Communication service
│   ├── messagingService.js       # Message handling
│   ├── threadService.js          # Thread management
│   ├── notificationService.js    # Notification system
│   ├── templateService.js        # Message templates
│   └── deliveryService.js        # Message delivery
├── reports/                      # Reporting service
│   ├── reportService.js          # Report generation
│   ├── scheduleService.js        # Report scheduling
│   ├── templateService.js        # Report templates
│   ├── deliveryService.js        # Report delivery
│   └── customReportService.js    # Custom report builder
├── integrations/                 # External integrations service
│   ├── googleClassroomService.js # Google Classroom integration
│   ├── googleSheetsService.js    # Google Sheets integration
│   ├── apiProxyService.js        # External API proxy
│   └── webhookService.js         # Webhook handling
├── dailyUpdates/                 # Daily update service
│   ├── dailyUpdateService.js     # Daily update generation
│   ├── emailService.js           # Email operations
│   ├── attachmentService.js      # Attachment handling
│   ├── templateService.js        # Update templates
│   └── scheduleService.js        # Update scheduling
├── analytics/                    # Analytics service
│   ├── usageService.js           # Usage tracking
│   ├── insightService.js         # Data insights
│   ├── performanceService.js     # Performance metrics
│   └── reportService.js          # Analytics reporting
├── security/                     # Security service
│   ├── auditService.js           # Audit logging
│   ├── rateLimitService.js       # Rate limiting
│   ├── encryptionService.js      # Data encryption
│   └── complianceService.js      # Compliance monitoring
└── utils/                        # Utility functions
    ├── dataValidator.js          # Data validation utilities
    ├── errorHandler.js           # Error handling utilities
    ├── logger.js                 # Logging utilities
    ├── security.js               # Security utilities
    ├── organizationContext.js    # Organization context utilities
    ├── featureFlags.js           # Feature flagging utilities
    └── cache.js                  # Caching utilities
```

## Multi-Tenancy Implementation Details

### 1. Organization Context in All Services

```javascript
// Example: Enhanced student service with multi-tenancy
class StudentService extends BaseService {
  constructor(organizationId) {
    super(organizationId);
  }
  
  async getStudents(filters = {}) {
    // Always include organization context
    let query = this.getOrganizationQuery('students');
    
    // Apply additional filters
    if (filters.gradeLevel) {
      query = query.where('gradeLevelId', '==', filters.gradeLevel);
    }
    
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  async createStudent(studentData) {
    // Validate organization context
    if (studentData.organizationId !== this.organizationId) {
      throw new Error('Organization ID mismatch');
    }
    
    // Add audit fields
    const enrichedData = {
      ...studentData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: this.currentUserId,
      organizationId: this.organizationId
    };
    
    const docRef = await this.firestore
      .collection('students')
      .add(enrichedData);
    
    return { id: docRef.id, ...enrichedData };
  }
}
```

### 2. Permission-Based Service Access

```javascript
// permissionService.js - Manages role-based access control
class PermissionService {
  static async checkPermission(userId, organizationId, permission) {
    const userDoc = await getDoc(
      doc(db, `organizations/${organizationId}/users`, userId)
    );
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    return userData.permissions.includes(permission);
  }
  
  static async getServicePermissions(userId, organizationId) {
    const userDoc = await getDoc(
      doc(db, `organizations/${organizationId}/users`, userId)
    );
    
    if (!userDoc.exists()) {
      return [];
    }
    
    return userDoc.data().permissions || [];
  }
}

// Usage in services
class GradeService extends BaseService {
  async updateGrade(gradeId, gradeData, userId) {
    // Check permission
    const hasPermission = await PermissionService.checkPermission(
      userId, 
      this.organizationId, 
      'update_grades'
    );
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }
    
    // Proceed with grade update
    // ...
  }
}
```

### 3. Feature Flagging Based on Subscription

```javascript
// featureFlags.js - Manages feature access based on subscription
class FeatureFlagService {
  static async checkFeatureAccess(organizationId, feature) {
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
      return false;
    }
    
    const orgData = orgDoc.data();
    const subscription = orgData.subscription;
    
    const featureMatrix = {
      basic: ['attendance', 'grades', 'basic_reports'],
      standard: ['attendance', 'grades', 'behavior', 'communication', 'advanced_reports'],
      premium: ['attendance', 'grades', 'behavior', 'communication', 'analytics', 'api', 'custom_branding']
    };
    
    return featureMatrix[subscription.plan]?.includes(feature) || false;
  }
  
  static async getAvailableFeatures(organizationId) {
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
      return [];
    }
    
    const orgData = orgDoc.data();
    const subscription = orgData.subscription;
    
    const featureMatrix = {
      basic: ['attendance', 'grades', 'basic_reports'],
      standard: ['attendance', 'grades', 'behavior', 'communication', 'advanced_reports'],
      premium: ['attendance', 'grades', 'behavior', 'communication', 'analytics', 'api', 'custom_branding']
    };
    
    return featureMatrix[subscription.plan] || [];
  }
}
```

## Service Responsibilities

### Frontend Services

1. **apiService.js** - Handles all HTTP requests to backend functions with organization context
2. **authService.js** - Manages multi-tenant authentication state and user sessions
3. **organizationService.js** - Handles organization selection, context, and management
4. **studentService.js** - Manages organization-scoped student data operations
5. **gradeService.js** - Handles organization-scoped grade and assessment operations
6. **attendanceService.js** - Manages organization-scoped attendance tracking
7. **assignmentService.js** - Handles organization-scoped assignment management
8. **communicationService.js** - Manages organization-scoped messaging and communication
9. **dailyUpdateService.js** - Handles organization-scoped daily update generation and sending
10. **emailService.js** - Manages organization-scoped email operations
11. **reportService.js** - Handles organization-scoped report generation and management
12. **billingService.js** - Manages organization-scoped billing and subscription operations
13. **cacheService.js** - Implements organization-aware client-side caching strategies
14. **analyticsService.js** - Handles organization-scoped usage analytics and insights
15. **permissionService.js** - Manages role-based access control and permissions
16. **subscriptionService.js** - Manages subscription tiers and feature access

### Backend Services

#### Auth Services
- Multi-tenant user authentication and authorization
- Organization context validation
- Token management with organization claims
- Password reset functionality
- Email verification
- Permission-based access control

#### Billing Services
- Organization-scoped subscription management
- Stripe integration with organization context
- Payment processing and billing
- Plan management and feature flagging
- Usage tracking and limits

#### School Services
- Multi-tenant organization creation and management
- School settings and configuration per organization
- User invitation and management within organizations
- Organization branding and customization
- Tenant isolation and data boundaries

#### User Services
- Organization-scoped user profile management
- Role assignment and permission management within organizations
- User status management and access control
- Multi-organization user support
- User invitation and onboarding

#### Student Services
- Organization-scoped student data management
- Guardian information management within organizations
- Enrollment operations and tracking
- Student data validation and security
- Bulk operations with organization context

#### Class Services
- Organization-scoped class creation and management
- Teacher assignment within organizations
- Class scheduling and organization
- Class validation and access control
- Academic year management

#### Grade Services
- Organization-scoped assignment creation and management
- Grade recording and calculation within organizations
- Category and grading period management
- Grade validation and security
- Custom grading scales per organization

#### Attendance Services
- Organization-scoped attendance recording
- Attendance reporting and analytics
- Attendance policies and customization
- Attendance validation and security
- Bulk attendance operations

#### Communication Services
- Organization-scoped messaging between users
- Thread management within organizations
- Notification system with organization context
- Message templates and customization
- Delivery tracking and analytics

#### Report Services
- Organization-scoped report generation
- Report scheduling and automation
- Template management and customization
- Report delivery and tracking
- Custom report builder with organization branding

#### Integration Services
- Organization-scoped Google Classroom integration
- Google Sheets integration with organization context
- External API proxy with organization isolation
- Webhook handling and security
- Integration configuration per organization

#### Daily Update Services
- Organization-scoped daily update generation
- Email operations with organization templates
- Attachment handling and storage
- Update scheduling and automation
- Template customization per organization

#### Analytics Services
- Organization-scoped usage tracking
- Data insights and analytics
- Performance metrics and monitoring
- Analytics reporting and dashboards
- Data export with organization context

#### Security Services
- Organization-scoped audit logging
- Rate limiting per organization
- Data encryption and security
- Compliance monitoring (FERPA, COPPA)
- Security incident response

## Implementation Notes

### 1. **Multi-Tenancy First**
- Every service must be designed with multi-tenancy in mind
- All data operations must include organization context
- Services must validate organization boundaries

### 2. **Modularity and Reusability**
- Each service should have a single responsibility
- Services should be designed for reuse across features
- Use dependency injection for service configuration

### 3. **Security and Compliance**
- Implement proper authentication and authorization
- Enforce organization boundaries at all levels
- Ensure compliance with educational data regulations

### 4. **Performance and Scalability**
- Design for horizontal scaling across organizations
- Implement efficient caching strategies
- Optimize database queries for multi-tenant operations

### 5. **Testing and Quality**
- Services should be easily testable in isolation
- Implement comprehensive testing for multi-tenancy
- Test organization boundary enforcement

### 6. **Error Handling and Logging**
- Consistent error handling across all services
- Comprehensive logging with organization context
- Proper error reporting and monitoring

### 7. **Feature Flagging**
- Implement subscription-based feature access
- Support organization-specific feature customization
- Enable A/B testing across organizations

## Success Metrics

### Multi-tenancy Metrics
- **100% data isolation** between organizations
- **Zero cross-organization data access** incidents
- **Successful organization boundary enforcement** in all services
- **Proper role-based access control** implementation

### Performance Metrics
- **Service response time**: < 200ms for 95% of operations
- **Database query performance**: < 100ms for common operations
- **Cache hit ratio**: > 80% for frequently accessed data
- **Scalability**: Support for 100+ organizations simultaneously

### Security Metrics
- **Security incidents**: 0 per month
- **Unauthorized access attempts**: < 1% of total requests
- **Data breach incidents**: 0
- **Compliance audit results**: 100% pass rate

## Conclusion

This enhanced service structure provides a comprehensive foundation for building a robust, multi-tenant SaaS platform. The multi-tenancy support is built into every layer, ensuring data isolation, security, and scalability. The modular design allows for easy maintenance and extension while maintaining strict organization boundaries.