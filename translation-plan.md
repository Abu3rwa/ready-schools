# Teacher Dashboard Translation Plan

## Current State Analysis

The app currently has basic internationalization (i18n) setup with:
- **i18next** framework configured
- **English (en)** and **Arabic (ar)** language support
- Basic translation files in `public/locales/`
- Language switcher in Header component
- RTL support with `stylis-plugin-rtl`

**Current Translation Coverage**: ~22 basic terms (dashboard overview, navigation)
**Missing**: 95%+ of the application content needs translation

## Translation Strategy Overview

### Target Languages (Priority Order)
1. **Arabic (ar)** - High priority (existing partial support)
2. **English (en)**

### Translation Phases

## Phase 1: Foundation & Core UI (Weeks 1-2)

### 1.1 Translation Infrastructure Enhancement
```javascript
// Enhanced i18n configuration
const i18nConfig = {
  supportedLngs: ['en', 'ar'],
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  // Add pluralization rules for different languages
  pluralSeparator: '_',
  contextSeparator: '_',
}
```

### 1.2 Core Navigation & UI Elements
**Files to translate:**
- `src/components/common/Sidebar.jsx`
- `src/components/common/Header.jsx`
- `src/components/common/Layout.jsx`
- `src/pages/Dashboard.js`

**Translation keys needed:**
```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "students": "Students",
    "gradebook": "Grade Book",
    "assignments": "Assignments",
    "attendance": "Attendance",
    "behavior": "Behavior",
    "communication": "Communication",
    "reports": "Reports",
    "standards": "Standards",
    "settings": "Settings"
  },
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import"
  }
}
```

### 1.3 Language Switcher Enhancement
```jsx
// Enhanced language switcher with flags and names
const LanguageSwitcher = () => {
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];
  
  return (
    <Select value={currentLanguage} onChange={handleLanguageChange}>
      {languages.map(lang => (
        <MenuItem key={lang.code} value={lang.code}>
          <span>{lang.flag}</span> {lang.name}
        </MenuItem>
      ))}
    </Select>
  );
};
```

## Phase 2: Core Teaching Modules (Weeks 3-6)

### 2.1 Students Module Translation
**Files:**
- `src/pages/Students.js`
- `src/components/students/EnhancedStudentForm.jsx`
- `src/components/students/EnhancedStudentCard.jsx`
- `src/components/students/StudentAnalytics.jsx`

**Translation keys:**
```json
{
  "students": {
    "title": "Students",
    "addStudent": "Add Student",
    "editStudent": "Edit Student",
    "studentInfo": "Student Information",
    "personalInfo": "Personal Information",
    "academicInfo": "Academic Information",
    "contactInfo": "Contact Information",
    "firstName": "First Name",
    "lastName": "Last Name",
    "grade": "Grade",
    "studentId": "Student ID",
    "email": "Email",
    "phone": "Phone",
    "address": "Address",
    "emergencyContact": "Emergency Contact",
    "parentName": "Parent Name",
    "parentEmail": "Parent Email",
    "parentPhone": "Parent Phone"
  }
}
```

### 2.2 Gradebook Module Translation
**Files:**
- `src/pages/GradeBook.js`
- `src/components/grades/VirtualizedGradeTable.jsx`
- `src/components/grades/StandardsGradeCell.jsx`

**Translation keys:**
```json
{
  "gradebook": {
    "title": "Grade Book",
    "subject": "Subject",
    "assignment": "Assignment",
    "score": "Score",
    "total": "Total",
    "percentage": "Percentage",
    "grade": "Grade",
    "date": "Date",
    "category": "Category",
    "weight": "Weight",
    "classAverage": "Class Average",
    "studentAverage": "Student Average",
    "gradeScale": "Grade Scale",
    "passingGrade": "Passing Grade",
    "lateWork": "Late Work",
    "missing": "Missing",
    "incomplete": "Incomplete"
  }
}
```

### 2.3 Assignments Module Translation
**Files:**
- `src/pages/Assignments.js`
- `src/components/assignments/EnhancedAssignmentForm.jsx`
- `src/components/assignments/EnhancedAssignmentCard.jsx`

**Translation keys:**
```json
{
  "assignments": {
    "title": "Assignments",
    "addAssignment": "Add Assignment",
    "editAssignment": "Edit Assignment",
    "assignmentInfo": "Assignment Information",
    "title": "Title",
    "description": "Description",
    "dueDate": "Due Date",
    "category": "Category",
    "points": "Points",
    "weight": "Weight",
    "status": "Status",
    "assigned": "Assigned",
    "inProgress": "In Progress",
    "completed": "Completed",
    "overdue": "Overdue",
    "categories": {
      "homework": "Homework",
      "quiz": "Quiz",
      "test": "Test",
      "project": "Project",
      "participation": "Participation"
    }
  }
}
```

