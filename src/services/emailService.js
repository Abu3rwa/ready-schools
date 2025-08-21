import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

class GmailService {
  constructor() {
    this.auth = getAuth();
    this.SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
    this.CLIENT_ID = '610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com';
    // Remove hardcoded client secret - this will be handled by backend only
  }

  // Generate cryptographically secure state for OAuth
  generateSecureState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate state parameter to prevent CSRF
  validateState(state) {
    const savedState = sessionStorage.getItem('gmail_auth_state');
    sessionStorage.removeItem('gmail_auth_state'); // Remove immediately after use
    return state === savedState && savedState !== null;
  }

  async getGmailTokens(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      
      // Enhanced validation checks
      if (!userData.gmail_configured) {
        console.log('Gmail not configured for this user');
        return null;
      }
      
      // Check for any error states that need addressing
      if (userData.gmail_token_error || userData.gmail_last_error) {
        console.log('Gmail has error state:', userData.gmail_token_error || userData.gmail_last_error);
        return null;
      }
      
      // Validate token presence
      if (!userData.gmail_access_token || !userData.gmail_refresh_token) {
        console.log('Gmail tokens missing - user needs to re-authenticate');
        return null;
      }
      
      // Check expiry with buffer (refresh 5 minutes early)
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      if (userData.gmail_token_expiry && (Date.now() + bufferTime) >= userData.gmail_token_expiry) {
        console.log('Gmail tokens will expire soon, needs refresh');
        return null;
      }
      
      return {
        accessToken: userData.gmail_access_token,
        refreshToken: userData.gmail_refresh_token,
        expiryTime: userData.gmail_token_expiry,
        configured: true
      };
    } catch (error) {
      console.error('Error getting Gmail tokens:', error);
      return null;
    }
  }

  async clearGmailError(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        gmail_token_error: null,
        gmail_token_error_time: null,
        gmail_last_error: null,
        gmail_error_time: null
      });
      console.log('Gmail errors cleared for user:', userId);
    } catch (error) {
      console.error('Error clearing Gmail error:', error);
    }
  }

  async sendEmail(to, subject, body) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let tokens = await this.getGmailTokens(userId);
      if (!tokens) throw new Error('Gmail not configured or tokens expired. Please re-authenticate.');

      // Create email in RFC 2822 format
      const email = [
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\r\n');

      // Proper base64 encoding
      const base64Email = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email using Gmail API with proper error handling
      let response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64Email
        })
      });

      // Enhanced error handling
      if (response.status === 401) {
        await this.markTokensAsExpired(userId);
        throw new Error('Gmail authentication expired. Please re-authenticate.');
      } else if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.message?.includes('quota')) {
          throw new Error('Gmail API quota exceeded. Please try again later.');
        }
        await this.markTokensAsExpired(userId);
        throw new Error('Gmail access forbidden. Please re-authenticate.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to send email: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
        threadId: result.threadId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Mark tokens as expired/invalid
  async markTokensAsExpired(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        gmail_configured: false,
        gmail_last_error: 'Token authentication failed',
        gmail_error_time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking tokens as expired:', error);
    }
  }

  async initiateGmailAuth() {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Clear any existing errors first
    await this.clearGmailError(userId);

    // Generate secure state for CSRF protection
    const state = this.generateSecureState();
    sessionStorage.setItem('gmail_auth_state', state);

    // Determine redirect URI based on environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectUri = isLocalhost 
      ? `${window.location.origin}/auth/gmail/callback`
      : `https://smile3-8c8c5.firebaseapp.com/auth/gmail/callback`;

    // Construct OAuth URL with PKCE for enhanced security
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', this.SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('include_granted_scopes', 'true');

    console.log('Redirecting to Gmail OAuth with redirect URI:', redirectUri);
    
    // Redirect to Google's OAuth page
    window.location.href = authUrl.toString();
  }

  async handleGmailCallback(code, state) {
    // Enhanced state validation
    if (!this.validateState(state)) {
      throw new Error('Invalid or missing state parameter. Possible CSRF attack.');
    }

    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    try {
      // Always use backend for token exchange (more secure)
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://us-central1-smile3-8c8c5.cloudfunctions.net/handleGmailOAuthCallback'
        : 'http://localhost:5001/smile3-8c8c5/us-central1/handleGmailOAuthCallback';

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to complete Gmail OAuth: ${response.status}`);
      }

      const result = await response.json();
      console.log('Gmail OAuth completed successfully');
      return result;
    } catch (error) {
      console.error('OAuth callback error:', error);
      // Mark as needing re-authentication on callback failure
      await this.markTokensAsExpired(userId);
      throw error;
    }
  }

  // Health check method for monitoring
  async checkHealth(userId) {
    try {
      const tokens = await this.getGmailTokens(userId);
      if (!tokens) {
        return { healthy: false, reason: 'No valid tokens' };
      }

      // Simple API call to test connectivity
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        }
      });

      if (response.ok) {
        return { healthy: true };
      } else {
        return { healthy: false, reason: `API call failed: ${response.status}` };
      }
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }
}

export const gmailService = new GmailService();