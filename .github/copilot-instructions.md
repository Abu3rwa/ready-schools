---
applyTo: "**"
---

# AI Agent Instructions for ready-schools Codebase

## Interactive Workflow

1. **Before starting any new task, always run** `python userinput.py` **in the root directory.**
   - Wait for user input in the terminal before proceeding.
2. **Main Workflow:**
   - Perform the assigned task as directed by the user's input.
   - **After finishing each task, run** `python userinput.py` **again in the root directory.**
   - Wait for new user input before starting the next task.
   - Repeat this process for every task cycle.
3. **Terminal Usage:**
   - The terminal should be opened in the chat window itself.
   - Always read and act on the user's input from the terminal.
4. **Exit Condition:**
   - If the user enters `stop` when prompted, exit the loop and terminate the process.

## Project Architecture

- **Frontend:** React (Material-UI), organized in components, pages, and context providers in `src/contexts`.
- **Backend:** Firebase Functions (Node.js), code in `functions/src`, with Firestore as the main data store.
- **Integration:** Assignments, GradeBooks, Lessons, and Materials are tightly coupled via event-driven architecture and context providers.
- **Standards-Based Grading:** Standards mapping and grading are integrated across assignments and gradebooks (`StandardsGradingContext.js`, `standardsIntegrationService.js`).
- **Daily Update System:** Automated emails aggregate attendance, behavior, grades, lessons, assignments, and materials. See `docs/daily-update-upgrade-plan.md` for upgrade details.

## Key Patterns & Conventions

- **Event System:** Assignment, gradebook, lesson, and material changes are synchronized using event emission/listening. Example:
  ```js
  eventEmitter.emit("assignmentAdded", { subject, assignmentId, assignment });
  eventEmitter.on("assignmentAdded", handleAssignmentAddedEvent);
  ```
- **Automatic Gradebook Creation:** When an assignment is created for a new subject, a gradebook is auto-generated.
- **Category Weights:** Assignment and gradebook categories use weighted scoring, managed in context and persisted in Firestore.
- **Dual Grading:** Assignments can be graded with both traditional points and standards proficiency. See `gradingMode: "dual"` and proficiency scales.
- **Standards Mapping:** Standards are mapped to assignments and grades, with shared analytics and reporting.
- **Lessons System:** Daily lessons are tracked, linked to gradebooks, and included in daily updates. See `LessonContext.js` and lesson data model in `daily-update-upgrade-plan.md`.
- **Material Management:** Materials (Google Drive, YouTube, PDFs, images, links) are linked to lessons and assignments, and referenced in daily updates.
- **Customization:** Parents and teachers can select email frequency and which sections to receive in daily/weekly/monthly updates.
- **Testing & Feedback:** Pilot testing and user feedback are required before full deployment of new features.
- **Accessibility & Localization:** All UI components and emails should support accessibility and multiple languages.

## Developer Workflows

- **Build/Run Frontend:** Use standard React scripts (`npm start`, `npm run build`) in the root.
- **Deploy/Run Functions:** Use Firebase CLI (`firebase deploy --only functions`).
- **Testing:** Manual testing via dashboard UI; check browser console for event logs and errors.
- **Debugging:** Use console logs in both frontend and backend. For integration issues, check event system logs and context state.
- **Troubleshooting:** If assignments/grades do not sync, verify event emission and context initialization.
- **Daily Update Testing:** Use sample data and pilot feedback before full deployment.

## Integration Points

- **Assignments ↔ GradeBooks:** Data flows via shared subject, assignmentId, and event system.
- **Standards ↔ Analytics:** Standards data is used for analytics and reporting in both systems.
- **Lessons ↔ Daily Updates:** Lessons are included in daily update emails and linked to gradebooks.
- **Materials ↔ Lessons/Assignments:** Materials are managed and referenced in both lessons and assignments, and included in daily updates.
- **Customization ↔ Communication:** Email frequency and content are user-configurable.
- **Testing ↔ Feedback:** Pilot testing and feedback collection are required before rollout.
- **Accessibility ↔ Localization:** All features must support accessibility and multiple languages.

## File References

- `src/contexts/AssignmentContext.js`, `src/contexts/GradeBookContext.js`, `src/contexts/StandardsGradingContext.js`, `src/contexts/LessonContext.js`
- `src/services/eventEmitter.js`, `src/services/standardsIntegrationService.js`
- `functions/src/index.js`, `functions/src/services/gmailApiService.js`
- `docs/ASSIGNMENTS_GRADEBOOK_INTEGRATION_README.md`, `docs/assignments-gradebooks-integration-plan.md`, `docs/standards-grading-integration-plan.md`, `docs/daily-update-upgrade-plan.md`

## Example: Adding an Assignment

1. Create assignment via context/provider.
2. Event is emitted; gradebook is updated or created if needed.
3. Standards mapping is available for grading and analytics.

## Example: Grading Workflow

1. Enter grade in gradebook (traditional and/or standards).
2. Grade is synchronized with assignment and analytics.
3. Daily update includes new grade and standards progress.

## Example: Daily Update Workflow

1. Teacher enters lesson and activities for the day.
2. System aggregates attendance, behavior, lessons, homework, assignments, and materials.
3. Daily update email is sent to parents with actionable info, customized to their preferences.

## Agent Loop Reminder

- **Always run** `python userinput.py` **before starting and after finishing each task, using the input to drive your next action.**