## Phase 3: Advanced Teaching Features (Weeks 7-10)

### 3.1 Attendance Module Translation
**Files:**
- `src/pages/Attendance.js`
- Attendance-related components

**Translation keys:**
```json
{
  "attendance": {
    "title": "Attendance",
    "takeAttendance": "Take Attendance",
    "attendanceDate": "Attendance Date",
    "status": "Status",
    "present": "Present",
    "absent": "Absent",
    "tardy": "Tardy",
    "excused": "Excused",
    "late": "Late",
    "earlyDismissal": "Early Dismissal",
    "fieldTrip": "Field Trip",
    "notes": "Notes",
    "attendanceRate": "Attendance Rate",
    "attendanceReport": "Attendance Report"
  }
}
```

### 3.2 Behavior Module Translation
**Files:**
- `src/pages/Behavior.js`
- `src/components/behavior/BehaviorAnalytics.jsx`
- `src/components/behavior/ReflectionConference.jsx`

**Translation keys:**
```json
{
  "behavior": {
    "title": "Behavior",
    "logBehavior": "Log Behavior",
    "behaviorType": "Behavior Type",
    "positive": "Positive",
    "negative": "Negative",
    "neutral": "Neutral",
    "skills": "Skills",
    "strength": "Strength",
    "growth": "Growth Area",
    "description": "Description",
    "restorativeAction": "Restorative Action",
    "reflectionConference": "Reflection Conference",
    "studentPerspective": "Student Perspective",
    "teacherNotes": "Teacher Notes",
    "behaviorAnalytics": "Behavior Analytics",
    "classSkillsProfile": "Class Skills Profile"
  }
}
```

### 3.3 Communication Module Translation
**Files:**
- `src/pages/Communication.js`
- `src/components/communication/DailyUpdateManager.jsx`
- `src/components/communication/DailyEmailsHistory.js`

**Translation keys:**
```json
{
  "communication": {
    "title": "Communication",
    "dailyUpdates": "Daily Updates",
    "emailHistory": "Email History",
    "composeEmail": "Compose Email",
    "sendDailyUpdates": "Send Daily Updates",
    "preview": "Preview",
    "subject": "Subject",
    "content": "Content",
    "recipients": "Recipients",
    "send": "Send",
    "draft": "Draft",
    "sent": "Sent",
    "failed": "Failed",
    "emailTemplates": "Email Templates",
    "parentCommunication": "Parent Communication"
  }
}
```

## Phase 4: Settings & Configuration (Weeks 11-12)

### 4.1 Settings Module Translation
**Files:**
- `src/pages/Settings.js`
- `src/components/settings/SubjectsManager.jsx`
- `src/components/settings/EmailSettings.jsx`
- `src/components/settings/FrameworksManager.jsx`

**Translation keys:**
```json
{
  "settings": {
    "title": "Settings",
    "classroomProfile": "Classroom Profile",
    "subjectsStandards": "Subjects & Standards",
    "gradingAssessment": "Grading & Assessment",
    "communication": "Communication",
    "dataReports": "Data & Reports",
    "teacherInfo": "Teacher Information",
    "schoolInfo": "School Information",
    "gradeLevel": "Grade Level",
    "classSize": "Class Size",
    "academicYear": "Academic Year",
    "emailPreferences": "Email Preferences",
    "notificationSettings": "Notification Settings"
  }
}
```

### 4.2 Reports Module Translation
**Files:**
- `src/pages/Reports.js`
- `src/components/reports/StandardsBasedReports.jsx`
- `src/components/reports/ReportFilters.jsx`

**Translation keys:**
```json
{
  "reports": {
    "title": "Reports",
    "generateReport": "Generate Report",
    "reportType": "Report Type",
    "dateRange": "Date Range",
    "students": "Students",
    "subjects": "Subjects",
    "exportFormat": "Export Format",
    "pdf": "PDF",
    "excel": "Excel",
    "csv": "CSV",
    "print": "Print",
    "email": "Email",
    "reportCard": "Report Card",
    "progressReport": "Progress Report",
    "attendanceReport": "Attendance Report",
    "behaviorReport": "Behavior Report"
  }
}
```

## Phase 5: Standards & Advanced Features (Weeks 13-14)

### 5.1 Standards Module Translation
**Files:**
- `src/pages/Standards.js`
- `src/components/standards/StandardsBrowser.jsx`
- `src/components/standards/StandardsMapper.jsx`

**Translation keys:**
```json
{
  "standards": {
    "title": "Standards",
    "browseStandards": "Browse Standards",
    "mapStandards": "Map Standards",
    "standardCode": "Standard Code",
    "standardDescription": "Standard Description",
    "subject": "Subject",
    "gradeLevel": "Grade Level",
    "framework": "Framework",
    "addStandard": "Add Standard",
    "editStandard": "Edit Standard",
    "deleteStandard": "Delete Standard",
    "standardsProgress": "Standards Progress"
  }
}
```

