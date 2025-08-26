import { buildDailyUpdateTemplate } from "../templates/dailyUpdateEmail.js";
import { buildSubject as buildStudentSubject, buildHtml as buildStudentHtml, buildText as buildStudentText } from "../templates/studentDailyUpdateEmail.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpsError } from "firebase-functions/v2/https";
import { createEmailContentFilter, checkContentAvailability } from "../services/EmailContentFilter.js";
import { validateEmailPreferences } from "../constants/emailSections.js";

// Send a single email
export const sendEmail = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const { to, subject, html, text, userId } = req.body || {};
    if (!to || !subject) {
      return res.status(400).json({ error: "Missing required fields: to, subject" });
    }
    const emailService = (await import("../services/emailService.js")).default;
    const result = await emailService.sendEmail({ to, subject, html, text }, userId);
    return res.json({ success: true, messageId: result?.messageId });
  } catch (error) {
    console.error("sendEmail error", error);
    return res.status(500).json({ error: error.message });
  }
};

// Send daily updates to all parents (callable v2 handler)
export const sendDailyUpdates = async (data, context) => {
  try {
    // In v2 onCall, the first param is a request-like object { data, auth, ... }
    const request = data;
    const payload = request?.data ?? data;
    const authUid = context?.auth?.uid ?? request?.auth?.uid;

    // Debug
    console.log("sendDailyUpdates called with keys:", Object.keys(request || {}));
    console.log("payload keys:", Object.keys(payload || {}));
    console.log("auth uid:", authUid);

    // Validate authentication
    if (!authUid) {
      throw new Error("User must be authenticated");
    }

    const { date, dataSources } = payload || {};
    if (!dataSources) {
      throw new Error("Missing dataSources");
    }

    // Validate data sources
    const dataSourcesValidation = (await import("../constants/emailSections.js")).validateDataSources(dataSources);
    if (!dataSourcesValidation.isValid) {
      console.error("Invalid data sources:", dataSourcesValidation.errors);
      throw new HttpsError('invalid-argument', 'Invalid data sources provided');
    }
    
    // Validate email preferences if present
    if (dataSources.emailPreferences) {
      const validation = validateEmailPreferences(dataSources.emailPreferences);
      if (!validation.isValid) {
        console.warn("Invalid email preferences:", validation.errors);
        // Continue with defaults rather than failing
      }
    }

    console.log("sendDailyUpdates: Starting daily update process...");
    console.log("sendDailyUpdates: Date:", date);
    console.log("sendDailyUpdates: Data sources:", {
      students: dataSources.students?.length || 0,
      attendance: dataSources.attendance?.length || 0,
      behavior: dataSources.behavior?.length || 0,
      schoolName: dataSources.schoolName,
      teacher: dataSources.teacher,
      hasEmailPreferences: !!dataSources.emailPreferences
    });

    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdates = await dailyUpdateService.generateAllDailyUpdates(new Date(date), authUid);
    
    console.log(`sendDailyUpdates: Generated ${dailyUpdates.length} daily updates`);

    let emailsSent = 0;
    const savedEmails = [];

    for (const update of dailyUpdates) {
      console.log(`sendDailyUpdates: Processing update for student: ${update.studentName} (${update.studentId})`);
      
      if (update.parentEmails && update.parentEmails.length > 0) {
        console.log(`sendDailyUpdates: Found ${update.parentEmails.length} parent emails for ${update.studentName}`);
        
        try {
          // Check if parent emails are enabled and have content
          const parentFilter = createEmailContentFilter(update.emailPreferences, 'parent');
          const parentEnabled = update.emailPreferences?.parent?.enabled;
          const parentHasContent = parentFilter.hasAnyContent(update);

          if (!parentEnabled) {
            console.log(`sendDailyUpdates: Parent emails disabled for ${update.studentName}`);
            continue;
          }

          if (!parentHasContent) {
            console.log(`sendDailyUpdates: No content to include in parent email for ${update.studentName} - skipping due to all sections disabled`);
            continue;
          }

          // Log filtering summary for debugging
          const filteringSummary = parentFilter.getFilteringSummary(update);
          console.log(`sendDailyUpdates: Parent email filtering for ${update.studentName}:`, {
            includedSections: filteringSummary.includedSections,
            excludedSections: filteringSummary.excludedSections
          });

          const emailContent = buildDailyUpdateTemplate({
            ...update,
            schoolName: dataSources.schoolName || "School",
            teacherName: dataSources.teacher?.name || "Teacher",
            teacherEmail: dataSources.teacher?.email || "",
            emailContentLibrary: dataSources.emailContentLibrary || {},
            emailPreferences: update.emailPreferences || dataSources.emailPreferences || {},
          });

          console.log(`sendDailyUpdates: Email content generated for ${update.studentName}:`, {
            subject: emailContent.subject,
            hasHtml: !!emailContent.html,
            htmlLength: emailContent.html?.length || 0
          });

          const emailService = (await import("../services/emailService.js")).default;
          
          // normalize and deduplicate recipients
          const uniqueRecipients = Array.from(
            new Set(
              (update.parentEmails || [])
                .filter(Boolean)
                .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : e))
                .filter((e) => typeof e === "string" && e.length > 0)
            )
          );

          console.log(`sendDailyUpdates: Sending to ${uniqueRecipients.length} unique recipients for ${update.studentName}`);

          for (const parentEmail of uniqueRecipients) {
            console.log(`sendDailyUpdates: Sending email to ${parentEmail} for student ${update.studentName}`);
            
            try {
              const result = await emailService.sendEmail({
                to: parentEmail,
                subject: emailContent.subject,
                html: emailContent.html,
              }, authUid);

              console.log(`sendDailyUpdates: Email sent successfully to ${parentEmail}:`, {
                messageId: result?.messageId,
                method: result?.method,
                success: result?.success
              });

              emailsSent++;
              
              // Save email record to Firestore
              const emailRecord = {
                studentId: update.studentId,
                studentName: update.studentName,
                subject: emailContent.subject,
                recipients: [parentEmail],
                date: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD format
                sentStatus: "sent",
                recipientType: "parent",
                userId: authUid,
                messageId: result?.messageId,
                method: result?.method || "gmail",
                html: emailContent.html,
                text: emailContent.text,
                // Add character trait fields for easy access
                characterTraitQuote: update.characterTraitQuote || null,
                characterTraitChallenge: update.characterTraitChallenge || null,
                characterTrait: update.characterTrait || null,
                metadata: {
                  createdAt: new Date().toISOString(),
                  sentAt: new Date().toISOString(),
                  teacherName: dataSources.teacher?.name || "Teacher",
                  schoolName: dataSources.schoolName || "School",
                  includedSections: filteringSummary.includedSections,
                }
              };
              
              // Save to Firestore - Parent emails in dailyUpdateEmails collection
              const { getFirestore } = await import("firebase-admin/firestore");
              const adminDb = getFirestore();
              await adminDb.collection("dailyUpdateEmails").add(emailRecord);
              
              savedEmails.push({
                id: `email-${Date.now()}-${update.studentId}-${parentEmail}`,
                ...emailRecord,
              });

            } catch (emailError) {
              console.error(`sendDailyUpdates: Failed to send email to ${parentEmail} for student ${update.studentName}:`, {
                error: emailError.message,
                code: emailError.code,
                stack: emailError.stack
              });
              // Continue with other emails instead of failing completely
            }
          }
        } catch (emailError) {
          console.error(`sendDailyUpdates: Error processing email for student ${update.studentId}:`, {
            error: emailError.message,
            stack: emailError.stack
          });
          // Continue with other students instead of failing completely
        }
      } else {
        console.log(`sendDailyUpdates: No parent emails found for student ${update.studentName}`);
      }
    }

    console.log(`sendDailyUpdates: Process completed. Emails sent: ${emailsSent}`);

    return {
      success: true,
      message: `Daily updates sent successfully! ${emailsSent} emails sent.`,
      emailsSent,
      savedEmails,
      totalStudents: dailyUpdates.length
    };
  } catch (error) {
    console.error("sendDailyUpdates error:", {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Provide more specific error handling
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Convert specific errors to more meaningful HttpsErrors
    if (error.message.includes('Authentication')) {
      throw new HttpsError('unauthenticated', error.message);
    }
    
    if (error.message.includes('Missing') || error.message.includes('Invalid')) {
      throw new HttpsError('invalid-argument', error.message);
    }
    
    if (error.message.includes('Permission') || error.message.includes('Access')) {
      throw new HttpsError('permission-denied', error.message);
    }
    
    // Default to internal error with more context
    throw new HttpsError('internal', `Daily update sending failed: ${error.message}`);
  }
};

// Send daily update for a specific student
export const sendStudentDailyUpdate = async (req, res) => {
  const authed = await requireAuth(req).catch(() => null);
  if (!authed) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  if (!req.is("application/json")) return res.status(415).json({ error: "Unsupported Media Type" });
  try {
    const { studentId, date, dataSources } = req.body || {};
    if (!studentId || !dataSources) {
      return res.status(400).json({ error: "Missing studentId or dataSources" });
    }

    // Validate data sources
    const dataSourcesValidation = (await import("../constants/emailSections.js")).validateDataSources(dataSources);
    if (!dataSourcesValidation.isValid) {
      console.error("Invalid data sources:", dataSourcesValidation.errors);
      return res.status(400).json({ error: "Invalid data sources" });
    }
    
    // Validate email preferences if present
    if (dataSources.emailPreferences) {
      const validation = validateEmailPreferences(dataSources.emailPreferences);
      if (!validation.isValid) {
        console.warn("Invalid email preferences:", validation.errors);
      }
    }

    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdate = await dailyUpdateService.generateDailyUpdate(studentId, new Date(date), req.user?.uid);
    
    if (!dailyUpdate || !dailyUpdate.parentEmails || dailyUpdate.parentEmails.length === 0) {
      return res.status(400).json({
        error: "No parent emails found for student"
      });
    }

    // Check if parent emails are enabled and have content
    const parentFilter = createEmailContentFilter(dailyUpdate.emailPreferences, 'parent');
    const parentEnabled = dailyUpdate.emailPreferences?.parent?.enabled;
    const parentHasContent = parentFilter.hasAnyContent(dailyUpdate);

    if (!parentEnabled) {
      return res.status(400).json({
        error: "Parent emails are disabled in preferences"
      });
    }

    if (!parentHasContent) {
      return res.status(400).json({
        error: "No content to include in parent email based on current preferences"
      });
    }

    const emailContent = buildDailyUpdateTemplate({
      ...dailyUpdate,
      schoolName: dataSources.schoolName || "School",
      teacherName: dataSources.teacher?.name || "Teacher",
      teacherEmail: dataSources.teacher?.email || "",
      emailContentLibrary: dataSources.emailContentLibrary || {},
      emailPreferences: dailyUpdate.emailPreferences || dataSources.emailPreferences || {},
    });

    const results = [];
    const emailService = (await import("../services/emailService.js")).default;
    
    // normalize and deduplicate recipients
    const uniqueRecipients = Array.from(
      new Set(
        (dailyUpdate.parentEmails || [])
          .filter(Boolean)
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : e))
          .filter((e) => typeof e === "string" && e.length > 0)
      )
    );

    for (const parentEmail of uniqueRecipients) {
      try {
        const result = await emailService.sendEmail({
          to: parentEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        }, req.user?.uid);
        results.push({ email: parentEmail, success: true, messageId: result?.messageId });
      } catch (emailError) {
        console.error(`Error sending email to ${parentEmail}:`, emailError);
        results.push({ email: parentEmail, success: false, error: emailError.message });
      }
    }

    return res.json({
      success: true,
      message: `Daily update sent to ${results.filter(r => r.success).length} parents.`,
      studentName: dailyUpdate.studentName,
      parentEmails: dailyUpdate.parentEmails,
      results,
    });
  } catch (error) {
    console.error("sendStudentDailyUpdate error", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get daily update data without sending emails (callable function)
export const getDailyUpdateData = async (data, context) => {
  try {
    // Validate authentication
    const authUid = context?.auth?.uid;
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Normalize payload shape: accept either direct or nested under data (defensive for various callers)
    const actualData = (data && typeof data === "object" && "data" in data) ? data.data : data;
    const studentId = actualData?.studentId;
    const date = actualData?.date;
    const dataSources = actualData?.dataSources;

    // Basic validation
    if (!dataSources) {
      throw new Error("Missing dataSources");
    }

    // Validate email preferences if present
    if (dataSources.emailPreferences) {
      const validation = validateEmailPreferences(dataSources.emailPreferences);
      if (!validation.isValid) {
        console.warn("Invalid email preferences in getDailyUpdateData:", validation.errors);
      }
    }
    
    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    
    if (studentId) {
      const dailyUpdate = await dailyUpdateService.generateDailyUpdate(studentId, new Date(date), authUid);
      return {
        success: true,
        data: dailyUpdate,
        message: `Retrieved daily update data for ${dailyUpdate.studentName}`
      };
    } else {
      const dailyUpdates = await dailyUpdateService.generateAllDailyUpdates(new Date(date), authUid);
      const classSummary = dailyUpdateService.getClassSummary(new Date(date));
      return {
        success: true,
        data: {
          dailyUpdates,
          classSummary,
          totalStudents: dailyUpdates.length,
        },
        message: `Retrieved daily update data for ${dailyUpdates.length} students`
      };
    }
  } catch (error) {
    console.error("getDailyUpdateData error", error);
    
    // Provide more specific error handling
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Convert specific errors to more meaningful HttpsErrors
    if (error.message.includes('Authentication')) {
      throw new HttpsError('unauthenticated', error.message);
    }
    
    if (error.message.includes('Missing') || error.message.includes('Invalid')) {
      throw new HttpsError('invalid-argument', error.message);
    }
    
    // Default to internal error with more context
    throw new HttpsError('internal', `Failed to get daily update data: ${error.message}`);
  }
};

// Send student emails (all students) via callable
export const sendStudentEmailsCallable = async (data, context) => {
  try {
    const requestShape = data;
    const payload = (data && typeof data === "object" && "data" in data) ? data.data : data;
    const authUid = context?.auth?.uid ?? requestShape?.auth?.uid;
    if (!authUid) {
      console.log("sendStudentEmailsCallable: missing auth in context; request.auth:", requestShape?.auth);
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { date, dataSources } = payload || {};
    if (!dataSources) {
      throw new HttpsError("invalid-argument", "Missing dataSources");
    }

    // Validate data sources
    const dataSourcesValidation = (await import("../constants/emailSections.js")).validateDataSources(dataSources);
    if (!dataSourcesValidation.isValid) {
      console.error("sendStudentEmailsCallable: Invalid data sources:", dataSourcesValidation.errors);
      throw new HttpsError("invalid-argument", "Invalid dataSources");
    }
    
    // Validate email preferences if present
    if (dataSources.emailPreferences) {
      const validation = validateEmailPreferences(dataSources.emailPreferences);
      if (!validation.isValid) {
        console.warn("sendStudentEmailsCallable: Invalid email preferences:", validation.errors);
      }
    }

    console.log("sendStudentEmailsCallable: payload summary:", {
      hasDate: !!date,
      students: Array.isArray(dataSources.students) ? dataSources.students.length : 0,
      attendance: Array.isArray(dataSources.attendance) ? dataSources.attendance.length : 0,
      hasEmailPreferences: !!dataSources.emailPreferences,
    });

    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdates = await dailyUpdateService.generateAllDailyUpdates(new Date(date), authUid);

    const emailService = (await import("../services/emailService.js")).default;

    // Create quick lookup for student emails
    const studentsById = new Map(
      (dataSources.students || []).map((s) => [s.id || s.studentId, s])
    );

    let emailsSent = 0;
    const savedEmails = [];

    for (const update of dailyUpdates) {
      try {
        const student = studentsById.get(update.studentId) || {};
        const rawEmail = student.studentEmail || student.email || null;
        const studentEmail =
          typeof rawEmail === "string" && rawEmail.trim().length > 0
            ? rawEmail.trim().toLowerCase()
            : null;

        console.log(`Student ${update.studentName} (${update.studentId}):`, {
          hasStudent: !!student,
          rawEmail: rawEmail,
          studentEmail: studentEmail,
          studentKeys: Object.keys(student)
        });

        if (!studentEmail) {
          console.log(`Skipping student ${update.studentName} - no email found`);
          continue;
        }

        // Check if student emails are enabled and have content
        const studentFilter = createEmailContentFilter(update.emailPreferences, 'student');
        const studentEnabled = update.emailPreferences?.student?.enabled;
        const studentHasContent = studentFilter.hasAnyContent(update);

        if (!studentEnabled) {
          console.log(`Skipping student ${update.studentName} - student emails disabled`);
          continue;
        }

        if (!studentHasContent) {
          console.log(`Skipping student ${update.studentName} - no content to include due to all sections disabled`);
          continue;
        }

        // Log filtering summary for debugging
        const filteringSummary = studentFilter.getFilteringSummary(update);
        console.log(`Student email filtering for ${update.studentName}:`, {
          includedSections: filteringSummary.includedSections,
          excludedSections: filteringSummary.excludedSections
        });

        console.log(`Sending email to student: ${update.studentName} at ${studentEmail}`);

        const emailContext = {
          ...update,
          schoolName: dataSources.schoolName || "School",
          teacherName: dataSources.teacher?.name || "Teacher",
          teacherEmail: dataSources.teacher?.email || "",
          userId: authUid,
          emailContentLibrary: dataSources.emailContentLibrary || {},
          emailPreferences: update.emailPreferences || dataSources.emailPreferences || {},
          overrides: dataSources.overrides?.[update.studentId] || null,
        };

        // Normalize date to a Date object for templates that expect Date APIs
        try {
          if (emailContext?.date && typeof emailContext.date === 'string') {
            const parsed = new Date(emailContext.date);
            if (!isNaN(parsed.getTime())) {
              emailContext.date = parsed;
            }
          }
        } catch (_) {}

        const subject = buildStudentSubject(emailContext);
        const html = await buildStudentHtml(emailContext);
        const text = buildStudentText(emailContext);

        const result = await emailService.sendEmail(
          {
            to: studentEmail,
            subject: subject,
            html: html,
            text: text,
          },
          authUid
        );
        emailsSent++;
        
        // Save email record to Firestore
        const emailRecord = {
          studentId: update.studentId,
          studentName: update.studentName,
          subject: subject,
          recipients: [studentEmail],
          date: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD format
          sentStatus: "sent",
          recipientType: "student",
          userId: authUid,
          messageId: result?.messageId,
          method: result?.method || "gmail",
          content: html,
          text: text,
          metadata: {
            createdAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            teacherName: dataSources.teacher?.name || "Teacher",
            schoolName: dataSources.schoolName || "School",
            includedSections: filteringSummary.includedSections,
          }
        };
        
        // Save to Firestore
        const { getFirestore } = await import("firebase-admin/firestore");
        const adminDb = getFirestore();
        await adminDb.collection("dailyUpdateEmails").add(emailRecord);
        
        savedEmails.push({
          id: `student-email-${Date.now()}-${update.studentId}`,
          ...emailRecord,
        });
      } catch (emailError) {
        console.error(
          `Error sending student email for student ${update.studentId}:`,
          emailError
        );
      }
    }

    return {
      success: true,
      message: `Student emails sent successfully! ${emailsSent} emails sent.`,
      emailsSent,
      savedEmails,
    };
  } catch (error) {
    console.error("sendStudentEmailsCallable error", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error?.message || "Unknown error");
  }
};

// Send student email for a specific student via callable
export const sendStudentEmailCallable = async (data, context) => {
  try {
    const requestShape = data;
    const payload = (data && typeof data === "object" && "data" in data) ? data.data : data;
    const authUid = context?.auth?.uid ?? requestShape?.auth?.uid;
    if (!authUid) {
      console.log("sendStudentEmailCallable: missing auth in context; request.auth:", requestShape?.auth);
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { studentId, date, dataSources } = payload || {};
    if (!studentId || !dataSources) {
      throw new HttpsError("invalid-argument", "Missing studentId or dataSources");
    }

    // Validate data sources
    const dataSourcesValidation = (await import("../constants/emailSections.js")).validateDataSources(dataSources);
    if (!dataSourcesValidation.isValid) {
      console.error("sendStudentEmailCallable: Invalid data sources:", dataSourcesValidation.errors);
      throw new HttpsError("invalid-argument", "Invalid dataSources");
    }
    
    // Validate email preferences if present
    if (dataSources.emailPreferences) {
      const validation = validateEmailPreferences(dataSources.emailPreferences);
      if (!validation.isValid) {
        console.warn("sendStudentEmailCallable: Invalid email preferences:", validation.errors);
      }
    }

    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdate = dailyUpdateService.generateDailyUpdate(
      studentId,
      new Date(date)
    );

    const student = (dataSources.students || []).find(
      (s) => (s.id || s.studentId) === studentId
    );
    const rawEmail = student?.studentEmail || student?.email || null;
    const studentEmail =
      typeof rawEmail === "string" && rawEmail.trim().length > 0
        ? rawEmail.trim().toLowerCase()
        : null;
    if (!studentEmail) {
      throw new HttpsError("failed-precondition", "No student email found");
    }

    // Check if student emails are enabled and have content
    const studentFilter = createEmailContentFilter(dailyUpdate.emailPreferences, 'student');
    const studentEnabled = dailyUpdate.emailPreferences?.student?.enabled;
    const studentHasContent = studentFilter.hasAnyContent(dailyUpdate);

    if (!studentEnabled) {
      throw new HttpsError("failed-precondition", "Student emails are disabled in preferences");
    }

    if (!studentHasContent) {
      throw new HttpsError("failed-precondition", "No content to include in student email based on current preferences");
    }

    const emailContext = {
      ...dailyUpdate,
      schoolName: dataSources.schoolName || "School",
      teacherName: dataSources.teacher?.name || "Teacher",
      teacherEmail: dataSources.teacher?.email || "",
      userId: authUid,
      emailContentLibrary: dataSources.emailContentLibrary || {},
      emailPreferences: dailyUpdate.emailPreferences || dataSources.emailPreferences || {},
      overrides: dataSources.overrides?.[dailyUpdate.studentId] || null,
    };

    // Normalize date to a Date object for templates that expect Date APIs
    try {
      if (emailContext?.date && typeof emailContext.date === 'string') {
        const parsed = new Date(emailContext.date);
        if (!isNaN(parsed.getTime())) {
          emailContext.date = parsed;
        }
      }
    } catch (_) {}

    const subject = buildStudentSubject(emailContext);
    const html = await buildStudentHtml(emailContext);
    const text = buildStudentText(emailContext);

    const emailService = (await import("../services/emailService.js")).default;
    const result = await emailService.sendEmail(
      {
        to: studentEmail,
        subject: subject,
        html: html,
        text: text,
      },
      authUid
    );

    // Save email record to Firestore
    const emailRecord = {
      studentId: dailyUpdate.studentId,
      studentName: dailyUpdate.studentName,
      subject: subject,
      recipients: [studentEmail],
      date: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD format
      sentStatus: "sent",
      recipientType: "student",
      userId: authUid,
      messageId: result?.messageId,
      method: result?.method || "gmail",
      html: html,
      text: text,
      // Add character trait fields for easy access
      characterTraitQuote: dailyUpdate.characterTraitQuote || null,
      characterTraitChallenge: dailyUpdate.characterTraitChallenge || null,
      characterTrait: dailyUpdate.characterTrait || null,
      metadata: {
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        teacherName: dataSources.teacher?.name || "Teacher",
        schoolName: dataSources.schoolName || "School",
      }
    };
    
    // Save to Firestore - Student emails in separate collection
    const { getFirestore } = await import("firebase-admin/firestore");
    const adminDb = getFirestore();
    await adminDb.collection("studentDailyEmails").add(emailRecord);

    return {
      success: true,
      message: `Student email sent to ${studentEmail}`,
      studentName: dailyUpdate.studentName,
      studentEmail,
      messageId: result?.messageId,
      emailRecord: {
        id: `student-email-${Date.now()}-${dailyUpdate.studentId}`,
        ...emailRecord,
      },
    };
  } catch (error) {
    console.error("sendStudentEmailCallable error", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error?.message || "Unknown error");
  }
};

// Get Gmail API status for a user
export const getGmailStatus = async (req, res) => {
  try {
    const authed = await requireAuth(req).catch(() => null);
    if (!authed) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

    const userId = req.user?.uid;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    const gmailApiService = (await import("../services/gmailApiService.js")).default;
    const status = await gmailApiService.checkGmailStatus(userId);

    return res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error("getGmailStatus error", error);
    return res.status(500).json({ error: error.message });
  }
};

// Handle Gmail OAuth callback (backend)
export const handleGmailOAuthCallback = async (req, res) => {
  // CORS: restrict to known origins
  const origin = req.headers.origin || '';
  const allowedOrigins = (
    process.env.cors_allowed_origins ||
    'http://localhost:3000'
  )
    .split(',')
    .map((s) => s.trim());
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }
  
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    
    const { code, state, userId, redirect_uri } = req.body || {};
    if (!code || !state || !userId) {
      return res.status(400).json({ error: "Missing code, state, or userId" });
    }

    // Prefer APP_URL if set; else use request-provided redirect_uri; else fallback to localhost
    const appUrlValue = (process.env.app_url || '').replace(/\/$/, '');
    const finalRedirectUri = appUrlValue
      ? `${appUrlValue}/auth/gmail/callback`
      : (redirect_uri || 'http://localhost:3000/auth/gmail/callback');

    // Exchange code for tokens using backend credentials
    const clientId = process.env.gmail_client_id || '610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com';
    const clientSecret = process.env.gmail_client_secret || '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';
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || errorData.message || 'Failed to exchange code for tokens');
    }

    const tokens = await response.json();
    
    // Save tokens to Firestore
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    
    const newExpiry = Date.now() + (tokens.expires_in * 1000);
    
    await db.collection("users").doc(userId).update({
      gmail_access_token: tokens.access_token,
      gmail_refresh_token: tokens.refresh_token,
      gmail_token_expiry: newExpiry,
      gmail_configured: true,
      gmail_token_error: null,
      gmail_token_error_time: null,
      gmail_last_error: null,
      gmail_error_time: null,
      gmail_token_last_refresh: new Date().toISOString()
    });
    
    console.log(`Gmail OAuth completed for user ${userId}`);
    
    return res.json({
      success: true,
      message: "Gmail OAuth completed successfully",
      newExpiry: newExpiry
    });
  } catch (error) {
    console.error("handleGmailOAuthCallback error", error);
    return res.status(500).json({ error: error.message });
  }
};

