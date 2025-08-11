import nodemailer from "nodemailer";
import getEmailConfig from "../config/email.js";

class EmailService {
  constructor() {
    // Initialize with null transporter - will be set up lazily
    this.transporter = null;
    this.dailyCount = 0;
    this.lastReset = new Date().toDateString();
    this.initialized = false;

    // Defer all initialization until an actual function is called
    // This prevents initialization during module loading
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Only get the config when actually needed
      const emailConfig = getEmailConfig();
      console.log("Email config:", JSON.stringify(emailConfig, null, 2));
      
      this.transporter = nodemailer.createTransport(emailConfig);
      
      // Verify connection configuration
      await this.transporter.verify();
      console.log("Email service initialized and verified successfully");
    } catch (error) {
      console.error("Failed to create email transporter:", error);
      console.error("Error details:", {
        code: error.code,
        response: error.response,
        command: error.command,
        stack: error.stack
      });
      // Don't throw an error here, just mark as not initialized
      // This allows the service to attempt reinitialization later
      this.initialized = false;
      throw new Error(`Email service initialization failed: ${error.message}`);
    }

    this.initialized = true;
  }

  async verifyConnection() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email service verification failed:", error);
      return false;
    }
  }

  resetDailyCountIfNeeded() {
    const today = new Date().toDateString();
    if (this.lastReset !== today) {
      this.dailyCount = 0;
      this.lastReset = today;
    }
  }

  async sendEmail(options) {
    try {
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
        hasText: !!options.text
      });

      const result = await this.transporter.sendMail(options);
      console.log("Email sent successfully:", {
        messageId: result.messageId,
        response: result.response
      });
      
      this.dailyCount++;
      return result;
    } catch (error) {
      console.error("Failed to send email. Error details:", {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message
      });
      throw error;
    }
  }

  async sendBatchEmails(emailBatch, { onProgress, maxRetries = 3 } = {}) {
    const results = {
      successful: [],
      failed: [],
      totalAttempted: 0,
    };

    for (const email of emailBatch) {
      let attempts = 0;
      let success = false;

      while (attempts < maxRetries && !success) {
        try {
          const result = await this.sendEmail(email);
          results.successful.push({
            recipient: email.to,
            messageId: result.messageId,
            timestamp: new Date(),
          });
          success = true;
        } catch (error) {
          attempts++;
          if (attempts === maxRetries) {
            results.failed.push({
              recipient: email.to,
              error: error.message,
              attempts,
              timestamp: new Date(),
            });
          }
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempts) * 1000)
          );
        }
      }

      results.totalAttempted++;
      if (onProgress) {
        onProgress({
          total: emailBatch.length,
          current: results.totalAttempted,
          successful: results.successful.length,
          failed: results.failed.length,
        });
      }

      // Delay between emails to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return results;
  }

  validateEmailOptions(options) {
    const errors = [];

    if (!options.to) errors.push("Recipient (to) is required");
    if (!options.subject) errors.push("Subject is required");
    if (!options.html && !options.text)
      errors.push("Email content (html or text) is required");

    if (options.attachments) {
      const totalSize = options.attachments.reduce(
        (sum, att) => sum + (att.content?.length || 0),
        0
      );
      if (totalSize > 10 * 1024 * 1024) {
        // 10MB limit
        errors.push("Total attachments size exceeds 10MB limit");
      }
    }

    if (errors.length > 0) {
      throw new Error(`Email validation failed: ${errors.join(", ")}`);
    }

    return true;
  }
}

// Singleton instance
const emailService = new EmailService();

export default emailService;
