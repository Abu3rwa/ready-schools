# Plan to Modularize `studentDailyUpdateEmail.js`

This document outlines the plan to refactor the large `studentDailyUpdateEmail.js` file into smaller, more manageable modules within the `functions/src/templates/student_daily_update_email_template` directory. The goal is to improve readability, maintainability, and reusability without breaking existing functionality.

## Current File: `functions/src/templates/studentDailyUpdateEmail.js`

## New Directory Structure:
`functions/src/templates/student_daily_update_email_template/`
├── `MODULARIZATION_PLAN.md`
├── `contextNormalization.js`
├── `htmlUtilities.js`
├── `lessonFormatters.js`
├── `characterTraitHelpers.js`
├── `contentToggles.js`
├── `subjectBuilder.js`
├── `textBuilder.js`
├── `htmlBuilder.js`
└── `mainTemplate.js` (new entry point)

## Modularization Steps:

1.  **Create `contextNormalization.js`**:
    *   Move the `normalizeContext` function to this file.
    *   Export `normalizeContext`.

2.  **Create `htmlUtilities.js`**:
    *   Move `safe`, `formatList`, and `getGradeColor` functions to this file.
    *   Export these functions.

3.  **Create `lessonFormatters.js`**:
    *   Move `formatLessons` and `formatIndividualLesson` functions to this file.
    *   Export these functions.
    *   Import `safe` from `htmlUtilities.js`.

4.  **Create `characterTraitHelpers.js`**:
    *   Move `getBuiltInQuotes` and `getBuiltInChallenges` functions to this file.
    *   Export these functions.
    *   Import `dayjs` and `dayOfYear` plugin.
    *   Import `getCurrentMonthTrait`, `getDailyQuote`, `getDailyChallenge` from `../services/characterTraitsService.js`.

5.  **Create `contentToggles.js`**:
    *   Move `allowedContentToggles` and `studentAllowedContentToggles` to this file.
    *   Export these constants.

6.  **Create `subjectBuilder.js`**:
    *   Move `buildSubject` function to this file.
    *   Export `buildSubject`.
    *   Import `dayjs` from `dayjs`.
    *   Import `normalizeContext` from `contextNormalization.js`.

7.  **Create `textBuilder.js`**:
    *   Move `buildText` function to this file.
    *   Export `buildText`.
    *   Import `normalizeContext` from `contextNormalization.js`.

8.  **Create `htmlBuilder.js`**:
    *   Move `buildHtml` function and all its internal helper functions (`getPersonalizedContent`, `getPersonalizedTheme`, `gradesSummary`, `computeAverage`, `progressMeter`, `achievementBadges`, `focusTip`, `motivation`, `formatGrades`, `formatAssignmentsDueSoon`, `formatBehavior`, `formatAttendance`, `formatReminders`, `encouragementBlock`, `todaysChallenge`) to this file.
    *   Export `buildHtml`.
    *   Update all internal references to use the new modularized imports.
    *   Import `dayjs`, `dayOfYear` plugin.
    *   Import `sanitizeHtml` from `sanitize-html`.
    *   Import `normalizeContext` from `contextNormalization.js`.
    *   Import `safe`, `formatList`, `getGradeColor` from `htmlUtilities.js`.
    *   Import `formatLessons`, `formatIndividualLesson` from `lessonFormatters.js`.
    *   Import `getCurrentMonthTrait`, `getDailyQuote`, `getDailyChallenge` from `../services/characterTraitsService.js`.
    *   Import `getBuiltInQuotes`, `getBuiltInChallenges` from `characterTraitHelpers.js`.

9.  **Create `mainTemplate.js`**:
    *   This file will serve as the new entry point for the email template.
    *   Import `buildSubject`, `buildHtml`, `buildText` from their respective new modules.
    *   Import `allowedContentToggles` from `contentToggles.js`.
    *   Re-export `buildSubject`, `buildHtml`, `buildText`, and `allowedContentToggles`.
    *   Re-export `buildStudentDailyEmailTemplate` which will now import `buildSubject`, `buildHtml`, `buildText` from this new `mainTemplate.js`.

10. **Update Original `studentDailyUpdateEmail.js`**:
    *   Modify `functions/src/templates/studentDailyUpdateEmail.js` to import and re-export everything from `mainTemplate.js`. This ensures backward compatibility for existing callers.

11. **Verification**:
    *   Ensure all existing tests and functionalities related to `studentDailyUpdateEmail.js` continue to work as expected.
    *   Manually test email generation with various contexts to confirm correct rendering and data population.

This modularization will make the code easier to navigate, test, and extend in the future.