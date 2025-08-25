# **Enhanced Google Classroom Integration Plan**

## **Codebase Analysis Summary**

After thorough analysis of your existing teacher-kit application, I've identified the perfect integration strategy that leverages your established patterns:

### **Existing Architecture Strengths:**
- ✅ **Firebase Functions v2** with lazy loading pattern
- ✅ **Established Google OAuth** for Gmail with proper token management
- ✅ **Firestore user data** with `gmail_configured`, `gmail_access_token` fields
- ✅ **Clean service layer** pattern (`gmailApiService.js`)
- ✅ **Authentication middleware** (`requireAuth`)
- ✅ **React + Material-UI** frontend with context patterns
- ✅ **Established navigation** and settings page structure

### **Reusable Integration Points:**
- 🔄 **Extend Gmail OAuth** to include Classroom scopes
- 🔄 **Adapt token management** system for Classroom APIs
- 🔄 **Follow service pattern** established by `gmailApiService.js`
- 🔄 **Use existing middleware** and authentication flow
- 🔄 **Extend settings page** for Classroom configuration

---

## **Primary Directive: Zero Disruption to Existing Functionality**
This plan is designed to be **100% additive**, following your existing patterns exactly. The new features will be encapsulated in new files and a new, separate user interface page. Existing application logic will not be modified, only extended in a safe, opt-in manner.

---

### **PHASE 1: Google Cloud Configuration (External Setup)**

