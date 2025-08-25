import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear.js";
dayjs.extend(dayOfYear);
import sanitizeHtml from "sanitize-html";

// Import character traits service
import { getCurrentMonthTrait, getDailyQuote, getDailyChallenge } from "../services/characterTraitsService.js";
import { createEmailContentFilter } from "../services/EmailContentFilter.js";

// ------------------------------
// Context Normalization (new + legacy)
// ------------------------------
const normalizeContext = (input) => {
  const data = input || {};

  // Legacy fields
  const legacyStudentName = data.studentName;
  const legacyDate = data.date;
  const legacySchoolName = data.schoolName;
  const legacyTeacherName = data.teacherName;
  const legacyAssignments = data.assignments || [];
  const legacyGrades = data.grades || [];
  const legacyLessons = data.lessons || [];
  const legacyUpcoming = data.upcomingAssignments || [];
  const legacySubjectGrades = data.subjectGrades || {};
  const legacyOverallGrade = data.overallGrade;

  // New context fields from plan
  const student = data.student || {};
  const classContexts = data.classContexts || [];
  const assignmentsDueSoon = data.assignmentsDueSoon || legacyUpcoming || [];
  const newGrades = data.newGrades || legacyGrades || [];
  const attendanceSummary = data.attendanceSummary || data.attendance || null;
  const behaviorHighlights = data.behaviorHighlights || data.behavior || [];
  const reminders = data.reminders || [];
  const encouragement = data.encouragement || null;
  const locale = data.locale || null;
  const dateRange = data.dateRange || null;
  const schoolName = data.schoolName || legacySchoolName || "School";
  const teacherName = data.teacherName || legacyTeacherName || "Your Teacher";
  const userId = data.userId || null; // Add userId for character traits
  
  // Create centralized content filter for student emails
  const contentFilter = createEmailContentFilter(data.emailPreferences || {}, 'student');

  // Compute canonical fields
  const studentName = (student.name || legacyStudentName || "Student").trim();
  const firstName = student.firstName || (studentName || "Student").split(" ")[0];
  const date = dateRange?.end || legacyDate || new Date();

  // Map optional legacy fields that we still render if present
  const lessons = Array.isArray(data.lessons)
    ? data.lessons
    : Array.isArray(legacyLessons)
    ? legacyLessons
    : [];

  // Today's assignments (activities)
  const assignments = Array.isArray(data.assignments)
    ? data.assignments
    : Array.isArray(legacyAssignments)
    ? legacyAssignments
    : [];

  // Subject grades and overall grade if provided (optional)
  const subjectGrades = data.subjectGrades || legacySubjectGrades || {};
  const overallGrade =
    typeof data.overallGrade === "number"
      ? data.overallGrade
      : typeof legacyOverallGrade === "number"
      ? legacyOverallGrade
      : null;

  return {
    // canonical
    studentName,
    firstName,
    date,
    schoolName,
    teacherName,
    assignmentsDueSoon,
    newGrades,
    attendanceSummary,
    behaviorHighlights,
    reminders,
    encouragement,
    locale,
    classContexts,
    userId, // Include userId
    // optional/legacy-friendly
    lessons,
    assignments,
    subjectGrades,
    overallGrade,
    // Content filter for centralized filtering
    contentFilter,
    // Email content library for personalization
    emailContentLibrary: data.emailContentLibrary || {},
  };
};

// ------------------------------
// Utilities
// ------------------------------
const safe = (val) => sanitizeHtml(val || "", { allowedTags: ["em", "strong"], allowedAttributes: {} });

const formatList = (items, mapper) => {
  if (!items || items.length === 0) return '<p style="color:#666">Nothing for now.</p>';
  return `
    <ul style="margin:8px 0; padding-left:18px; color:#444;">
      ${items.map(mapper).join("")}
    </ul>`;
};

const formatLessons = (lessons, getPersonalizedContent, studentName, firstName) => {
  if (!lessons || lessons.length === 0) {
    // Use personalized content for empty state message
    const emptyMessage = getPersonalizedContent('lessonEmptyStates', 'No lessons recorded for today - but every day is a learning adventure! 🌟');
    return `<p style="color:#666; text-align:center; font-style:italic;">${safe(emptyMessage)}</p>`;
  }
  
  // Group lessons by subject like the parent email does
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
  
  const lessonsBySubject = groupLessonsBySubject(lessons);
  
  return Object.entries(lessonsBySubject).map(([subject, subjectLessons]) => `
    <div style="margin-bottom: 25px;">
      <h4 style="margin: 0 0 15px 0; color: #1459a9; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', sans-serif; border-bottom: 2px solid #e3f2fd; padding-bottom: 8px;">
        ${getPersonalizedContent('lessonTitlePrefixes', '📚')} ${safe(subject)}
      </h4>
      ${subjectLessons.map(lesson => formatIndividualLesson(lesson, getPersonalizedContent)).join('')}
    </div>
  `).join('');
};

