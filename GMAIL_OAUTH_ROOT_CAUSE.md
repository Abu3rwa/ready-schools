## Gmail OAuth: Root Cause & Problematic Files

### Main issue
- **Mismatched OAuth endpoints and redirect URIs between frontend and backend**, especially on localhost, caused the OAuth callback POST to fail (browser showed “Failed to fetch”).
- **Legacy function URL** was used in the frontend while the function was deployed as a 2nd‑gen Run service (different URL).
- **Backend redirect_uri was hardcoded** and didn’t always match the frontend origin during local runs.
- **CORS headers were missing** on the callback endpoint, blocking the browser request.
- Security concern: a **client secret was briefly exposed in frontend** during a previous iteration (now removed).

### Primary symptoms
- UI kept showing “Connect Gmail”.
- Console: `Error handling Gmail callback: TypeError: Failed to fetch`.
- Firestore user doc stayed with `gmail_configured: false` and tokens null.

### Contributing factors
- Different redirect URIs for local vs prod.
- Frontend called the legacy `cloudfunctions.net` URL while the deployed function lived at a `run.app` URL.
- CORS not set on the HTTP function for browser calls from localhost.
- Inconsistent token/config checks (flag vs tokens) increased confusion.

### Problematic files and functions
- `src/services/gmailService.js`
  - `handleGmailCallback(...)`: Was posting to old endpoint; needed to call the deployed 2nd‑gen URL and include dynamic `redirect_uri`.
  - `getGmailTokens(...)`: Previously allowed inconsistency between `gmail_configured` and actual tokens.
  - `refreshGmailTokens(...)` call site: Needed correct function URL.
- `functions/src/api/emailApi.js`
  - `handleGmailOAuthCallback(...)`: Needed to accept a dynamic `redirect_uri`, use correct env vars, and return proper CORS headers.
  - `refreshGmailTokens(...)`: Added to centrally refresh tokens; also needed CORS.
- `functions/src/index.js`
  - Ensure exports included `refreshGmailTokens` and the OAuth callback.
- `src/contexts/GmailContext.js`
  - Uses `gmailService.handleGmailCallback`; surfaced failures from endpoint mismatch.
- `src/components/email/GmailSetup.jsx`
  - UX surfaced stale state; added manual refresh helped debugging.
- `reset-gmail-config.js`
  - Initial invocation pattern mismatched function type; fixed to direct HTTP.

### Fixes applied
- Frontend now calls the 2nd‑gen function URLs:
  - OAuth callback: `https://handlegmailoauthcallback-jhyfivohoq-uc.a.run.app`
  - Token refresh: `https://refreshgmailtokens-jhyfivohoq-uc.a.run.app`
- Backend `handleGmailOAuthCallback`:
  - Accepts `redirect_uri` from request; defaults to localhost in dev.
  - Uses `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars.
  - Adds CORS headers and handles OPTIONS preflight.
- Added `refreshGmailTokens` function with CORS and Firestore updates.
- Removed exposed client secret from frontend; OAuth handled server‑side only.
- `getGmailTokens` now respects `gmail_configured` and proactively refreshes tokens (via backend) when near expiry.

### What to verify
- Run OAuth locally → POST to `handlegmailoauthcallback-...a.run.app` should return 200.
- Firestore `users/{uid}` updates: `gmail_access_token`, `gmail_refresh_token` (first grant), `gmail_token_expiry`, `gmail_configured: true`.
- Subsequent Gmail API calls succeed; auto‑refresh triggers before expiry.

### Notes
- Always keep redirect URIs aligned (Google console, frontend origin, backend token exchange).
- Use backend for all sensitive OAuth operations; never place secrets in frontend.
- Prefer 2nd‑gen function URLs (`*.a.run.app`) in the client for HTTP calls to deployed functions.

### Solutions and Implementation Plan

#### Phase 1 – Security and Endpoint Alignment (done)
- Use 2nd‑gen function URLs in client:
  - OAuth callback: `https://handlegmailoauthcallback-jhyfivohoq-uc.a.run.app`
  - Token refresh: `https://refreshgmailtokens-jhyfivohoq-uc.a.run.app`
- Backend-only token exchange; remove client secret from frontend.
- Add CORS headers and OPTIONS handling on OAuth endpoints.
- Accept `redirect_uri` in request; default to `http://localhost:3000/auth/gmail/callback` for dev.

#### Phase 2 – Robust OAuth (next)
- Configure env vars in Functions: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`.
- Derive redirect URI on the server from `APP_URL` to avoid client drift.
- Implement PKCE and strict state verification (cryptographically strong random state).
- Restrict CORS to known origins (localhost and production domains) instead of `*`.

#### Phase 3 – Token Lifecycle & UX
- Centralize token refresh on backend; proactive refresh 5–10 minutes before expiry.
- Add a refresh mutex to avoid concurrent refresh races.
- Standardize error surfaces to UI (expired/invalid tokens → clear guidance to re-auth).
- Context subscribes to Firestore user doc to avoid stale Gmail status in UI.

#### Phase 4 – Reliability & Monitoring
- Add structured logging around OAuth exchanges and refresh outcomes.
- Quota/rate handling with retry + exponential backoff; circuit breaker for repeated failures.
- SMTP fallback toggles and analytics on send success/failure rates.

Ownership and next steps:
- Backend: finalize env setup and PKCE/state enforcement.
- Frontend: remove redirect URI construction logic; trust server; keep "Refresh Status" and clear error banners.
- Verify end-to-end: run OAuth, confirm Firestore tokens + `gmail_configured: true`, send test email.
