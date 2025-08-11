import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const getCurrentUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

export const saveDailyUpdateAsDocument = async (updateData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const documentsCol = collection(db, 'documents');
    const documentData = {
      ...updateData,
      userId,
      type: 'daily_update',
      createdAt: new Date().toISOString(),
      category: 'daily_update',
      status: 'active',
      tags: ['daily_update', 'email'],
      studentId: updateData.studentId,
      subject: `Daily Update - ${updateData.date}`,
      content: updateData.content,
      metadata: {
        originalDate: updateData.date,
        sentStatus: updateData.sentStatus,
        recipientType: 'parent',
        attendance: updateData.attendance,
        grades: updateData.grades,
        behavior: updateData.behavior,
        assignments: updateData.assignments
      }
    };

    const docRef = await addDoc(documentsCol, documentData);
    return { success: true, document: { id: docRef.id, ...documentData } };
  } catch (error) {
    console.error('Error saving daily update document:', error);
    throw new Error('Failed to save daily update document.');
  }
};

export const saveReportAsDocument = async (reportData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const documentsCol = collection(db, 'documents');
    const documentData = {
      ...reportData,
      userId,
      type: 'report',
      createdAt: new Date().toISOString(),
      category: 'report',
      status: 'active',
      tags: ['report', 'academic'],
      studentId: reportData.studentId,
      subject: `${reportData.reportType} Report - ${reportData.date}`,
      content: reportData.content,
      metadata: {
        originalDate: reportData.date,
        reportType: reportData.reportType,
        period: {
          start: reportData.startDate,
          end: reportData.endDate
        },
        academicData: reportData.academicData
      }
    };

    const docRef = await addDoc(documentsCol, documentData);
    return { success: true, document: { id: docRef.id, ...documentData } };
  } catch (error) {
    console.error('Error saving report document:', error);
    throw new Error('Failed to save report document.');
  }
};

export const getDocuments = async (filters = {}) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const documentsCol = collection(db, 'documents');
    let q = query(documentsCol, where('userId', '==', userId));

    // Apply additional filters
    if (filters.studentId) {
      q = query(q, where('studentId', '==', filters.studentId));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to fetch documents.');
  }
};

export const updateDocument = async (documentId, updates) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const documentRef = doc(db, 'documents', documentId);
    await updateDoc(documentRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: 'Document updated successfully' };
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document.');
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated.');

    const documentRef = doc(db, 'documents', documentId);
    await deleteDoc(documentRef);

    return { success: true, message: 'Document deleted successfully' };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document.');
  }
};