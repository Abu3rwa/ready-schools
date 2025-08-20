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
    // Don't initialize Firebase Admin services in constructor
    this.db = null;
  }

  // Lazy initialization of Firestore
  getDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
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
      const userDoc = await this.getDb().collection("users").doc(userId).get();
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
      const allowSmtpFallback = process.env.SMTP_GLOBAL_FALLBACK_ENABLED === 'true';

      // Prioritize OAuth 2 (Gmail API) when available
      if (userId) {
        const userConfig = await this.getUserEmailConfig(userId);
        if (userConfig?.useGmailApi) {
          console.log("Using Gmail API for sending email");
          try {
            const result = await gmailApiService.sendEmail(userId, options);
            console.log("Gmail API email sent successfully:", result);
            return result;
          } catch (gmailError) {
            console.error("Gmail API failed", gmailError);

            // If Gmail API fails due to auth issues, mark user as needing re-auth
            if (gmailError.message?.toLowerCase().includes('token') || gmailError.message?.toLowerCase().includes('auth')) {
              try {
                await this.getDb().collection("users").doc(userId).update({
                  gmail_configured: false,
                  gmail_last_error: gmailError.message,
                  gmail_error_time: new Date().toISOString()
                });
                console.log(`Marked user ${userId} as needing Gmail re-authentication`);
              } catch (updateError) {
                console.error("Failed to update user auth status:", updateError);
              }
            }

            if (!allowSmtpFallback) {
              console.log("SMTP fallback disabled; rethrowing Gmail error");
              throw gmailError;
            }
            console.log("Using SMTP fallback for sending email");
            // continue to SMTP fallback below
          }
        } else {
          // User has no Gmail configured
          if (!allowSmtpFallback) {
            throw new Error("Gmail is not configured for this user, and SMTP fallback is disabled");
          }
        }
      } else {
        // No user context
        if (!allowSmtpFallback) {
          throw new Error("No userId provided for Gmail sending, and SMTP fallback is disabled");
        }
      }

      // Fallback to SMTP (only if explicitly enabled)
      if (!allowSmtpFallback) {
        throw new Error("SMTP fallback is disabled");
      }
      console.log("Using SMTP fallback for sending email");
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
      console.log("Email sent successfully via SMTP:", {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      this.dailyCount++;
      return {
        success: true,
        messageId: result.messageId,
        method: 'smtp'
      };
    } catch (error) {
      console.error("Email service error:", {
        error: error.message,
        userId: userId,
        options: {
          to: options.to,
          subject: options.subject,
          hasHtml: !!options.html,
          hasText: !!options.text,
        }
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
