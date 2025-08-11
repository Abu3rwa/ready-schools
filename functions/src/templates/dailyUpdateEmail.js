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

  // Get pronouns and gender-specific language based on gender
  const getPronouns = (gender) => {
    // Handle various gender formats and provide appropriate fallbacks
    const genderLower = gender?.toLowerCase()?.trim();
    
    // Frontend gender options: ["Male", "Female", "Other", "Prefer not to say"]
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
      case '':
      case 'unknown':
      case null:
      case undefined:
      default:
        // For empty/unknown genders, use neutral language that's still personal
        console.log('Using default pronouns for gender:', gender);
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

  // Validate and normalize gender data
  const normalizeGender = (gender) => {
    if (!gender || typeof gender !== 'string') return null;
    
    const normalized = gender.trim();
    if (normalized === '') return null;
    
    // Map common variations to standard values
    const genderMap = {
      'male': 'Male',
      'm': 'Male',
      'male student': 'Male',
      'boy': 'Male',
      'female': 'Female',
      'f': 'Female',
      'female student': 'Female',
      'girl': 'Female',
      'other': 'Other',
      'prefer not to say': 'Prefer not to say',
      'non-binary': 'Other',
      'nonbinary': 'Other',
      'nb': 'Other',
      'enby': 'Other',
      'genderfluid': 'Other',
      'genderqueer': 'Other',
      'agender': 'Other'
    };
    
    const lowerGender = normalized.toLowerCase();
    return genderMap[lowerGender] || normalized;
  };
  
  const normalizedGender = normalizeGender(studentGender);
  
  // Debug logging to track gender values
  console.log('Gender data processing:', {
    rawGender: studentGender,
    type: typeof studentGender,
    normalized: normalizedGender,
    processed: normalizedGender?.toLowerCase()?.trim()
  });
  
  const pronouns = getPronouns(normalizedGender);
  
  // Log the pronouns being used
  console.log('Pronouns selected:', pronouns);

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
              const percentage = Math.round((grade.score / grade.points) * 100);
              const gradeColor = getGradeColor(percentage);
              return `
          <tr>
            <td style="padding: 15px; margin-bottom: 15px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <h4 style="margin: 0; color: #1976d2; font-size: 16px; font-family: Arial, sans-serif; word-break: break-word;">${grade.assignmentName}</h4>
                  </td>
                  <td align="right" style="padding-bottom: 10px;">
                    <div style="font-size: 18px; font-weight: bold; color: ${gradeColor}; font-family: Arial, sans-serif;">
                ${grade.score}/${grade.points} (${percentage}%)
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
    : (typeof overallGrade === 'number' ? overallGrade : 0);

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

  // Generate personalized encouragement message
  const getEncouragementMessage = () => {
    const messages = [];
    
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

  return {
    subject: `📚 ${schoolName} - Daily Update for ${studentName} (${dayjs(date).format("MMM DD, YYYY")})`,
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
                  <p class="greeting">I hope this message finds you well! <br> I'm excited to share ${studentFirstName}'s daily update with you. Your ${pronouns.child} is an important part of our classroom community, and I wanted to keep you informed about ${pronouns.possessive} progress and activities.</p>

              ${getEncouragementMessage()}

              <!-- Quick Summary -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-grid">
                    <tr>
                      <td style="padding: 0 7.5px 0 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
                  <div class="summary-value" style="color: ${getGradeColor(averageGrade)};">
                    ${averageGrade}%
                  </div>
                  <div class="summary-label">Average Grade</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="padding: 0 0 0 7.5px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
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
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 7.5px 0 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
                  <div class="summary-value" style="color: #1976d2;">
                    ${assignments.length || 0}
                  </div>
                  <div class="summary-label">Today's Activities</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="padding: 15px 0 0 7.5px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="summary-card">
                          <tr>
                            <td style="text-align: center; padding: 20px 15px;">
                  <div class="summary-value" style="color: #2e7d32;">
                    ${upcomingAssignments.length || 0}
                  </div>
                  <div class="summary-label">Upcoming Tasks</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

              <!-- Subject Grades Section -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">📊 Subject Grades</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                  ${formatSubjectGrades(subjectGrades)}
                      </td>
                    </tr>
                  </table>

              <!-- Attendance Section -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">📅 Today's Attendance</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                        <div class="attendance-status" style="background-color: ${attendanceStatusData.bg};">
                    ${attendanceStatusData.html}
                    ${
                      attendance.notes
                              ? `<br><small style="color: #666; font-weight: normal; font-family: Arial, Helvetica, sans-serif;">${sanitizeHtml(attendance.notes, { allowedTags: [], allowedAttributes: {} })}</small>`
                        : ""
                    }
                  </div>
                      </td>
                    </tr>
                  </table>

              <!-- Today's Activities -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">📚 Today's Learning Activities</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                  ${formatAssignments(assignments, "learning activities")}
                      </td>
                    </tr>
                  </table>

              <!-- New Grades -->
              ${
                grades && grades.length > 0
                  ? `
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
              `
                  : ""
              }

              <!-- Behavior Summary -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">🌟 Behavior & Social Learning</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                  ${formatBehavior(behavior)}
                      </td>
                    </tr>
                  </table>

              <!-- Upcoming Assignments -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="section">
                    <tr>
                      <td class="section-title">⏰ Upcoming Assignments & Deadlines</td>
                    </tr>
                    <tr>
                      <td class="section-content">
                  ${formatUpcoming(upcomingAssignments)}
                      </td>
                    </tr>
                  </table>

              <!-- Contact Information -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="contact-info">
                <p><strong>💌 I'm here to support ${studentFirstName}'s success!</strong></p>
                        <p>If you have any questions, concerns, or would like to discuss ${pronouns.possessive} progress, please don't hesitate to reach out. I believe that strong communication between home and school is key to ${pronouns.possessive} success. Your ${pronouns.child} is making wonderful progress, and I'm excited to see ${pronouns.object} continue to grow!</p>
                <p><strong>📧 Email:</strong> ${teacherEmail || 'Available upon request'}</p>
                <p><strong>🕐 Best times to contact:</strong> During school hours or by appointment</p>
                
                <div class="teacher-signature">
                  <p><strong>Warm regards,</strong></p>
                  <p><strong>${teacherName}</strong></p>
                  <p><em>${studentFirstName}'s Teacher</em></p>
                          <p><em>Proud to be teaching such a wonderful ${pronouns.title}!</em></p>
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
                  <p>💙 Thank you for being an amazing partner in your ${pronouns.child}'s education!</p>
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
