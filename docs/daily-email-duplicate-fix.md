## Daily Email Duplicate Sends – Root Cause and Fix Plan

### Summary
- Parents are receiving two identical emails per student when a single send is triggered.
- The primary cause is duplicated recipient addresses in `parentEmails` (e.g., `parentEmail1` and `parentEmail2` contain the same address), combined with backend loops that send to each address without deduplication.
- Secondary UX risk: the UI shows two separate "Send" button groups, which can lead to a second manual trigger if both are clicked. This is not the main cause but can exacerbate the issue.

### Where it happens
- Backend sender loops:
  - `functions/src/api/emailApi.js`
    - `sendDailyUpdates` iterates `update.parentEmails` and sends to each one.
    - `sendStudentDailyUpdate` does the same for a single student.
- Parent emails are sourced from:
  - `functions/src/services/dailyUpdateService.js` → `getParentEmails(student)` returns `[parentEmail1, parentEmail2]` without deduplication or normalization.
- Frontend buttons that can lead to multiple manual triggers:
  - `src/components/communication/DailyUpdateManager.jsx` shows "Send Daily Updates" and "Send to Students" in two places.

### Fixes (Implement all)

1) Backend: Deduplicate recipients per student before sending
   - In both `sendDailyUpdates` and `sendStudentDailyUpdate` (file: `functions/src/api/emailApi.js`), normalize and deduplicate the recipient list before iterating.
   - Implementation pattern:
     - Normalize: trim and lowercase emails
     - Filter out falsy/empty
     - Use `Set` for uniqueness

   Example edit inside each function before the send loop:
   ```js
   const uniqueRecipients = Array.from(
     new Set((update.parentEmails || [])
       .filter(Boolean)
       .map(e => e.trim().toLowerCase()))
   );
   for (const parentEmail of uniqueRecipients) {
     await emailService.sendEmail({ to: parentEmail, subject: emailContent.subject, html: emailContent.html }, authUid);
     emailsSent++;
   }
   ```

   And for the single-student path (`req.user?.uid`/`auth.uid` as applicable):
   ```js
   const uniqueRecipients = Array.from(
     new Set((dailyUpdate.parentEmails || [])
       .filter(Boolean)
       .map(e => e.trim().toLowerCase()))
   );
   for (const parentEmail of uniqueRecipients) { /* send */ }
   ```

2) Backend: Return unique recipients from the data service
   - In `functions/src/services/dailyUpdateService.js`, change `getParentEmails(student)` to deduplicate and normalize.
   - Replace the function body with:
   ```js
   const emails = [student.parentEmail1, student.parentEmail2]
     .filter(Boolean)
     .map(e => e.trim())
     .filter(e => e.length > 0);
   return Array.from(new Set(emails.map(e => e.toLowerCase())));
   ```

   This ensures previews and downstream logic consistently reflect the unique recipient list.

3) Frontend: Separate parent vs student sends and reduce accidental double triggers
   - `src/components/communication/DailyUpdateManager.jsx` shows action buttons in two places. Keep only the bottom `CardActions` set, or ensure one set is hidden at all times.
   - Ensure "Send Daily Updates" calls the parent-send callable only. Make "Send to Students" call the student-send callable (to students' `studentEmail`) and never reuse the parent send path.
   - If keeping both button groups, ensure the alternative set remains disabled/hidden using the current tab state and add a global in-flight guard to block a second trigger while `sending` is true.

4) Optional robustness: Delivery idempotency (skip already-sent)
   - For strong guarantees, add an idempotency check before sending:
     - Create a deterministic key per user/day/student: `${authUid}:${studentId}:${dateString}`.
     - Write a doc in `dailyUpdateSends/{key}` with status when beginning a send (use `create` in a transaction to avoid races). If doc exists, skip.
     - This prevents accidental repeated sends across processes or double clicks.

### Test Plan
- Unit-level
  - Given `parentEmail1 = "parent@example.com"` and `parentEmail2 = "parent@example.com"`, `getParentEmails` returns a single address.
  - Backend `sendDailyUpdates` sends exactly once per parent per student.
- Manual
  - Use Daily Update preview where a student has identical parent emails.
  - Trigger "Send Daily Updates" once → verify a single message per parent in SMTP/Gmail logs.
  - Trigger again immediately → if idempotency is implemented, verify no second send; otherwise, expect second send as designed.

### Files to edit
- `functions/src/api/emailApi.js` (deduplication in both senders)
- `functions/src/services/dailyUpdateService.js` (`getParentEmails` normalization/dedup)
- `src/components/communication/DailyUpdateManager.jsx` (separate parent vs student sends, remove/guard duplicate button groups)

### Rollout notes
- These changes are backwards-compatible and affect only recipient handling and UI ergonomics.
- No schema changes required unless implementing idempotency; that adds a new collection.


