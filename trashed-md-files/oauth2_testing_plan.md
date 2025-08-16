# OAuth 2 Gmail Authentication Testing Plan

## Prerequisites
1. Google OAuth 2 credentials (Client ID and Client Secret) properly configured
2. Firebase functions environment variables set:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - APP_URL
3. REACT_APP_GOOGLE_CLIENT_SECRET set in .env file

## Test Cases

### 1. OAuth 2 Setup Test
**Objective:** Verify that users can successfully connect their Gmail account

**Steps:**
1. Navigate to the email settings page
2. Click "Connect Gmail" button
3. Verify that the user is redirected to Google's OAuth consent screen
4. Complete the OAuth flow by granting permissions
5. Verify that the user is redirected back to the application
6. Check that the success message is displayed
7. Verify that tokens are stored in Firestore

**Expected Results:**
- User is redirected to Google's OAuth consent screen
- User can successfully grant permissions
- User is redirected back to the application
- Success message is displayed
- Tokens are stored in Firestore with correct fields:
  - gmail_access_token
  - gmail_refresh_token
  - gmail_token_expiry
  - gmail_configured = true

### 2. Email Sending Test
**Objective:** Verify that emails can be sent using OAuth 2

**Steps:**
1. Ensure Gmail is configured for the user
2. Send a test email using the application
3. Check the email sending logs
4. Verify that the email was sent successfully
5. Check the user's Gmail sent folder to confirm the email appears there

**Expected Results:**
- Email is sent successfully
- Log shows "Using Gmail API for sending email"
- Email appears in the user's Gmail sent folder
- No errors in the console

### 3. Token Refresh Test
**Objective:** Verify that expired tokens are handled correctly

**Steps:**
1. Configure Gmail for a user
2. Manually expire the access token in Firestore (set gmail_token_expiry to a past date)
3. Send a test email
4. Check the logs for token refresh messages
5. Verify that the email is sent successfully
6. Check that the tokens in Firestore have been updated

**Expected Results:**
- Log shows "Token might be expired, attempting to refresh..."
- Email is sent successfully after token refresh
- Tokens in Firestore are updated with new expiry time

### 4. Fallback to SMTP Test
**Objective:** Verify that the system falls back to SMTP when OAuth 2 is not configured

**Steps:**
1. Ensure Gmail is not configured for the user
2. Send a test email
3. Check the email sending logs
4. Verify that the email was sent using SMTP

**Expected Results:**
- Log shows "Initializing email service..." and "Email service initialized successfully"
- Email is sent successfully using SMTP
- No errors in the console

### 5. Error Handling Test
**Objective:** Verify that errors are handled gracefully

**Test Cases:**
1. **Invalid Client Secret:**
   - Remove or invalidate the Google Client Secret
   - Try to connect Gmail
   - Verify that an appropriate error message is displayed

2. **Token Expiration:**
   - Expire both access and refresh tokens
   - Try to send an email
   - Verify that the user is prompted to re-authenticate

3. **Network Errors:**
   - Simulate network issues during email sending
   - Verify that appropriate error messages are displayed
   - Verify that retry mechanism works

**Expected Results:**
- Appropriate error messages are displayed for each scenario
- Users are guided on how to resolve issues
- No application crashes

## Manual Testing Steps

### Setting up OAuth 2 Credentials
1. Go to Google Cloud Console
2. Create or select a project
3. Enable the Gmail API
4. Create OAuth 2 credentials (Client ID and Client Secret)
5. Add authorized redirect URIs:
   - http://localhost:3000/auth/gmail/callback (for development)
   - Your production URL + /auth/gmail/callback

### Setting Environment Variables
1. For Firebase functions:
   ```bash
   firebase functions:config:set \
     gmail.client_id="your-client-id" \
     gmail.client_secret="your-client-secret" \
     app.url="your-app-url"
   ```

2. For frontend (.env file):
   ```
   REACT_APP_GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Testing Email Sending
1. Connect Gmail account through the application UI
2. Send a test email to yourself
3. Check your inbox and sent folder
4. Verify that the email was sent from your Gmail address
5. Check the application logs for successful sending

## Automated Testing
Consider adding unit tests for:
1. Gmail API service token refresh functionality
2. Email service sendEmail method with different configurations
3. Error handling in various scenarios
4. Token expiration and refresh scenarios

## Troubleshooting Common Issues

### "Gmail not configured for this user"
- Ensure the user has completed the OAuth flow
- Check Firestore for user document with Gmail tokens
- Verify that gmail_configured field is set to true

### "Token expired. Please re-authenticate"
- User needs to reconnect their Gmail account
- Check if refresh token was properly stored
- Verify that the client secret is correct

### "Failed to exchange code for tokens"
- Check that the client secret is correct
- Verify that the redirect URI matches exactly
- Ensure that the Google OAuth credentials are properly configured

### "Daily email limit reached"
- This indicates the SMTP fallback is working
- For production, ensure OAuth 2 is properly configured for all users
- Check if there are issues with Gmail API quotas