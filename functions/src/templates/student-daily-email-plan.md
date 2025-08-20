## Student Daily Email – Implementation Plan (Backend + Frontend)

This plan introduces a dedicated student-facing daily email, separate from the parent daily update. It reuses shared infrastructure where appropriate, but keeps identity, preferences, content, and analytics clearly separated to avoid confusion.



### Goals and Non‑Goals
- **Goals**
  - Deliver a concise, student-focused daily email that highlights learning tasks, upcoming due work, reminders, and encouragement.
  - Keep it opt‑in and configurable at class/course and student levels.
  - Provide preview, scheduling, delivery tracking, retry, and analytics.
  - Localize content using existing i18n infrastructure.
- **Non‑Goals**
  - Do not reuse the parent template or delivery settings.
  - Do not change existing parent daily update behavior.





---

### Architecture Overview
- **Template**: `functions/src/templates/studentDailyUpdateEmail.js` (new, student‑centered content, not shared with parent template).
- **Scheduler**: Reuse current scheduling approach (Cloud Scheduler → HTTPS CF or Pub/Sub CF) with a new job/topic for student emails.
- **Services**: Extend existing services with parallel student‑specific paths.
  - `dailyUpdateService` → add student data aggregation method(s).
  - `emailService` / `gmailApiService` → reuse; introduce a distinct sender configuration scope for student emails.
  - `reportDelivery` / `reportDeliveryLogs` → extend to log student deliveries with a distinct recipientType.
- **Frontend**: Extend communication UI with a separate Student Emails tab, and add settings under Settings → Communication.
- **Data**: Store student email preferences alongside existing preferences but avoid reusing parent flags; add explicit `studentDailyEmail` subtree.

---

### Data Model and Config
- **Firestore Documents**
  - `schools/{schoolId}/emailPreferences/global` (or existing preferences doc)
    - `studentDailyEmail.enabled: boolean`
    - `studentDailyEmail.schedule: { timeZone: string, hour: number, minute: number, days: string[] }`
    - `studentDailyEmail.senderProfileId: string` (references a sender profile; OAuth account or SMTP)
    - `studentDailyEmail.localization: { localeFallback: string }`
    - `studentDailyEmail.contentToggles: { assignments: boolean, attendance: boolean, behavior: boolean, reminders: boolean, encouragement: boolean }`
    - `studentDailyEmail.rateLimitPerMinute: number`
    - `studentDailyEmail.batchSize: number` (per invocation)
  - `classes/{classId}/emailPreferences` (optional override)
    - mirror `studentDailyEmail.*` keys to override global
  - `students/{studentId}`
    - `contact.email: string`
    - `preferences.studentDailyEmail.enabled: boolean`
    - `preferences.studentDailyEmail.locale: string` (optional per‑student)
    - `preferences.studentDailyEmail.deliveryWindow: { hour?: number, minute?: number }` (optional)
- **Delivery Logs** (extend existing collection)
  - `emailDeliveries/{deliveryId}`
    - `recipientType: 'student' | 'parent'`
    - `recipientId: studentId`
    - `recipientEmail: string`
    - `template: 'studentDailyUpdate'`
    - `status: 'queued' | 'sent' | 'failed' | 'skipped'`
    - `errorCode?: string` `errorMessage?: string`
    - `traceId: string` (link aggregation to delivery)
    - `scheduledAt`, `sentAt`, `retryCount`

---

### Backend Changes (Cloud Functions)
1. Template
   - Implement `functions/src/templates/studentDailyUpdateEmail.js` exporting:
     - `buildSubject(context): string`
     - `buildHtml(context): string`
     - `buildText(context): string`
     - `allowedContentToggles: string[]`
     - Context includes: `{ student, classContexts[], assignmentsDueSoon[], newGrades[], attendanceSummary, behaviorHighlights, reminders[], encouragement, locale, dateRange }`.

2. Aggregation
   - In `functions/src/services/dailyUpdateService.js` add:
     - `getStudentDailyContext({ schoolId, studentId, date })`
       - Pull from `gradeCalculationService`, `standardsGradingService`, `attendance`, `assignments`, behavior where available.
       - Filter by content toggles and locale.
     - `listEligibleStudents({ schoolId, scheduleContext })` honoring preferences and class overrides.

3. Delivery
   - In `functions/src/services/emailService.js` add a helper:
     - `sendStudentDailyEmail({ to, subject, html, text, senderProfileId, traceId })` (thin wrapper over existing send, but tagged for logs/metrics).
   - In `functions/src/services/reportDelivery.js` and `reportDeliveryLogs.js`:
     - Ensure `recipientType: 'student'` flows through; index by `recipientType + sentAt` for history UI.

