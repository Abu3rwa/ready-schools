import sanitizeHtml from "sanitize-html";
import dayjs from "dayjs";

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
  } = data;

  // Build a friendly, personalized salutation
  const studentFirstName = (studentName || "").split(" ")[0] || "Student";
  const rawSalutation = parentName && parentName.trim()
    ? parentName
    : `${studentFirstName}'s Parent`;
  const safeSalutation = sanitizeHtml(rawSalutation, { allowedTags: [], allowedAttributes: {} });

  // Get pronouns based on gender
  const getPronouns = (gender) => {
    switch(gender?.toLowerCase()) {
      case 'male':
        return { subject: 'he', object: 'him', possessive: 'his', possessiveProper: 'his' };
      case 'female':
        return { subject: 'she', object: 'her', possessive: 'her', possessiveProper: 'hers' };
      default:
        return { subject: 'they', object: 'them', possessive: 'their', possessiveProper: 'theirs' };
    }
  };

  const pronouns = getPronouns(studentGender);

  // Helper function to format assignment list with enhanced styling
  const formatAssignments = (assignments, type) => {
    if (!assignments || assignments.length === 0) {
      return `<div class="no-content"><p><em>No ${type} for today.</em></p></div>`;
    }

    return `
      <div class="assignment-list">
        ${assignments
          .map(
            (assignment) => `
          <div class="assignment-item">
            <div class="assignment-header">
              <h4>${assignment.name}</h4>
            </div>
            <span class="subject-badge">${assignment.subject}</span>
            ${
              assignment.description
                ? `<p class="assignment-description">${sanitizeHtml(assignment.description, { allowedTags: ['em', 'strong'], allowedAttributes: {} })}</p>`
                : ""
            }
            ${
              assignment.dueDate
                ? `<div class="due-date">📅 Due: ${dayjs(assignment.dueDate).format("MMM DD, YYYY")}</div>`
                : ""
            }
            ${
              assignment.points
                ? `<div class="points">🎯 ${assignment.points} points</div>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `;
  };

  // Helper function to format grades with enhanced styling
  const formatGrades = (grades) => {
    if (!grades || grades.length === 0) {
      return `<div class="no-content"><p><em>No new grades today.</em></p></div>`;
    }

    return `
      <div class="grade-list">
        ${grades
          .map(
            (grade) => {
              const percentage = Math.round((grade.score / grade.points) * 100);
              const gradeColor = getGradeColor(percentage);
              return `
          <div class="grade-item">
            <div class="grade-header">
              <h4>${grade.assignmentName}</h4>
              <div class="grade-score" style="color: ${gradeColor};">
                ${grade.score}/${grade.points} (${percentage}%)
              </div>
            </div>
            <div class="grade-subject">${grade.subject}</div>
          </div>
        `;
            }
          )
          .join("")}
      </div>
    `;
  };

  // Helper function to format behavior with enhanced styling
  const formatBehavior = (behavior) => {
    if (!behavior || behavior.length === 0) {
      return `<div class="no-content"><p><em>Great day with no behavior incidents! 🌟</em></p></div>`;
    }

    return `
      <div class="behavior-list">
        ${behavior
          .map(
            (incident) => `
          <div class="behavior-item ${incident.type.toLowerCase()}">
            <div class="behavior-header">
              <span class="behavior-type">${incident.type === "Positive" ? "🌟" : "⚠️"} ${incident.type}</span>
            </div>
            <p class="behavior-description">${sanitizeHtml(incident.description, { allowedTags: [], allowedAttributes: {} })}</p>
            ${
              incident.actionTaken
                ? `<div class="action-taken">Action taken: ${sanitizeHtml(incident.actionTaken, { allowedTags: [], allowedAttributes: {} })}</div>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `;
  };

  // Helper function to format upcoming assignments with enhanced styling
  const formatUpcoming = (assignments) => {
    if (!assignments || assignments.length === 0) {
      return `<div class="no-content"><p><em>No upcoming assignments in the next few days.</em></p></div>`;
    }

    return `
      <div class="upcoming-list">
        ${assignments
          .map(
            (assignment) => {
              const daysUntilDue = dayjs(assignment.dueDate).diff(dayjs(), 'days');
              const urgencyClass = daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'soon' : 'normal';
              return `
        <div class="upcoming-item ${urgencyClass}" style="display:block;box-sizing:border-box;margin:0 0 12px 0;overflow:hidden;">
          <div class="upcoming-header" style="display:block;margin-bottom:10px;">
            <h4 style="display:block;margin:0 0 6px 0;color:#1976d2;font-size:16px;max-width:100%;word-break:break-word;overflow-wrap:anywhere;">${sanitizeHtml(assignment.name, { allowedTags: [], allowedAttributes: {} })}</h4>
            <span class="subject-badge" style="display:inline-block;background-color:#e3f2fd;color:#1976d2;padding:4px 12px;border-radius:15px;font-size:12px;font-weight:500;max-width:100%;word-break:break-word;overflow-wrap:anywhere;white-space:normal;">${sanitizeHtml(assignment.subject, { allowedTags: [], allowedAttributes: {} })}</span>
          </div>
          ${
            assignment.description
              ? `<p class="assignment-description" style="margin:10px 0;color:#666;font-size:14px;word-break:break-word;overflow-wrap:anywhere;">${sanitizeHtml(assignment.description, { allowedTags: [], allowedAttributes: {} })}</p>`
              : ''
          }
          <div class="upcoming-details" style="display:block;margin-top:8px;">
            <span class="due-date" style="display:inline;font-size:13px;color:#666;margin-right:12px;white-space:normal;word-break:break-word;overflow-wrap:anywhere;">📅 Due: ${dayjs(assignment.dueDate).format("MMM DD, YYYY")}</span>
            ${assignment.points ? `<span class="points" style="display:inline;font-size:13px;color:#666;margin-right:12px;white-space:normal;word-break:break-word;overflow-wrap:anywhere;">🎯 ${assignment.points} points</span>` : ""}
          </div>
          ${daysUntilDue <= 1 ? '<div class="urgency-indicator" style="color:#ff5722;font-weight:bold;font-size:12px;margin-top:8px;">⏰ Due soon!</div>' : ''}
        </div>
      `;
            }
          )
          .join("")}
      </div>
    `;
  };

  // Helper function to format subject grades
  const formatSubjectGrades = (subjectGrades) => {
    if (!subjectGrades || Object.keys(subjectGrades).length === 0) {
      return `<div class="no-content"><p><em>No grades available yet.</em></p></div>`;
    }

    return `
      <div class="subject-grades-grid">
        ${Object.entries(subjectGrades)
          .map(([subject, grade]) => {
            const gradeColor = getGradeColor(grade);
            return `
          <div class="subject-grade-card">
            <div class="subject-name">${subject}</div>
            <div class="subject-grade" style="color: ${gradeColor};">${grade}%</div>
          </div>
        `;
          })
          .join("")}
      </div>
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
    : (typeof overallGrade === 'number' ? overallGrade : 0);

  // Get attendance status with enhanced styling
  const getAttendanceStatus = () => {
    const statusConfig = {
      Present: { icon: "✅", color: "#2e7d32", bg: "#e8f5e8" },
      Tardy: { icon: "⏰", color: "#f57c00", bg: "#fff3e0" },
      Absent: { icon: "❌", color: "#d32f2f", bg: "#ffebee" },
      Excused: { icon: "📋", color: "#1976d2", bg: "#e3f2fd" }
    };
    
    const config = statusConfig[attendance.status] || statusConfig.Absent;
    return {
      html: `<span style="color: ${config.color}; font-weight: bold;">${config.icon} ${attendance.status}</span>`,
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

  // Generate personalized encouragement message
  const getEncouragementMessage = () => {
    const messages = [];
    
    if (averageGrade >= 90) {
      messages.push(`${studentFirstName} is excelling academically! ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} should be very proud! 🎉`);
    } else if (averageGrade >= 80) {
      messages.push(`${studentFirstName} is doing great work! ${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} is showing strong understanding! 🚀`);
    } else if (averageGrade >= 70) {
      messages.push(`${studentFirstName} is making good progress. Let's continue supporting ${pronouns.object} to reach ${pronouns.possessive} full potential! 📚`);
    } else {
      messages.push(`${studentFirstName} is working hard. Let's collaborate to help ${pronouns.object} succeed! 🤝`);
    }

    if (attendanceRate >= 95) {
      messages.push(`${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} maintains an excellent attendance record! 📅`);
    }

    if (behavior && behavior.some(b => b.type === "Positive")) {
      messages.push(`${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} showed great behavior today! 🌟`);
    }

    return messages.length > 0 ? `<div class="encouragement">${messages.join(" ")}</div>` : "";
  };

  const attendanceStatusData = getAttendanceStatus();

  return {
    subject: `📚 ${schoolName} - Daily Update for ${studentName} (${dayjs(date).format("MMM DD, YYYY")})`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .email-container {
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              background: linear-gradient(135deg,rgb(227, 247, 253) 0%,rgb(224, 241, 255) 100%);

            }
            .header {
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
              color: white;
              text-align: center;
              padding: 30px 20px;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 10px;
              background: linear-gradient(90deg, #4fc3f7, #29b6f6, #03a9f4, #0288d1);
            }
            .school-title {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: 300;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .date-badge {
              background-color: rgba(255,255,255,0.2);
              color: white;
              padding: 8px 20px;
              border-radius: 25px;
              display: inline-block;
              font-weight: 500;
              font-size: 14px;
              backdrop-filter: blur(10px);
            }
            .content {
              padding: 30px;
            }
            .greeting {
              margin: 0 0 20px 0;
              font-size: 16px;
              line-height: 1.6;
            }
            .greeting.main {
              font-size: 18px;
              font-weight: 500;
              color: #1976d2;
            }
            .encouragement {
              background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
              padding: 15px 20px;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: 500;
              color: #2e7d32;
              border-left: 4px solid #4caf50;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 15px;
              margin: 25px 0;
            }
            .summary-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 20px 15px;
              border-radius: 10px;
              text-align: center;
              border: 1px solid #dee2e6;
              transition: transform 0.2s ease;
            }
            .summary-card:hover {
              transform: translateY(-2px);
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .summary-label {
              font-size: 12px;
              color: #6c757d;
              text-transform: uppercase;
              font-weight: 500;
              letter-spacing: 0.5px;
            }
            .section {
              margin: 25px 0;
              background-color: #fafafa;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid #e0e0e0;
            }
            .section-title {
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
              color: white;
              font-size: 16px;
              font-weight: 600;
              padding: 15px 20px;
              margin: 0;
              display: flex;
              align-items: center;
            }
            .section-content {
              padding: 20px;
            }
            .attendance-status {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
              border-radius: 8px;
              margin: 15px 0;
              background-color: ${attendanceStatusData.bg};
            }
            .assignment-list, .grade-list, .behavior-list {
              display: flex !important;
              flex-direction: column !important;
              gap: 15px;
              width: 100%;
              box-sizing: border-box;
              flex-wrap: nowrap !important;
            }
            .assignment-item, .grade-item, .behavior-item, .upcoming-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              box-sizing: border-box;
              margin-bottom: 0;
            }
            .assignment-header, .grade-header, .behavior-header, .upcoming-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
              flex-wrap: wrap;
              gap: 8px;
            }
            .assignment-header h4, .grade-header h4, .behavior-header h4, .upcoming-header h4 {
              margin: 0;
              color: #1976d2;
              font-size: 16px;
              flex: 1;
              min-width: 200px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            .subject-badge {
              background-color: #e3f2fd;
              color: #1976d2;
              padding: 4px 12px;
              border-radius: 15px;
              font-size: 12px;
              font-weight: 500;
            }
            .assignment-description {
              margin: 10px 0;
              color: #666;
              font-size: 14px;
            }
            .due-date, .points {
              font-size: 13px;
              color: #666;
              margin: 5px 0;
            }
            .grade-score {
              font-size: 18px;
              font-weight: bold;
            }
            .grade-subject {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            .behavior-item.positive {
              border-left: 4px solid #4caf50;
              background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
            }
            .behavior-item.negative {
              border-left: 4px solid #f44336;
              background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
            }
            .behavior-type {
              font-weight: bold;
              font-size: 14px;
            }
            .behavior-description {
              margin: 10px 0 5px 0;
              color: #555;
            }
            .action-taken {
              font-size: 13px;
              color: #666;
              font-style: italic;
            }
            .upcoming-item.urgent {
              border-left: 4px solid #ff5722;
              background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            }
            .upcoming-item.soon {
              border-left: 4px solid #ff9800;
              background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
            }
            .subject-grades-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            .subject-grade-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 20px 15px;
              border-radius: 10px;
              text-align: center;
              border: 1px solid #dee2e6;
              transition: transform 0.2s ease;
            }
            .subject-grade-card:hover {
              transform: translateY(-2px);
            }
            .subject-name {
              font-size: 14px;
              color: #6c757d;
              text-transform: uppercase;
              font-weight: 500;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .subject-grade {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 0;
            }
            .no-content {
              text-align: center;
              color: #666;
              font-style: italic;
              padding: 20px;
            }
            .contact-info {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              padding: 25px;
              border-radius: 10px;
              margin: 30px 0;
              border: 1px solid #90caf9;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .contact-info p {
              margin: 8px 0;
              line-height: 1.6;
              font-size: 14px;
            }
            .teacher-signature {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid rgba(25, 118, 210, 0.2);
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .teacher-signature p {
              margin: 4px 0;
              font-size: 14px;
            }
            .footer {
              background-color: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #666;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 5px 0;
            }
            /* Upcoming assignments: force wrap and avoid overflow in email clients */
            .upcoming-list {
              display: block;
              width: 100%;
              padding: 0;
              margin: 0;
            }
            .upcoming-item {
              display: block;
              width: 100%;
              box-sizing: border-box;
              margin: 0 0 12px 0;
              background: white;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              overflow: hidden;
            }
            .upcoming-header {
              display: block;
              margin-bottom: 10px;
            }
            .upcoming-header h4 {
              display: block;
              margin: 0 0 6px 0;
              color: #1976d2;
              font-size: 16px;
              max-width: 100%;
              word-break: break-word;
              overflow-wrap: anywhere;
            }
            .subject-badge {
              display: inline-block;
              background-color: #e3f2fd;
              color: #1976d2;
              padding: 4px 12px;
              border-radius: 15px;
              font-size: 12px;
              font-weight: 500;
              max-width: 100%;
              word-break: break-word;
              overflow-wrap: anywhere;
              white-space: normal;
            }
            .assignment-description {
              margin: 10px 0;
              color: #666;
              font-size: 14px;
              word-break: break-word;
              overflow-wrap: anywhere;
            }
            .upcoming-details {
              display: block;
              margin-top: 8px;
            }
            .due-date, .points {
              display: inline;
              font-size: 13px;
              color: #666;
              margin-right: 12px;
              white-space: normal;
              word-break: break-word;
              overflow-wrap: anywhere;
            }
            .urgency-indicator {
              color: #ff5722;
              font-weight: bold;
              font-size: 12px;
              margin-top: 8px;
            }
            @media (max-width: 600px) {
              body { padding: 10px; }
              .content { padding: 15px; }
              .summary-grid { grid-template-columns: 1fr; gap: 10px; }
              .summary-card { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 15px; text-align: left; padding: 12px 15px; }
              .summary-value { font-size: 20px; margin-bottom: 0; }
              .summary-label { font-size: 12px; }
              .assignment-header, .grade-header, .upcoming-header { flex-direction: column; align-items: flex-start; gap: 8px; }
              .upcoming-details { display: block; }
              .upcoming-header h4 { min-width: unset; width: 100%; font-size: 14px; }
              .subject-badge { align-self: flex-start; font-size: 11px; padding: 3px 10px; }
              .contact-info { padding: 15px; }
              .teacher-signature { margin-top: 10px; padding-top: 10px; }
              .section-content { padding: 15px; }
              .section-title { font-size: 14px; padding: 12px 15px; }
              .upcoming-item, .assignment-item, .grade-item, .behavior-item { padding: 12px; }
              .date-badge { font-size: 12px; padding: 6px 15px; }
              .school-title { font-size: 24px; }
              .assignment-description { font-size: 13px; }
              .due-date, .points { font-size: 12px; }
            }
            @media (min-width: 601px) and (max-width: 900px) {
              .summary-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1 class="school-title">${schoolName}</h1>
              <div class="date-badge">
                📚 Daily Update - ${dayjs(date).format("dddd, MMMM DD, YYYY")}
              </div>
            </div>

            <div class="content">
              <p class="greeting main">Dear ${safeSalutation},</p>
              <p class="greeting">I hope this message finds you well! <br> I'm excited to share ${studentFirstName}'s daily update with you. Your child is an important part of our classroom community, and I wanted to keep you informed about ${pronouns.possessive} progress and activities.</p>

              ${getEncouragementMessage()}

              <!-- Quick Summary -->
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-value" style="color: ${getGradeColor(averageGrade)};">
                    ${averageGrade}%
                  </div>
                  <div class="summary-label">Average Grade</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value" style="color: ${
                    attendance.status === "Present"
                      ? "#2e7d32"
                      : attendance.status === "Tardy"
                      ? "#f57c00"
                      : "#d32f2f"
                  };">
                    ${attendanceRate}%
                  </div>
                  <div class="summary-label">Attendance Rate</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value" style="color: #1976d2;">
                    ${assignments.length || 0}
                  </div>
                  <div class="summary-label">Today's Activities</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value" style="color: #2e7d32;">
                    ${upcomingAssignments.length || 0}
                  </div>
                  <div class="summary-label">Upcoming Tasks</div>
                </div>
              </div>

              <!-- Subject Grades Section -->
              <div class="section">
                <h3 class="section-title">📊 Subject Grades</h3>
                <div class="section-content">
                  ${formatSubjectGrades(subjectGrades)}
                </div>
              </div>

              <!-- Attendance Section -->
              <div class="section">
                <h3 class="section-title">📅 Today's Attendance</h3>
                <div class="section-content">
                  <div class="attendance-status">
                    ${attendanceStatusData.html}
                    ${
                      attendance.notes
                        ? `<br><small style="color: #666; font-weight: normal;">${sanitizeHtml(attendance.notes, { allowedTags: [], allowedAttributes: {} })}</small>`
                        : ""
                    }
                  </div>
                </div>
              </div>

              <!-- Today's Activities -->
              <div class="section">
                <h3 class="section-title">📚 Today's Learning Activities</h3>
                <div class="section-content">
                  ${formatAssignments(assignments, "learning activities")}
                </div>
              </div>

              <!-- New Grades -->
              ${
                grades && grades.length > 0
                  ? `
                <div class="section">
                  <h3 class="section-title">📊 Recent Grades & Assessments</h3>
                  <div class="section-content">
                    ${formatGrades(grades)}
                  </div>
                </div>
              `
                  : ""
              }

              <!-- Behavior Summary -->
              <div class="section">
                <h3 class="section-title">🌟 Behavior & Social Learning</h3>
                <div class="section-content">
                  ${formatBehavior(behavior)}
                </div>
              </div>

              <!-- Upcoming Assignments -->
              <div class="section">
                <h3 class="section-title">⏰ Upcoming Assignments & Deadlines</h3>
                <div class="section-content">
                  ${formatUpcoming(upcomingAssignments)}
                </div>
              </div>

              <!-- Contact Information -->
              <div class="contact-info">
                <p><strong>💌 I'm here to support ${studentFirstName}'s success!</strong></p>
                <p>If you have any questions, concerns, or would like to discuss ${studentFirstName}'s progress, please don't hesitate to reach out. I believe that strong communication between home and school is key to ${pronouns.possessive} success.</p>
                <p><strong>📧 Email:</strong> ${teacherEmail || 'Available upon request'}</p>
                <p><strong>🕐 Best times to contact:</strong> During school hours or by appointment</p>
                
                <div class="teacher-signature">
                  <p><strong>Warm regards,</strong></p>
                  <p><strong>${teacherName}</strong></p>
                  <p><em>${studentFirstName}'s Teacher</em></p>
                  <p>${schoolName}</p>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>📤 This update was sent on ${dayjs().format("MMMM DD, YYYY [at] h:mm A")}</p>
              
              <p>💙 Thank you for being an amazing partner in your child's education!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};
