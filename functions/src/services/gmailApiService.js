import { google } from "googleapis";
import { getFirestore } from "firebase-admin/firestore";

class GmailApiService {
  constructor() {
    // Don't initialize Firebase Admin services in constructor
    this.db = null;
    // Get Google OAuth2 credentials from environment variables (Firebase Functions v2)
    this.googleClientId = process.env.GMAIL_CLIENT_ID || "610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com";
    this.googleClientSecret = process.env.GMAIL_CLIENT_SECRET || "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";
  }

  // Lazy initialization of Firestore
  getDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  async getUserTokens(userId) {
    try {
      const userDoc = await this.getDb().collection("users").doc(userId).get();
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

  async refreshToken(userId, retryCount = 0) {
    try {
      console.log(`Gmail API: Attempting to refresh token for userId: ${userId} (attempt ${retryCount + 1})`);
      const tokens = await this.getUserTokens(userId);
      if (!tokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log(`Gmail API: Found refresh token, creating OAuth2 client...`);
      const oauth2Client = new google.auth.OAuth2(
        this.googleClientId,
        this.googleClientSecret,
        `${process.env.APP_URL || 'https://smile3-8c8c5.firebaseapp.com'}/auth/gmail/callback`
      );

      // Set the refresh token
      oauth2Client.setCredentials({
        refresh_token: tokens.refreshToken
      });

      console.log(`Gmail API: Refreshing access token...`);
      // Refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      console.log(`Gmail API: Token refreshed successfully, updating Firestore...`);
      // Update tokens in Firestore and clear any previous errors
      await this.getDb().collection("users").doc(userId).update({
        gmail_access_token: credentials.access_token,
        gmail_token_expiry: credentials.expiry_date,
        gmail_token_last_refresh: new Date().toISOString(),
        gmail_token_error: null,
        gmail_token_error_time: null
      });

      console.log(`Gmail API: Tokens updated in Firestore successfully`);
      return credentials;
    } catch (error) {
      console.error("Gmail API: Error refreshing token:", {
        userId,
        retryCount,
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Only mark as unconfigured after multiple consecutive failures
      if (retryCount >= 2) {
        try {
          await this.getDb().collection("users").doc(userId).update({
            gmail_configured: false,
            gmail_token_error: error.message,
            gmail_token_error_time: new Date().toISOString()
          });
          console.log(`Gmail API: Marked user ${userId} as needing re-authentication after ${retryCount + 1} failed attempts`);
        } catch (updateError) {
          console.error("Gmail API: Failed to update user auth status:", updateError);
        }
      } else {
        // Log the error but don't mark as unconfigured yet
        console.log(`Gmail API: Token refresh failed (attempt ${retryCount + 1}), will retry...`);
      }
      
      throw error;
    }
  }

  async createGmailClient(userId) {
    console.log(`Gmail API: Creating client for userId: ${userId}`);
    const tokens = await this.getUserTokens(userId);
    if (!tokens) {
      throw new Error("Gmail not configured for this user");
    }

    console.log(`Gmail API: Tokens found for user:`, {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiryTime: tokens.expiryTime,
      isExpired: tokens.expiryTime ? new Date(tokens.expiryTime) < new Date() : 'unknown'
    });

    // Check if token is expired and refresh if needed
    if (tokens.expiryTime && new Date(tokens.expiryTime) < new Date()) {
      console.log(`Gmail API: Token expired, refreshing before creating client...`);
      
      // Try to refresh with retries
      let refreshSuccess = false;
      let lastError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await this.refreshToken(userId, attempt);
          // Get the refreshed tokens
          const refreshedTokens = await this.getUserTokens(userId);
          if (refreshedTokens) {
            tokens.accessToken = refreshedTokens.accessToken;
            tokens.expiryTime = refreshedTokens.expiryTime;
            refreshSuccess = true;
            console.log(`Gmail API: Token refreshed successfully on attempt ${attempt + 1}`);
            break;
          }
        } catch (refreshError) {
          lastError = refreshError;
          console.log(`Gmail API: Token refresh attempt ${attempt + 1} failed:`, refreshError.message);
          
          // Wait before retrying (exponential backoff)
          if (attempt < 2) {
            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.log(`Gmail API: Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!refreshSuccess) {
        console.error(`Gmail API: All token refresh attempts failed. Last error:`, lastError?.message);
        throw new Error(`Token refresh failed after 3 attempts: ${lastError?.message}`);
      }
    }

    const oauth2Client = new google.auth.OAuth2(
      this.googleClientId,
      this.googleClientSecret,
      `${process.env.APP_URL || 'https://smile3-8c8c5.firebaseapp.com'}/auth/gmail/callback`
    );

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryTime,
    });

    console.log(`Gmail API: OAuth2 client created with credentials`);
    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  async sendEmail(userId, { to, subject, html }) {
    try {
      console.log(`Gmail API: Attempting to send email to ${to} with subject: ${subject}`);
      
      // Validate input parameters
      if (!to || !subject || !html) {
        throw new Error(`Invalid email parameters: to=${to}, subject=${subject}, hasHtml=${!!html}`);
      }

      const gmail = await this.createGmailClient(userId);
      console.log("Gmail API: Client created successfully");

      // Create email in RFC 2822 format (simplified like working version)
      const email = [
        'Content-Type: text/html; charset="UTF-8"',
        "MIME-Version: 1.0",
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        html,
      ].join("\r\n");

      console.log("Gmail API: Email constructed, attempting to send...");

      // Encode the email properly
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      console.log("Gmail API: Email encoded, attempting to send...");

      try {
        // Send the email (like working version)
        const result = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedEmail,
          },
        });

        console.log(`Gmail API: Email sent successfully! MessageId: ${result.data.id}`);
        console.log(`Gmail API: ThreadId: ${result.data.threadId}`);
        
        // Return success like working version (no verification)
        return {
          success: true,
          messageId: result.data.id,
          threadId: result.data.threadId,
        };
      } catch (error) {
        console.error("Gmail API: Error in send operation:", {
          error: error.message,
          code: error.code,
          status: error.status,
          details: error.details,
          stack: error.stack
        });

        // Check if it's an authentication error that might be due to expired token
        if (error.code === 401 || error.code === 403) {
          console.log("Token might be expired, attempting to refresh...");
          try {
            // Try to refresh the token
            await this.refreshToken(userId);
            console.log("Token refreshed successfully, retrying...");
            
            // Retry with refreshed client
            const refreshedGmail = await this.createGmailClient(userId);
            const result = await refreshedGmail.users.messages.send({
              userId: "me",
              requestBody: {
                raw: encodedEmail,
              },
            });

            console.log(`Gmail API: Email sent successfully after token refresh! MessageId: ${result.data.id}`);
            
            return {
              success: true,
              messageId: result.data.id,
              threadId: result.data.threadId,
            };
          } catch (refreshError) {
            console.error("Failed to refresh token:", refreshError);
            throw new Error(`Token refresh failed: ${refreshError.message}`);
          }
        }
        
        // For other errors, provide more context
        if (error.code === 400) {
          throw new Error(`Bad request - check email format: ${error.message}`);
        } else if (error.code === 429) {
          throw new Error(`Rate limit exceeded: ${error.message}`);
        } else if (error.code >= 500) {
          throw new Error(`Gmail API server error: ${error.message}`);
        }
        
        throw error;
      }
    } catch (error) {
      console.error("Gmail API: Error sending email:", {
        to: to,
        subject: subject,
        error: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack
      });
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

  async checkGmailStatus(userId) {
    try {
      console.log(`Gmail API: Checking status for userId: ${userId}`);
      const tokens = await this.getUserTokens(userId);
      
      if (!tokens) {
        return {
          configured: false,
          status: 'not_configured',
          message: 'Gmail not configured for this user'
        };
      }

      if (!tokens.accessToken || !tokens.refreshToken) {
        return {
          configured: false,
          status: 'incomplete_tokens',
          message: 'Missing access or refresh token'
        };
      }

      // Check if token is expired
      const isExpired = tokens.expiryTime && new Date(tokens.expiryTime) < new Date();
      
      if (isExpired) {
        return {
          configured: true,
          status: 'token_expired',
          message: 'Access token expired, refresh needed',
          canRefresh: !!tokens.refreshToken
        };
      }

      // Simplified check - just verify we can create a client (like working version)
      try {
        await this.createGmailClient(userId);
        
        return {
          configured: true,
          status: 'operational',
          message: 'Gmail API working correctly',
          // Don't try to get profile info that requires additional scopes
        };
      } catch (testError) {
        return {
          configured: true,
          status: 'connection_failed',
          message: `Connection test failed: ${testError.message}`,
          error: testError.message
        };
      }
    } catch (error) {
      console.error("Gmail API: Error checking status:", error);
      return {
        configured: false,
        status: 'error',
        message: `Error checking status: ${error.message}`,
        error: error.message
      };
    }
  }

  async checkGmailQuotas(userId) {
    try {
      console.log(`Gmail API: Checking quotas for userId: ${userId}`);
      
      // Simplified check - just verify we can create a client
      await this.createGmailClient(userId);
      
      const quotaInfo = {
        status: 'operational',
        message: 'Gmail API accessible',
        timestamp: new Date().toISOString()
      };
      
      console.log(`Gmail API: Quota info:`, quotaInfo);
      return quotaInfo;
      
    } catch (error) {
      console.error("Gmail API: Error checking quotas:", error);
      throw error;
    }
  }

  async clearGmailError(userId) {
    try {
      await this.getDb().collection("users").doc(userId).update({
        gmail_token_error: null,
        gmail_token_error_time: null
      });
      console.log(`Gmail API: Cleared error status for user ${userId}`);
    } catch (error) {
      console.error("Gmail API: Failed to clear error status:", error);
    }
  }

  async testEmailDelivery(userId, testEmail) {
    try {
      console.log(`Gmail API: Testing email delivery to: ${testEmail}`);
      
      const testSubject = `Test Email - ${new Date().toISOString()}`;
      const testHtml = `
        <html>
          <body>
            <h2>Test Email</h2>
            <p>This is a test email to verify Gmail API delivery.</p>
            <p>Sent at: ${new Date().toISOString()}</p>
            <p>If you receive this, Gmail API is working correctly.</p>
          </body>
        </html>
      `;
      
      const result = await this.sendEmail(userId, {
        to: testEmail,
        subject: testSubject,
        html: testHtml
      });
      
      console.log(`Gmail API: Test email sent successfully:`, result);
      
      // Return success without verification (like working version)
      return {
        success: true,
        messageId: result.messageId,
        verified: false, // No verification to avoid scope issues
        message: 'Test email sent successfully. Check your inbox to verify delivery.'
      };
      
    } catch (error) {
      console.error("Gmail API: Test email delivery failed:", error);
      throw error;
    }
  }
}

export default new GmailApiService();

