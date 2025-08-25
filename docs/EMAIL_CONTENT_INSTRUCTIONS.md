# Email Content Library Setup Instructions

## Overview
This document provides step-by-step instructions for adding content from the `email-content-library.md` file to your email content management system.

## Prerequisites
- You must be logged in as a teacher
- You must have access to the Email Content Manager in the settings

## Step 1: Access the Email Content Manager
1. Log in to your teacher account
2. Navigate to Settings
3. Click on "Email Content Templates"

## Step 2: Add Content by Category
The email content library has 8 categories. For each category, follow these steps:

### For Text-based Content (Greetings, Grade Headers, Assignment Headers, Behavior Headers, Lesson Headers, Motivational Quotes):
1. Click on the category tab (e.g., "Greetings")
2. Click "Add Template"
3. Copy a template from the corresponding section in `email-content-library.md`
4. Paste it into the text field
5. Click "Save Template"
6. Repeat for all templates in that category

### For JSON-based Content (Visual Themes, Achievement Badges):
1. Click on the category tab (e.g., "Visual Themes")
2. Click "Add Template"
3. Switch to the JSON view
4. Copy a theme/badge object from the corresponding section in `email-content-library.md`
5. Paste it into the JSON field
6. Click "Save Template"
7. Repeat for all themes/badges in that category

## Step 3: Bulk Import Option
For faster setup, you can use the bulk import feature:

1. Click on a category tab
2. Click "Bulk Import"
3. Copy the entire JSON array from the corresponding section in `email-content-library.md`
4. Paste it into the prompt dialog
5. Click OK

## Important Notes
- Make sure to include the square brackets `[]` when doing bulk imports
- Each category has 32 templates for maximum variety
- Templates use placeholders like `{firstName}`, `{studentName}`, `{schoolName}`, and `{teacherName}`
- The system will automatically personalize content based on student data

## Example
For the Greetings category:
1. Open `email-content-library.md`
2. Find the "Greetings (32 templates)" section
3. Copy the entire JSON array including the square brackets:
```json
[
  "Hi {firstName}! Here's your amazing progress today! ✨",
  "Hello {firstName}! Check out what you accomplished in class! 🚀",
  // ... more templates
  "Good morning {firstName}! You've been a science explorer! 🔬"
]
```
4. In the Email Content Manager, go to the Greetings tab
5. Click "Bulk Import"
6. Paste the copied JSON array
7. Click OK

## Verification
After adding content:
1. Check that each category shows the correct number of templates (should be 32 for each)
2. Test by generating a sample email to ensure content is being used
3. Verify that placeholders are being replaced correctly with student data