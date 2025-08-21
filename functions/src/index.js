import { onRequest, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Disable billing check to avoid the billing API error
setGlobalOptions({
  maxInstances: 1,
  timeoutSeconds: 60,
  memory: "256MiB",
  region: "us-central1",
  cpu: 0.5,
});

// Initialize Firebase Admin once per instance
// Updated to use the correct project ID that matches the frontend
// Using default database configuration
initializeApp({
  projectId: "smile3-8c8c5",
});

const adminDb = getFirestore();
const adminAuth = getAuth();

 
// Export all email API functions using dynamic imports
// This prevents the functions from being loaded during initialization
const emailApi = await import("./api/emailApi.js");
export const sendEmail = onRequest(emailApi.sendEmail);
export const sendBatchEmails = onRequest(emailApi.sendBatchEmails);
export const getEmailStatus = onRequest(emailApi.getEmailStatus);
export const verifyEmailConfig = onRequest(emailApi.verifyEmailConfig);
export const getGmailStatus = onRequest(emailApi.getGmailStatus);
export const testGmailDelivery = onRequest(emailApi.testGmailDelivery);
export const getGmailQuotas = onRequest(emailApi.getGmailQuotas);
export const fixGmailConfig = onRequest(emailApi.fixGmailConfig);
export const handleGmailOAuthCallback = onRequest(emailApi.handleGmailOAuthCallback);
export const fixSpecificUser = onRequest(emailApi.fixSpecificUser);
export const resetGmailConfiguration = onRequest(emailApi.resetGmailConfiguration);
export const refreshGmailTokens = onRequest(emailApi.refreshGmailTokens);
export const studentPreviewDailyEmail = onRequest(
  emailApi.studentPreviewDailyEmail
);
export const studentQueueDailyEmail = onRequest(
  emailApi.studentQueueDailyEmail
);
export const sendDailyUpdates = onCall(emailApi.sendDailyUpdates);
export const sendStudentDailyUpdate = onRequest(
  emailApi.sendStudentDailyUpdate
);
export const getDailyUpdateData = onCall(emailApi.getDailyUpdateData);
// Student email callables
export const sendStudentEmails = onCall(emailApi.sendStudentEmailsCallable);
export const sendStudentEmail = onCall(emailApi.sendStudentEmailCallable);
// New callable endpoints for student-directed emails (separate from parent updates)
 

// Admin API
const adminApi = await import("./api/adminApi.js");
export const adminBanUser = onCall(adminApi.adminBanUser);
export const adminDeleteUser = onCall(adminApi.adminDeleteUser);
