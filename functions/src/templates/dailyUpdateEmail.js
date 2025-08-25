import sanitizeHtml from "sanitize-html";
import dayjs from "dayjs";
import { createEmailContentFilter } from "../services/EmailContentFilter.js";

export const buildDailyUpdateTemplate = (data) => {
  const {
    studentName,
    studentGender,
    parentName,
    date,
    schoolName,
    teacherName,
    teacherEmail,
    attendance,
    assignments,
    grades,
    behavior,
    upcomingAssignments,
    classwork,
    homework,
    subjectGrades, // Updated to expect per-subject grades
    overallGrade,
    attendanceRate,
    behaviorSummary,
    // New optional preferences
    subjectTemplate,
    emailPreferences = {}, // Unified email preferences object
    // New lesson data
    lessons = [],
    lessonSummary = {},
    // Phase 2: Teacher preferences for personalization
    teacherPreferences = {} // { tone: "casual", focus: "academic", length: "brief", style: "conversational" }
  } = data;

  // Create centralized content filter for parent emails
  const contentFilter = createEmailContentFilter(emailPreferences, 'parent');

  // Build subject using template if provided
  const subjectFromTemplate = () => {
    if (!subjectTemplate) return null;
    const tokens = {
      "{School}": schoolName || "School",
      "{Student}": studentName || "Student",
      "{Date}": dayjs(date).format("MMM DD, YYYY"),
    };
    let subject = subjectTemplate;
    Object.entries(tokens).forEach(([k, v]) => (subject = subject.split(k).join(v)));
    return subject;
  };

  // Build a friendly, personalized salutation
  const studentFirstName = (studentName || "").split(" ")[0] || "Student";
  const rawSalutation = parentName && parentName.trim()
    ? parentName
    : `Parent/Guardian of ${studentFirstName}`;
  const safeSalutation = sanitizeHtml(rawSalutation, { allowedTags: [], allowedAttributes: {} });

  // Get pronouns and gender-specific language based on gender
  const getPronouns = (gender) => {
    const genderLower = gender?.toLowerCase()?.trim();
    switch(genderLower) {
      case 'male':
      case 'm':
      case 'boy':
      case 'male student':
        return { 
          subject: 'he', 
          object: 'him', 
          possessive: 'his', 
          possessiveProper: 'his',
          reflexive: 'himself',
          title: 'young man',
          student: 'student',
          child: 'son'
        };
      case 'female':
      case 'f':
      case 'girl':
      case 'female student':
        return { 
          subject: 'she', 
          object: 'her', 
          possessive: 'her', 
          possessiveProper: 'hers',
          reflexive: 'herself',
          title: 'young lady',
          student: 'student',
          child: 'daughter'
        };
      case 'other':
      case 'prefer not to say':
      case 'non-binary':
      case 'nonbinary':
      case 'nb':
      case 'enby':
      case 'genderfluid':
      case 'genderqueer':
      case 'agender':
        return { 
          subject: 'they', 
          object: 'them', 
          possessive: 'their', 
          possessiveProper: 'theirs',
          reflexive: 'themselves',
          title: 'student',
          student: 'student',
          child: 'child'
        };
      default:
        return { 
          subject: 'they', 
          object: 'them', 
          possessive: 'their', 
          possessiveProper: 'theirs',
          reflexive: 'themselves',
          title: 'student',
          student: 'student',
          child: 'child'
        };
    }
  };

  const normalizeGender = (gender) => {
    if (!gender || typeof gender !== 'string') return null;
    const normalized = gender.trim();
    if (normalized === '') return null;
    const genderMap = {
      'male': 'Male', 'm': 'Male', 'male student': 'Male', 'boy': 'Male',
      'female': 'Female', 'f': 'Female', 'female student': 'Female', 'girl': 'Female',
      'other': 'Other', 'prefer not to say': 'Prefer not to say',
      'non-binary': 'Other', 'nonbinary': 'Other', 'nb': 'Other', 'enby': 'Other',
      'genderfluid': 'Other', 'genderqueer': 'Other', 'agender': 'Other'
    };
    const lowerGender = normalized.toLowerCase();
    return genderMap[lowerGender] || normalized;
  };
  
  const normalizedGender = normalizeGender(studentGender);
  const pronouns = getPronouns(normalizedGender);

  // Debug logging to track gender values
  console.log('Gender data processing:', {
    rawGender: studentGender,
    type: typeof studentGender,
    normalized: normalizedGender,
    processed: normalizedGender?.toLowerCase()?.trim()
  });
  
  // Log the pronouns being used
  console.log('Pronouns selected:', pronouns);

  // ===== PHASE 1 & 2: PERSONALIZATION FUNCTIONS =====
  
  // Phase 1: Dynamic Greeting System
  const getDynamicGreeting = (data) => {
    const greetings = [
      "Hi there!",
      "Good afternoon!",
      "Hello!",
      "Greetings!",
      "Hope you're having a great day!",
      "Just wanted to share some updates!",
      "Quick update for you today!",
      "Here's what happened in class today!"
    ];
    
    // Use date to rotate greetings (different greeting each day)
    const dayOfYear = dayjs(data.date).dayOfYear();
    const greetingIndex = dayOfYear % greetings.length;
    return greetings[greetingIndex];
  };

  // Phase 1: Context-Aware Greetings
  const getContextualGreeting = (data) => {
    if (data.attendance && data.attendance.status === "Absent") {
      return "I wanted to check in since [student] wasn't in class today.";
    }
    if (data.grades && data.grades.length > 0) {
      return "Great news! [student] received some grades today.";
    }
    if (data.behavior && data.behavior.some(b => b.type === "Positive")) {
      return "I'm so proud of [student]'s behavior today!";
    }
    if (data.lessons && data.lessons.length > 0) {
      return "Here's what [student] learned today!";
    }
    return "Here's [student]'s daily update!";
  };

  // Phase 2: Teacher Personality Integration
  const getTeacherPersonalityGreeting = (teacherPreferences = {}) => {
    const personalities = {
      enthusiastic: "I'm thrilled to share [student]'s progress today!",
      supportive: "I wanted to let you know how [student] is doing.",
      casual: "Quick update on [student]'s day!",
      professional: "Here's [student]'s daily academic summary.",
      caring: "I'm thinking of [student] and wanted to share today's highlights."
    };
    
    const tone = teacherPreferences.tone || "casual";
    return personalities[tone] || personalities.casual;
  };

  // Phase 2: Student-Specific Openings
  const getStudentSpecificOpening = (student, data) => {
    const studentName = studentFirstName;
    
    // Simple student-specific logic based on available data
    if (data.attendance && data.attendance.status === "Present" && 
        data.behavior && data.behavior.length === 0) {
      return `${studentName} had a great, incident-free day!`;
    }
    
    if (data.grades && data.grades.some(g => g.score && g.points && (g.score / g.points) >= 0.9)) {
      return `${studentName} really excelled on today's work!`;
    }
    
    if (data.behavior && data.behavior.some(b => b.type === "Positive")) {
      return `${studentName} showed wonderful behavior today!`;
    }
    
    return `I'm enjoying watching ${studentName} grow and learn each day.`;
  };

  // Phase 1: Natural Language Variation
  const getNaturalEncouragement = (data) => {
    const messages = [];
    
    // Specific achievements
    if (data.grades && data.grades.some(g => g.score && g.points && (g.score / g.points) >= 0.9)) {
      messages.push("I was really impressed with [student]'s work today!");
    }
    
    // Behavior highlights
    if (data.behavior && data.behavior.some(b => b.type === "Positive")) {
      const positiveBehaviors = data.behavior.filter(b => b.type === "Positive");
      if (positiveBehaviors.length > 0) {
        messages.push(`[Student] showed great ${positiveBehaviors[0].skill || 'behavior'} today!`);
      }
    }
    
    // Attendance recognition
    if (data.attendance && data.attendance.status === "Present") {
      messages.push("Thanks for getting [student] to school today!");
    }
    
    // Lesson engagement
    if (data.lessons && data.lessons.length > 0) {
      messages.push(`[Student] was engaged in ${data.lessons.length} lessons today!`);
    }
    
    return messages.length > 0 ? messages.join(" ") : null;
  };

  // Use centralized content filtering service
  const shouldIncludeSection = (section, data) => {
    return contentFilter.shouldIncludeSection(section, data);
  };

  // Phase 2: Dynamic Section Ordering
  const getSectionOrder = (data) => {
    const sections = [];
    
    // Most important/relevant information first
    if (data.attendance && data.attendance.status === "Absent") {
      sections.push("attendance");
    }
    
    if (data.grades && data.grades.length > 0) {
      sections.push("grades");
    }
    
    if (data.behavior && data.behavior.length > 0) {
      sections.push("behavior");
    }
    
    if (data.lessons && data.lessons.length > 0) {
      sections.push("lessons");
    }
    
    // Add remaining sections
    sections.push("assignments", "upcoming");
    
    return sections;
  };

  // ===== END PERSONALIZATION FUNCTIONS =====

  // Helper function to format assignment list with enhanced styling and email client compatibility
  const formatAssignments = (assignments, type) => {
    if (!assignments || assignments.length === 0) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td align="center" style="padding: 20px; color: #666; font-style: italic; font-family: Arial, sans-serif;">
              No ${type} for today.
            </td>
          </tr>
        </table>
      `;
    }

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        ${assignments
          .map(
            (assignment) => `
          <tr>
            <td style="padding: 15px; margin-bottom: 15px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <h4 style="margin: 0; color: #1976d2; font-size: 16px; font-family: Arial, sans-serif; word-break: break-word;">${assignment.name}</h4>
                  </td>
                  <td align="right" style="padding-bottom: 10px;">
                    <span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 500; font-family: Arial, sans-serif;">${assignment.subject}</span>
                  </td>
                </tr>
            ${
              assignment.description
                    ? `<tr><td colspan="2" style="padding-bottom: 10px;"><p style="margin: 10px 0; color: #666; font-size: 14px; font-family: Arial, sans-serif; word-break: break-word;">${sanitizeHtml(assignment.description, { allowedTags: ['em', 'strong'], allowedAttributes: {} })}</p></td></tr>`
                : ""
            }
            ${
              assignment.dueDate
                    ? `<tr><td colspan="2" style="padding-bottom: 5px;"><div style="font-size: 13px; color: #666; font-family: Arial, sans-serif;">📅 Due: ${dayjs(assignment.dueDate).format("MMM DD, YYYY")}</div></td></tr>`
                : ""
            }
            ${
              assignment.points
                    ? `<tr><td colspan="2"><div style="font-size: 13px; color: #666; font-family: Arial, sans-serif;">🎯 ${assignment.points} points</div></td></tr>`
                : ""
            }
              </table>
            </td>
          </tr>
        `
          )
          .join("")}
      </table>
    `;
  };

  // Helper function to format grades with enhanced styling and email client compatibility
  const formatGrades = (grades) => {
    if (!grades || grades.length === 0) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td align="center" style="padding: 20px; color: #666; font-style: italic; font-family: Arial, sans-serif;">
              No new grades today.
            </td>
          </tr>
        </table>
      `;
    }

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        ${grades
          .map(
            (grade) => {
              // Handle cases where points might be null, 0, or undefined
              let displayText, percentage, gradeColor;
              
              if (!grade.points || grade.points === 0 || grade.points === null) {
                // If no points available, show just the score
                displayText = `${grade.score} point${grade.score !== 1 ? 's' : ''}`;
                percentage = null;
                gradeColor = "#666"; // Neutral color for no percentage
              } else {
                // Calculate percentage normally
                percentage = Math.round((grade.score / grade.points) * 100);
                gradeColor = getGradeColor(percentage);
                displayText = `${grade.score}/${grade.points} (${percentage}%)`;
              }
              
              return `
          <tr>
            <td style="padding: 15px; margin-bottom: 15px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <h4 style="margin: 0; color: #1976d2; font-size: 16px; font-family: Arial, sans-serif; word-break: break-word;">${grade.assignmentName || 'Assignment'}</h4>
                  </td>
                  <td align="right" style="padding-bottom: 10px;">
                    <div style="font-size: 18px; font-weight: bold; color: ${gradeColor}; font-family: Arial, sans-serif;">
                ${displayText}
              </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">
                    <div style="font-size: 14px; color: #666; margin-top: 5px; font-family: Arial, sans-serif;">${grade.subject}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
            }
          )
          .join("")}
      </table>
    `;
  };

  // Helper function to format behavior with enhanced styling and email client compatibility
  const formatBehavior = (behavior) => {
    if (!behavior || behavior.length === 0) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td align="center" style="padding: 20px; color: #2e7d32; font-weight: 500; font-family: Arial, sans-serif; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-radius: 8px;">
              🌟 Great day with no behavior incidents!
            </td>
          </tr>
        </table>
      `;
    }

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        ${behavior
          .map(
            (incident) => `
          <tr>
            <td style="padding: 15px; margin-bottom: 15px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid ${incident.type === "Positive" ? "#4caf50" : "#f44336"};">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-weight: bold; font-size: 14px; font-family: Arial, sans-serif; color: ${incident.type === "Positive" ? "#2e7d32" : "#d32f2f"};">
                      ${incident.type === "Positive" ? "🌟" : "⚠️"} ${incident.type}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 5px;">
                    <p style="margin: 10px 0 5px 0; color: #555; font-family: Arial, sans-serif; word-break: break-word;">${sanitizeHtml(incident.description, { allowedTags: [], allowedAttributes: {} })}</p>
                  </td>
                </tr>
            ${
              incident.actionTaken
                    ? `<tr><td><div style="font-size: 13px; color: #666; font-style: italic; font-family: Arial, sans-serif;">Action taken: ${sanitizeHtml(incident.actionTaken, { allowedTags: [], allowedAttributes: {} })}</div></td></tr>`
                : ""
            }
              </table>
            </td>
          </tr>
        `
          )
          .join("")}
      </table>
    `;
  };

  // Helper function to format upcoming assignments with enhanced styling and email client compatibility
  const formatUpcoming = (assignments) => {
    if (!assignments || assignments.length === 0) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td align="center" style="padding: 20px; color: #666; font-style: italic; font-family: Arial, sans-serif;">
              No upcoming assignments in the next few days.
            </td>
          </tr>
        </table>
      `;
    }

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        ${assignments
          .map(
            (assignment) => {
              const daysUntilDue = dayjs(assignment.dueDate).diff(dayjs(), 'days');
              const urgencyColor = daysUntilDue <= 1 ? '#ff5722' : daysUntilDue <= 3 ? '#ff9800' : '#1976d2';
              const urgencyBg = daysUntilDue <= 1 ? '#fff3e0' : daysUntilDue <= 3 ? '#fff8e1' : '#ffffff';
              return `
        <tr>
          <td style="padding: 15px; margin-bottom: 15px; background-color: ${urgencyBg}; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid ${urgencyColor};">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom: 10px;">
                  <h4 style="margin: 0 0 6px 0; color: #1976d2; font-size: 16px; font-family: Arial, sans-serif; word-break: break-word; max-width: 100%;">${sanitizeHtml(assignment.name, { allowedTags: [], allowedAttributes: {} })}</h4>
                  <span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 500; font-family: Arial, sans-serif; display: inline-block; max-width: 100%; word-break: break-word;">${sanitizeHtml(assignment.subject, { allowedTags: [], allowedAttributes: {} })}</span>
                </td>
              </tr>
          ${
            assignment.description
                  ? `<tr><td style="padding-bottom: 10px;"><p style="margin: 10px 0; color: #666; font-size: 14px; font-family: Arial, sans-serif; word-break: break-word;">${sanitizeHtml(assignment.description, { allowedTags: [], allowedAttributes: {} })}</p></td></tr>`
                  : ''
              }
              <tr>
                <td style="padding-bottom: 8px;">
                  <span style="font-size: 13px; color: #666; margin-right: 12px; font-family: Arial, sans-serif;">📅 Due: ${dayjs(assignment.dueDate).format("MMM DD, YYYY")}</span>
                  ${assignment.points ? `<span style="font-size: 13px; color: #666; margin-right: 12px; font-family: Arial, sans-serif;">🎯 ${assignment.points} points</span>` : ""}
                </td>
              </tr>
              ${daysUntilDue <= 1 ? '<tr><td><div style="color: #ff5722; font-weight: bold; font-size: 12px; margin-top: 8px; font-family: Arial, sans-serif;">⏰ Due soon!</div></td></tr>' : ''}
            </table>
          </td>
        </tr>
      `;
            }
          )
          .join("")}
      </table>
    `;
  };

  // Helper function to format subject grades with email client compatibility
  const formatSubjectGrades = (subjectGrades) => {
    if (!subjectGrades || Object.keys(subjectGrades).length === 0) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td align="center" style="padding: 20px; color: #666; font-style: italic; font-family: Arial, sans-serif;">
              No grades available yet.
            </td>
          </tr>
        </table>
      `;
    }

    const subjects = Object.entries(subjectGrades);
    const rows = [];
    
    // Create rows with 2 subjects per row for better mobile layout
    for (let i = 0; i < subjects.length; i += 2) {
      const row = subjects.slice(i, i + 2);
      rows.push(row);
    }

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        ${rows.map(row => `
          <tr>
            ${row.map(([subject, grade]) => {
            const gradeColor = getGradeColor(grade);
            return `
                <td style="padding: 15px; text-align: center; vertical-align: top; width: 50%;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 10px;">
                    <tr>
                      <td style="padding: 20px 15px;">
                        <div style="font-size: 14px; color: #6c757d; text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 8px; font-family: Arial, sans-serif;">${subject}</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${gradeColor}; font-family: Arial, sans-serif;">${grade}%</div>
                      </td>
                    </tr>
                  </table>
                </td>
              `;
            }).join('')}
            ${row.length === 1 ? '<td style="width: 50%;"></td>' : ''}
          </tr>
        `).join('')}
      </table>
    `;
  };

  // Calculate average grade for summary
  const calculateAverageGrade = (subjectGrades) => {
    if (!subjectGrades || Object.keys(subjectGrades).length === 0) return 0;
    const grades = Object.values(subjectGrades);
    return Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
  };

  const averageGrade = (subjectGrades && Object.keys(subjectGrades).length > 0)
    ? calculateAverageGrade(subjectGrades)
    : (typeof overallGrade === 'number' && overallGrade > 0 ? overallGrade : null);

  // Get attendance status with enhanced styling and email client compatibility
  const getAttendanceStatus = () => {
    const statusConfig = {
      Present: { icon: "✅", color: "#2e7d32", bg: "#e8f5e8" },
      Tardy: { icon: "⏰", color: "#f57c00", bg: "#fff3e0" },
      Absent: { icon: "❌", color: "#d32f2f", bg: "#ffebee" },
      Excused: { icon: "📋", color: "#1976d2", bg: "#e3f2fd" }
    };
    
    const config = statusConfig[attendance.status] || statusConfig.Absent;
    return {
      html: `<span style="color: ${config.color}; font-weight: bold; font-family: Arial, sans-serif;">${config.icon} ${attendance.status}</span>`,
      bg: config.bg
    };
  };

  // Get grade color based on percentage
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "#2e7d32"; // Green
    if (percentage >= 80) return "#1976d2"; // Blue
    if (percentage >= 70) return "#f57c00"; // Orange
    return "#d32f2f"; // Red
  };

  

  // Helper function to format lessons with enhanced styling and email client compatibility
  const formatLessons = (lessons) => {
    if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td align="center" style="padding: 20px; color: #666; font-style: italic; font-family: Arial, sans-serif;">
              No lessons recorded for today.
            </td>
          </tr>
        </table>
      `;
    }

    // Ensure all lessons have required fields
    const safeLessons = lessons.map(lesson => ({
      ...lesson,
      subject: lesson.subject || 'Unknown Subject',
      title: lesson.title || 'Untitled Lesson',
      description: lesson.description || '',
      duration: lesson.duration || 0,
      learningObjectives: Array.isArray(lesson.learningObjectives) ? lesson.learningObjectives : [],
      activities: Array.isArray(lesson.activities) ? lesson.activities : [],
      materials: Array.isArray(lesson.materials) ? lesson.materials : [],
      homework: lesson.homework || '',
      notes: lesson.notes || ''
    }));

    // Group lessons by subject
    const lessonsBySubject = groupLessonsBySubject(safeLessons);
    
    return Object.entries(lessonsBySubject).map(([subject, subjectLessons]) => `
      <div style="margin-bottom: 25px;">
        <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px; font-weight: 600; font-family: Arial, sans-serif; border-bottom: 2px solid #e3f2fd; padding-bottom: 8px;">
          📚 ${subject}
        </h4>
        ${subjectLessons.map(lesson => formatIndividualLesson(lesson)).join('')}
      </div>
    `).join('');
  };

  // Group lessons by subject
  const groupLessonsBySubject = (lessons) => {
    if (!Array.isArray(lessons)) return {};
    
    return lessons.reduce((acc, lesson) => {
      const subject = lesson.subject || 'Unknown Subject';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(lesson);
      return acc;
    }, {});
  };

  // Format individual lesson
  const formatIndividualLesson = (lesson) => {
    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px;">
        <tr>
          <td style="padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <!-- Lesson Header -->
              <tr>
                <td style="padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td>
                        <h4 style="margin: 0; color: #1976d2; font-size: 16px; font-weight: 600; font-family: Arial, sans-serif; word-break: break-word;">
                          ${lesson.title || 'Untitled Lesson'}
                        </h4>
                      </td>
                      <td align="right" style="width: 80px;">
                        <span style="background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; font-family: Arial, sans-serif;">
                          ${lesson.duration || 0} min
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Lesson Description -->
              ${lesson.description ? `
                <tr>
                  <td style="padding: 15px 0 10px 0;">
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif; word-break: break-word;">
                      ${sanitizeHtml(lesson.description, { allowedTags: ['em', 'strong'], allowedAttributes: {} })}
                    </p>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Learning Objectives -->
              ${lesson.learningObjectives && Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0 ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="margin-bottom: 8px;">
                      <strong style="color: #2e7d32; font-family: Arial, sans-serif;">🎯 Learning Objectives:</strong>
                    </div>
                    <ul style="margin: 8px 0; padding-left: 20px; font-family: Arial, sans-serif;">
                      ${lesson.learningObjectives.map(obj => `
                        <li style="margin-bottom: 5px; color: #666; font-size: 13px;">
                          ${sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} })}
                        </li>
                      `).join('')}
                    </ul>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Activities -->
              ${lesson.activities && Array.isArray(lesson.activities) && lesson.activities.length > 0 ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="margin-bottom: 8px;">
                      <strong style="color: #1976d2; font-family: Arial, sans-serif;">🔄 Activities:</strong>
                    </div>
                    <ul style="margin: 8px 0; padding-left: 20px; font-family: Arial, sans-serif;">
                      ${lesson.activities.map(act => `
                        <li style="margin-bottom: 5px; color: #666; font-size: 13px;">
                          ${sanitizeHtml(act, { allowedTags: [], allowedAttributes: {} })}
                        </li>
                      `).join('')}
                    </ul>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Homework -->
              ${lesson.homework ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="margin-bottom: 8px;">
                      <strong style="color: #f57c00; font-family: Arial, sans-serif;">📝 Homework:</strong>
                    </div>
                    <p style="margin: 0; color: #666; font-size: 13px; font-family: Arial, sans-serif; word-break: break-word;">
                      ${sanitizeHtml(lesson.homework, { allowedTags: ['em', 'strong'], allowedAttributes: {} })}
                    </p>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Materials -->
              ${lesson.materials && Array.isArray(lesson.materials) && lesson.materials.length > 0 ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="margin-bottom: 8px;">
                      <strong style="color: #7b1fa2; font-family: Arial, sans-serif;">📚 Materials:</strong>
                    </div>
                    <div style="display: inline-block;">
                      ${lesson.materials.map(material => `
                        <a href="${material.url || '#'}" target="_blank" style="
                          background: #fff; 
                          color: #1976d2; 
                          padding: 6px 12px; 
                          border-radius: 6px; 
                          text-decoration: none; 
                          border: 1px solid #1976d2; 
                          font-size: 12px; 
                          margin-right: 8px; 
                          margin-bottom: 8px; 
                          display: inline-block;
                          font-family: Arial, sans-serif;
                        ">
                          ${sanitizeHtml(material.name || 'Material', { allowedTags: [], allowedAttributes: {} })} 
                          ${material.type ? `(${material.type})` : ''}
                        </a>
                      `).join('')}
                    </div>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Teacher Notes -->
              ${lesson.notes ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <div style="margin-bottom: 8px;">
                      <strong style="color: #d32f2f; font-family: Arial, sans-serif;">💭 Teacher Notes:</strong>
                    </div>
                    <p style="margin: 0; color: #666; font-size: 13px; font-style: italic; font-family: Arial, sans-serif; word-break: break-word;">
                      ${sanitizeHtml(lesson.notes, { allowedTags: ['em', 'strong'], allowedAttributes: {} })}
                    </p>
                  </td>
                </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  // Generate personalized encouragement message (Enhanced with Phase 1 & 2)
  const getEncouragementMessage = () => {
    const messages = [];
    
    // Phase 1: Try natural encouragement first
    const naturalEncouragement = getNaturalEncouragement({ attendance, grades, behavior, lessons });
    if (naturalEncouragement) {
      messages.push(naturalEncouragement.replace(/\[student\]/gi, studentFirstName));
    }
    
    // Fallback to original logic if no natural encouragement
    if (messages.length === 0) {
    if (averageGrade >= 90) {
      messages.push(`${studentFirstName} is excelling academically! What a bright ${pronouns.title} ${pronouns.subject} is! 🎉`);
    } else if (averageGrade >= 80) {
      messages.push(`${studentFirstName} is doing great work! ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} is showing strong understanding and dedication! 🚀`);
    } else if (averageGrade >= 70) {
      messages.push(`${studentFirstName} is making good progress. Let's continue supporting ${pronouns.object} to reach ${pronouns.possessive} full potential! 📚`);
    } else {
      messages.push(`${studentFirstName} is working hard. Let's collaborate to help ${pronouns.object} succeed and build confidence! 🤝`);
    }

    if (attendanceRate >= 95) {
      messages.push(`${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} maintains an excellent attendance record - what a responsible ${pronouns.title}! 📅`);
    }

    if (behavior && behavior.some(b => b.type === "Positive")) {
      messages.push(`${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} showed wonderful behavior today! ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} is truly a role model for others! 🌟`);
    }

    // Add lesson-specific encouragement (only if lessons exist and are enabled)
    if (lessons && Array.isArray(lessons) && lessons.length > 0 && contentFilter.shouldIncludeSection('lessons', data)) {
      try {
        const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
        const subjects = [...new Set(lessons.map(lesson => lesson.subject || 'Unknown Subject').filter(subject => subject !== 'Unknown Subject'))];
        
        if (subjects.length > 0) {
          messages.push(`Today ${pronouns.subject} engaged in ${lessons.length} enriching lessons across ${subjects.join(', ')} for a total of ${totalDuration} minutes of active learning! 📚✨`);
        } else {
          // Fallback message when subjects are not available
          messages.push(`Today ${pronouns.subject} engaged in ${lessons.length} enriching lessons for a total of ${totalDuration} minutes of active learning! 📚✨`);
        }
      } catch (error) {
        console.error('Error processing lesson encouragement:', error);
        // Continue without lesson encouragement if there's an error
        }
      }
    }

    return messages.length > 0 ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 15px 20px; border-radius: 8px; border-left: 4px solid #4caf50; font-weight: 500; color: #2e7d32; font-family: Arial, sans-serif;">
            ${messages.join(" ")}
          </td>
        </tr>
      </table>
    ` : "";
  };

  const attendanceStatusData = getAttendanceStatus();

  const computedSubject = subjectFromTemplate() || `${schoolName} - Daily Update for ${studentName} (${dayjs(date).format("MMM DD, YYYY")})`;

  return {
    subject: computedSubject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            /* Reset styles for email clients */
            body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            
            /* Base styles */
            body { 
              margin: 0 !important;
              padding: 0 !important;
              background-color: #f4f4f4 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 14px !important;
              line-height: 1.6 !important;
              color: #333333 !important;
            }
            
            /* Container styles */
            .email-container {
              max-width: 600px !important;
              margin: 0 auto !important;
              background-color: #ffffff !important;
            }
            
            /* Header styles */
            .header {
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
              color: #ffffff !important;
              text-align: center !important;
              padding: 30px 20px !important;
              position: relative !important;
            }
            
            .school-title {
              margin: 0 0 10px 0 !important;
              font-size: 28px !important;
              font-weight: 300 !important;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .date-badge {
              background-color: rgba(255,255,255,0.2) !important;
              color: #ffffff !important;
              padding: 8px 20px !important;
              border-radius: 25px !important;
              display: inline-block !important;
              font-weight: 500 !important;
              font-size: 14px !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            /* Content styles */
            .content {
              padding: 30px 20px !important;
            }
            
            .greeting {
              margin: 0 0 20px 0 !important;
              font-size: 16px !important;
              line-height: 1.6 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .greeting.main {
              font-size: 18px !important;
              font-weight: 500 !important;
              color: #1976d2 !important;
            }
            
            /* Summary grid - fallback to table layout */
            .summary-grid {
              width: 100% !important;
              margin: 25px 0 !important;
            }
            
            .summary-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
              padding: 20px 15px !important;
              border-radius: 10px !important;
              text-align: center !important;
              border: 1px solid #dee2e6 !important;
              margin-bottom: 15px !important;
            }
            
            .summary-value {
              font-size: 24px !important;
              font-weight: bold !important;
              margin-bottom: 5px !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .summary-label {
              font-size: 12px !important;
              color: #6c757d !important;
              text-transform: uppercase !important;
              font-weight: 500 !important;
              letter-spacing: 0.5px !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            /* Section styles */
            .section {
              margin: 25px 0 !important;
              background-color: #fafafa !important;
              border-radius: 10px !important;
              border: 1px solid #e0e0e0 !important;
              overflow: hidden !important;
            }
            
            .section-title {
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
              color: #ffffff !important;
              font-size: 16px !important;
              font-weight: 600 !important;
              padding: 15px 20px !important;
              margin: 0 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .section-content {
              padding: 20px !important;
            }
            
            /* Attendance status */
            .attendance-status {
              font-size: 20px !important;
              font-weight: bold !important;
              text-align: center !important;
              padding: 20px !important;
              border-radius: 8px !important;
              margin: 15px 0 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            /* Contact info */
            .contact-info {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
              padding: 25px !important;
              border-radius: 10px !important;
              margin: 30px 0 !important;
              border: 1px solid #90caf9 !important;
            }
            
            .contact-info p {
              margin: 8px 0 !important;
              line-height: 1.6 !important;
              font-size: 14px !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .teacher-signature {
              margin-top: 15px !important;
              padding-top: 15px !important;
              border-top: 1px solid rgba(25, 118, 210, 0.2) !important;
            }
            
            .teacher-signature p {
              margin: 4px 0 !important;
              font-size: 14px !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            /* Footer */
            .footer {
              background-color: #f5f5f5 !important;
              padding: 20px !important;
              text-align: center !important;
              font-size: 13px !important;
              color: #666 !important;
              border-top: 1px solid #e0e0e0 !important;
            }
            
            .footer p {
              margin: 5px 0 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            /* Responsive design */
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                min-width: 100% !important;
              }
              
              .content {
                padding: 15px !important;
              }
              
              .header {
                padding: 20px 15px !important;
              }
              
              .school-title {
                font-size: 24px !important;
              }
              
              .date-badge {
                font-size: 12px !important;
                padding: 6px 15px !important;
              }
              
              .summary-card {
                padding: 15px !important;
                margin-bottom: 10px !important;
              }
              
              .summary-value {
                font-size: 20px !important;
              }
              
              .section-content {
                padding: 15px !important;
              }
              
              .section-title {
                font-size: 14px !important;
                padding: 12px 15px !important;
              }
              
            .contact-info {
                padding: 15px !important;
              }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #1a1a1a !important;
                color: #ffffff !important;
              }
              
              .email-container {
                background-color: #2d2d2d !important;
              }
              
              .section {
                background-color: #3d3d3d !important;
                border-color: #4d4d4d !important;
              }
            }
            
            /* Print styles */
            @media print {
              body {
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              
              .email-container {
                box-shadow: none !important;
                border: 1px solid #000000 !important;
              }
            }
            
            /* Lesson section specific styles */
            .lesson-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
              border: 1px solid #dee2e6 !important;
              border-radius: 12px !important;
              padding: 20px !important;
              margin-bottom: 20px !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            }
            
            .lesson-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              margin-bottom: 15px !important;
              padding-bottom: 10px !important;
              border-bottom: 2px solid #e9ecef !important;
            }
            
            .lesson-title {
              color: #1976d2 !important;
              margin: 0 !important;
              font-size: 18px !important;
              font-weight: 600 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .lesson-duration {
              background: #e3f2fd !important;
              color: #1976d2 !important;
              padding: 4px 12px !important;
              border-radius: 20px !important;
              font-size: 12px !important;
              font-weight: 500 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .lesson-description {
              color: #555 !important;
              margin-bottom: 15px !important;
              line-height: 1.6 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .lesson-objectives, .lesson-activities, .lesson-homework, .lesson-materials, .lesson-notes {
              margin-bottom: 15px !important;
            }
            
            .lesson-objectives ul, .lesson-activities ul {
              margin: 8px 0 !important;
              padding-left: 20px !important;
            }
            
            .lesson-objectives li, .lesson-activities li {
              margin-bottom: 5px !important;
              color: #666 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .materials-list {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 8px !important;
              margin-top: 8px !important;
            }
            
            .material-link {
              background: #fff !important;
              color: #1976d2 !important;
              padding: 6px 12px !important;
              border-radius: 6px !important;
              text-decoration: none !important;
              border: 1px solid #1976d2 !important;
              font-size: 12px !important;
              transition: all 0.2s ease !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            .material-link:hover {
              background: #1976d2 !important;
              color: #fff !important;
            }
          </style>
        </head>
        <body>
          <!--[if mso]>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center">
          <tr>
          <td>
          <![endif]-->
          
          <div class="email-container">
            <!-- Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="header">
              <h1 class="school-title">${schoolName}</h1>
              <div class="date-badge">
                📚 Daily Update - ${dayjs(date).format("dddd, MMMM DD, YYYY")}
              </div>
                </td>
              </tr>
            </table>

            <!-- Content -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="content">
              <p class="greeting main">Dear ${safeSalutation},</p>
                  <p class="greeting">
                    ${(() => {
                      // Phase 2: Try teacher personality first (if preferences are set)
                      if (teacherPreferences && teacherPreferences.tone) {
                        const personalityGreeting = getTeacherPersonalityGreeting(teacherPreferences);
                        return personalityGreeting.replace(/\[student\]/gi, studentFirstName);
                      }
                      
                      // Phase 1: Try contextual greeting
                      const contextualGreeting = getContextualGreeting({ attendance, grades, behavior, lessons });
                      if (contextualGreeting) {
                        return contextualGreeting.replace(/\[student\]/gi, studentFirstName);
                      }
                      
                                            // Phase 1: Fallback to dynamic greeting
                      const dynamicGreeting = getDynamicGreeting({ date });
                      return `${dynamicGreeting} ${studentFirstName} had a great day!`;
                    })()}
                  </p>
                  
                  <!-- Phase 2: Student-specific opening (optional) -->
                  ${(() => {
                    if (teacherPreferences && teacherPreferences.focus === "student") {
                      const studentOpening = getStudentSpecificOpening({ firstName: studentFirstName }, { attendance, grades, behavior, lessons });
                      return `<p class="greeting">${studentOpening}</p>`;
                    }
                    return '';
                  })()}

              ${getEncouragementMessage()}

              <!-- Quick Summary -->
                  ${!contentFilter.shouldIncludeSection('attendance', data) && !contentFilter.shouldIncludeSection('subjectGrades', data) && !contentFilter.shouldIncludeSection('lessons', data) ? '' : `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-grid">
                    <tr>
                      <td style="padding: 0 7.5px 0 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
                  <div class="summary-value" style="color: ${averageGrade !== null ? getGradeColor(averageGrade) : '#666'};">
                    ${averageGrade !== null ? `${averageGrade}%` : 'N/A'}
                  </div>
                  <div class="summary-label">Average Grade</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="padding: 0 7.5px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
                  <div class="summary-value" style="color: ${attendance.status === "Present" ? "#2e7d32" : attendance.status === "Tardy" ? "#f57c00" : "#d32f2f"};">
                    ${attendanceRate}%
                  </div>
                  <div class="summary-label">Attendance Rate</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      ${contentFilter.shouldIncludeSection('lessons', data) && lessons && Array.isArray(lessons) && lessons.length > 0 ? `
                      <td style="padding: 0 0 0 7.5px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
                  <div class="summary-value" style="color: #1976d2;">
                    ${lessons.length}
                  </div>
                  <div class="summary-label">Lessons Today</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      ` : ''}
                    </tr>
                  </table>
                  `}

              <!-- Subject Grades Section -->
                  ${!contentFilter.shouldIncludeSection('subjectGrades', data) ? '' : `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">📊 Subject Grades</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                  ${formatSubjectGrades(subjectGrades)}
                      </td>
                    </tr>
                  </table>`}

              <!-- Attendance Section -->
                  ${!contentFilter.shouldIncludeSection('attendance', data) ? '' : `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">📅 Today\'s Attendance</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                        <div class="attendance-status" style="background-color: ${attendanceStatusData.bg};">
                    ${attendanceStatusData.html}
                    ${attendance.notes ? `<br><small style="color: #666; font-weight: normal; font-family: Arial, Helvetica, sans-serif;">${sanitizeHtml(attendance.notes, { allowedTags: [], allowedAttributes: {} })}</small>` : ""}
                  </div>
                      </td>
                    </tr>
                  </table>`}

              <!-- Today\'s Lessons Section -->
                  ${contentFilter.shouldIncludeSection('lessons', data) && lessons && Array.isArray(lessons) && lessons.length > 0 ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">
                        📚 Today\'s Lessons
                        ${lessonSummary && lessonSummary.totalLessons ? `
                          <span style="font-size: 14px; font-weight: normal; opacity: 0.8; margin-left: 10px;">
                            (${lessonSummary.totalLessons} lessons, ${lessonSummary.totalDuration || 0} minutes)
                          </span>
                        ` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td class="section-content">
                        ${formatLessons(lessons)}
                      </td>
                    </tr>
                  </table>` : ''}

              <!-- Today\'s Activities Section -->
                  ${contentFilter.shouldIncludeSection('assignments', data) && assignments && assignments.length > 0 ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">📝 Today\'s Activities</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                        ${formatAssignments(assignments)}
                      </td>
                    </tr>
                  </table>` : ''}

              <!-- New Grades -->
              ${!contentFilter.shouldIncludeSection('grades', data) ? '' : (grades && grades.length > 0 ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                      <tr>
                        <td class="section-title">📊 Recent Grades & Assessments</td>
                      </tr>
                      <tr>
                        <td class="section-content">
                    ${formatGrades(grades)}
                        </td>
                      </tr>
                    </table>
              ` : '')}

              <!-- Behavior Summary -->
                  ${!contentFilter.shouldIncludeSection('behavior', data) ? '' : `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">🌟 Behavior & Social Learning</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                  ${formatBehavior(behavior)}
                      </td>
                    </tr>
                  </table>`}

              <!-- Upcoming Assignments -->
                  ${!contentFilter.shouldIncludeSection('upcoming', data) ? '' : `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">⏰ Upcoming Due Dates</td>
                    </tr>
                    <tr>
                      <td class="section-content" style="margin-bottom: 8px;">
                  ${formatUpcoming(upcomingAssignments)}
                  </td>
                </tr>
              </table>
            `}

              <!-- Contact Information -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="contact-info">
                <p><strong>💌 I\'m here to support ${studentFirstName}\'s success!</strong></p>
                        <p>If you have any questions, concerns, or would like to discuss ${pronouns.possessive} progress, please don\'t hesitate to reach out. I believe that strong communication between home and school is key to ${pronouns.possessive} success. Your ${pronouns.child} is making wonderful progress, and I\'m excited to see ${pronouns.object} continue to grow!</p>
                <p><strong>📧 Email:</strong> ${teacherEmail || 'Available upon request'}</p>
                <div class="teacher-signature">
                  <p><strong>Warm regards,</strong></p>
                  <p><strong>${teacherName}</strong></p>
                  <p>${schoolName}</p>
                </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="footer">
              <p>📤 This update was sent on ${dayjs().format("MMMM DD, YYYY [at] h:mm A")}</p>
                  <p>💙 Thank you for being an amazing partner in your ${pronouns.child}\'s education!</p>
                </td>
              </tr>
            </table>
            </div>
          
          <!--[if mso]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </body>
      </html>
    `,
  };
};