// Token refresh endpoint
export const refreshGmailTokens = async (req, res) => {
  // Add CORS headers for localhost
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }
  
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    
    const { userId, refreshToken } = req.body || {};
    if (!userId || !refreshToken) {
      return res.status(400).json({ error: "Missing userId or refreshToken" });
    }

    // Exchange refresh token for new access token
    const clientId = process.env.gmail_client_id || '610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com';
    const clientSecret = process.env.gmail_client_secret || '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';
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Token refresh failed:', errorData);
      
      // If refresh token is invalid, clear Gmail configuration
      if (errorData.error === 'invalid_grant') {
        const { getFirestore } = await import("firebase-admin/firestore");
        const db = getFirestore();
        
        await db.collection("users").doc(userId).update({
          gmail_configured: false,
          gmail_token_error: 'Refresh token invalid - re-authentication required',
          gmail_token_error_time: new Date().toISOString()
        });
      }
      
      throw new Error(errorData.error_description || errorData.message || 'Failed to refresh tokens');
    }

    const tokens = await response.json();
    
    // Save new tokens to Firestore
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    
    const newExpiry = Date.now() + (tokens.expires_in * 1000);
    
    await db.collection("users").doc(userId).update({
      gmail_access_token: tokens.access_token,
      gmail_token_expiry: newExpiry,
      gmail_token_error: null,
      gmail_token_error_time: null,
      gmail_token_last_refresh: new Date().toISOString()
    });
    
    console.log(`Gmail tokens refreshed for user ${userId}`);
    
    return res.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // May be null if not provided by Google
      expiry_time: newExpiry
    });
  } catch (error) {
    console.error("refreshGmailTokens error", error);
    return res.status(500).json({ error: error.message });
  }
};