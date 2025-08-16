# Multi-User Email Integration Plan with OAuth 2.0

## Current State

- Single SMTP credential (email/password) for all email sending
- All emails are sent from one email address
- Teachers need to send emails from their own addresses

## Goals

1. Allow multiple teachers to send emails from their own accounts
2. Implement secure OAuth 2.0 authentication
3. Support major email providers (Gmail, Outlook)
4. Maintain email sending functionality with proper authentication

## Implementation Plan

### 1. OAuth 2.0 Integration

#### Supported Providers

1. **Google (Gmail)**

   - Required Scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`
   - API Console Setup:
     - Create project in Google Cloud Console
     - Enable Gmail API
     - Configure OAuth consent screen
     - Create OAuth 2.0 client credentials

2. **Microsoft (Outlook)**
   - Required Scopes:
     - `https://graph.microsoft.com/mail.send`
     - `https://graph.microsoft.com/user.read`
   - Azure Portal Setup:
     - Register application
     - Configure permissions
     - Get client credentials

### 2. Database Schema Updates

#### User Table Modifications

```sql
ALTER TABLE users
ADD COLUMN email_provider VARCHAR(50),
ADD COLUMN oauth_access_token TEXT,
ADD COLUMN oauth_refresh_token TEXT,
ADD COLUMN token_expiry TIMESTAMP,
ADD COLUMN email_configured BOOLEAN DEFAULT FALSE;
```

#### Required Fields:

- email_provider: 'gmail' | 'outlook' | null
- oauth_access_token: Encrypted OAuth access token
- oauth_refresh_token: Encrypted OAuth refresh token
- token_expiry: Token expiration timestamp
- email_configured: Whether email is set up for the user

### 3. Backend API Endpoints

#### OAuth Flow Endpoints:

1. `GET /api/email/auth/:provider`

   - Start OAuth flow
   - Generate state token
   - Redirect to provider's consent screen

2. `GET /api/email/callback/:provider`
   - Handle OAuth callback
   - Validate state token
   - Exchange code for tokens
   - Store encrypted tokens

#### Email Management Endpoints:

1. `GET /api/email/status`

   - Check email configuration status
   - Verify token validity
   - Return provider info

2. `POST /api/email/revoke`
   - Revoke OAuth access
   - Clear stored tokens
   - Reset email configuration

### 4. Security Implementation

1. **Token Encryption**

   - Encrypt access and refresh tokens
   - Use secure key management
   - Implement token rotation

2. **Token Refresh Logic**

```javascript
class TokenManager {
  async getValidToken(userId) {
    const tokens = await getUserTokens(userId);
    if (isTokenExpired(tokens.accessToken)) {
      return await refreshUserToken(userId, tokens.refreshToken);
    }
    return tokens.accessToken;
  }
}
```

3. **Security Headers**
   - Implement CORS
   - Set secure cookies
   - Use CSP headers

### 5. Frontend Implementation

#### Email Setup Flow

1. **Provider Selection Screen**

   - Choose email provider
   - Provider-specific instructions
   - Clear setup steps

2. **OAuth Consent Flow**

   - Redirect to provider
   - Handle callbacks
   - Show setup status

3. **Email Settings Dashboard**
   - Show connected account
   - Provider information
   - Revoke access option

#### UI Components

```javascript
const EmailSetup = () => {
  return (
    <div>
      <h2>Email Setup</h2>
      <ProviderSelection />
      <SetupStatus />
      <RevokeAccess />
    </div>
  );
};
```

### 6. Email Service Implementation

#### Provider-specific Email Services

```javascript
class EmailService {
  async sendEmail(userId, emailData) {
    const user = await getUser(userId);
    const service = this.getProviderService(user.email_provider);
    const token = await tokenManager.getValidToken(userId);

    return await service.sendMail(token, emailData);
  }

  getProviderService(provider) {
    switch (provider) {
      case "gmail":
        return new GmailService();
      case "outlook":
        return new OutlookService();
      default:
        return new DefaultEmailService();
    }
  }
}
```

### 7. Testing Strategy

1. **OAuth Flow Tests**

   - Authentication process
   - Token management
   - Error handling

2. **Integration Tests**

   - Provider APIs
   - Token refresh
   - Email sending

3. **Security Tests**
   - Token encryption
   - State validation
   - XSS prevention

### 8. Deployment Steps

1. **Provider Setup**

   - Create Google Cloud project
   - Register Azure application
   - Configure OAuth credentials

2. **Application Updates**

   - Database migrations
   - Backend deployment
   - Frontend updates

3. **Security Review**
   - Audit token handling
   - Review permissions
   - Test security measures

### 9. User Documentation

1. **Setup Guide**

   - Step-by-step provider setup
   - Troubleshooting steps
   - FAQ section

2. **Security Information**
   - OAuth vs SMTP explanation
   - Data handling details
   - Privacy information

## Timeline Estimation

1. OAuth Provider Setup: 2 days
2. Backend Implementation: 4-5 days
3. Frontend Development: 3-4 days
4. Testing: 2-3 days
5. Documentation: 1-2 days
6. Deployment: 1 day

Total Estimated Time: 13-17 days

## Advantages of OAuth 2.0 Approach

1. **Security**

   - No password storage
   - Token-based authentication
   - Automatic token rotation

2. **User Experience**

   - One-click setup
   - No app password creation
   - Familiar consent flow

3. **Maintenance**
   - Managed by providers
   - Standard protocol
   - Better error handling

## Risks and Mitigation

### Risks

1. OAuth token expiration
2. API rate limits
3. Provider downtime
4. Consent screen requirements

### Mitigation

1. Automatic token refresh
2. Rate limit handling
3. Fallback mechanisms
4. Clear setup documentation
