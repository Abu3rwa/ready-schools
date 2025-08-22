import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear.js";
dayjs.extend(dayOfYear);
import sanitizeHtml from "sanitize-html";

// Import character traits service
import { getCurrentMonthTrait, getDailyQuote, getDailyChallenge } from "../services/characterTraitsService.js";

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
    subjectGrades,
    overallGrade,
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
    newGrades,
    attendanceSummary,
    behaviorHighlights,
    reminders,
    encouragement,
    lessons,
    subjectGrades,
    overallGrade,
    userId,
  } = ctx;

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
      ? 'On fire! 🔥'
      : width >= 80
      ? 'Great momentum! 🚀'
      : width >= 70
      ? 'Keep climbing! 🧗'
      : 'You\'ve got this! 🌱';
    return `
      <div style="margin:16px 0;">
        <div style="font-weight:800; color:#1459a9; margin-bottom:8px;">📈 Learning Progress</div>
        <div style="background:#eceff1; border-radius:12px; height:16px; overflow:hidden; border:1px solid #1459a9;">
          <div style="width:${width}%; height:16px; background:${color};"></div>
        </div>
        <div style="font-size:13px; color:#1459a9; margin-top:8px;">Current average: <strong>${width}%</strong> • ${message}</div>
      </div>`;
  };

  // Achievement badges
  const achievementBadges = () => {
    const badges = [];
    if (attendanceSummary && attendanceSummary.status === 'Present') badges.push({ label: '✅ Attendance Champion', bg:'#f8f9fa', color:'#1459a9' });
    if (Array.isArray(newGrades) && newGrades.length > 0) badges.push({ label: '📊 Grade Collector', bg:'#f8f9fa', color:'#ed2024' });
    if (Array.isArray(lessons) && lessons.length > 0) badges.push({ label: '🔎 Curious Learner', bg:'#f8f9fa', color:'#1459a9' });
    if (Array.isArray(behaviorHighlights) && behaviorHighlights.some(b=>b.type === 'Positive')) badges.push({ label: '💜 Kindness Hero', bg:'#f8f9fa', color:'#ed2024' });
    if (badges.length === 0) return '';
    return `
      <div style="margin:16px 0;">
        <div style="font-weight:800; color:#1459a9; margin-bottom:8px;">🏅 Achievement Badges</div>
        <div style="display:flex; flex-wrap:wrap; gap:10px;">
          ${badges.map(b => `<span style="background:${b.bg}; color:${b.color}; padding:8px 12px; border-radius:18px; font-size:13px; box-shadow:0 1px 0 rgba(0,0,0,0.06); border:1px solid ${b.color};">${b.label}</span>`).join('')}
        </div>
      </div>`;
  };

  // Focus tip based on lowest subject grade
  const focusTip = () => {
    try {
      const entries = Object.entries(subjectGrades || {});
      if (!entries.length) return '';
      const sorted = entries.filter(([,v]) => typeof v === 'number').sort((a,b)=>a[1]-b[1]);
      if (!sorted.length) return '';
      const [lowestSubject, lowestGrade] = sorted[0];
      const tips = {
        default: `Try reviewing class notes, practicing a few problems, and asking one question tomorrow. You’ve got this! 💪`,
        ELA: `Read for 10 minutes and jot 3 new words. Practice makes progress! 📖`,
        Math: `Practice 5 quick problems and explain your steps to a friend. ➗`,
        Science: `Write one “why” question about today’s topic and try to answer it. 🔬`,
        SS: `Tell a family member one fact you learned and why it matters. 🗺️`
      };
      const subjectKey = (lowestSubject || '').toString();
      const tip = tips[subjectKey] || tips.default;
      return `
        <div style="margin:16px 0; padding:14px; border-radius:10px; background:#f8f9fa; border:1px solid #1459a9; color:#1459a9;">
          <strong>🎯 Focus Tip (${safe(lowestSubject)} – ${lowestGrade}%):</strong> ${safe(tip)}
        </div>`;
    } catch(_) {
      return '';
    }
  };

  // Rotation motivation quote
  const motivation = async () => {
    try {
      // Try to get character trait-based quote first
      if (userId) {
        const currentTrait = await getCurrentMonthTrait(userId, date);
        if (currentTrait) {
          // Use student name as ID for unique selection
          const studentId = studentName || firstName || "student";
          const quote = getDailyQuote(currentTrait, studentId, date);
          return `
            <div style="margin:18px 0; padding:12px; border-radius:10px; background:#fffde7; border:1px solid #fff59d; color:#795548; text-align:center;">
              <div style="font-size:14px; margin-bottom:4px; color:#8d6e63;">🌟 ${currentTrait.name} Focus 🌟</div>
              ${quote}
            </div>`;
        }
      }
    } catch (error) {
      console.error("Error getting character trait quote:", error);
    }

    // Fallback to built-in quotes with student-specific selection
    const weekday = dayjs(date).day();
    const isWeekend = weekday === 5 || weekday === 6; // Friday (5) and Saturday (6) are weekends
    const studentId = studentName || firstName || "student";
    const quote = getBuiltInQuotes(weekday, isWeekend, studentId);
    return `
      <div style="margin:18px 0; padding:12px; border-radius:10px; background:#fffde7; border:1px solid #fff59d; color:#795548; text-align:center;">
        ${quote}
      </div>`;
  };

  const formatGrades = (gradesArray) => {
    if (!gradesArray || gradesArray.length === 0) return '<p style="color:#666">No new grades today.</p>';
    return `
      <ul style="margin:8px 0; padding-left:18px; color:#444;">
        ${gradesArray
          .map((g) => {
            let displayText = "";
            let pct = null;
            if (!g.points && g.points !== 0) {
              displayText = `${g.score}`;
            } else if (g.points === 0) {
              displayText = `${g.score}`;
            } else {
              pct = Math.round((g.score / g.points) * 100);
              displayText = `${g.score}/${g.points} (${pct}%)`;
            }
            const color = pct == null ? "#444" : getGradeColor(pct);
            return `<li>${safe(g.assignmentName || "Assignment")}: <span style=\"color:${color}\">${displayText}</span>${g.subject ? ` - <em>${safe(g.subject)}</em>` : ""}</li>`;
          })
          .join("")}
      </ul>
    `;
  };

  const formatAssignmentsDueSoon = (items) => {
    return formatList(items, (a) => `<li>${safe(a.name || "Assignment")}${a.dueDate ? ` (Due ${dayjs(a.dueDate).format("MMM DD")})` : ""}</li>`);
  };

  const formatBehavior = (items) => {
    if (!items || items.length === 0) return '<p style="color:#2e7d32">No behavior incidents. Great job!</p>';
    return `
      <ul style="margin:8px 0; padding-left:18px; color:#444;">
        ${items
          .map((b) => `<li>${b.type === "Positive" ? "🌟" : "⚠️"} ${safe(b.description || "")}</li>`)
          .join("")}
      </ul>
    `;
  };

  const formatAttendance = (att) => {
    if (!att) return '<p style="color:#666">Attendance not recorded.</p>';
    const status = att.status || "Not Recorded";
    const colors = {
      Present: { color: "#2e7d32", icon: "✅" },
      Tardy: { color: "#f57c00", icon: "⏰" },
      Absent: { color: "#d32f2f", icon: "❌" },
      Excused: { color: "#1976d2", icon: "📋" },
    };
    const cfg = colors[status] || { color: "#666", icon: "📅" };
    return `<div style=\"font-weight:600;color:${cfg.color}\">${cfg.icon} ${status}</div>${att.notes ? `<div style=\"color:#666;margin-top:4px\">${safe(att.notes)}</div>` : ""}`;
  };

  const formatReminders = (items) => {
    if (!items || items.length === 0) return '<p style="color:#666">No reminders.</p>';
    return formatList(items, (r) => `<li>${safe(typeof r === "string" ? r : r.text || "")}</li>`);
  };

  const encouragementBlock = () => {
    const parts = [];
    if (encouragement) parts.push(encouragement);
    if (parts.length === 0) return "";
    return `
      <div style="margin:18px 0; padding:14px; background:#e8f5e9; border:1px solid #c8e6c9; border-radius:8px; color:#2e7d32;">
        ${safe(parts.join(" "))}
      </div>
    `;
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
            <div class="section" style="border-color:#c8e6c9; background:#f1f8f2;">
              <div class="section-title" style="background:#2e7d32;">🌟 Today's Challenge: ${currentTrait.name}</div>
              <div class="section-content" style="color:#1b5e20;">${safe(challenge)}</div>
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
      <div class="section" style="border-color:#c8e6c9; background:#f1f8f2;">
        <div class="section-title" style="background:#2e7d32;">🌟 Today's Challenge</div>
        <div class="section-content" style="color:#1b5e20;">${safe(challenge)}</div>
      </div>`;
  };

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        /* Enhanced modern styles for better student engagement */
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
          position: relative !important;
        }
        .header::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="stars" patternUnits="userSpaceOnUse" width="100" height="100"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.3)"/><circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.3)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.3)"/></pattern></defs><rect width="100" height="100" fill="url(%23stars)"/></svg>') !important;
          opacity: 0.1 !important;
        }
        .school-title {
          margin: 0 !important; 
          font-weight: 800 !important; 
          font-size: 28px !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          position: relative !important;
          z-index: 1 !important;
        }
        .date-badge {
          margin-top: 12px !important; 
          opacity: 0.95 !important; 
          font-size: 14px !important;
          font-weight: 500 !important;
          background: rgba(255,255,255,0.2) !important;
          padding: 8px 16px !important;
          border-radius: 20px !important;
          display: inline-block !important;
          backdrop-filter: blur(10px) !important;
          position: relative !important;
          z-index: 1 !important;
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
          letter-spacing: 0.5px !important;
          font-size: 16px !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
        }
        .section-content { 
          padding: 20px !important; 
          background: #ffffff !important;
        }
        .summary-grid { 
          width: 100% !important; 
          margin: 24px 0 !important; 
        }
        .summary-card { 
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important; 
          border: none !important; 
          border-radius: 16px !important; 
          text-align: center !important; 
          padding: 20px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
        }
        .summary-value { 
          font-size: 24px !important; 
          font-weight: 800 !important; 
          color: #2c3e50 !important;
        }
        .summary-label { 
          font-size: 13px !important; 
          color: #7f8c8d !important; 
          text-transform: uppercase !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%) !important;
          border: 3px solid #1459a9 !important;
          border-radius: 20px !important;
          padding: 24px 28px !important;
          margin: 0 0 24px 0 !important;
          box-shadow: 0 6px 20px rgba(20, 89, 169, 0.2) !important;
        }
        .wins-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid #1459a9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
          box-shadow: 0 4px 16px rgba(20, 89, 169, 0.15) !important;
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
        .challenge-section {
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
          <div class="date-badge">${dayjs(date).format("dddd, MMMM DD, YYYY")}</div>
        </div>

        <div class="content">
          <!-- Hero Banner -->
          <div class="hero-banner">
            <div style="font-size: 22px; font-weight: 800; color:#ffffff;">🌟 You're absolutely amazing, ${safe(firstName)}! 🌟</div>
            <div style="font-size: 15px; color:#ffffff; margin-top: 10px;">High-five for being awesome and giving it your all today! 🙌✨</div>
          </div>

          <p style="margin:0 0 16px 0; font-size: 17px; color: #2c3e50;">Hi there, ${safe(firstName)}! 👋</p>
          <p style="margin:0 0 20px 0; font-size: 16px; color: #34495e;">Here's your incredible daily summary - you're doing fantastic things! Keep that amazing energy flowing! ✨🚀</p>

          <!-- Today's Wins -->
          ${(() => {
            const wins = [];
            if (attendanceSummary && attendanceSummary.status === 'Present') wins.push('You showed up ready to conquer the day! ✅');
            if (Array.isArray(newGrades) && newGrades.length > 0) wins.push(`You earned ${newGrades.length} amazing grade${newGrades.length>1?'s':''}! 🏅🎉`);
            if (Array.isArray(lessons) && lessons.length > 0) wins.push(`You tackled ${lessons.length} lesson${lessons.length>1?'s':''} like a champion! 📚💪`);
            if (Array.isArray(assignmentsDueSoon) && assignmentsDueSoon.length > 0) wins.push('You have upcoming work — planning ahead shows real leadership! ⏰📋');
            if (Array.isArray(behaviorHighlights) && behaviorHighlights.some(b=>b.type === 'Positive')) wins.push('You made incredible choices today! 🌈💫');
            if (wins.length === 0) return '';
            return `
              <div class="wins-section">
                <div style="font-weight:800; color:#1459a9; margin-bottom:8px; font-size: 18px;">🎉 Today's Amazing Achievements 🎉</div>
                <ul style="margin:0; padding-left:20px; color:#1459a9;">
                  ${wins.map(w => `<li>${safe(w)}</li>`).join('')}
                </ul>
              </div>`;
          })()}



          <!-- Stars Earned -->
          ${(() => {
            let stars = 0;
            if (overallGrade != null) stars += overallGrade >= 90 ? 3 : overallGrade >= 80 ? 2 : overallGrade >= 70 ? 1 : 0;
            if (attendanceSummary && attendanceSummary.status === 'Present') stars += 1;
            if (Array.isArray(behaviorHighlights) && behaviorHighlights.some(b=>b.type === 'Positive')) stars += 1;
            if (stars === 0) return '';
            const starRow = '⭐'.repeat(Math.min(stars, 5));
            return `
              <div class="stars-earned">
                <div style="color:#ed2024; font-weight:700; font-size: 16px; text-align: center;">
                  🎊 ${starRow} Incredible! You earned ${stars} star${stars>1?'s':''} today! ${starRow}
                </div>
              </div>`;
          })()}

          ${progressMeter()}
          ${achievementBadges()}
          ${focusTip()}
          ${motivation()}

          <div class="grades-section">
            <div class="section-header">📊 Your Amazing Grades</div>
            ${gradesSummary()}
          </div>

          <div class="lessons-section">
            <div class="section-header">🏆 New Grades Today</div>
            ${formatGrades(newGrades)}
          </div>

          ${lessons && lessons.length > 0 ? `
          <div class="lessons-section">
            <div class="section-header">📚 Today's Learning Adventures</div>
            ${formatList(lessons, (l) => `<li>${safe(l.title || "Lesson")} ${l.subject ? `- <em>${safe(l.subject)}</em>` : ""} ${l.duration ? `(${l.duration} min)` : ""}</li>`)}
          </div>` : ""}

          <div class="assignments-section">
            <div class="section-header">⏰ Assignments Coming Up</div>
            <div class="section-content">${formatAssignmentsDueSoon(assignmentsDueSoon)}</div>
          </div>

          ${attendanceSummary ? `
          <div class="attendance-section">
            <div class="section-header">📅 Your Attendance</div>
            ${formatAttendance(attendanceSummary)}
          </div>` : ""}

          ${behaviorHighlights ? `
          <div class="behavior-section">
            <div class="section-header">🧠 Your Choices Today</div>
            ${formatBehavior(behaviorHighlights)}
          </div>` : ""}

          ${encouragementBlock()}

          <!-- Today's Challenge -->
          ${await todaysChallenge()}

          ${reminders ? `
          <div class="reminders-section">
            <div class="section-header">🔔 Important Reminders</div>
            ${formatReminders(reminders)}
          </div>` : ""}

          <div class="footer" style="margin-top:32px; border-top:1px solid #e1e4e8; padding-top:18px; color:#7f8c8d; font-size:14px;">
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
    newGrades,
    lessons,
    assignmentsDueSoon,
  } = ctx;

  return `Hi ${firstName},\n\nHere’s your daily summary.\n\n- New grades today: ${newGrades?.length || 0}\n- Lessons today: ${lessons?.length || 0}\n- Due soon: ${assignmentsDueSoon?.length || 0}\n\nKeep going!`;
};

// ------------------------------
// Backward-compatible wrapper used by existing callers
// ------------------------------
export const buildStudentDailyEmailTemplate = async (data) => {
  const subject = buildSubject(data);
  const html = await buildHtml(data);
  const text = buildText(data);
  return { subject, html, text };
};


