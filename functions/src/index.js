import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";

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
  projectId: "smile3-8c8c5"
});

// Minimal test endpoint with no external dependencies
export const testFunction = onRequest(async (req, res) => {
  res.json({
    success: true,
    message: "Minimal function working",
    timestamp: new Date().toISOString(),
  });
});

// Simple email test endpoint
export const sendTestEmail = onRequest(async (req, res) => {
  try {
    // Lazy import emailService only when this function is called
    const emailService = (await import("./services/emailService.js")).default;

    const result = await emailService.sendEmail({
      to: "abdulhafeez.alameen@amly.com",
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email from Firebase Functions v2.</p>",
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export all email API functions using dynamic imports
// This prevents the functions from being loaded during initialization
export const sendEmail = (await import("./api/emailApi.js")).sendEmail;
export const sendBatchEmails = (await import("./api/emailApi.js"))
  .sendBatchEmails;
export const getEmailStatus = (await import("./api/emailApi.js"))
  .getEmailStatus;
export const verifyEmailConfig = (await import("./api/emailApi.js"))
  .verifyEmailConfig;
export const sendDailyUpdates = (await import("./api/emailApi.js"))
  .sendDailyUpdates;
export const sendStudentDailyUpdate = (await import("./api/emailApi.js"))
  .sendStudentDailyUpdate;
export const getDailyUpdateData = (await import("./api/emailApi.js"))
  .getDailyUpdateData;