4. Scheduling and Execution
   - Add `functions/src/api/emailApi.js` (or extend) with HTTPS endpoints:
     - `POST /email/student/preview` → build preview for a given `studentId` and date (admin/teacher auth only).
     - `POST /email/student/queue` → queue immediate student email(s) for students/class/school.
   - Add scheduled function:
     - `scheduleStudentDailyEmails` (Pub/Sub or Scheduler HTTP) → batches over eligible students using `batchSize`, respects `rateLimitPerMinute`.

5. AuthZ
   - Reuse middleware `middleware/auth.js` for HTTPS APIs; restrict to roles: `admin`, `teacher` with access to target student/class.
   - Scheduled job runs as service account; no end‑user OAuth required.

6. Gmail/SMTP Integration
   - Reuse `gmailApiService.js` and sender profiles (OAuth) or SMTP credentials.
   - Allow selecting a dedicated sender profile for student emails via `studentDailyEmail.senderProfileId`.

7. Localization
   - Use server‑side i18n for static copy fragments to match `locale` (fallback per preferences/global).
   - Keep translations in `public/locales/*/translation.json` synced with template keys.

8. Error Handling and Retries
   - Exponential backoff up to 3 retries per delivery.
   - Classify errors (transient vs permanent), skip invalid emails, log `skipped` with reasons.

9. Observability
   - Structured logs with `traceId`, `recipientId`, and `template`.
   - Metrics: sends, failures, skips, average build time, average send time.

---

### Frontend Changes (React App)
1. Navigation/Pages
   - In `src/components/communication/DailyUpdateManager.jsx` add a new tab: "Student Emails".
   - Alternatively, add a new component `StudentDailyUpdateManager.jsx` for clarity and embed in `AssignmentsGradebookDashboard` where helpful.

2. Settings UI
   - Extend `src/components/settings/DailyEmailPreferences.jsx` or create `StudentEmailPreferences.jsx` with the following controls:
     - Enable/disable student emails.
     - Schedule (time, timezone, days).
     - Sender profile selector (pull from backend profiles).
     - Content toggles.
     - Rate limit and batch size (admin‑only).
   - Wire to Firestore preference docs described above via `emailPreferencesService.js`.

3. Compose and Preview
   - Add preview panel that calls `POST /email/student/preview`.
   - Allow per‑student preview by selecting a student from `StudentContext`.

4. Manual Send/Queue
   - Add actions to queue immediate emails for:
     - Selected student
     - Class/section
     - School (admin)
   - Call `POST /email/student/queue` with appropriate scope.

5. History and Status
   - Extend `src/components/communication/DailyEmailsHistory.js` or create `StudentEmailsHistory.jsx` to filter `recipientType === 'student'` and show timeline, status, and errors.
   - Reuse `EmailStatus.jsx` badges; add `recipientType` filter.

6. Localization
   - Add new keys for student email copy to `public/locales/*/translation.json`.
   - Ensure UI supports locale selection/fallbacks where applicable.

7. Permissions
   - Show student email controls only to roles with permissions (teacher/admin). Hide for others.

---

### Template Content Guidelines (Student‑centric)
- Tone: concise, supportive, actionable.
- Sections (toggleable):
  - Today’s agenda / focus
  - Assignments due soon (+ quick status)
  - New grades/feedback highlights
  - Attendance/participation reminder (if relevant and appropriate)
  - Encouragement / tip of the day
  - Helpful links (resources, office hours)
- Include clear unsubscribe/manage‑preferences link for the student (deep link to portal if applicable).

---

### Security & Privacy
- Only authorized teachers/admins can trigger or preview.
- Emails sent only to verified student addresses.
- No sensitive PII beyond what’s already visible to the student in the app.
- Rate limit send endpoints per user to prevent abuse.

---

### Rollout Plan
1. Implement backend aggregation and template with feature flag off.
2. Ship UI for settings and preview behind role‑restricted flag.
3. Run test pilot with one class; monitor logs and feedback.
4. Gradually enable by grade level or class.

---

### Test Plan
- Unit tests
  - Template builders (subject/html/text) with varied toggles/locales.
  - Aggregation outputs for edge cases (no assignments, missing email).
- Integration tests
  - Preview endpoint with mocked data.
  - Queue endpoint → delivery log entries.
  - Scheduler batch run with rate limits.
- UI tests
  - Preferences form validation and persistence.
  - Preview rendering for selected students and locales.
  - History/status filters by `recipientType: 'student'`.

---

