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
initializeApp({
  projectId: "smile3-8c8c5",
});

const adminDb = getFirestore();
const adminAuth = getAuth();

// Lazy import helpers
const loadEmailApi = async () => await import("./api/emailApi.js");
const loadAdminApi = async () => await import("./api/adminApi.js");
const loadDriveApi = async () => await import("./api/driveApi.js");

// Email API HTTP
export const sendEmail = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendEmail(req, res);
});

export const sendBatchEmails = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.sendBatchEmails(req, res);
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

export const studentPreviewDailyEmail = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.studentPreviewDailyEmail(req, res);
});

export const studentQueueDailyEmail = onRequest(async (req, res) => {
  const emailApi = await loadEmailApi();
  return emailApi.studentQueueDailyEmail(req, res);
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

// Drive API HTTP
export const apiDriveAuthStart = onRequest({
  cors: true,
  path: "/api/drive/auth/start"
}, async (req, res) => {
  const driveApi = await loadDriveApi();
  return driveApi.driveAuthStart(req, res);
});

export const apiDriveAuthCallback = onRequest({
  cors: true,
  path: "/api/drive/auth/callback"
}, async (req, res) => {
  const driveApi = await loadDriveApi();
  return driveApi.driveAuthCallback(req, res);
});

export const apiDriveFiles = onRequest({
  cors: true,
  path: "/api/drive/files"
}, async (req, res) => {
  const driveApi = await loadDriveApi();
  return driveApi.driveFiles(req, res);
});