// Format individual lesson with ALL the dynamic data from frontend
const formatIndividualLesson = (lesson, getPersonalizedContent) => {
  // Ensure all lesson fields are properly handled with fallbacks
  const safeLesson = {
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
  };
  
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
                      <h4 style="margin: 0; color: #1459a9; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', sans-serif; word-break: break-word;">
                        ${getPersonalizedContent('lessonTitlePrefixes', '📚')} ${safe(safeLesson.title)}
                      </h4>
                    </td>
                    <td align="right" style="width: 80px;">
                      <span style="background: #e3f2fd; color: #1459a9; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; font-family: 'Segoe UI', sans-serif;">
                        ${safeLesson.duration} min
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Lesson Description -->
            ${safeLesson.description ? `
              <tr>
                <td style="padding: 15px 0 10px 0;">
                  <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; font-family: 'Segoe UI', sans-serif; word-break: break-word;">
                    ${safe(safeLesson.description)}
                  </p>
                </td>
              </tr>
            ` : ''}
            
            <!-- Learning Objectives -->
            ${safeLesson.learningObjectives && safeLesson.learningObjectives.length > 0 ? `
              <tr>
                <td style="padding: 10px 0;">
                  <div style="margin-bottom: 8px;">
                    <strong style="color: #2e7d32; font-family: 'Segoe UI', sans-serif;">🎯 Learning Objectives:</strong>
                  </div>
                  <ul style="margin: 8px 0; padding-left: 20px; font-family: 'Segoe UI', sans-serif;">
                    ${safeLesson.learningObjectives.map(obj => `
                      <li style="margin-bottom: 5px; color: #666; font-size: 13px;">
                        ${safe(obj)}
                      </li>
                    `).join('')}
                  </ul>
                </td>
              </tr>
            ` : ''}
            
            <!-- Activities -->
            ${safeLesson.activities && safeLesson.activities.length > 0 ? `
              <tr>
                <td style="padding: 10px 0;">
                  <div style="margin-bottom: 8px;">
                    <strong style="color: #1976d2; font-family: 'Segoe UI', sans-serif;">🔄 Activities:</strong>
                  </div>
                  <ul style="margin: 8px 0; padding-left: 20px; font-family: 'Segoe UI', sans-serif;">
                    ${safeLesson.activities.map(act => `
                      <li style="margin-bottom: 5px; color: #666; font-size: 13px;">
                        ${safe(act)}
                      </li>
                    `).join('')}
                  </ul>
                </td>
              </tr>
            ` : ''}
            
            <!-- Homework -->
            ${safeLesson.homework ? `
              <tr>
                <td style="padding: 10px 0;">
                  <div style="margin-bottom: 8px;">
                    <strong style="color: #f57c00; font-family: 'Segoe UI', sans-serif;">📝 Homework:</strong>
                  </div>
                  <p style="margin: 0; color: #666; font-size: 13px; font-family: 'Segoe UI', sans-serif; word-break: break-word;">
                    ${safe(safeLesson.homework)}
                  </p>
                </td>
              </tr>
            ` : ''}
            
            <!-- Materials -->
            ${safeLesson.materials && safeLesson.materials.length > 0 ? `
              <tr>
                <td style="padding: 10px 0;">
                  <div style="margin-bottom: 8px;">
                    <strong style="color: #7b1fa2; font-family: 'Segoe UI', sans-serif;">📚 Materials:</strong>
                  </div>
                  <div style="display: inline-block;">
                    ${safeLesson.materials.map(material => `
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
                        font-family: 'Segoe UI', sans-serif;
                      ">
                        ${safe(material.name || 'Material')} 
                        ${material.type ? `(${safe(material.type)})` : ''}
                      </a>
                    `).join('')}
                  </div>
                </td>
              </tr>
            ` : ''}
            
            <!-- Teacher Notes -->
            ${safeLesson.notes ? `
              <tr>
                <td style="padding: 10px 0;">
                  <div style="margin-bottom: 8px;">
                    <strong style="color: #d32f2f; font-family: 'Segoe UI', sans-serif;">💭 Teacher Notes:</strong>
                  </div>
                  <p style="margin: 0; color: #666; font-size: 13px; font-style: italic; font-family: 'Segoe UI', sans-serif; word-break: break-word;">
                    ${safe(safeLesson.notes)}
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



const getGradeColor = (percentage) => {
  if (percentage >= 90) return "#2e7d32"; // Green
  if (percentage >= 80) return "#1976d2"; // Blue
  if (percentage >= 70) return "#f57c00"; // Orange
  return "#d32f2f"; // Red
};

// Character traits helper functions - REMOVED DUPLICATE
// const getCurrentMonthTrait = async (date) => {
//   try {
//     // This would be called from the cloud function context where we have access to Firestore
//     // For now, return null to use built-in fallbacks
//     return null;
//   } catch (error) {
//     console.warn("Could not load current month trait:", error);
//     return null;
//   }
// };

const getBuiltInQuotes = (weekday, isWeekend, studentId = null) => {
  // Week structure: Sunday(0) -> Monday(1) -> Tuesday(2) -> Wednesday(3) -> Thursday(4) -> Friday(5) -> Saturday(6)
  // Weekends: Friday(5) and Saturday(6)
  const generalQuotes = [
    'Small steps every day add up to big results. 🌱',
    'Mistakes help your brain grow. Keep going! 🧠',
    'Your effort matters more than being perfect. ⭐',
    'Be kind, be curious, be you. 💙',
    'Every challenge makes you stronger. 💪',
    'You have amazing potential inside you. ✨',
    'Learning is an adventure - enjoy the journey! 🗺️',
    'Your kindness makes the world better. 🌍',
    'Believe in yourself - you can do it! 🚀',
    'Today is a new opportunity to shine. 🌟'
  ];

  const weekdayQuotes = {
    0: ['Fresh start, new week—one curious question can lead to big discoveries. 🌟', 'Sunday is perfect for planning your week ahead. 📝'],
    1: ['Monday motivation: Start strong and stay curious! 🔍', 'New week, new opportunities to learn and grow. 🌱'],
    2: ['Tuesday tip: Ask one "why" question today. ❓', 'Keep that learning momentum going! 🚀'],
    3: ['Wednesday wisdom: You\'re halfway through the week! 🎯', 'Stay curious about everything around you. 👀'],
    4: ['Thursday thought: Week is ending! Plan one mini curiosity-quest for the weekend. 🔎✨', 'Finish the week strong with one new discovery! 💡'],
    5: ['Friday feeling: Weekend is here! Time to explore and satisfy your curiosity! 🧪🎉', 'Weekend curiosity mission starts now! 🚀'],
    6: ['Saturday spirit: Weekends are perfect for wonder. Notice something new today. 👀', 'Time to explore and satisfy your curiosity! 🔍']
  };

  const weekendQuotes = [
    'Weekend wonder time! What will you discover today? 🔍',
    'Perfect day for a mini curiosity adventure! 🗺️',
    'Weekends are made for exploring and learning! 🌟'
  ];

  let pool = [...generalQuotes];
  
  if (weekdayQuotes[weekday]) {
    pool = pool.concat(weekdayQuotes[weekday]);
  }
  
  if (isWeekend && weekendQuotes.length > 0) {
    pool = pool.concat(weekendQuotes);
  }

  // Use student ID for unique selection if available
  if (studentId) {
    const seed = `${studentId}-${weekday}-${isWeekend ? 'weekend' : 'weekday'}`;
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % pool.length;
    return pool[index];
  }

  // Fallback: use day-of-year for deterministic selection when no student ID
  const doy = dayjs(new Date()).dayOfYear();
  const index = doy % pool.length;
  return pool[index];
};

const getBuiltInChallenges = (weekday, traitName = null, studentId = null) => {
  // Week structure: Sunday(0) -> Monday(1) -> Tuesday(2) -> Wednesday(3) -> Thursday(4) -> Friday(5) -> Saturday(6)
  // Weekends: Friday(5) and Saturday(6)
  const generalChallenges = [
    'Ask one curious question in class today ❓',
    'Find 3 new words while reading and use one in a sentence 📖',
    'Try a short "what if" brainstorm about a topic you love 💡',
    'Observe something at home/school and write one thing you wonder 👀',
    'Teach a friend one cool fact you learned and ask their question 🤝',
    'Draw a tiny diagram of something you\'re curious about ✍️',
    'Find a safe mini-experiment to try (with an adult\'s help) 🧪',
    'Read for 10 minutes and jot down 2 curious thoughts 📝'
  ];

  const traitChallenges = {
    Confidence: [
      'Stand up for what you believe is right today 💪',
      'Share your unique perspective in class discussion 🗣️',
      'Try something new that challenges your comfort zone 🌟'
    ],
    Hope: [
      'Help someone who might need encouragement today 🤝',
      'Write down one thing you\'re hopeful about for tomorrow ✨',
      'Share a positive message with a classmate 💙'
    ],
    Wisdom: [
      'Think before you speak - choose your words carefully 🧠',
      'Ask a thoughtful question that helps others think deeper ❓',
      'Make a decision based on what you know is right, not just what\'s easy ⚖️'
    ]
  };

  let pool = [...generalChallenges];
  
  if (traitName && traitChallenges[traitName]) {
    pool = pool.concat(traitChallenges[traitName]);
  }

  // Add weekend-specific challenges for Thursday (plan) and Friday/Saturday (do)
  if (weekday === 4) { // Thursday - week ending, plan weekend
    pool.push('Plan a weekend curiosity mission: list materials and 1 step 🗺️');
    pool.push('Think of one thing you want to learn about this weekend 📚');
  } else if (weekday === 5 || weekday === 6) { // Friday/Saturday - weekend
    pool.push('Try your weekend curiosity quest and reflect on 1 discovery 🌟');
    pool.push('Do one thing today that makes you wonder about the world 🔍');
  }

  // Use student ID for unique selection if available
  if (studentId) {
    const seed = `${studentId}-${weekday}-${traitName || 'general'}`;
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % pool.length;
    return pool[index];
  }

  // Fallback: use day-of-year for deterministic selection when no student ID
  const doy = dayjs(new Date()).dayOfYear();
  const index = doy % pool.length;
  return pool[index];
};

// ------------------------------
// Allowed content toggles (student-facing)
// ------------------------------
export const allowedContentToggles = [
  "assignments", // worked on today (if provided)
  "grades", // new grades today
  "lessons", // lessons today (if provided)
  "upcoming", // assignments due soon
  "attendance",
  "behavior",
  "reminders",
  "encouragement",
  "helpfulLinks",
];

// For backward compatibility with existing imports
export const studentAllowedContentToggles = allowedContentToggles;

// ------------------------------
// Subject, HTML, and Text builders
// ------------------------------
export const buildSubject = (context) => {
  console.log("buildSubject called with context:", {
    hasContext: !!context,
    contextKeys: context ? Object.keys(context) : [],
    studentName: context?.studentName,
    firstName: context?.firstName,
    date: context?.date
  });
  
  const { firstName, date, schoolName } = normalizeContext(context);
  
  console.log("buildSubject normalized data:", {
    firstName,
    date,
    schoolName
  });
  
  const subject = `${schoolName} - Your Daily Spark, ${firstName}! (${dayjs(date).format("MMM DD")})`;
  console.log("buildSubject generated subject:", subject);
  
  return subject;
};

export const buildHtml = async (context) => {
  const ctx = normalizeContext(context);
  const {
    firstName,
    studentName,
    date,
    schoolName,
    teacherName,
    assignmentsDueSoon,
    assignments,
    newGrades,
    attendanceSummary,
    behaviorHighlights,
    reminders,
    encouragement,
    lessons,
    subjectGrades,
    overallGrade,
    userId,
    contentFilter,
  } = ctx;

  // Debug logging for student email preferences
  console.log("Student email template - studentEmailPreferences:", {
    studentName,
    firstName,
    date,
    hasContentFilter: !!contentFilter,
    // Check what data we have
    hasLessons: !!lessons,
    lessonsCount: lessons?.length || 0,
    hasAttendance: !!attendanceSummary,
    hasBehavior: !!behaviorHighlights,
    hasGrades: !!newGrades,
    gradesCount: newGrades?.length || 0,
    hasAssignments: !!assignmentsDueSoon,
    assignmentsCount: assignmentsDueSoon?.length || 0,
  });

  // Get email content library from passed context
  let emailContentLibrary = ctx.emailContentLibrary || {};

  // Helper function to get personalized content with deterministic daily rotation
  const getPersonalizedContent = (contentType, fallback) => {
    try {
      console.log(`getPersonalizedContent called for ${contentType}:`, {
        hasEmailContentLibrary: !!emailContentLibrary,
        emailContentLibraryKeys: Object.keys(emailContentLibrary || {}),
        contentType,
        templatesCount: (emailContentLibrary[contentType] || []).length,
        firstName,
        studentName
      });
      
      const templates = emailContentLibrary[contentType] || [];
      if (templates.length > 0) {
        // ROTATION SYSTEM: Each student gets a different header each day
        // - Uses day-of-year (1-365) to ensure daily variety
        // - Each student has a unique seed to stagger their rotation
        // - With 33-40 content items, students will cycle through in ~1-2 months
        // - This provides good variety while allowing content to repeat naturally
        const dayOfYear = dayjs(date).dayOfYear();
        const studentId = studentName || firstName || 'student';
        
        // Create a unique seed for each student to stagger their rotation
        const studentSeed = studentId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        // Combine day of year with student seed for deterministic rotation
        // This ensures each student sees different content each day
        const rotationIndex = (dayOfYear + studentSeed) % templates.length;
        const selected = templates[rotationIndex];
        
        if (selected) {
          // Replace placeholders in the template
          const personalizedContent = selected
            .replace(/{firstName}/g, firstName || 'Student')
            .replace(/{studentName}/g, studentName || 'Student')
            .replace(/{schoolName}/g, schoolName || 'School')
            .replace(/{teacherName}/g, teacherName || 'Your Teacher');
          
          console.log(`Personalized content for ${contentType}:`, {
            original: selected,
            personalized: personalizedContent,
            firstName,
            studentName
          });
          
          return safe(personalizedContent); // Apply safe here
        }
      }
    } catch (error) {
      console.warn(`Error getting personalized content for ${contentType}:`, error);
    }
    return fallback;
  };

  // Get personalized theme with deterministic daily rotation
  const getPersonalizedTheme = () => {
    try {
      const themes = emailContentLibrary.visualThemes || [];
      if (themes.length > 0) {
        // Deterministic daily rotation for themes
        // With 3-4 theme options, students will cycle through themes every few days
        const dayOfYear = dayjs(date).dayOfYear();
        const studentId = studentName || firstName || 'student';
        
        // Create a unique seed for each student to stagger their theme rotation
        const studentSeed = studentId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        // Combine day of year with student seed for deterministic rotation
        const rotationIndex = (dayOfYear + studentSeed) % themes.length;
        const selected = themes[rotationIndex];
        
        if (selected) {
          return {
            primary: selected.primary || "#1459a9",
            secondary: selected.secondary || "#ed2024",
            header: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)",
            winsBorder: selected.winsBorder || "#1459a9",
            assignmentsBorder: selected.assignmentsBorder || "#ed2024",
            starsBorder: selected.starsBorder || "#ed2024"
          };
        }
      }
    } catch (error) {
      console.warn("Error getting personalized theme:", error);
    }
    return {
      primary: "#1459a9",
      secondary: "#ed2024",
      header: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)",
      winsBorder: "#1459a9",
      assignmentsBorder: "#ed2024",
      starsBorder: "#ed2024"
    };
  };

  const theme = getPersonalizedTheme();

  const gradesSummary = () => {
    const entries = Object.entries(subjectGrades || {});
    if (entries.length === 0 && overallGrade == null) {
      return '<p style="color:#666">No grades yet.</p>';
    }
    const parts = [];
    if (entries.length) {
      parts.push(
        `<div>${entries
          .map(([subj, g]) => `<div style=\"margin:4px 0\"><strong>${safe(subj)}:</strong> ${g}%</div>`)
          .join("")}</div>`
      );
    }
    if (overallGrade != null) {
      parts.push(`<div style=\"margin-top:6px\"><strong>Overall:</strong> ${overallGrade}%</div>`);
    }
    return parts.join("");
  };

  // Compute average grade for a simple progress meter
  const computeAverage = () => {
    try {
      const entries = Object.values(subjectGrades || {});
      if (typeof overallGrade === "number") return overallGrade;
      if (Array.isArray(entries) && entries.length > 0) {
        const sum = entries.reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
        const count = entries.filter(v => typeof v === 'number').length;
        return count > 0 ? Math.round(sum / count) : null;
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  const averageForBar = computeAverage();

  const progressMeter = () => {
    if (averageForBar == null) return '';
    const width = Math.max(0, Math.min(100, averageForBar));
    const color = getGradeColor(width);
    const message = width >= 90
      ? getPersonalizedContent('progressMessages', 'On fire! 🔥')
      : width >= 80
      ? getPersonalizedContent('progressMessages', 'Great momentum! 🚀')
      : width >= 70
      ? getPersonalizedContent('progressMessages', 'Keep climbing! 🧗')
      : getPersonalizedContent('progressMessages', 'You\'ve got this! 🌱');
    return `
        <div style="background:#eceff1; border-radius:12px; height:16px; overflow:hidden; border:1px solid ${theme.primary};">
          <div style="width:${width}%; height:16px; background:${color};"></div>
        </div>
      <div style="font-size:13px; color:#1459a9; margin-top:8px;">Current average: <strong>${width}%</strong> • ${message}</div>`;
  };

  // Achievement badges using content library
  const achievementBadges = () => {
    try {
      const libraryBadges = emailContentLibrary.achievementBadges || [];
      if (libraryBadges.length === 0) return '';
      
      // Get personalized badge selection based on student and date
      const dayOfYear = dayjs(date).dayOfYear();
      const studentId = studentName || firstName || 'student';
      const studentSeed = studentId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // Select badges based on student achievements and rotate through library
      const selectedBadges = [];
      
      if (attendanceSummary && attendanceSummary.status === 'Present') {
        const attendanceBadge = libraryBadges.find(b => b.name === 'Attendance Champion') || 
          { name: 'Attendance Champion', icon: '✅', color: '#4caf50' };
        selectedBadges.push(attendanceBadge);
      }
      
      if (Array.isArray(newGrades) && newGrades.length > 0) {
        const gradeBadge = libraryBadges.find(b => b.name === 'Grade Collector') || 
          { name: 'Grade Collector', icon: '🏅', color: '#2196f3' };
        selectedBadges.push(gradeBadge);
      }
      
      if (Array.isArray(lessons) && lessons.length > 0) {
        const lessonBadge = libraryBadges.find(b => b.name === 'Curious Learner') || 
          { name: 'Curious Learner', icon: '🔎', color: '#1459a9' };
        selectedBadges.push(lessonBadge);
      }
      
      if (Array.isArray(behaviorHighlights) && behaviorHighlights.some(b=>b.type === 'Positive')) {
        const behaviorBadge = libraryBadges.find(b => b.name === 'Kindness Hero') || 
          { name: 'Kindness Hero', icon: '❤️', color: '#e91e63' };
        selectedBadges.push(behaviorBadge);
      }
      
      if (selectedBadges.length === 0) return '';
      
    return `
        <div style="display:flex; flex-wrap:wrap; gap:10px;">
          ${selectedBadges.map(badge => `
            <span style="background:#f8f9fa; color:${badge.color}; padding:8px 12px; border-radius:18px; font-size:13px; box-shadow:0 1px 0 rgba(0,0,0,0.06); border:1px solid ${badge.color};">
              ${badge.icon} ${badge.name}
            </span>
          `).join('')}
      </div>`;
    } catch (error) {
      console.warn('Error getting achievement badges from content library:', error);
      return '';
    }
  };

 

  // Today's Challenge function
  const todaysChallenge = async () => {
    try {
      // Try to get character trait-based challenge first
      if (userId) {
        const currentTrait = await getCurrentMonthTrait(userId, date);
        if (currentTrait) {
          // Use student name as ID for unique selection
          const studentId = studentName || firstName || "student";
          const challenge = getDailyChallenge(currentTrait, studentId, date);
          return `
            <div style="margin:16px 0;">
              <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">🎯 Today's Challenge</div>
              <div style="color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;">
                ${safe(challenge)}
              </div>
            </div>`;
        }
      }
    } catch (error) {
      console.error("Error getting character trait challenge:", error);
    }

    // Fallback to built-in challenges with student-specific selection
    const weekday = dayjs(date).day();
    const studentId = studentName || firstName || "student";
    const challenge = getBuiltInChallenges(weekday, null, studentId);
    return `
      <div style="margin:16px 0;">
        <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">🎯 Today's Challenge</div>
        <div style="color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;">
          ${safe(challenge)}
        </div>
      </div>`;
  };

  // Rotation motivation quote using content library
  const motivation = async () => {
    try {
      // Try to get character trait-based quote first
      if (userId) {
        const currentTrait = await getCurrentMonthTrait(userId, date);
        if (currentTrait) {
          // Use student name as ID for unique selection
          const studentId = studentName || firstName || 'student';
          const quote = getDailyQuote(currentTrait, studentId, date);
    return `
            <div style="margin:16px 0;">
              <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">💫 Today's Quote</div>
              <div style="font-style:italic; color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;">
                "${safe(quote)}"
              </div>
            </div>`;
        }
      }
      
      // Try content library motivational quotes with deterministic rotation
      const libraryQuotes = emailContentLibrary.motivationalQuotes || [];
      if (libraryQuotes.length > 0) {
        const dayOfYear = dayjs(date).dayOfYear();
        const studentId = studentName || firstName || 'student';
        
        // Create a unique seed for each student to stagger their rotation
        const studentSeed = studentId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        // Combine day of year with student seed for deterministic rotation
        const rotationIndex = (dayOfYear + studentSeed) % libraryQuotes.length;
        const selected = libraryQuotes[rotationIndex];
        
        if (selected) {
          // Replace placeholders in the quote
          const personalizedQuote = selected
            .replace(/{firstName}/g, firstName || 'Student')
            .replace(/{studentName}/g, studentName || 'Student')
            .replace(/{schoolName}/g, schoolName || 'School')
            .replace(/{teacherName}/g, teacherName || 'Your Teacher');
          
          return `
            <div style="margin:16px 0;">
              <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">💫 Today's Quote</div>
              <div style="font-style:italic; color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;">
                "${safe(personalizedQuote)}"
              </div>
            </div>`;
        }
      }
      
      // Fallback to built-in quotes with deterministic selection
      const weekday = dayjs(date).day();
      const isWeekend = weekday === 5 || weekday === 6; // Friday or Saturday
      const fallbackQuote = getBuiltInQuotes(weekday, isWeekend, studentName || firstName);
      
      return `
        <div style="margin:16px 0;">
          <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">💫 Today's Quote</div>
          <div style="font-style:italic; color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;">
            "${safe(fallbackQuote)}"
          </div>
        </div>`;
    } catch (error) {
      console.warn('Error in motivation function:', error);
      // Final fallback
      return `
        <div style="margin:16px 0;">
          <div style="font-weight:600; color:#2e7d32; margin-bottom:8px;">💫 Today's Quote</div>
          <div style="font-style:italic; color:#1b5e20; padding:12px; background:rgba(255,255,255,0.7); border-radius:8px; border-left:4px solid #2e7d32;">
            "Every day is a new opportunity to grow and learn! 🌟"
          </div>
        </div>`;
    }
  };  

  // Helper functions for formatting sections
  const formatAttendance = (attendance) => {
    if (!attendance) return '<p style="color:#666">No attendance data.</p>';
    return `
      <div style="margin:8px 0;">
        <strong>📅 ${safe(attendance.status || 'Not Recorded')}</strong><br>
        <span style="color:#666; font-size:14px;">${safe(attendance.notes || 'Attendance not yet recorded for today')}</span>
      </div>`;
  };

  const formatBehavior = (behavior) => {
    if (!behavior || behavior.length === 0) {
      return '<p style="color:#666">No behavior incidents. Great job!</p>';
    }
    return formatList(behavior, (b) => 
      `<li><strong>${safe(b.type || 'Incident')}:</strong> ${safe(b.description || 'No description')}</li>`
    );
  };

  const formatReminders = (reminders) => {
    if (!reminders || reminders.length === 0) {
      return '<p style="color:#666">No reminders.</p>';
    }
    return formatList(reminders, (r) => `<li>${safe(r)}</li>`);
  };

  const formatAssignments = (assignments) => {
    if (!assignments || assignments.length === 0) {
      return '<p style="color:#666">No assignments due soon.</p>';
    }
    return formatList(assignments, (a) => 
      `<li><strong>${safe(a.name || 'Assignment')}</strong> (Due ${dayjs(a.dueDate).format('MMM DD')})</li>`
    );
  };

  const formatGrades = (grades) => {
    if (!grades || grades.length === 0) {
      return '<p style="color:#666">No new grades today.</p>';
    }
    return formatList(grades, (g) => 
      `<li><strong>${safe(g.assignmentName || 'Assignment')}:</strong> ${g.score}/${g.points} (${Math.round((g.score/g.points)*100)}%)</li>`
    );
  };

  const encouragementBlock = () => {
    const parts = [];
    if (assignmentsDueSoon && assignmentsDueSoon.length > 0) {
      parts.push(getPersonalizedContent('achievementMessages', "You have upcoming work — planning ahead shows real leadership! ⏰📋"));
    }
    if (newGrades && newGrades.length > 0) {
      parts.push(getPersonalizedContent('achievementMessages', "You earned new grades today — your hard work is paying off! 🏆📊"));
    }
    if (attendanceSummary && attendanceSummary.status === 'Present') {
      parts.push(getPersonalizedContent('achievementMessages', "Perfect attendance today — you're building great habits! ✅📅"));
    }
    if (behaviorHighlights && behaviorHighlights.some(b => b.type === 'Positive')) {
      parts.push(getPersonalizedContent('achievementMessages', "You made positive choices today — keep up the amazing work! 🌟💫"));
    }
    
    if (parts.length === 0) {
      parts.push(getPersonalizedContent('achievementMessages', "Every day you show up is a win — keep being awesome! ✨🚀"));
    }
    
    return safe(parts.join(" "));
  };

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          color: #2c3e50 !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
        }
        .email-container {
          max-width: 680px !important;
          margin: 20px auto !important;
          background: #ffffff !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
          overflow: hidden !important;
        }
        .header {
          background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important;
          color: #fff !important;
          padding: 28px 24px !important;
          text-align: center !important;
        }
        .school-title {
          margin: 0 !important; 
          font-weight: 800 !important; 
          font-size: 28px !important;
        }
        .date-badge {
          margin-top: 12px !important; 
          font-size: 14px !important;
          font-weight: 500 !important;
          background: rgba(255,255,255,0.2) !important;
          padding: 8px 16px !important;
          border-radius: 20px !important;
          display: inline-block !important;
        }
        .content { 
          padding: 32px 24px !important; 
          background: #ffffff !important;
        }
        .section { 
          margin: 24px 0 !important; 
          border: none !important; 
          border-radius: 16px !important; 
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          overflow: hidden !important;
        }
        .section-title { 
          background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important; 
          color: #fff !important; 
          padding: 16px 20px !important; 
          font-weight: 700 !important; 
          font-size: 16px !important;
        }
        .section-content { 
          padding: 20px !important; 
          background: #ffffff !important;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important;
          border: 3px solid #1459a9 !important;
          border-radius: 20px !important;
          padding: 24px 28px !important;
          margin: 0 0 24px 0 !important;
          box-shadow: 0 6px 20px rgba(20, 89, 169, 0.2) !important;
        }
        .stars-earned {
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%) !important;
          border: 2px solid #ed2024 !important;
          border-radius: 16px !important;
          padding: 16px !important;
          margin: 20px 0 !important;
          box-shadow: 0 4px 16px rgba(237, 32, 36, 0.2) !important;
        }
        .grades-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #1459a9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important;
        }
        .lessons-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #1459a9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important;
        }
        .assignments-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #ed2024 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(237, 32, 36, 0.15) !important;
        }
        .attendance-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #1459a9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important;
        }
        .behavior-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #ed2024 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(237, 32, 36, 0.15) !important;
        }
        .reminders-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #1459a9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important;
        }
        .footer {
          margin-top: 32px !important;
          padding-top: 20px !important;
          border-top: 2px solid #1459a9 !important;
          font-size: 14px !important;
          color: #7f8c8d !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border-radius: 16px !important;
          padding: 20px !important;
        }
        .section-header {
          font-size: 20px !important;
          font-weight: 700 !important;
          color: #1459a9 !important;
          margin: 0 0 12px 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        ul {
          margin: 12px 0 !important;
          padding-left: 24px !important;
          color: #34495e !important;
        }
        li {
          margin: 8px 0 !important;
          line-height: 1.5 !important;
        }
        p {
          margin: 0 0 16px 0 !important;
          color: #34495e !important;
        }
        @media only screen and (max-width: 600px) {
          .content { padding: 20px 16px !important; }
          .header { padding: 20px 16px !important; }
          .school-title { font-size: 24px !important; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h2 class="school-title">${safe(schoolName)}</h2>
          <div class="date-badge">${dayjs(date).format('dddd, MMMM D, YYYY')}</div>
        </div>

        <div class="content">
          <!-- Dynamic Personalized Greeting with Hero Banner Style -->
          <div style="margin:24px 0; padding:24px; background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius:20px; border:3px solid #1459a9; box-shadow:0 6px 20px rgba(20, 89, 169, 0.2);">
            <h1 style="margin:0 0 12px 0; font-size:24px; color:#1459a9; text-align:center; font-weight:700;">
              ${getPersonalizedContent('greetings', '🌟 You\'re absolutely amazing, {firstName}! 🌟')}
            </h1>
            <p style="margin:0; font-size:16px; color:#34495e; text-align:center; font-weight:500;">
          ${(() => {
                // Generate unique sub-message based on student name for variety
                const messages = [
                  'High-five for being awesome and giving it your all today! 🙌✨',
                  'You\'re doing incredible things - keep shining! ⭐',
                  'Your hard work is making a difference! 🚀',
                  'You\'re on fire today - amazing job! 🔥',
                  'You\'re crushing it today! 🎯',
                  'Keep being the amazing person you are! 💫',
                  
                  'Your positive energy is contagious! 🌟',
                  'You make learning look easy! 📚',
                  'You are a star! 🌟',
                  'You are a shining light! 💫',
                  'You are a shining star! 🌟',
                 ];
                // Use student name to deterministically select message
                const seed = (studentName || firstName || 'student').split('').reduce((a, b) => {
                  a = ((a << 5) - a) + b.charCodeAt(0);
                  return a & a;
                }, 0);
                const index = Math.abs(seed) % messages.length;
                return messages[index];
          })()}
            </p>
          </div>

          <!-- Additional Personalized Message -->
          <div style="margin:20px 0; padding:20px; background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius:16px; border:2px solid #1459a9;">
            <p style="margin:0; font-size:16px; color:#1459a9; font-weight:600;">
              Here's your incredible daily summary - you're doing fantastic things! Keep that amazing energy flowing! ✨🚀
            </p>
          </div>

          <!-- Today's Achievements -->
          <div style="margin:16px 0; padding:14px; border-radius:10px; background:#fff3cd; border:1px solid #ffeaa7; color:#856404;">
            <strong>${getPersonalizedContent('achievementSectionHeaders', '🎉 Today\'s Amazing Achievements 🎉')}</strong><br>
            ${encouragementBlock()}
          </div>

          <!-- Stars Earned -->
              <div class="stars-earned">
            <div style="text-align:center; font-size:18px; font-weight:700; color:#ed2024;">
              ${getPersonalizedContent('starMessages', `🎊 ⭐⭐⭐ Incredible! You earned ${averageForBar >= 90 ? '3' : averageForBar >= 80 ? '2' : '1'} stars today! ⭐⭐⭐`)}
                </div>
          </div>

          <!-- Learning Progress -->
          <div style="margin:16px 0;">
            <div style="font-weight:800; color:${theme.primary}; margin-bottom:8px;">${getPersonalizedContent('progressHeaders', '📈 Learning Progress')}</div>
          ${progressMeter()}
          </div>

        

          <!-- Motivation & Challenge Section -->
          <div class="section" style="border-color:#c8e6c9; background:#f1f8f2;">
            <div class="section-title" style="background:#2e7d32;">🌟 Character Trait of the Month</div>
            <div class="section-content" style="color:#1b5e20;">
              ${await motivation()}
              ${await todaysChallenge()}
            </div>
          </div>

          <!-- Achievement Badges -->
          <div style="margin:16px 0;">
            <div style="font-weight:800; color:#1459a9; margin-bottom:8px;">${getPersonalizedContent('badgeHeaders', '🏅 Achievement Badges')}</div>
            ${achievementBadges()}
          </div>

          <!-- Grades Section -->
          ${contentFilter.shouldIncludeSection('subjectGrades', ctx) ? `
          <div class="grades-section">
            <div class="section-header">${getPersonalizedContent('gradeSectionHeaders', '📊 Your Amazing Grades')}</div>
            ${gradesSummary()}
          </div>` : ""}

          <!-- New Grades Today -->
          ${contentFilter.shouldIncludeSection('grades', ctx) && newGrades && newGrades.length > 0 ? `
          <div class="grades-section">
            <div class="section-header">${getPersonalizedContent('gradeSectionHeaders', '🏆 New Grades Today')}</div>
            ${formatGrades(newGrades)}
          </div>` : ""}

          <!-- Today's Activities -->
          ${contentFilter.shouldIncludeSection('assignments', ctx) && assignments && assignments.length > 0 ? `
          <div class="assignments-section">
            <div class="section-header">${getPersonalizedContent('assignmentSectionHeaders', '📝 Today\'s Activities')}</div>
            ${formatAssignments(assignments)}
          </div>` : ""}

          <!-- Assignments Coming Up -->
          ${contentFilter.shouldIncludeSection('upcoming', ctx) && assignmentsDueSoon && assignmentsDueSoon.length > 0 ? `
          <div class="assignments-section">
            <div class="section-header">${getPersonalizedContent('assignmentSectionHeaders', '⏰ Assignments Coming Up')}</div>
            ${formatAssignments(assignmentsDueSoon)}
          </div>` : ""}

          <!-- Lessons Section -->
          ${contentFilter.shouldIncludeSection('lessons', ctx) && lessons && lessons.length > 0 ? `
          <div class="lessons-section">
            <div class="section-header">${getPersonalizedContent('lessonSectionHeaders', '📚 Today\'s Learning Adventures')}</div>
            ${formatLessons(lessons, getPersonalizedContent, studentName, firstName)}
          </div>` : ""}

          <!-- Attendance Section -->
          ${contentFilter.shouldIncludeSection('attendance', ctx) && attendanceSummary ? `
          <div class="attendance-section">
            <div class="section-header">${getPersonalizedContent('attendanceHeaders', '📅 Your Attendance')}</div>
            ${formatAttendance(attendanceSummary)}
          </div>` : ""}

          <!-- Behavior Section -->
          ${contentFilter.shouldIncludeSection('behavior', ctx) && behaviorHighlights ? `
          <div class="behavior-section">
            <div class="section-header">${getPersonalizedContent('behaviorSectionHeaders', '🧠 Your Choices Today')}</div>
            ${formatBehavior(behaviorHighlights)}
          </div>` : ""}



          <!-- Reminders Section -->
          ${reminders ? `
          <div class="reminders-section">
            <div class="section-header">${getPersonalizedContent('reminderHeaders', '🔔 Important Reminders')}</div>
            ${formatReminders(reminders)}
          </div>` : ""}

          <div class="footer">
            <div style="font-weight:600; color:#1459a9; margin-bottom:4px;">
              Best,<br>
              ${safe(teacherName)}<br>
              ${safe(schoolName)}
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

export const buildText = (context) => {
  const ctx = normalizeContext(context);
  const {
    firstName,
    studentName,
    date,
    schoolName,
    teacherName,
    assignmentsDueSoon,
    newGrades,
    attendanceSummary,
    behaviorHighlights,
    reminders,
    lessons,
    subjectGrades,
    overallGrade,
  } = ctx;

  const formatList = (items, mapper) => {
    if (!items || items.length === 0) return 'Nothing for now.';
    return items.map(mapper).join('\n');
  };

  const formatAttendance = (attendance) => {
    if (!attendance) return 'No attendance data.';
    return `${attendance.status || 'Not Recorded'}\n${attendance.notes || 'Attendance not yet recorded for today'}`;
  };

  const formatBehavior = (behavior) => {
    if (!behavior || behavior.length === 0) {
      return 'No behavior incidents. Great job!';
    }
    return formatList(behavior, (b) => `${b.type || 'Incident'}: ${b.description || 'No description'}`);
  };

  const formatReminders = (reminders) => {
    if (!reminders || reminders.length === 0) {
      return 'No reminders.';
    }
    return formatList(reminders, (r) => r);
  };

  const formatAssignments = (assignments) => {
    if (!assignments || assignments.length === 0) {
      return 'No assignments due soon.';
    }
    return formatList(assignments, (a) => `${a.name || 'Assignment'} (Due ${dayjs(a.dueDate).format('MMM DD')})`);
  };

  const formatGrades = (grades) => {
    if (!grades || grades.length === 0) {
      return 'No new grades today.';
    }
    return formatList(grades, (g) => `${g.assignmentName || 'Assignment'}: ${g.score}/${g.points} (${Math.round((g.score/g.points)*100)}%)`);
  };

  const gradesSummary = () => {
    const entries = Object.entries(subjectGrades || {});
    if (entries.length === 0 && overallGrade == null) {
      return 'No grades yet.';
    }
    const parts = [];
    if (entries.length) {
      parts.push(entries.map(([subj, g]) => `${subj}: ${g}%`).join('\n'));
    }
    if (overallGrade != null) {
      parts.push(`Overall: ${overallGrade}%`);
    }
    return parts.join('\n');
  };

  const encouragementBlock = () => {
    const parts = [];
    if (assignmentsDueSoon && assignmentsDueSoon.length > 0) {
      parts.push("You have upcoming work — planning ahead shows real leadership!");
    }
    if (newGrades && newGrades.length > 0) {
      parts.push("You earned new grades today — your hard work is paying off!");
    }
    if (attendanceSummary && attendanceSummary.status === 'Present') {
      parts.push("Perfect attendance today — you're building great habits!");
    }
    if (behaviorHighlights && behaviorHighlights.some(b => b.type === 'Positive')) {
      parts.push("You made positive choices today — keep up the amazing work!");
    }
    
    if (parts.length === 0) {
      parts.push("Every day you show up is a win — keep being awesome!");
    }
    
    return `Today's Amazing Achievements:\n${parts.join(' ')}`;
  };

  return `
${schoolName} - Your Daily Spark, ${firstName}! (${dayjs(date).format("MMM DD")})

🌟 You're absolutely amazing, ${firstName}! 🌟
High-five for being awesome and giving it your all today!

${encouragementBlock()}

🎊 ⭐⭐⭐ Incredible! You earned ${overallGrade >= 90 ? '3' : overallGrade >= 80 ? '2' : '1'} stars today! ⭐⭐⭐

📊 Your Amazing Grades:
${gradesSummary()}

${newGrades && newGrades.length > 0 ? `🏆 New Grades Today:\n${formatGrades(newGrades)}\n` : ''}

${assignmentsDueSoon && assignmentsDueSoon.length > 0 ? `⏰ Assignments Coming Up:\n${formatAssignments(assignmentsDueSoon)}\n` : ''}

${lessons && lessons.length > 0 ? `📚 Today's Learning Adventures:\n${formatList(lessons, (l) => `${l.title || "Lesson"} ${l.subject ? `- ${l.subject}` : ""} ${l.duration ? `(${l.duration} min)` : ""}`)}\n` : ''}

${attendanceSummary ? `📅 Your Attendance:\n${formatAttendance(attendanceSummary)}\n` : ''}

${behaviorHighlights ? `🧠 Your Choices Today:\n${formatBehavior(behaviorHighlights)}\n` : ''}

🌟 Today's Challenge:
Do one thing today that makes you wonder about the world

${reminders ? `🔔 Important Reminders:\n${formatReminders(reminders)}\n` : ''}

Best,
${teacherName}
${schoolName}`;
};
