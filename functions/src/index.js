import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Disable billing check to avoid the billing API error
setGlobalOptions({
  maxInstances: 3,
  timeoutSeconds: 60,
  memory: "256MiB",
  region: "us-central1",
});

// Initialize Firebase Admin once per instance
// Updated to use the correct project ID that matches the frontend
// Using default database configuration
initializeApp({
  projectId: "smile3-8c8c5",
});

const adminDb = getFirestore();

// Minimal test endpoint with no external dependencies
export const testFunction = onRequest(async (req, res) => {
  res.json({
    success: true,
    message: "Minimal function working",
    timestamp: new Date().toISOString(),
  });
});

// Export all email API functions using dynamic imports
// This prevents the functions from being loaded during initialization
const emailApi = await import("./api/emailApi.js");
export const sendEmail = emailApi.sendEmail;
export const sendBatchEmails = emailApi.sendBatchEmails;
export const getEmailStatus = emailApi.getEmailStatus;
export const verifyEmailConfig = emailApi.verifyEmailConfig;
export const sendDailyUpdates = emailApi.sendDailyUpdates;
export const sendStudentDailyUpdate = emailApi.sendStudentDailyUpdate;
export const getDailyUpdateData = emailApi.getDailyUpdateData;

// Admin API
const adminApi = await import("./api/adminApi.js");
export const adminBanUser = adminApi.adminBanUser;
export const adminDeleteUser = adminApi.adminDeleteUser;

// Scheduled function to calculate class-wide skills profile
export const calculateClassSkillsProfile = onSchedule(
  { schedule: "every 24 hours" },
  async (event) => {
    try {
      // Aggregate by userId
      const behaviorsSnap = await adminDb.collection("behaviors").get();
      const userToSkillCounts = new Map();

      behaviorsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId;
        const skills = Array.isArray(data.skills) ? data.skills : [];
        if (!userId) return;

        if (!userToSkillCounts.has(userId)) {
          userToSkillCounts.set(userId, {});
        }
        const skillCounts = userToSkillCounts.get(userId);

        skills.forEach((s) => {
          const key = s?.skill || "unknown";
          skillCounts[key] =
            (skillCounts[key] || 0) + (s?.type === "strength" ? 2 : 1);
        });
      });

      // Write to analytics collection per user
      const batch = adminDb.batch();
      userToSkillCounts.forEach((skillCounts, userId) => {
        const analyticsRef = adminDb.collection("analytics").doc(userId);
        batch.set(
          analyticsRef,
          { skillCounts, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      });
      await batch.commit();

      return { success: true, usersProcessed: userToSkillCounts.size };
    } catch (error) {
      console.error("calculateClassSkillsProfile error", error);
      throw error;
    }
  }
);

// HTTP endpoint to recalculate analytics immediately
export const recalculateClassSkillsProfile = onRequest(async (req, res) => {
  try {
    const behaviorsSnap = await adminDb.collection("behaviors").get();
    const userToSkillCounts = new Map();

    behaviorsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId;
      const skills = Array.isArray(data.skills) ? data.skills : [];
      if (!userId) return;

      if (!userToSkillCounts.has(userId)) {
        userToSkillCounts.set(userId, {});
      }
      const skillCounts = userToSkillCounts.get(userId);

      skills.forEach((s) => {
        const key = s?.skill || "unknown";
        skillCounts[key] =
          (skillCounts[key] || 0) + (s?.type === "strength" ? 2 : 1);
      });
    });

    const batch = adminDb.batch();
    userToSkillCounts.forEach((skillCounts, userId) => {
      const analyticsRef = adminDb.collection("analytics").doc(userId);
      batch.set(
        analyticsRef,
        { skillCounts, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    });
    await batch.commit();

    res.json({ success: true, usersProcessed: userToSkillCounts.size });
  } catch (error) {
    console.error("recalculateClassSkillsProfile error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// On-demand migration endpoint (secured via callable HTTPS in real setup)
export const runBehaviorMigration = onRequest(async (req, res) => {
  try {
    const { migrateBehaviorStructure } = await import(
      "./migrations/migrateBehaviorStructure.js"
    );
    const result = await migrateBehaviorStructure();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("runBehaviorMigration error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
