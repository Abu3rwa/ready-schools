import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  setDoc 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

class EmailContentService {
  constructor() {
    this.db = getFirestore(getApp());
    this.functions = getFunctions(getApp());
    this.collectionName = 'emailContent';
  }

  // Get document ID for a specific teacher
  getTeacherDocumentId(teacherId) {
    return `teacher_${teacherId}`;
  }

  // Get the entire content library for a specific teacher
  async getContentLibrary(teacherId) {
    try {
      const documentId = this.getTeacherDocumentId(teacherId);
      const docRef = doc(this.db, this.collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      console.log('EmailContentService: Database query details:', {
        teacherId,
        documentId,
        collectionName: this.collectionName,
        docExists: docSnap.exists(),
        docData: docSnap.exists() ? docSnap.data() : null
      });
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('EmailContentService: Found document with data:', {
          keys: Object.keys(data),
          contentSummary: Object.entries(data).map(([key, value]) => ({
            key,
            type: Array.isArray(value) ? 'array' : typeof value,
            length: Array.isArray(value) ? value.length : 'N/A'
          }))
        });
        return data;
      } else {
        console.log('EmailContentService: Document does not exist, returning empty structure');
        // Return empty structure if document doesn't exist
        return {
          greetings: [],
          gradeSectionHeaders: [],
          assignmentSectionHeaders: [],
          behaviorSectionHeaders: [],
          lessonSectionHeaders: [],
          motivationalQuotes: [],
          dailyChallenges: [],
          visualThemes: [],
          achievementBadges: []
        };
      }
    } catch (error) {
      console.error('Error getting content library:', error);
      throw error;
    }
  }

  // Add a new template to a specific content type for a teacher
  async addTemplate(teacherId, contentType, content) {
    try {
      const documentId = this.getTeacherDocumentId(teacherId);
      const docRef = doc(this.db, this.collectionName, documentId);
      await updateDoc(docRef, {
        [contentType]: arrayUnion(content)
      });
      return true;
    } catch (error) {
      // If document doesn't exist, initialize it with default content first
      if (error.code === 'not-found' || error.message.includes('No document to update')) {
        try {
          // Initialize document with default content
          await this.initializeContentLibrary(teacherId, this.getDefaultContent());
          
          // Now try to add the template again
          const documentId = this.getTeacherDocumentId(teacherId);
          const docRef = doc(this.db, this.collectionName, documentId);
          await updateDoc(docRef, {
            [contentType]: arrayUnion(content)
          });
          return true;
        } catch (initError) {
          console.error('Error initializing content library:', initError);
          throw initError;
        }
      } else {
        console.error('Error adding template:', error);
        throw error;
      }
    }
  }

  // Update a template at a specific index for a teacher
  async updateTemplate(teacherId, contentType, index, newContent) {
    try {
      const documentId = this.getTeacherDocumentId(teacherId);
      const docRef = doc(this.db, this.collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const currentArray = currentData[contentType] || [];
        
        // Create new array with updated content
        const updatedArray = [...currentArray];
        updatedArray[index] = newContent;
        
        await updateDoc(docRef, {
          [contentType]: updatedArray
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // Delete a template at a specific index for a teacher
  async deleteTemplate(teacherId, contentType, index) {
    try {
      const documentId = this.getTeacherDocumentId(teacherId);
      const docRef = doc(this.db, this.collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const currentArray = currentData[contentType] || [];
        
        // Remove item at index
        const updatedArray = currentArray.filter((_, i) => i !== index);
        
        await updateDoc(docRef, {
          [contentType]: updatedArray
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // Bulk update an entire content type for a teacher
  async bulkUpdate(teacherId, contentType, contentArray) {
    try {
      const documentId = this.getTeacherDocumentId(teacherId);
      const docRef = doc(this.db, this.collectionName, documentId);
      await updateDoc(docRef, {
        [contentType]: contentArray
      });
      return true;
    } catch (error) {
      console.error('Error bulk updating:', error);
      throw error;
    }
  }

  // Get default content structure
  getDefaultContent() {
    return {
      greetings: [],
      gradeSectionHeaders: [],
      assignmentSectionHeaders: [],
      behaviorSectionHeaders: [],
      lessonSectionHeaders: [],
      motivationalQuotes: [],
      dailyChallenges: [],
      visualThemes: [],
      achievementBadges: []
    };
  }

  // Initialize the content library with default content for a teacher
  async initializeContentLibrary(teacherId, defaultContent) {
    try {
      const documentId = this.getTeacherDocumentId(teacherId);
      const docRef = doc(this.db, this.collectionName, documentId);
      await setDoc(docRef, defaultContent || this.getDefaultContent());
      return true;
    } catch (error) {
      console.error('Error initializing content library:', error);
      throw error;
    }
  }

  async exportContentLibrary(teacherId, options) {
    const exportContent = httpsCallable(this.functions, 'exportEmailContent');
    const result = await exportContent({ teacherId, options });
    return result.data;
  }

  async importContentLibrary(teacherId, importData, strategy) {
    const importContent = httpsCallable(this.functions, 'importEmailContent');
    const result = await importContent({ teacherId, importData, strategy });
    return result.data;
  }

  // Get list of teachers for sharing
  async getTeachersList() {
    try {
      const usersSnapshot = await getDocs(collection(this.db, 'users'));
      
      const teachers = [];
      usersSnapshot.forEach(docSnap => {
        const userData = docSnap.data();
        teachers.push({
          id: docSnap.id,
          email: userData.email,
          displayName: userData.displayName || userData.email,
          photoURL: userData.photoURL
        });
      });
      
      return teachers;
    } catch (error) {
      console.error('Error getting teachers list:', error);
      throw error;
    }
  }

  // Share content directly with another teacher
  async shareContentWithTeacher(targetTeacherId, contentTypes, strategy = 'merge') {
    const shareContent = httpsCallable(this.functions, 'shareEmailContent');
    const result = await shareContent({ 
      targetTeacherId, 
      contentTypes, 
      strategy 
    });
    return result.data;
  }

  // Get pending sharing requests for the current teacher
  async getPendingSharingRequests() {
    const getRequests = httpsCallable(this.functions, 'getPendingSharingRequests');
    const result = await getRequests();
    return result.data;
  }

  // Accept a sharing request
  async acceptSharingRequest(requestId) {
    const acceptRequest = httpsCallable(this.functions, 'acceptSharingRequest');
    const result = await acceptRequest({ requestId });
    return result.data;
  }

  // Reject a sharing request
  async rejectSharingRequest(requestId) {
    const rejectRequest = httpsCallable(this.functions, 'rejectSharingRequest');
    const result = await rejectRequest({ requestId });
    return result.data;
  }
}

export default new EmailContentService();
