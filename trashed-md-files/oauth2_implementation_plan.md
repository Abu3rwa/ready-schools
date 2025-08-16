# OAuth 2 Gmail Authentication Implementation Plan

## Current Issues

1. **SMTP Configuration with Hardcoded Credentials**
   - In `functions/src/config/email.js`, lines 5-6 show hardcoded SMTP credentials
   - The email service defaults to SMTP initialization (line 20 in emailService.js)
   - Even when OAuth 2 is available, SMTP is used as fallback

2. **OAuth 2 Implementation Issues**
   - OAuth 2 configuration exists but is not properly integrated
   - The frontend has OAuth 2 implementation but it's not properly connected to the backend email service
   - Token refresh mechanism is missing in the backend Gmail API service
   - The email service prioritizes SMTP over OAuth 2

3. **Token Management Issues**
   - No automatic token refresh in the backend Gmail API service
   - Tokens are stored in Firestore but not properly refreshed when expired

## Required Changes

### 1. Backend Email Service (functions/src/services/emailService.js)

**Current sendEmail method:**
```javascript
async sendEmail(options, userId = null) {
  try {
    // If userId is provided, check if they have Gmail API configured
    if (userId) {
      const userConfig = await this.getUserEmailConfig(userId);
      if (userConfig?.useGmailApi) {
        console.log("Using Gmail API for sending email");
        return await gmailApiService.sendEmail(userId, options);
      }
    }

    // Fall back to SMTP if no userId or Gmail not configured
    if (!this.initialized) {
      console.log("Initializing email service...");
      await this.initialize();
      console.log("Email service initialized successfully");
    }

    // ... SMTP sending logic
  }
}
```

**Required changes:**
- Modify to prioritize OAuth 2 when available
- Check for OAuth 2 configuration even without userId
- Implement better error handling

### 2. Gmail API Service (functions/src/services/gmailApiService.js)

**Current issues:**
- No token refresh mechanism
- No handling of expired token errors
- No automatic retry with refreshed tokens

**Required changes:**

#### a. Add token refresh method:
```javascript
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
```

#### b. Modify createGmailClient to handle token expiration:
```javascript
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
```

#### c. Modify sendEmail to handle token expiration:
```javascript
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
```

### 3. Environment Variables Setup

**Required environment variables for functions:**
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- APP_URL

These should be set using Firebase Functions environment configuration:
```bash
firebase functions:config:set gmail.client_id="your-client-id" gmail.client_secret="your-client-secret"
```

### 4. Frontend Integration

**Current Gmail service issues:**
- Missing client secret in environment variables
- No proper error handling for token expiration

**Required changes:**
- Ensure REACT_APP_GOOGLE_CLIENT_SECRET is properly set in .env file
- Add better error handling in Gmail service

## Testing Plan

1. **OAuth 2 Setup Test**
   - Verify Gmail OAuth 2 setup flow works correctly
   - Check token storage in Firestore

2. **Email Sending Test**
   - Test sending emails using OAuth 2
   - Verify emails appear in sent folder

3. **Token Refresh Test**
   - Test token expiration and refresh
   - Verify updated tokens are stored correctly

4. **Fallback Test**
   - Test SMTP fallback when OAuth 2 is not configured
   - Verify proper error handling

## Documentation

1. **Setup Instructions**
   - How to configure Google OAuth 2 credentials
   - How to set environment variables
   - How to connect Gmail account

2. **User Guide**
   - How to use OAuth 2 for sending emails
   - How to reconnect Gmail if tokens expire
   - Troubleshooting common issues