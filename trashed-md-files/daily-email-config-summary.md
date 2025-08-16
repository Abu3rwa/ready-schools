# Daily Email Configuration - Summary

What was added

- Teacher-configurable daily email settings in Settings → Email Settings:
  - School Name
  - Subject Template with tokens: {School}, {Student}, {Date}
  - Section toggles: attendance, grades, behavior, activities, upcoming, subject grades
- Backend now honors these settings for daily updates:
  - Subject template applied per email
  - School name and section toggles passed to the HTML builder
- Preview and manual compose updated:
  - DailyUpdateManager preview uses your School Name
  - Compose in Email History uses School/Teacher names from your profile

How to use

1. Open Settings → Email Settings → Daily Email Preferences.
2. Set your School Name and customize the Subject Template.
3. Toggle sections you want included.
4. Save. These preferences are stored in `users/{uid}`.
5. Use Communication → Daily Updates to preview/send. The backend uses your preferences automatically.

Data model

- users/{uid}
  - `school_name: string`
  - `dailyEmailSubjectTemplate: string`
  - `dailyEmailIncludeSections: { attendance, grades, behavior, assignments, upcoming, subjectGrades }`
  - (optional) `teacher_display_name: string`

Notes

- If no Subject Template is set, default is `{School} - Daily Update for {Student} ({Date})`.
- Section toggles hide sections only if explicitly set to false.
- Manual compose continues to save to `dailyUpdateEmails` and uses your School/Teacher names in metadata. 