**Task 1.1: Enable Google Classroom API**
1. Navigate to [Google Cloud Console API Library](https://console.cloud.google.com/apis/library/classroom.googleapis.com)
2. Ensure project `smile3-8c8c5` is selected
3. Click **"ENABLE"** button

**Task 1.2: Update OAuth Consent Screen Scopes**
1. Navigate to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Click **"EDIT APP"** → **"Scopes"** → **"ADD OR REMOVE SCOPES"**
3. Add these **read-only** scopes:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.students.readonly`
4. Save configuration

**Task 1.3: Configure API Quotas**
1. Set appropriate quotas for Classroom API usage
2. Enable monitoring and alerting for API usage

---

### **PHASE 2: Backend Implementation - Following Your Existing Patterns**

**Task 2.1: Extend Gmail OAuth Scopes (Frontend Pattern)**
1. **File to Modify:** [`src/services/gmailService.js`](src/services/gmailService.js:8)
2. **Action:** Add Classroom scopes to existing Gmail scopes:
   ```javascript
   // Line 8 - extend existing SCOPES array
   this.SCOPES = [
     'https://www.googleapis.com/auth/gmail.send',
     // Add these new read-only classroom scopes
     'https://www.googleapis.com/auth/classroom.courses.readonly',
     'https://www.googleapis.com/auth/classroom.rosters.readonly',
     'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
   ];
   ```

**Task 2.2: Update User Data Schema (AuthContext Pattern)**
1. **File to Modify:** [`src/contexts/AuthContext.jsx`](src/contexts/AuthContext.jsx:42)
2. **Action:** Add classroom configuration field to user creation:
   ```javascript
   // Line 49-56 - add classroom_configured field
   gmail_configured: false,
   gmail_access_token: null,
   gmail_refresh_token: null,
   gmail_token_expiry: null,
   gmail_token_last_refresh: null,
   gmail_token_error: null,
   gmail_token_error_time: null,
   // Add this new field
   classroom_configured: false,
   ```

**Task 2.3: Create Classroom API Service (Following gmailApiService.js Pattern)**
1. **File to Create:** `functions/src/services/classroomApiService.js`
2. **Purpose:** Mirror your [`gmailApiService.js`](functions/src/services/gmailApiService.js) structure
3. **Action:** Create isolated service following your established patterns:
   ```javascript
   import { google } from "googleapis";
   import { getFirestore } from "firebase-admin/firestore";

   class ClassroomApiService {
     constructor() {
       this.db = null;
       this.googleClientId = process.env.GMAIL_CLIENT_ID || "610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com";
       this.googleClientSecret = process.env.GMAIL_CLIENT_SECRET || "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";
     }

     getDb() {
       if (!this.db) {
         this.db = getFirestore();
       }
       return this.db;
     }

     // Reuse token management from gmailApiService pattern
     async getUserTokens(userId) {
       // Same pattern as gmailApiService.getUserTokens()
     }

     async createClassroomClient(userId) {
       // Same pattern as gmailApiService.createGmailClient()
       const tokens = await this.getUserTokens(userId);
       if (!tokens) {
         throw new Error("Google Classroom not configured for this user");
       }

       const oauth2Client = new google.auth.OAuth2(
         this.googleClientId,
         this.googleClientSecret,
         `${process.env.APP_URL || 'https://smile3-8c8c5.firebaseapp.com'}/auth/gmail/callback`
       );

       oauth2Client.setCredentials({
         access_token: tokens.accessToken,
         refresh_token: tokens.refreshToken,
         expiry_date: tokens.expiryTime,
       });

       return google.classroom({ version: "v1", auth: oauth2Client });
     }

     async listCourses(userId) {
       const classroom = await this.createClassroomClient(userId);
       const response = await classroom.courses.list({
         teacherId: 'me',
         courseStates: ['ACTIVE']
       });
       return response.data.courses || [];
     }

     async importRoster(userId, courseId) {
       const classroom = await this.createClassroomClient(userId);
       const db = this.getDb();
       
       // Get students from Classroom API
       const response = await classroom.courses.students.list({ courseId });
       const classroomStudents = response.data.students || [];
       
       // Prevent duplicates by checking existing students
       const existingStudents = await db.collection('students')
         .where('teacherId', '==', userId)
         .where('classroom_course_id', '==', courseId)
         .get();
       
       const existingIds = new Set(existingStudents.docs.map(doc => doc.data().classroom_student_id));
       
       let addedCount = 0;
       const batch = db.batch();
       
       for (const student of classroomStudents) {
         if (!existingIds.has(student.userId)) {
           const newStudentRef = db.collection('students').doc();
           batch.set(newStudentRef, {
             teacherId: userId,
             firstName: student.profile?.name?.givenName || '',
             lastName: student.profile?.name?.familyName || '',
             email: student.profile?.emailAddress || '',
             classroom_student_id: student.userId,
             classroom_course_id: courseId,
             source: 'google_classroom',
             createdAt: new Date().toISOString()
           });
           addedCount++;
         }
       }
       
       if (addedCount > 0) {
         await batch.commit();
       }
       
       return { added: addedCount, skipped: classroomStudents.length - addedCount };
     }
   }

   export default new ClassroomApiService();
   ```

**Task 2.4: Add HTTP Endpoints (Following Your index.js Pattern)**
1. **File to Modify:** [`functions/src/index.js`](functions/src/index.js)
2. **Action:** Add endpoints following your existing pattern:
   ```javascript
   // Add import at top
   const loadClassroomApi = async () => await import("./api/classroomApi.js");

   // Add endpoints following your existing pattern (around line 280)
   export const getClassroomCourses = onRequest(async (req, res) => {
     const classroomApi = await loadClassroomApi();
     return classroomApi.getClassroomCourses(req, res);
   });

   export const importClassroomRoster = onRequest(async (req, res) => {
     const classroomApi = await loadClassroomApi();
     return classroomApi.importClassroomRoster(req, res);
   });
   ```

**Task 2.5: Create API Handler (Following Your emailApi.js Pattern)**
1. **File to Create:** `functions/src/api/classroomApi.js`
2. **Action:** Follow your [`emailApi.js`](functions/src/api/emailApi.js) structure:
   ```javascript
   import { requireAuth } from "../middleware/auth.js";

   export const getClassroomCourses = async (req, res) => {
     try {
       const authed = await requireAuth(req).catch(() => null);
       if (!authed) return res.status(401).json({ error: "Unauthorized" });
       if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

       const classroomApiService = (await import("../services/classroomApiService.js")).default;
       const courses = await classroomApiService.listCourses(req.user?.uid);
       return res.json({ success: true, courses });
     } catch (error) {
       console.error("getClassroomCourses error", error);
       return res.status(500).json({ error: error.message });
     }
   };

   export const importClassroomRoster = async (req, res) => {
     try {
       const authed = await requireAuth(req).catch(() => null);
       if (!authed) return res.status(401).json({ error: "Unauthorized" });
       if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

       const { courseId } = req.body || {};
       if (!courseId) return res.status(400).json({ error: "Course ID required" });

       const classroomApiService = (await import("../services/classroomApiService.js")).default;
       const result = await classroomApiService.importRoster(req.user?.uid, courseId);
       return res.json({ success: true, result });
     } catch (error) {
       console.error("importClassroomRoster error", error);
       return res.status(500).json({ error: error.message });
     }
   };
   ```

---

### **PHASE 3: Frontend Implementation - Following Your React Patterns**

**Task 3.1: Create Frontend Service (Following Your Service Pattern)**
1. **File to Create:** `src/services/classroomService.js`
2. **Purpose:** Mirror structure of your existing services
3. **Action:** Follow your [`gmailService.js`](src/services/gmailService.js) pattern:
   ```javascript
   import { auth } from '../firebase';

   class ClassroomService {
     constructor() {
       this.auth = auth;
     }

     async getClassroomCourses() {
       try {
         const token = await this.auth.currentUser?.getIdToken();
         const response = await fetch('https://getclassroomcourses-jhyfivohoq-uc.a.run.app', {
           method: 'GET',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         });

         if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           throw new Error(errorData.error || 'Failed to fetch courses');
         }

         const result = await response.json();
         return result.courses || [];
       } catch (error) {
         console.error('Error fetching Classroom courses:', error);
         throw error;
       }
     }

     async importRosterFromCourse(courseId) {
       try {
         const token = await this.auth.currentUser?.getIdToken();
         const response = await fetch('https://importclassroomroster-jhyfivohoq-uc.a.run.app', {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ courseId })
         });

         if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           throw new Error(errorData.error || 'Failed to import roster');
         }

         const result = await response.json();
         return result.result;
       } catch (error) {
         console.error('Error importing roster:', error);
         throw error;
       }
     }
   }

   export const classroomService = new ClassroomService();
   ```

**Task 3.2: Extend Settings Page (Following Your Settings Pattern)**
1. **File to Modify:** [`src/pages/Settings.js`](src/pages/Settings.js)
2. **Action:** Add Classroom setup component following your existing pattern:
   ```javascript
   import ClassroomSetup from "../components/settings/ClassroomSetup";

   // Add to Grid around line 38
   <Grid item xs={12}>
     <ClassroomSetup />
   </Grid>
   ```

**Task 3.3: Create Classroom Setup Component (Following GmailSetup Pattern)**
1. **File to Create:** `src/components/settings/ClassroomSetup.jsx`
2. **Action:** Follow your [`GmailSetup.jsx`](src/components/email/GmailSetup.jsx) structure exactly:
   ```jsx
   import React, { useEffect, useState } from "react";
   import {
     Box, Button, Typography, Alert, CircularProgress,
     List, ListItem, ListItemIcon, ListItemText, Divider,
   } from "@mui/material";
   import { School as SchoolIcon, Check as CheckIcon, Settings as SettingsIcon } from "@mui/icons-material";
   import { useAuth } from "../../contexts/AuthContext";
   import { doc, getDoc, updateDoc } from "firebase/firestore";
   import { db } from "../../firebase";
   import { gmailService } from "../../services/gmailService"; // Reuse existing OAuth flow

   const ClassroomSetup = () => {
     const { currentUser } = useAuth();
     const [status, setStatus] = useState("checking");
     const [busy, setBusy] = useState(false);
     const [isConfigured, setIsConfigured] = useState(false);

     useEffect(() => {
       const checkStatus = async () => {
         try {
           if (currentUser?.classroom_configured) {
             setStatus("configured");
             setIsConfigured(true);
           } else {
             setStatus("not_configured");
             setIsConfigured(false);
           }
         } catch (err) {
           console.error("Error checking Classroom status:", err);
           setStatus("error");
         }
       };
       checkStatus();
     }, [currentUser]);

     const handleSetupClick = async () => {
       try {
         // Reuse Gmail OAuth flow - it now includes Classroom scopes
         await gmailService.initiateGmailAuth();
       } catch (err) {
         console.error("Error setting up Classroom:", err);
       }
     };

     const renderStatus = () => {
       switch (status) {
         case "checking":
           return (
             <Box display="flex" alignItems="center" gap={2}>
               <CircularProgress size={20} />
               <Typography>Checking Google Classroom configuration...</Typography>
             </Box>
           );
         case "configured":
           return (
             <Alert severity="success" sx={{ width: "100%" }}>
               Google Classroom is connected and ready to use
             </Alert>
           );
         case "not_configured":
           return (
             <Alert severity="info" sx={{ width: "100%" }}>
               Connect your Google account to import students and assignments from Classroom.
             </Alert>
           );
         default:
           return null;
       }
     };

     return (
       <Box sx={{ p: 3 }}>
         <Typography variant="h6" gutterBottom>
           Google Classroom Integration
         </Typography>
         
         {renderStatus()}

         <List sx={{ mt: 2 }}>
           <ListItem>
             <ListItemIcon>
               <SchoolIcon color={isConfigured ? "success" : "disabled"} />
             </ListItemIcon>
             <ListItemText
               primary="Import student rosters from Classroom"
               secondary={isConfigured ? "Available" : "Not configured"}
             />
           </ListItem>
           <Divider />
           <ListItem>
             <ListItemIcon>
               <SettingsIcon color={isConfigured ? "success" : "disabled"} />
             </ListItemIcon>
             <ListItemText
               primary="Sync assignments and coursework"
               secondary={isConfigured ? "Available" : "Not configured"}
             />
           </ListItem>
         </List>

         <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
           <Button
             variant="contained"
             color={isConfigured ? "success" : "primary"}
             onClick={handleSetupClick}
             disabled={busy}
             startIcon={isConfigured ? <CheckIcon /> : <SchoolIcon />}
           >
             {isConfigured ? "Reconfigure Classroom" : "Connect Google Classroom"}
           </Button>
         </Box>
       </Box>
     );
   };

   export default ClassroomSetup;
   ```

**Task 3.4: Create Classroom Sync Page**
1. **File to Create:** `src/pages/ClassroomSync.js`
2. **Action:** Create main Classroom functionality page:
   ```jsx
   import React, { useState, useEffect } from 'react';
   import { Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
   import { useAuth } from '../contexts/AuthContext';
   import ClassroomRosterImport from '../components/classroom/ClassroomRosterImport';

   const ClassroomSync = () => {
     const { currentUser } = useAuth();
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       setLoading(false);
     }, []);

     if (loading) {
       return (
         <Container>
           <Box display="flex" justifyContent="center" p={4}>
             <CircularProgress />
           </Box>
         </Container>
       );
     }

     if (!currentUser?.classroom_configured) {
       return (
         <Container maxWidth="md">
           <Box sx={{ mt: 3 }}>
             <Alert severity="info">
               Please configure Google Classroom in Settings before using this feature.
             </Alert>
           </Box>
         </Container>
       );
     }

     return (
       <Container maxWidth="lg">
         <Box sx={{ mt: 3, mb: 3 }}>
           <Typography variant="h4" gutterBottom>
             Google Classroom Sync
           </Typography>
           <Typography variant="body1" color="text.secondary">
             Import students and assignments from your Google Classroom courses.
           </Typography>
         </Box>
         <ClassroomRosterImport />
       </Container>
     );
   };

   export default ClassroomSync;
   ```

**Task 3.5: Add Navigation and Routing**
1. **File to Modify:** [`src/components/common/Sidebar.jsx`](src/components/common/Sidebar.jsx:34)
2. **Action:** Add classroom menu item to [`menuItems`](src/components/common/Sidebar.jsx:34) array:
   ```javascript
   // Add after line 101, before the array closing
   {
     text: "navigation.classroom",
     icon: <SchoolIcon />,
     path: "/classroom-sync",
     color: "#4A90E2",
     requiresClassroom: true // Add this flag
   },
   ```

3. **File to Modify:** [`src/App.jsx`](src/App.jsx)
4. **Action:** Add route and import:
   ```javascript
   import ClassroomSync from "./pages/ClassroomSync";

   // Add route around line 94
   <Route
     path="/classroom-sync"
     element={currentUser ? <ClassroomSync /> : <Navigate to="/login" />}
   />
   ```

5. **File to Modify:** [`src/components/common/Sidebar.jsx`](src/components/common/Sidebar.jsx:164)
6. **Action:** Update menu rendering to check classroom requirement:
   ```javascript
   // Around line 164, modify the filter logic
   {menuItems
     .filter(item => !item.requiresClassroom || currentUser?.classroom_configured)
     .map((item) => {
       const active = isActive(item.path);
       // ... rest of existing code
   ```

---

### **PHASE 5: Testing & Quality Assurance**

**Task 5.1: Unit Testing for Backend Services**
1.  **File to Create:** `functions/src/api/services/classroomService.test.js`
2.  **Purpose:** Test all functions in the classroom service with mock data.
3.  **Action:** Create comprehensive tests for:
    *   `createGoogleClient` function with various user states
    *   `listCourses` function with different response scenarios
    *   `importRoster` function with valid and invalid data
    *   Error handling for network failures and API errors

**Task 5.2: Integration Testing**
1.  **File to Create:** `functions/src/api/routes/classroomRoutes.test.js`
2.  **Purpose:** Test the API endpoints with mocked authentication and Google API responses.
3.  **Action:** Create tests for:
    *   Authentication middleware integration
    *   Rate limiting effectiveness
    *   All endpoint responses with various input scenarios

**Task 5.3: Frontend Testing**
1.  **File to Create:** `src/pages/Classroom/ClassroomSync.test.js`
2.  **Purpose:** Test the UI component behavior with different states.
3.  **Action:** Create tests for:
    *   Loading states and error handling
    *   User interaction flows
    *   Proper rendering of course data
    *   Import functionality with mock service responses

---

### **PHASE 6: Security & Compliance**

**Task 6.1: Data Privacy Compliance**
1.  **Action:** Ensure all Classroom data is handled according to privacy regulations:
    *   Data is only stored temporarily for import purposes
    *   No sensitive student information is logged
    *   All data transfers use HTTPS
    *   User consent is properly documented

**Task 6.2: Input Validation & Sanitization**
1.  **Action:** Implement strict validation on all inputs:
    *   Course IDs are validated before API calls
    *   Student data is sanitized before storage
    *   All API responses are validated before processing

**Task 6.3: Authentication & Authorization**
1.  **Action:** Verify security measures:
    *   All routes require proper authentication
    *   Users can only access their own Classroom data
    *   OAuth tokens are properly refreshed and stored

---

### **PHASE 7: Performance Optimization**

**Task 7.1: Caching Strategy**
1.  **Action:** Implement caching for frequently accessed data:
    *   Cache course lists for 5 minutes per user
    *   Implement cache invalidation on import operations
    *   Use Redis or similar for distributed caching in production

**Task 7.2: Pagination for Large Datasets**
1.  **Action:** Optimize for large rosters:
    *   Implement client-side pagination for course lists
    *   Add progress indicators for large imports
    *   Batch Firestore operations to prevent timeouts

**Task 7.3: Error Recovery**
1.  **Action:** Implement resilient error handling:
    *   Retry failed API calls with exponential backoff
    *   Save import progress to resume after failures
    *   Provide clear error messages to users

---

### **PHASE 8: Monitoring & Observability**

**Task 8.1: Logging Implementation**
1.  **Action:** Add comprehensive logging:
    *   Log all Classroom API interactions
    *   Track import operations with timing metrics
    *   Log errors with full context for debugging

**Task 8.2: Error Tracking**
1.  **Action:** Integrate error tracking service:
    *   Capture frontend and backend errors
    *   Set up alerts for critical failures
    *   Monitor API usage and quotas

**Task 8.3: Performance Monitoring**
1.  **Action:** Monitor key metrics:
    *   API response times
    *   Import operation durations
    *   User success rates

---

### **PHASE 9: Documentation & User Guides**

**Task 9.1: Technical Documentation**
1.  **File to Create:** `docs/Google_Classroom_Technical.md`
2.  **Purpose:** Document the technical implementation details for developers.
3.  **Content:**
    *   Architecture overview
    *   API endpoint documentation
    *   Data flow diagrams
    *   Error handling procedures

**Task 9.2: User Documentation**
1.  **File to Create:** `docs/Google_Classroom_User_Guide.md`
2.  **Purpose:** Provide clear instructions for end users.
3.  **Content:**
    *   How to connect Google Classroom account
    *   Step-by-step import process
    *   Troubleshooting common issues
    *   FAQ section

**Task 9.3: Update README**
1.  **File to Modify:** `README.md`
2.  **Action:** Add section about Google Classroom integration with links to detailed documentation.

---

### **PHASE 10: Deployment & Rollback Procedures**

**Task 10.1: Deployment Checklist**
1.  **Action:** Create a pre-deployment checklist:
    *   Verify Google Cloud API is enabled
    *   Confirm OAuth scopes are correctly configured
    *   Test with staging environment
    *   Validate error handling scenarios

**Task 10.2: Rollback Plan**
1.  **Action:** Document rollback procedures:
    *   How to disable Classroom integration
    *   How to remove Classroom data if needed
    *   Steps to revert code changes

**Task 10.3: Post-Deployment Monitoring**
1.  **Action:** Set up monitoring for the first week:
    *   Daily check of error logs
    *   Monitor API usage quotas
    *   Collect user feedback

---

This enhanced plan ensures that the Google Classroom integration is not only robust and secure but also production-ready with comprehensive error handling, testing strategies, security considerations, performance optimizations, and monitoring capabilities. The implementation follows best practices for scalability, maintainability, and user experience.