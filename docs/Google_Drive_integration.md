# Google Drive Integration – Complete, Safe, Non‑Invasive Implementation Plan (No App‑Breaking Changes)

This plan adds an optional Google Drive file picker to your app without touching existing Gmail email/OAuth logic. It is additive, behind user gating, and fully reversible. It includes detailed backend/frontend contracts, data fields, environment variables, flows, test cases, and rollout guidance. No executable source code is included.

---

## Guardrails (cannot break current app)
- Do not modify existing Gmail OAuth routes, scopes, or tokens.
- Add Drive as a separate, optional integration with its own auth start/callback endpoints and the single scope `https://www.googleapis.com/auth/drive.readonly`.
- UI is gated by both environment config and a per‑user flag `users/{uid}.drive_configured === true`.
- All Drive API is isolated under `/api/drive/*` and requires Firebase Auth.
- If Drive is not connected or unavailable, the feature stays hidden or shows a small non‑blocking prompt.
- Rollback: remove `/api/drive` router usage and hide the UI trigger; nothing else changes.

---

## Prerequisites
- Google Cloud: Enable “Google Drive API” in the same project as Gmail.
- OAuth consent screen: Add the scope `.../auth/drive.readonly` to allowed scopes (does not change Gmail flows).
- Redirect URI(s): Ensure your existing authorized redirect URIs include the Drive callback URL path you will use (same domain as Gmail if desired).

Implementation notes
- If you currently host APIs in Firebase Functions (Express on Functions), mount a new router under `/api/drive` rather than mixing routes into Gmail handlers.
- For non-Firebase backends, mirror the same routes and auth checks; all client contracts remain identical.

---

## Environment and Configuration
- Frontend
  - `VITE_API_BASE_URL` (string): Base URL for your Cloud Functions API (e.g., `https://<region>-<project>.cloudfunctions.net` or your Express hosting URL). If missing, the UI hides Drive features.
- Backend (Functions runtime)
  - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` (already present for Gmail; reused to create OAuth clients). No renaming. Drive uses the same OAuth client unless you prefer a separate one.
- CORS allowlist
  - Keep or extend your existing allowlist. Do not allow `*`. Include staging and production origins explicitly.

Additional backend config (exact names)
- `DRIVE_REDIRECT_PATH` (default `/api/drive/auth/callback`)
- `OAUTH_STATE_SECRET` (random 32+ chars used to HMAC state param)
- `DRIVE_RATE_LIMIT_PER_MINUTE` (default `60`)
- `DRIVE_FILES_PAGE_SIZE_MAX` (default `50`)

---

## Data Model (Firestore)
- `users/{uid}` updates (set by Drive callback if successful)
  - `drive_configured: boolean` (true after a valid token exchange)
  - `integrations.drive`: optional nested object for safer separation from Gmail fields
    - `access_token: string` (optional to store; refresh tokens suffice when using Google SDK refresh flow)
    - `refresh_token: string` (required for long‑lived access)
    - `token_expiry: number|timestamp` (optional)
    - `last_connected: timestamp`
- No changes to existing Gmail fields. Do not reuse or overwrite `gmail_*` keys.
- No Firestore security rules changes required (tokens are read/written server‑side only).

Example user document (server-managed fields only)
```json
{
  "drive_configured": true,
  "integrations": {
    "drive": {
      "refresh_token": "1//0g...", 
      "token_expiry": 1723598400000,
      "last_connected": "2025-08-20T12:34:56.000Z"
    }
  }
}
    ```

---

## Backend (Functions) – Endpoints and Responsibilities

All routes require Firebase Auth via existing middleware. Mount under `/api/drive` to keep complete isolation.

1) Auth – Start
- Method/Path: `GET /api/drive/auth/start`
- Auth: Required (Firebase ID token)
- Purpose: Generate the Google OAuth URL for `drive.readonly` and redirect user to Google consent.
- Query params: optional `redirect` to return to a specific app page after callback
- Response: HTTP 302 redirect to Google OAuth URL
- Failure modes: 401 if unauthenticated; 500 for unexpected errors (logged).

Request/Response example
- Request: `GET /api/drive/auth/start?redirect=%2Fsettings%3Fintegrations%3Ddrive`
- Response: `302 Location: https://accounts.google.com/o/oauth2/v2/auth?...&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly&state=<hmacState>`

2) Auth – Callback
- Method/Path: `GET /api/drive/auth/callback`
- Auth: Not required (Google redirects back without Firebase token). Use state or session to map to user; validate CSRF state and exchange code for tokens.
- Purpose: Exchange `code` for tokens; persist `integrations.drive.*`, set `drive_configured: true` on `users/{uid}`.
- Response: HTTP 302 redirect to the app (to the provided `redirect` or a default settings page) with a success indicator.
- Failure modes: If token exchange fails, do not write to Firestore; redirect with an error indicator. Log reason without PII.

