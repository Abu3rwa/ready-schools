import nodemailer from "nodemailer";
import getEmailConfig from "../config/email.js";
import gmailApiService from "./gmailApiService.js";
import { getFirestore } from "firebase-admin/firestore";

class EmailService {
  constructor() {
    this.initialized = false;
    this.transporter = null;
    this.dailyCount = 0;
    this.lastReset = new Date();
    this.db = getFirestore();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const config = getEmailConfig();
      this.transporter = nodemailer.createTransport(config.smtp);
      await this.transporter.verify();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      throw error;
    }
  }

  resetDailyCountIfNeeded() {
    const today = new Date();
    if (
      today.getDate() !== this.lastReset.getDate() ||
      today.getMonth() !== this.lastReset.getMonth() ||
      today.getFullYear() !== this.lastReset.getFullYear()
    ) {
      this.dailyCount = 0;
      this.lastReset = today;
    }
  }

  async getUserEmailConfig(userId) {
    try {
      const userDoc = await this.db.collection("users").doc(userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      return {
        useGmailApi: userData.gmail_configured === true,
        emailConfigured: true,
      };
    } catch (error) {
      console.error("Error getting user email config:", error);
      return null;
    }
  }

  async sendEmail(options, userId = null) {
    try {
      // Prioritize OAuth 2 (Gmail API) when available
      if (userId) {
        const userConfig = await this.getUserEmailConfig(userId);
        if (userConfig?.useGmailApi) {
          console.log("Using Gmail API for sending email");
          return await gmailApiService.sendEmail(userId, options);
        }
      }

      // Check if OAuth 2 is available globally (for cases without userId)
      // This would require a different approach to determine if Gmail API should be used
      // For now, we'll fall back to SMTP as before
      if (!this.initialized) {
        console.log("Initializing email service...");
        await this.initialize();
        console.log("Email service initialized successfully");
      }

      this.resetDailyCountIfNeeded();

      if (this.dailyCount >= 1000) {
        throw new Error("Daily email limit reached (1000)");
      }

      console.log("Attempting to send email with options:", {
        to: options.to,
        subject: options.subject,
        hasHtml: !!options.html,
        hasText: !!options.text,
      });

      const result = await this.transporter.sendMail(options);
      console.log("Email sent successfully:", {
        messageId: result.messageId,
        response: result.response,
      });

      this.dailyCount++;
      return result;
    } catch (error) {
      console.error("Failed to send email. Error details:", {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message,
      });
      throw error;
    }
  }

  async sendBatchEmails(
    emailBatch,
    userId = null,
    { onProgress, maxRetries = 3 } = {}
  ) {
    // If userId is provided and they use Gmail API, use that
    if (userId) {
      const userConfig = await this.getUserEmailConfig(userId);
      if (userConfig?.useGmailApi) {
        console.log("Using Gmail API for batch emails");
        return await gmailApiService.sendBatchEmails(userId, emailBatch, {
          onProgress,
        });
      }
    }

    // Fall back to SMTP
    const results = {
      successful: [],
      failed: [],
    };

    for (const [index, email] of emailBatch.entries()) {
      let retries = 0;
      let success = false;

      while (retries < maxRetries && !success) {
        try {
          const result = await this.sendEmail(email);
          results.successful.push({ email, result });
          success = true;

          if (onProgress) {
            onProgress({
              completed: index + 1,
              total: emailBatch.length,
              success: true,
              email,
            });
          }
        } catch (error) {
          retries++;
          console.error(
            `Failed to send email (attempt ${retries}/${maxRetries}):`,
            error
          );

          if (retries === maxRetries) {
            results.failed.push({ email, error: error.message });
            if (onProgress) {
              onProgress({
                completed: index + 1,
                total: emailBatch.length,
                success: false,
                email,
                error,
              });
            }
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retries) * 1000)
            );
          }
        }
      }
    }

    return results;
  }
}

export default new EmailService();
