# Architecture and Technology Stack for Version 2

## Overview

Version 2 of the Teacher Dashboard will transition from a single-user application to a multi-tenant SaaS platform using Firebase as the core infrastructure. This document outlines the architectural changes and technology stack required to support this transformation while enabling monetization opportunities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│              Web App (React)     Mobile App                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                   Firebase Services                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Cloud Run     │  │  Cloud Functions│  │   Hosting   │ │
│  │ (Billing/Mgmt)  │  │ (Email, Reports) │  │ (React App) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    Firebase Backend                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Firestore     │  │   Auth System   │  │ Cloud Storage│ │
│  │ (Data Storage)  │  │ (Users/Schools) │  │ (Documents) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                   Third-Party Services                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Stripe API    │  │  SendGrid/SES   │  │ Google APIs │ │
│  │ (Payments)      │  │ (Email Delivery)│  │ (Sheets,etc)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework:** React 18+ with JavaScript (no TypeScript for simplicity)
- **State Management:** React Context API + useReducer
- **UI Library:** Material-UI (MUI) v5
- **Routing:** React Router v6
- **Build Tool:** React Scripts (Webpack)
- **Hosting:** Firebase Hosting

### Backend

- **Platform:** Firebase
- **Database:** Firestore (NoSQL)
- **Authentication:** Firebase Authentication
- **Serverless Functions:** Firebase Cloud Functions (Node.js 20)
- **File Storage:** Firebase Cloud Storage
- **Scheduled Tasks:** Firebase Cloud Functions with Pub/Sub triggers

### Third-Party Services

- **Email Delivery:** SendGrid / Amazon SES / Custom SMTP
- **Payment Processing:** Stripe API
- **Analytics:** Google Analytics for Firebase

## Monetization-Focused Architecture Components

### 1. Multi-Tenancy Implementation

```javascript
// Organization/School structure in Firestore
organizations/{orgId} = {
  name: "School Name",
  type: "school|district|network",
  status: "trial|active|suspended|cancelled",
  subscription: {
    plan: "basic|standard|premium",
    status: "active|cancelled|past_due|unpaid",
    currentPeriodStart: timestamp,
    currentPeriodEnd: timestamp,
    stripeSubscriptionId: "sub_123"
  },
  settings: {
    // School-specific settings
  },
  createdAt: timestamp,
  updatedAt: timestamp
}

// User structure with organization context
users/{userId} = {
  organizationId: "orgId",
  email: "user@school.edu",
  role: "teacher|admin|super_admin",
  permissions: ["permission1", "permission2"],
  status: "active|inactive|suspended",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Billing Service (Cloud Functions)

```javascript
// Cloud Function for handling billing operations
export const handleSubscription = functions.https.onCall(async (data, context) => {
  // Create/update subscription in Stripe
  // Update organization billing status in Firestore
});

export const processWebhooks = functions.https.onRequest(async (req, res) => {
  // Handle Stripe webhooks for payment events
});
```

### 3. Feature Flagging

```javascript
// Client-side feature checking
const checkFeatureAccess = (user, feature) => {
  const plan = user.organization.subscription.plan;
  const featureMatrix = {
    basic: ["attendance", "grades"],
    standard: ["attendance", "grades", "behavior", "communication"],
    premium: ["attendance", "grades", "behavior", "communication", "analytics", "api"]
  };
  return featureMatrix[plan].includes(feature);
};
```

## Implementation Considerations

### 1. Data Isolation

- All data must be stored with organization context
- Firestore security rules must enforce organization boundaries
- Client-side must always filter by organization

### 2. Performance Optimization

- Use Firestore indexes for common queries
- Implement client-side caching with React Context
- Use Firebase Cloud Functions for heavy processing

### 3. Security

- Implement Firestore security rules for data access
- Use Firebase Authentication for user management
- Apply organization-based security at all levels

### 4. Scalability

- Design for horizontal scaling using Firestore
- Use Cloud Functions for stateless operations
- Implement proper error handling and logging

## Migration Strategy

1. Update Firestore data model to include organization context
2. Implement multi-tenancy in authentication
3. Add subscription and billing fields to organization documents
4. Create billing management functions
5. Update client-side to respect organization boundaries
6. Implement feature flagging based on subscription tier

## Cost Considerations

- Firestore usage will increase with multi-tenancy
- Cloud Functions invocations will increase with more schools
- Storage costs will grow with more users and data
- Third-party service costs (Stripe, email delivery) will scale with usage

## Next Steps

1. Create detailed data model for multi-tenancy
2. Implement organization management features
3. Develop subscription and billing system
4. Create feature flagging system
5. Update security rules and client-side code