State mapping and CSRF notes
- Sign the `state` with `OAUTH_STATE_SECRET` including: `{ uid, redirect, nonce, ts }`.
- Reject if timestamp skew > 10 minutes or signature invalid.
- On success, write tokens scoped to the user from `uid` inside state payload.

3) Files – List
- Method/Path: `GET /api/drive/files`
- Auth: Required (Firebase ID token)
- Purpose: Return the user’s Drive files with minimal metadata (read‑only).
- Query params:
  - `q` (string, optional): search query. Default filters out folders: `mimeType != 'application/vnd.google-apps.folder'`.
  - `pageSize` (int, optional, 1..50; default 25)
  - `pageToken` (string, optional): for pagination
- Response (200 JSON):
  - `files[]`: `{ id, name, mimeType, iconLink, webViewLink }`
  - `nextPageToken?: string`
- Failure modes:
  - 403: user not connected (`drive_configured !== true` or tokens missing/invalid)
  - 429/5xx: Google quota or server errors – return 502 with `{ error: 'upstream_error', retryAfter?: seconds }`
  - 400: invalid params (pageSize out of bounds, etc.)

Example
```
GET /api/drive/files?q=math%20worksheet&pageSize=25
Authorization: Bearer <firebaseIdToken>
```
Response
```json
{
  "files": [
    {
      "id": "1a2b3c",
      "name": "Math Worksheet Unit 2.pdf",
      "mimeType": "application/pdf",
      "iconLink": "https://drive-thirdparty.googleusercontent.com/...",
      "webViewLink": "https://drive.google.com/file/d/1a2b3c/view"
    }
  ],
  "nextPageToken": "AOEd..."
}
```

Shared Backend Behaviors
- Token handling: Use stored refresh token; Google SDK will refresh access tokens as needed. On refresh failure, unset `drive_configured` and return 403 with a “Reconnect Drive” message.
- Rate limiting: Basic per‑user token bucket (e.g., max N requests/min) to protect quotas.
- Logging (no PII): `userId`, route, duration, status code, error class. Avoid logging file names.
- Timeouts: Upstream calls capped (e.g., 10s) and surfaced as 504/502 with safe messages.
- CORS: Restrict to known origins only.

Concrete limits and defaults
- Rate limit: `DRIVE_RATE_LIMIT_PER_MINUTE` default 60/min per user; `HTTP 429 { error: 'rate_limited', retryAfter }`.
- Timeout to Google: 10s; abort and return `502 { error: 'upstream_error' }`.
- Page size clamp: 1..`DRIVE_FILES_PAGE_SIZE_MAX` (default 50); if outside → `400 { error: 'invalid_parameters' }`.

---

## Frontend – Feature Gating and UX

Gating Conditions (all must be true to show the picker trigger)
- `auth.currentUser` exists
- `users/{uid}.drive_configured === true` (from Firestore user doc you already read in `AuthContext`)
- `VITE_API_BASE_URL` is defined

API Client (no breaking behavior)
- Service wrapper: `src/services/driveService.js`
  - Always attach Firebase ID token in the `Authorization: Bearer <token>` header
  - `getDriveFiles({ search, pageSize, pageToken })`
    - Calls `GET /api/drive/files`
    - Debounce search input by 500–800ms in UI to reduce load
  - Error handling: if 401/403, surface a small prompt “Connect Drive” and never crash

Client contract (TypeScript-like signature)
```ts
type DriveListParams = { search?: string; pageSize?: number; pageToken?: string };
type DriveFile = { id: string; name: string; mimeType: string; iconLink?: string; webViewLink: string };
async function getDriveFiles(p?: DriveListParams): Promise<{ files: DriveFile[]; nextPageToken?: string }>
```

UI Components
- `src/components/GoogleDrivePicker.jsx` (lazy‑loaded via dynamic import)
  - Modal with search, paginated list, error/empty states, and a Cancel button
  - Each item shows icon + name and invokes `onFileSelect(webViewLink)` on click
  - Accessibility: focus trap in modal, keyboard navigation, `aria-*` labels
  - Styles: co‑located CSS or CSS module to avoid global collisions
- Optional “Connect Drive” CTA
  - If user presses it, navigate to `/api/drive/auth/start` (opens a popup or redirects)
  - After callback, UI reads updated `drive_configured` and reveals the picker

Component skeletons (props)
```tsx
// src/components/GoogleDrivePicker.jsx
export function GoogleDrivePicker({ open, onClose, onFileSelect }: { open: boolean; onClose: () => void; onFileSelect: (url: string) => void })
```