### 5.2 Error Messages & Notifications
**Translation keys:**
```json
{
  "errors": {
    "general": "An error occurred. Please try again.",
    "network": "Network error. Please check your connection.",
    "validation": "Please check your input and try again.",
    "permission": "You don't have permission to perform this action.",
    "notFound": "The requested resource was not found.",
    "serverError": "Server error. Please try again later."
  },
  "notifications": {
    "success": "Operation completed successfully.",
    "warning": "Please review your input.",
    "info": "Information",
    "error": "Error occurred"
  }
}
```

## Phase 6: Localization & Cultural Adaptation (Weeks 15-16)

### 6.1 Date & Number Formatting
```javascript
// Enhanced date formatting for different locales
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/zh';
import 'dayjs/locale/de';

// Configure dayjs locales
dayjs.locale('ar'); // Arabic
dayjs.locale('es'); // Spanish
dayjs.locale('fr'); // French
dayjs.locale('zh'); // Chinese
dayjs.locale('de'); // German
```

### 6.2 RTL Support Enhancement
```javascript
// Enhanced RTL support for Arabic
const rtlLanguages = ['ar', 'he', 'fa'];

const isRTL = (language) => rtlLanguages.includes(language);

// Apply RTL styles dynamically
const applyRTLStyles = (language) => {
  if (isRTL(language)) {
    document.dir = 'rtl';
    document.body.style.direction = 'rtl';
  } else {
    document.dir = 'ltr';
    document.body.style.direction = 'ltr';
  }
};
```

### 6.3 Cultural Adaptation
- **Grade Scales**: Different countries use different grading systems
- **Date Formats**: MM/DD/YYYY vs DD/MM/YYYY
- **Currency**: For any paid features
- **Holidays**: Academic calendar differences
- **Names**: Different name formats (first/last vs last/first)

## Implementation Strategy

### 6.1 Translation Management
```javascript
// Translation management workflow
const translationWorkflow = {
  extraction: "Extract all hardcoded strings",
  translation: "Professional translation services",
  review: "Native speaker review",
  testing: "QA testing in target language",
  deployment: "Gradual rollout by language"
};
```

### 6.2 Quality Assurance
- **Professional Translation**: Use certified translators
- **Context Review**: Ensure educational context is preserved
- **User Testing**: Test with native-speaking teachers
- **Consistency Check**: Maintain consistent terminology
- **Cultural Review**: Ensure cultural appropriateness

### 6.3 Technical Implementation
```javascript
// Translation hook for easy usage
const useTranslation = () => {
  const { t, i18n } = useTranslation();
  
  const translate = (key, options = {}) => {
    return t(key, options);
  };
  
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    applyRTLStyles(language);
  };
  
  return { translate, changeLanguage, currentLanguage: i18n.language };
};
```

## Success Metrics

### 6.1 Translation Coverage
- **Phase 1**: 100% core UI translated
- **Phase 2**: 100% core modules translated
- **Phase 3**: 100% advanced features translated
- **Phase 4**: 100% settings and reports translated
- **Phase 5**: 100% standards and errors translated
- **Phase 6**: 100% localization complete

### 6.2 User Adoption
- **Language Usage**: Track which languages are most used
- **User Satisfaction**: Survey teachers on translation quality
- **Support Tickets**: Monitor language-related issues
- **Feature Usage**: Compare feature adoption across languages

## Resource Requirements

### 6.1 Translation Team
- **Project Manager**: Coordinate translation efforts
- **Technical Lead**: Handle i18n implementation
- **Translators**: Professional translators for each language
- **Reviewers**: Native-speaking teachers for context review
- **QA Testers**: Test functionality in each language

### 6.2 Tools & Services
- **Translation Management System**: For organizing translations
- **Professional Translation Services**: For accurate translations
- **Testing Environment**: For language-specific testing
- **Documentation**: Translation guidelines and glossaries

## Timeline Summary

- **Phase 1 (Weeks 1-2)**: Foundation & Core UI
- **Phase 2 (Weeks 3-6)**: Core Teaching Modules
- **Phase 3 (Weeks 7-10)**: Advanced Teaching Features
- **Phase 4 (Weeks 11-12)**: Settings & Configuration
- **Phase 5 (Weeks 13-14)**: Standards & Advanced Features
- **Phase 6 (Weeks 15-16)**: Localization & Cultural Adaptation

**Total Duration**: 16 weeks
**Languages**: 6 languages (English, Arabic, Spanish, French, Chinese, German)
**Coverage**: 100% of application content
