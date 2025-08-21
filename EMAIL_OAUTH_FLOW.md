## Gmail Email Sending with OAuth2 – End-to-End Flow

### Overview
- User clicks Connect Gmail → redirected to Google OAuth.
- After consent, Google redirects back to your app.
- Frontend sends the authorization code to a secure backend endpoint.
- Backend exchanges the code for tokens and stores them in Firestore.
- Emails are sent using the Gmail API with the stored access token.
- Tokens are refreshed automatically before they expire.

### Components
- Frontend (React)
  - `src/services/gmailService.js`
    - `initiateGmailAuth()`: Builds Google OAuth URL with scopes, `access_type=offline`, `prompt=consent` and redirects the browser.
    - `handleGmailCallback(code, state)`: Sends `code`, `state`, and `userId` to backend OAuth callback endpoint.
    - `getGmailTokens(userId)`: Reads token status from Firestore; calls backend refresh when near expiry.
- Backend (Cloud Functions)
  - `functions/src/api/emailApi.js`
    - `handleGmailOAuthCallback` (HTTP): Exchanges `code → tokens`, writes to Firestore.
    - `refreshGmailTokens` (HTTP): Exchanges `refresh_token → new access_token`, updates Firestore.

### OAuth Flow
1. Frontend builds OAuth URL (`https://accounts.google.com/o/oauth2/v2/auth`)
   - Scopes: Gmail send scope(s) as defined in `gmailService.js`.
   - Ensures: `access_type=offline`, `prompt=consent`, and a cryptographic `state`.
2. Redirect URI
   - Server derives the final redirect URI from `APP_URL`: `${APP_URL}/auth/gmail/callback`.
   - Frontend no longer sends `redirect_uri`; backend owns it to avoid drift.
3. Backend token exchange
   - Endpoint: `handleGmailOAuthCallback` (2nd‑gen URL)
   - Calls `https://oauth2.googleapis.com/token` with `code`, `client_id`, `client_secret`, and redirect URI.
   - On success, persists tokens and status to `users/{uid}`.

### Sending Email (Gmail API)
- Frontend path
  - `gmailService.sendEmail(...)` uses `gmail.googleapis.com` with `Authorization: Bearer <access_token>`.
  - If a 401/403 occurs, the client triggers re-auth or relies on refresh flow.
- Backend path (optional)
  - `functions/src/services/gmailApiService.js` (pattern from `o/`) shows a server‑side Gmail client using `googleapis` that auto‑refreshes.

### Token Refresh
- Proactive refresh policy
  - Frontend detects tokens expiring within ~5 minutes and calls:
    - `refreshGmailTokens` (2nd‑gen URL)
- Backend refresh endpoint
  - Exchanges `refresh_token` → new `access_token` via Google token endpoint.
  - Updates Firestore:
    - `gmail_access_token`, `gmail_token_expiry`, clears error fields, updates `gmail_token_last_refresh`.

### Firestore Writes (users/{uid})
- On successful OAuth callback:
  - `gmail_access_token`
  - `gmail_refresh_token` (first consent or when Google returns it)
  - `gmail_token_expiry` (ms epoch)
  - `gmail_configured: true`
  - Clears error fields: `gmail_token_error(_time)`, `gmail_last_error(_time)`
  - `gmail_token_last_refresh` (ISO timestamp)

### Endpoints (2nd‑gen URLs)
- OAuth callback: `https://handlegmailoauthcallback-jhyfivohoq-uc.a.run.app`
- Token refresh: `https://refreshgmailtokens-jhyfivohoq-uc.a.run.app`
- Note: URLs may change after redeploy; prefer using environment-configurable constants in the client.

### Environment Variables (Functions)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL` (e.g., `http://localhost:3000` in dev; prod site URL in production)
- `ALLOWED_ORIGINS` (comma‑separated; e.g., `http://localhost:3000,https://smile3-8c8c5.firebaseapp.com`)

### CORS & Security
- CORS set to allowed origins only; `OPTIONS` preflight supported.
- State parameter validated on frontend before sending to backend.
- Client secret never present in frontend; all exchanges on backend.

### How to Test Quickly
1. Click Connect Gmail → finish Google consent.
2. In DevTools → Network, ensure POST to OAuth callback returns 200.
3. Check Firestore `users/{uid}` fields listed above.
4. Send a test email; if 401/403, verify refresh endpoint and token timing.

### Troubleshooting
- “Failed to fetch” on callback
  - Verify client calls the `*.a.run.app` URL; check CORS and origin.
  - Ensure `APP_URL` and Google Console redirect URI match.
- No `refresh_token`
  - Repeat consent once with `prompt=consent` and `access_type=offline`.
- Fields not updating
  - Check Cloud Function logs for callback errors; confirm `userId` and `code` are sent.