Lazy loading
```ts
// Where used
const DrivePicker = React.lazy(() => import('../components/GoogleDrivePicker'));
```

Integration Points
- Lesson editor (or any form): show “Add from Drive” only when the picker is available per gating above. On selection, store `attachmentUrl = webViewLink` (no schema change if you already have such a field).
- Offline behavior: Show “Couldn’t load files. Try again.” and keep the rest of the page functional.

Empty/Loading/Error States
- Loading: spinners/skeletons inside modal list
- Empty: “No files found.”
- Errors: inline, non‑blocking; include a button to retry

---

## Security and Privacy
- Least privilege: only `drive.readonly` scope
- Token storage: server‑side only, under `users/{uid}.integrations.drive` (never sent to the client)
- Secrets: reuse existing `GMAIL_CLIENT_ID/SECRET`; do not hardcode in repo; managed via Functions config/env
- PII: do not log file names/URLs; only log counts and status codes
- Abuse prevention: per‑user rate limit, debounce, pagination caps, restricted CORS

Validation and hardening
- Validate `state` HMAC and timestamp in callback; reject mismatches.
- Store only `refresh_token` server-side; ephemeral access tokens in memory/secret manager.
- Do not expose Drive tokens to clients. Never proxy file contents; only return minimal metadata and `webViewLink`.

---

## Error Classes and Responses (Backend)
- 401 unauthenticated: `{ error: 'unauthenticated' }`
- 403 not connected/invalid tokens: `{ error: 'drive_not_connected', action: 'connect_drive' }`
- 400 bad request: `{ error: 'invalid_parameters', details?: { ... } }`
- 429 rate limited: `{ error: 'rate_limited', retryAfter: <seconds> }`
- 502 upstream error (Google): `{ error: 'upstream_error' }`
- 500 internal: `{ error: 'internal_error' }`

Error mapping guidance
- Google `401/403` during refresh → unset `drive_configured`, respond `403 drive_not_connected`.
- Google `429` → respond `502 upstream_error` and include `retryAfter` if provided.
- Axios/Fetch timeout/Error → `502 upstream_error`.

---

## Monitoring and Metrics
- Metrics to track
  - Auth starts/callback success rate
  - Files list requests: count, latency, error rates per class
  - User adoption: number of users with `drive_configured === true`
- Dashboards
  - Build basic charts in your logging platform for the above metrics
- Alerts
  - High 5xx or 502 rates on `/api/drive/files`
  - Sudden drop in callback success rate

Suggested log fields (no PII)
```json
{ "route": "/api/drive/files", "userId": "uid", "latencyMs": 123, "status": 200, "errorClass": null }
```

---

## QA / Test Plan

Unit
- Drive service token creation errors → returns controlled 403
- Query param validation on `/files`

Integration (backend)
- `/auth/start` redirects to Google with correct scope and state
- `/auth/callback` stores tokens and sets `drive_configured: true`
- `/files` returns files with defaults, honors `q`, `pageSize`, and `pageToken`
- Token refresh failures unset `drive_configured` and return 403

Integration (frontend)
- Gating: picker hidden unless all conditions met
- Debounced search; error/empty/loading states render correctly
- “Connect Drive” flow updates the UI after callback

E2E Scenarios
- New user (not connected) → hidden picker; CTA shown in settings
- Connect, then open picker → select a file → attachment URL appears in form
- Revoke Drive or expire tokens → server 403; UI prompts reconnection
- Offline → API errors handled without page crashes

Negative and edge cases
- Invalid `state` → callback rejects, user sees error banner and can retry.
- pageSize > max or < 1 → 400, UI shows inline validation.
- Google API partial outage → list shows error with retry; bottom sheet stays responsive.

---

## Rollout Strategy
- Stage in a non‑production environment first; verify all acceptance criteria
- Gradual enablement: expose the UI trigger to a small cohort (e.g., teachers in one class)
- Monitor quotas/latency and error rates before wider rollout

Rollback
- Remove router mount `/api/drive` and hide UI trigger; feature disappears without side effects

Feature flagging
- Gate the UI with both `VITE_API_BASE_URL` and `users/{uid}.drive_configured`.
- For staged rollout, also add a remote-config boolean `enableDrivePicker` and check it in UI before showing triggers.

---

## Phased Implementation Plan

Phase 0 – Preparation (no code risk)
- Confirm Drive API enabled, consent screen has `drive.readonly` scope
- Add OAuth redirect URI for Drive callback
- Set backend config: `OAUTH_STATE_SECRET`, limits (rate limit, page size)
- Add remote flag `enableDrivePicker` (optional)

