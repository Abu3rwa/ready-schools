rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {


    // Users can create, read, update, and delete their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // For other collections, only allow access to authenticated users.
    // You should refine these rules further for a production environment.
    match /students/{studentId} {
      allow read, write: if request.auth != null;
    }

    match /assignments/{assignmentId} {
      allow list: if request.auth != null;
      allow get, create, update: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /grades/{gradeId} {
      allow list: if request.auth != null;
      allow get, create, update: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /attendance/{attendanceId} {
      allow list: if request.auth != null;
      allow get, create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /behaviors/{behaviorId} {
      allow list: if request.auth != null;
      allow get, create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /communications/{communicationId} {
      allow read, write: if request.auth != null;
    }

    match /dailyUpdateEmails/{emailId} {
      allow list: if request.auth != null;
      allow get: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Settings can be read and written only by the owner
    match /settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}