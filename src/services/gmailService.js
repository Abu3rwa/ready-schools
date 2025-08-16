import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

class GmailService {
  constructor() {
    this.auth = getAuth();
    this.SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
    this.CLIENT_ID = '610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com';
  }

  async getGmailTokens(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      return {
        accessToken: userData.gmail_access_token,
        refreshToken: userData.gmail_refresh_token,
        expiryTime: userData.gmail_token_expiry
      };
    } catch (error) {
      console.error('Error getting Gmail tokens:', error);
      return null;
    }
  }

  async saveGmailTokens(userId, tokens) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expiry: Date.now() + (tokens.expires_in * 1000),
        gmail_configured: true
      });
    } catch (error) {
      console.error('Error saving Gmail tokens:', error);
      throw new Error('Failed to save Gmail configuration');
    }
  }

  async sendEmail(to, subject, body) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let tokens = await this.getGmailTokens(userId);
      if (!tokens) throw new Error('Gmail not configured for this user');

      // Check if token is expired
      if (tokens.expiryTime && Date.now() >= tokens.expiryTime) {
        console.log('Token expired, redirecting to re-authenticate');
        throw new Error('Gmail token expired. Please re-authenticate.');
      }

      // Create email in base64 format
      const email = [
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\r\n');

      const base64Email = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email using Gmail API
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

      // Check if we need to refresh the token
      if (response.status === 401 || response.status === 403) {
        console.log('Token might be expired, redirecting to re-authenticate...');
        throw new Error('Gmail token expired. Please re-authenticate.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to send email: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async initiateGmailAuth() {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Generate random state for security
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('gmail_auth_state', state);

    // Construct OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/gmail/callback`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', this.SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'consent');

    // Redirect to Google's OAuth page
    window.location.href = authUrl.toString();
  }

  async handleGmailCallback(code, state) {
    // Verify state to prevent CSRF
    const savedState = sessionStorage.getItem('gmail_auth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('gmail_auth_state');

    // Check if client secret is available
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error('Google Client Secret not configured. Please contact administrator.');
    }

    // Exchange code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.CLIENT_ID,
        client_secret: clientSecret,
        redirect_uri: `${window.location.origin}/auth/gmail/callback`,
        grant_type: 'authorization_code',
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || errorData.message || 'Failed to exchange code for tokens');
    }

    const tokens = await response.json();
    await this.saveGmailTokens(this.auth.currentUser.uid, tokens);
    return tokens;
  }
}

export const gmailService = new GmailService();