Phase 1 – Backend Scaffolding (isolated; Gmail untouched)
- Create `/api/drive` router and mount it (no logic yet)
- Implement `/auth/start` generating URL + signed state (no DB writes)
- Add rate limiter and timeouts; add structured logging (no PII)

Phase 2 – OAuth Callback + Token Persistence
- Implement `/auth/callback` with HMAC state validation
- Exchange code → tokens; write `users/{uid}.integrations.drive.*`, `drive_configured: true`
- On failure: redirect with error; do not write tokens

Phase 3 – Files Listing Endpoint (read-only)
- Implement `GET /api/drive/files` with param validation and clamps
- Use refresh token → access token via Google SDK; map upstream errors to plan’s error classes
- Add per-user rate limit and latency logging

Phase 4 – Frontend Gating + Service Client
- Add `driveService.getDriveFiles()` using `Authorization: Bearer <idToken>`
- Gate UI on `auth.currentUser`, `drive_configured`, `VITE_API_BASE_URL`, and optional `enableDrivePicker`
- Add “Connect Drive” CTA → `/api/drive/auth/start`

Phase 5 – Picker UI (Lazy-loaded)
- Build `GoogleDrivePicker` modal with search, pagination, loading/empty/error states
- Debounce search inputs (500–800ms); basic retry for transient errors
- Accessibility: focus trap, keyboard navigation, `aria-*`

Phase 6 – Integration Points + UX Polish
- Add “Add from Drive” button in target editor(s); set `attachmentUrl = webViewLink`
- Handle offline gracefully; never crash surrounding page
- Add skeletons and minimal telemetry (open/cancel/select counts)

Phase 7 – QA, Staging, and Pilot
- Run unit/integration tests (backend and frontend)
- Stage: validate acceptance criteria; verify Gmail flows are unchanged
- Pilot with a small cohort via feature flag; monitor errors, latency, adoption

Phase 8 – Gradual Rollout and GA
- Increase cohort size; watch dashboards and alerts
- GA when error budgets and performance targets are met
- Keep rollback path documented (remove router + hide triggers)

---

## Implementation Checklist (Copy/Paste for Tasks)

Backend
- [ ] Create Drive auth service (start/callback) – separate from Gmail
- [ ] Add `/api/drive/auth/start` + `/api/drive/auth/callback` routes
- [ ] Add `/api/drive/files` read‑only route with pagination/search
- [ ] Implement token refresh handling and 403 on failure
- [ ] Add per‑user rate limiting and timeouts
- [ ] Add restricted CORS entries for staging/prod
- [ ] Structured logging without PII

Concrete backend tasks (files/dirs)
- [ ] `functions/src/api/drive/index.js` (Express Router: mount start/callback/files)
- [ ] `functions/src/services/googleDriveService.js` (OAuth client + listFiles)
- [ ] `functions/src/middleware/requireAuth.js` (reuse existing)
- [ ] `functions/src/utils/rateLimiter.js` (token bucket per uid)
- [ ] Add mount in `functions/src/index.js`: `app.use('/api/drive', driveRouter)`

Frontend
- [ ] Add `driveService` client wrapper; use `VITE_API_BASE_URL`
- [ ] Lazy‑load `GoogleDrivePicker` and scope CSS
- [ ] Gate UI by `drive_configured` + env presence
- [ ] Debounce search; handle loading/empty/error/offline
- [ ] Integrate picker with lesson editor (store webViewLink)
- [ ] Optional: “Connect Drive” CTA in settings

Concrete frontend tasks (files/dirs)
- [ ] `src/services/driveService.js` (REST client)
- [ ] `src/components/GoogleDrivePicker.jsx` (modal picker, lazy-loaded)
- [ ] Add trigger in `src/components/.../EnhancedAssignmentForm.jsx` or relevant editor: “Add from Drive” button when gated
- [ ] Optional settings entry in `src/pages/Settings.js`: connect Drive CTA

Ops
- [ ] Enable Drive API, confirm scope on consent screen
- [ ] Add/verify OAuth redirect URI for drive callback
- [ ] Configure monitoring dashboards and alerts
- [ ] Stage, test, and roll out gradually

Acceptance criteria (must be true before GA)
- [ ] No errors in logs during normal flows for 7 days in staging
- [ ] 99% of `/files` calls < 1s p95 in staging
- [ ] < 0.5% 5xx (including upstream mapped 502) on `/files` during pilot

---

## Final Notes
- This plan is intentionally additive and isolated. If never enabled, the app behaves exactly as it does today.
- If enabled, the feature degrades gracefully and is easy to roll back without touching Gmail or parent features.