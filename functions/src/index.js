import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import * as emailContentService from "./services/emailContentService.js";

// Disable billing check to avoid the billing API error
setGlobalOptions({
  maxInstances: 1,
  timeoutSeconds: 60,
  memory: "256MiB",
  region: "us-central1",
  cpu: 0.25,
});

// Initialize Firebase Admin once per instance
initializeApp({
  projectId: "smile3-8c8c5",
});

const adminDb = getFirestore();
const adminAuth = getAuth();

// Lazy import helpers
const loadEmailApi = async () => await import("./api/emailApi.js");
const loadAdminApi = async () => await import("./api/adminApi.js");


// Callable for email content export
export const exportEmailContent = onCall(async (request) => {
  const { teacherId, options } = request.data;
  if (!request.auth || request.auth.uid !== teacherId) {
    throw new HttpsError('unauthenticated', 'You can only export your own content.');
  }
  return await emailContentService.exportContentLibrary(teacherId, options);
});

// Callable for email content import
export const importEmailContent = onCall(async (request) => {
  const { teacherId, importData, strategy } = request.data;
  if (!request.auth || request.auth.uid !== teacherId) {
    throw new HttpsError('unauthenticated', 'You can only import content to your own library.');
  }
  return await emailContentService.importContentLibrary(teacherId, importData, strategy);
});

// Callable for sharing email content between teachers
export const shareEmailContent = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { targetTeacherId, contentTypes, strategy } = data;
  
  if (!targetTeacherId || !contentTypes || !Array.isArray(contentTypes)) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    const result = await emailContentService.shareContentWithTeacher(
      auth.uid, 
      targetTeacherId, 
      contentTypes, 
      strategy
    );
    
    return result;
  } catch (error) {
    console.error('Error in shareEmailContent:', error);
    throw new HttpsError('internal', error.message);
  }
});

// Callables for content sharing requests
export const getPendingSharingRequests = onCall(async (request) => {
  const { auth } = request;
  
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const requests = await emailContentService.getPendingSharingRequests(auth.uid);
    return requests;
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw new HttpsError('internal', error.message);
  }
});

export const acceptSharingRequest = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { requestId } = data;
  
  if (!requestId) {
    throw new HttpsError('invalid-argument', 'Request ID is required');
  }
  
  try {
    const result = await emailContentService.acceptSharingRequest(requestId, auth.uid);
    return result;
  } catch (error) {
    console.error('Error accepting sharing request:', error);
    throw new HttpsError('internal', error.message);
  }
});

export const rejectSharingRequest = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { requestId } = data;
  
  if (!requestId) {
    throw new HttpsError('invalid-argument', 'Request ID is required');
  }
  
  try {
    const result = await emailContentService.rejectSharingRequest(requestId, auth.uid);
    return result;
  } catch (error) {
    console.error('Error rejecting sharing request:', error);
    throw new HttpsError('internal', error.message);
  }
});


// Email API HTTP
export const sendEmail = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendEmail(req, res);
});

export const getGmailStatus = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.getGmailStatus(req, res);
});

export const handleGmailOAuthCallback = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.handleGmailOAuthCallback(req, res);
});

export const refreshGmailTokens = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.refreshGmailTokens(req, res);
});

// Email API Callables
export const sendDailyUpdates = onCall(async (request) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendDailyUpdates(request, request);
});

export const sendStudentDailyUpdate = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendStudentDailyUpdate(req, res);
});

export const getDailyUpdateData = onCall(async (request) => {
  const emailApi = await loadEmailApi();
  return emailApi.getDailyUpdateData(request, request);
});

export const sendStudentEmails = onCall(async (request) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendStudentEmailsCallable(request, request);
});

export const sendStudentEmail = onCall(async (request) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendStudentEmailCallable(request, request);
});

// Admin API Callables
export const adminBanUser = onCall(async (request) => {
  const adminApi = await loadAdminApi();
  return adminApi.adminBanUser(request, request);
});

export const adminDeleteUser = onCall(async (request) => {
  const adminApi = await loadAdminApi();
  return adminApi.adminDeleteUser(request, request);
});




