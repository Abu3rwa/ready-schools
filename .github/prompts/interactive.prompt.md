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
- **Backend:** Firebase Functions (Node.js), code in `src`, with Firestore as the main data store.
- **Integration:** Assignments and GradeBooks are tightly coupled via event-driven architecture (see `AssignmentContext.js`, `GradeBookContext.js`, and `eventEmitter.js`).
- **Standards-Based Grading:** Standards mapping and grading are integrated across assignments and gradebooks (`StandardsGradingContext.js`, `standardsIntegrationService.js`).

## Key Patterns & Conventions

- **Event System:** Assignment and gradebook changes are synchronized using event emission/listening. Example:

  ```js
  eventEmitter.emit("assignmentAdded", { subject, assignmentId, assignment });
  eventEmitter.on("assignmentAdded", handleAssignmentAddedEvent);
  ```

- **Automatic Gradebook Creation:** When an assignment is created for a new subject, a gradebook is auto-generated.
- **Category Weights:** Assignment and gradebook categories use weighted scoring, managed in context and persisted in Firestore.
- **Dual Grading:** Assignments can be graded with both traditional points and standards proficiency. See `gradingMode: "dual"` and proficiency scales.
- **Standards Mapping:** Standards are mapped to assignments and grades, with shared analytics and reporting.
- **Daily Updates:** Automated emails aggregate attendance, behavior, grades, and assignments.

## Developer Workflows

- **Build/Run Frontend:** Use standard React scripts (`npm start`, `npm run build`) in the root.
- **Deploy/Run Functions:** Use Firebase CLI (`firebase deploy --only functions`).
- **Testing:** Manual testing via dashboard UI; check browser console for event logs and errors.
- **Debugging:** Use console logs in both frontend and backend. For integration issues, check event system logs and context state.
- **Troubleshooting:** If assignments/grades do not sync, verify event emission and context initialization.

## Integration Points

- **Assignments ↔ GradeBooks:** Data flows via shared subject, assignmentId, and event system.
- **Standards ↔ Analytics:** Standards data is used for analytics and reporting in both systems.
- **Communication:** Daily updates and progress reports are sent via backend email services.

## File References

- `AssignmentContext.js`, `GradeBookContext.js`, `StandardsGradingContext.js`
- `eventEmitter.js`, `standardsIntegrationService.js`
- `index.js`, `gmailApiService.js`
- `ASSIGNMENTS_GRADEBOOK_INTEGRATION_README.md`, `assignments-gradebooks-integration-plan.md`, `standards-grading-integration-plan.md`

## Example: Adding an Assignment

1. Create assignment via context/provider.
2. Event is emitted; gradebook is updated or created if needed.
3. Standards mapping is available for grading and analytics.

## Example: Grading Workflow

1. Enter grade in gradebook (traditional and/or standards).
2. Grade is synchronized with assignment and analytics.
3. Daily update includes new grade and standards progress.

## Agent Loop Reminder

- **Always run** `python userinput.py` **before starting and after finishing each task, using the input to drive your next action.**
