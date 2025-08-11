import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

export const saveDailyUpdateEmail = async (emailData) => {
  try {
    const userId = getCurrentUserId();
    console.log('Current user ID:', userId);
    if (!userId) throw new Error('User not authenticated.');

    console.log('Getting Firestore collection reference...');
    // Get reference to the dailyUpdateEmails collection
    const emailsCol = collection(db, 'dailyUpdateEmails');
    console.log('Collection reference:', emailsCol);
    console.log('Collection reference:', emailsCol);
    console.log('Collection path:', emailsCol.path);
    
    const emailDocument = {
      userId,
      studentId: emailData.studentId,
      date: emailData.date,
      subject: emailData.subject || `Daily Update - ${emailData.date}`,
      content: emailData.content,
      sentStatus: emailData.sentStatus || 'draft',
      createdAt: new Date().toISOString(),
      // Daily update specific data
      attendance: emailData.attendance || { status: 'Present', notes: '' },
      grades: emailData.grades || [],
      behavior: emailData.behavior || [],
      assignments: emailData.assignments || [],
      classwork: emailData.classwork || [],
      homework: emailData.homework || [],
      upcomingAssignments: emailData.upcomingAssignments || []
    };
    
    console.log('Saving email document:', emailDocument);

    console.log('Attempting to save document to Firestore...');
    const docRef = await addDoc(emailsCol, emailDocument);
    console.log('Document saved successfully with ID:', docRef.id);
    const savedDoc = { id: docRef.id, ...emailDocument };
    console.log('Returning saved document:', savedDoc);
    return { success: true, email: savedDoc };
  } catch (error) {
    console.error('Error saving daily update email:', error);
    throw new Error('Failed to save daily update email.');
  }
};

export const getDailyUpdateEmails = async (filters = {}) => {
  try {
    const userId = getCurrentUserId();
    console.log('Fetching emails for user:', userId);
    if (!userId) throw new Error('User not authenticated.');

    // Get reference to the dailyUpdateEmails collection
    const emailsCol = collection(db, 'dailyUpdateEmails');
    let q = query(emailsCol, where('userId', '==', userId));
    console.log('Base query created');

    // Apply additional filters
    if (filters.studentId) {
      q = query(q, where('studentId', '==', filters.studentId));
    }
    if (filters.date) {
      q = query(q, where('date', '==', filters.date));
    }
    if (filters.sentStatus) {
      q = query(q, where('sentStatus', '==', filters.sentStatus));
    }

    console.log('Executing query...');
    const snapshot = await getDocs(q);
    console.log('Query results:', snapshot.size, 'documents found');
    
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Processed results:', results);
    return results;
  } catch (error) {
    console.error('Error fetching daily update emails:', error);
    throw new Error('Failed to fetch daily update emails.');
  }
};

export const updateDailyUpdateEmail = async (emailId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const emailRef = doc(db, 'dailyUpdateEmails', emailId);
    await updateDoc(emailRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: 'Daily update email updated successfully' };
  } catch (error) {
    console.error('Error updating daily update email:', error);
    throw new Error('Failed to update daily update email.');
  }
};

export const deleteDailyUpdateEmail = async (emailId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const emailRef = doc(db, 'dailyUpdateEmails', emailId);
    await deleteDoc(emailRef);

    return { success: true, message: 'Daily update email deleted successfully' };
  } catch (error) {
    console.error('Error deleting daily update email:', error);
    throw new Error('Failed to delete daily update email.');
  }
};
