# Behavior Module Transformation: A Phased Implementation Plan

This document outlines the technical and operational steps required to transform the Behavior Tracking module from a simple incident log into a proactive platform for fostering student growth and leadership, as detailed in the strategic plan.

---

## Phase 1: Foundational Refactor & System Setup (Weeks 1-2)

**Goal:** Rearchitect the core data model and UI from a "Positive/Negative" system to a skill-based framework.

### 1.1. Backend & Data Model (Firestore)

*   **Modify `behavior` Collection:**
    *   The data structure for each behavior document will be changed.
    *   **DEPRECATE:** `type` (string: "Positive"/"Negative")
    *   **DEPRECATE:** `severity` (string: "Low", "Medium", "High")
    *   **ADD:** `skills` (array of objects: `[{ skill: "Resilience", type: "strength" }, { skill: "Self-Regulation", type: "growth" }]`)
    *   **RENAME:** The `actionTaken` field will be renamed to `restorativeAction`.
*   **Create `skills_taxonomy` Collection:**
    *   Create a new root collection to store the official list of skills.
    *   Each document will represent a skill category (e.g., "Collaboration").
    *   Document fields: `name` (string), `description` (string), `subSkills` (array of strings: ["Active listening", "Resolving conflicts"]).
*   **Update Firestore Security Rules (`firestore.rules`):**
    *   Add rules to allow authenticated users to `read` the `skills_taxonomy` collection.
    *   Update the rules for the `behavior` collection to validate the new `skills` array structure on `write`.

### 1.2. State Management (`src/contexts/BehaviorContext.js`)

*   **Modify `logBehavior` function:**
    *   Update the function signature to accept the new `skills` array and `restorativeAction` string.
    *   The internal logic will be changed to write the new data structure to Firestore.
*   **Modify `updateBehavior` function:**
    *   Update the function to handle the new data structure.
*   **Add `getSkillsTaxonomy` function:**
    *   Create a new function to fetch the skill list from the `skills_taxonomy` collection.

### 1.3. Frontend UI (`src/pages/Behavior.js` & Components)

*   **Create `SkillPicker.jsx` Component:**
    *   Build a new, reusable component that fetches data using `getSkillsTaxonomy`.
    *   It will display skills grouped by category and allow the user to select a skill and mark it as a "strength" or "area for growth."
*   **Update "Add/Edit Behavior" Dialog:**
    *   In `Behavior.js`, replace the "Type" and "Severity" `Select` components with the new `<SkillPicker />` component.
    *   Rename the "Action Taken" `TextField` label to "Support & Restorative Steps."
*   **Update Behavior Log Display:**
    *   Modify the list view in `Behavior.js` to display the selected skills (using `Chip` components) instead of the old Positive/Negative icons and severity levels.

### 1.4. Non-Technical Tasks

*   Draft initial professional development materials explaining the shift from a compliance mindset to a growth mindset.

---

## Phase 2: Student Agency & Pilot Program (Weeks 3-4)

**Goal:** Introduce features for student reflection and goal-setting, and test the new system with a select group of users.

### 2.1. Backend & Data Model (Firestore)

*   **Create `goals` Sub-collection:**
    *   Under `students/{studentId}`, create a new sub-collection named `goals`.
    *   Each document will represent a single growth goal.
    *   Fields: `skillName` (string), `description` (string), `targetDate` (timestamp), `status` (string: "In Progress", "Completed"), `createdAt` (timestamp).
*   **Create `reflections` Sub-collection:**
    *   Under `behavior/{behaviorId}`, create a new sub-collection named `reflections`.
    *   Fields: `studentResponse` (string), `teacherNotes` (string), `conferenceDate` (timestamp).

### 2.2. State Management (Contexts)

*   **In `BehaviorContext.js`:**
    *   Create an `addReflection` function that writes to the `reflections` sub-collection.
*   **In `StudentContext.js`:**
    *   Create `addGoal`, `updateGoal`, and `getGoals` functions to manage the new `goals` sub-collection for a given student.

### 2.3. Frontend UI

*   **Create `ReflectionConference.jsx` Component:**
    *   A dialog component with form fields for the student's perspective and teacher's notes.
    *   It will be triggered from a new "Log Reflection" button on each behavior entry.
*   **Create `StudentGrowthDashboard.jsx` Page/Component:**
    *   A new view, accessible to students, to see their active goals and progress.
    *   Will use the `getGoals` function from the `StudentContext`.
*   **Update `Behavior.js`:**
    *   Add the "Log Reflection" button to each behavior log item.

### 2.4. Pilot Program Logistics

*   Onboard select volunteer teachers and their students.
*   Establish a dedicated feedback channel (e.g., shared document, Slack channel) for rapid iteration.

---

## Phase 3: Full Rollout & Advanced Analytics (Weeks 5-8)

**Goal:** Deploy the system to all users, migrate historical data, and introduce powerful new analytics.

### 3.1. Data Migration

*   **Develop a Migration Script:**
    *   Create a one-time script (e.g., Node.js or Firebase Function) to run on the existing `behavior` collection.
    *   The script will map old data to the new structure (e.g., `type: "Negative", description: "Called out"` -> `skills: [{ skill: "Self-Regulation", type: "growth" }]`).
    *   Unmappable records will be flagged as "legacy."

### 3.2. Backend (Firebase Functions)

*   **Develop `calculateClassSkillsProfile` Function:**
    *   Create a scheduled Firebase Function to aggregate behavior data and generate a class-wide skills profile (top strengths, top growth areas).
    *   The result will be stored in a new `analytics` collection to avoid slow, real-time queries on the frontend.

### 3.3. Frontend UI

*   **Revamp Analytics Tab in `Behavior.js`:**
    *   Remove the old "Positive/Negative" charts.
    *   **ADD:** A Radar Chart to display the `Class Skills Profile` fetched from the `analytics` collection.
    *   **ADD:** A "Student Growth Over Time" line chart to visualize an individual's progress on a specific skill.
*   **Implement Gamification:**
    *   Create a `SkillBadge.jsx` component to visually represent proficiency.
    *   Develop logic to award badges when a student demonstrates consistent strength in a skill.

### 3.4. Non-Technical Tasks

*   Update all user documentation and training materials based on pilot feedback.
*   Conduct onboarding sessions for all remaining teachers, students, and parents.

---

## Phase 4: Ongoing Optimization & Intelligence (Ongoing)

**Goal:** Continuously improve the system by analyzing data and introducing intelligent features.

### 4.1. Feature Development

*   **Intelligent Recommendations (Prototyping):**
    *   Begin research on a simple recommendation engine.
    *   **Example:** If multiple students show a growth need in "Resilience," the system could suggest a relevant classroom activity or resource to the teacher.
*   **Multi-Stakeholder Dashboards:**
    *   Develop simplified dashboard views for Administrators and Parents.

### 4.2. System Monitoring

*   **Measure Success Metrics:**
    *   Implement tracking for the defined KPIs (student engagement in goal-setting, teacher adoption rates, etc.).
*   **Performance Optimization:**
    *   Monitor Firestore query performance and optimize data structures as needed.
    *   Review and refine Firebase Function efficiency.
