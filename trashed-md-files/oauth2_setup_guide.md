# OAuth 2 Gmail Authentication Setup Guide

## Overview

This guide explains how to set up OAuth 2 Gmail authentication for the application. The implementation allows users to send emails directly from their Gmail accounts instead of using SMTP.

## Changes Made

### Backend (Firebase Functions)

1. **Gmail API Service Enhancements**
   - Added automatic token refresh mechanism for expired access tokens
   - Implemented error handling for authentication errors
   - Added retry logic for sending emails with refreshed tokens
   - Improved token storage and update procedures

2. **Email Service Updates**
   - Maintained existing SMTP functionality as fallback
   - Prioritized OAuth 2 when available for users who have configured it
   - Improved error logging and debugging information

### Frontend

1. **Gmail Service Improvements**
   - Added better error handling for token expiration
   - Improved error messages for users
   - Added validation for required environment variables
   - Enhanced token expiration checking

## Setup Instructions

### 1. Google OAuth 2 Credentials

#### Create OAuth 2 Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on "Gmail API" and then "Enable"
4. Create OAuth 2 credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/gmail/callback`
     - For production: `https://yourdomain.com/auth/gmail/callback`
   - Note the Client ID and Client Secret

### 2. Environment Variables Configuration

#### Backend (Firebase Functions)
Set the following environment variables using Firebase CLI:

```bash
firebase functions:config:set \
  gmail.client_id="your-google-client-id" \
  gmail.client_secret="your-google-client-secret" \
  app.url="https://yourdomain.com"
```

#### Frontend (.env file)
Add the following to your `.env` file:

```
REACT_APP_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Firestore Configuration

The implementation automatically stores Gmail tokens in Firestore under the user document with the following fields:
- `gmail_access_token`: The access token for Gmail API
- `gmail_refresh_token`: The refresh token for obtaining new access tokens
- `gmail_token_expiry`: Timestamp when the access token expires
- `gmail_configured`: Boolean indicating if Gmail is configured

### 4. User Setup Process

Users can connect their Gmail account through the application:

1. Navigate to Settings > Email Configuration
2. Click "Connect Gmail" button
3. Complete the OAuth flow by granting permissions
4. The application will automatically store the tokens
5. Users can now send emails using their Gmail account

## How It Works

### Token Management
1. When a user connects their Gmail account, the application:
   - Redirects to Google's OAuth consent screen
   - Exchanges the authorization code for access and refresh tokens
   - Stores tokens securely in Firestore

2. When sending emails:
   - The application checks if the user has Gmail configured
   - If configured, uses the Gmail API with stored tokens
   - If tokens are expired, attempts to refresh them automatically
   - Falls back to SMTP if Gmail is not configured or refresh fails

### Error Handling
1. **Token Expiration**: 
   - Automatically detected and handled
   - Refresh tokens used to obtain new access tokens
   - Users redirected to re-authenticate if refresh fails

2. **Authentication Errors**:
   - Clear error messages displayed to users
   - Guidance on how to resolve common issues
   - Logging for debugging purposes

3. **Network Issues**:
   - Retry mechanism for transient failures
   - Appropriate error messages for persistent issues

## Troubleshooting

### Common Issues and Solutions

#### "Gmail not configured for this user"
- Ensure the user has completed the OAuth flow
- Check Firestore for user document with Gmail tokens
- Verify that `gmail_configured` field is set to `true`

#### "Token expired. Please re-authenticate"
- User needs to reconnect their Gmail account
- Check if refresh token was properly stored
- Verify that the client secret is correct

#### "Failed to exchange code for tokens"
- Check that the client secret is correct
- Verify that the redirect URI matches exactly
- Ensure that the Google OAuth credentials are properly configured

#### "Daily email limit reached"
- This indicates the SMTP fallback is working
- For production, ensure OAuth 2 is properly configured for all users
- Check if there are issues with Gmail API quotas

### Debugging Steps

1. **Check Environment Variables**
   ```bash
   firebase functions:config:get
   ```

2. **Check Firestore Data**
   - Look for user document with Gmail tokens
   - Verify token expiry dates

3. **Check Application Logs**
   - Look for error messages in Firebase Functions logs
   - Check browser console for frontend errors

## Security Considerations

1. **Token Storage**: 
   - Access and refresh tokens are stored in Firestore
   - Only accessible to authenticated users
   - Never exposed to the frontend directly

2. **Client Secret Protection**:
   - Stored as Firebase Functions environment variable
   - Not included in client-side code
   - Should be kept secure and not shared

3. **Scope Limitation**:
   - Only requests necessary scopes (`gmail.send`)
   - Users explicitly grant permissions
   - No access to read emails or other sensitive data

## Maintenance

### Regular Checks
1. Monitor Gmail API usage quotas
2. Check for token refresh failures
3. Verify OAuth credentials are still valid
4. Update client secrets when they expire

### Updating Credentials
1. Generate new OAuth 2 credentials in Google Cloud Console
2. Update Firebase Functions environment variables:
   ```bash
   firebase functions:config:set \
     gmail.client_id="new-client-id" \
     gmail.client_secret="new-client-secret"
   ```
3. Update `.env` file with new client secret
4. Users may need to re-authenticate if client ID changes

## Future Improvements

1. **Batch Email Sending**: 
   - Enhance batch email functionality with Gmail API
   - Implement better progress tracking

2. **Enhanced Error Recovery**:
   - Add automatic re-authentication prompts
   - Implement more sophisticated retry mechanisms

3. **Analytics and Monitoring**:
   - Add metrics for Gmail API usage
   - Implement alerts for authentication failures

4. **User Experience Improvements**:
   - Add visual indicators for Gmail connection status
   - Provide more detailed setup instructions
   - Add troubleshooting wizard for common issues