### Implementation Checklist
- Backend
  - [ ] Create `studentDailyUpdateEmail.js` template (subject/html/text).
  - [ ] Add student aggregation in `dailyUpdateService`.
  - [ ] Extend `emailService` send helper tagged for students.
  - [ ] Add preview and queue endpoints.
  - [ ] Add scheduled function for student emails.
  - [ ] Extend delivery logging and indices to include `recipientType: 'student'`.
  - [ ] Add i18n string keys for student copy.
- Frontend
  - [ ] Settings UI for student email preferences.
  - [ ] Student Emails tab/manager with preview and queue actions.
  - [ ] History/status view scoped to students.
  - [ ] Localization updates.
- Ops
  - [ ] Configure Cloud Scheduler job for student emails.
  - [ ] Provision sender profile for student emails.
  - [ ] Dashboards/alerts for send failures.

---

### Notes
- Keep parent and student email code paths, templates, and preferences independent to avoid cross‑impact.
- Aim for shared, well‑named utility functions where overlap is intentional (e.g., date formatting), but avoid shared template logic.



## Implementation Plan (repo-specific, ready to execute)

This plan is tailored to the current codebase. It does not modify or reuse the parent email send path; student emails are fully separate.

### Teacher goals (what students should receive)
- Warm subject line with school and date
- New grades today and short progress status
- Today’s lessons (if enabled by teacher prefs)
- Upcoming assignments within a week
- Today’s attendance status (optional)
- Short encouragement or reminders

Keep copy concise, student-appropriate, and motivational.

### Backend (Cloud Functions)
- Template: keep using `functions/src/templates/studentDailyUpdateEmail.js` (`buildSubject`, `buildHtml`, `buildText`).
- Callables (separate from parents; already supported in this repo):
  - `sendStudentEmails` (callable v2): send to all students with `studentEmail` present for a given date using teacher-provided data sources.
  - `sendStudentEmail` (callable v2): send to a single `studentId`.
- Inputs (from schemas and UI contexts):
  - `students[].studentEmail` is the target address (see `schemas/data-structures.md`).
  - Teacher identity and preferences injected in `dataSources.teacher` and `users/{uid}.studentDailyEmail.*`.
- Validation and logging:
  - Skip students without a valid `studentEmail`.
  - Log deliveries in a dedicated collection `studentDailyEmails` (or reuse `dailyUpdateEmails` with `recipientType: 'student'`).
- Idempotency (recommended):
  - Key per send: `${authUid}:${studentId}:${YYYY-MM-DD}` (collection `studentDailyEmailSends`). If present, skip.
- Optional scheduler (phase 2):
  - `scheduleStudentDailyEmails` triggered by Cloud Scheduler/PubSub, reading `users/{uid}.studentDailyEmail.schedule`.

### Frontend
- Preferences (already present):
  - `src/components/settings/DailyEmailPreferences.jsx` → uses `studentDailyEmail.enabled`, `.schedule`, `.contentToggles` under `users/{uid}`.
- Service layer:
  - `src/services/dailyUpdateService.js`
    - Ensure `prepareDataSources(contexts)` includes `studentEmail` for each student (already added).
    - Use callables:
      - `sendStudentEmailsToAll(contexts, date)` → calls `sendStudentEmails`.
      - `sendDailyUpdateForStudent(studentId, contexts, date)` → calls `sendStudentEmail`.
- UI
  - Keep student actions separate from parent actions in `src/components/communication/DailyUpdateManager.jsx`.
  - Optionally create a dedicated `StudentDailyUpdateManager.jsx` with:
    - Date picker
    - Preview table (student name, email presence, sections previewed)
    - Actions: “Send to All Students with Email”, per-student send
    - Progress and result feedback
  - Use the student template preview (render HTML from `studentDailyUpdateEmail.js`) in a dialog.

### Data and security
- Data sources passed from the page (students, attendance, assignments, grades, behavior, lessons, teacher, schoolName) mirror what parents use, but delivery targets `studentEmail` only.
- Auth required (teacher/admin). For callables, rely on `context.auth`; for HTTPS preview, continue using `middleware/auth.js`.

### Acceptance criteria
- Teacher can enable student emails and set schedule/toggles.
- Teacher can preview and manually send to students for a selected date.
- Only valid `studentEmail` targets are sent; missing/invalid addresses are listed as skipped.
- Parent email sending remains unchanged and unaffected.
- Duplicate student sends prevented within a run via idempotency.

### Test plan
- Unit: template builders for edge cases; validation and idempotency.
- Integration: callables return expected results; logs written with `recipientType: 'student'`.
- UI: preferences persist; preview renders; manual send flows show accurate progress/success/failure counts.

### Rollout
- Phase 1: Manual send from UI, no scheduler.
- Phase 2: Enable scheduler and delivery logs dashboard filtered by `recipientType: 'student'`.
- Phase 3: Localization and analytics enhancements.