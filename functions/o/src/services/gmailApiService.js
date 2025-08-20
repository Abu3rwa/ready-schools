import { google } from "googleapis";
import { getFirestore } from "firebase-admin/firestore";

class GmailApiService {
  constructor() {
    this.db = getFirestore();
  }

  async getUserTokens(userId) {
    try {
      const userDoc = await this.db.collection("users").doc(userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      return {
        accessToken: userData.gmail_access_token,
        refreshToken: userData.gmail_refresh_token,
        expiryTime: userData.gmail_token_expiry,
      };
    } catch (error) {
      console.error("Error getting Gmail tokens:", error);
      return null;
    }
  }

  async refreshToken(userId) {
    try {
      const tokens = await this.getUserTokens(userId);
      if (!tokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.APP_URL}/auth/gmail/callback`
      );

      // Set the refresh token
      oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
      });

      // Refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in Firestore
      await this.db.collection("users").doc(userId).update({
        gmail_access_token: credentials.access_token,
        gmail_token_expiry: credentials.expiry_date
      });

      return credentials;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }

  async createGmailClient(userId) {
    const tokens = await this.getUserTokens(userId);
    if (!tokens) {
      throw new Error("Gmail not configured for this user");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL}/auth/gmail/callback`
    );

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryTime,
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  async sendEmail(userId, { to, subject, html }) {
    try {
      const gmail = await this.createGmailClient(userId);

      // Create email in RFC 2822 format
      const email = [
        'Content-Type: text/html; charset="UTF-8"',
        "MIME-Version: 1.0",
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        html,
      ].join("\r\n");

      // Encode the email
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      try {
        // Send the email
        const result = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedEmail,
          },
        });

        return {
          success: true,
          messageId: result.data.id,
          threadId: result.data.threadId,
        };
      } catch (error) {
        // Check if it's an authentication error that might be due to expired token
        if (error.code === 401 || error.code === 403) {
          console.log("Token might be expired, attempting to refresh...");
          try {
            // Try to refresh the token
            await this.refreshToken(userId);
            // Retry with refreshed client
            const refreshedGmail = await this.createGmailClient(userId);
            const result = await refreshedGmail.users.messages.send({
              userId: "me",
              requestBody: {
                raw: encodedEmail,
              },
            });

            return {
              success: true,
              messageId: result.data.id,
              threadId: result.data.threadId,
            };
          } catch (refreshError) {
            console.error("Failed to refresh token:", refreshError);
            throw error;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("Error sending email via Gmail API:", error);
      throw error;
    }
  }

  async sendBatchEmails(userId, emails, { onProgress } = {}) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const [index, email] of emails.entries()) {
      try {
        const result = await this.sendEmail(userId, email);
        results.successful.push({ email, result });

        if (onProgress) {
          onProgress({
            completed: index + 1,
            total: emails.length,
            success: true,
            email,
          });
        }
      } catch (error) {
        results.failed.push({ email, error: error.message });

        if (onProgress) {
          onProgress({
            completed: index + 1,
            total: emails.length,
            success: false,
            email,
            error,
          });
        }
      }
    }

    return results;
  }
}

export default new GmailApiService();
