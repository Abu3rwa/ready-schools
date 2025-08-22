import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import emailService from "../services/emailService.js";
import { buildDailyUpdateTemplate } from "../templates/dailyUpdateEmail.js";
import { requireAuth } from "../middleware/auth.js";
import { getFirestore } from "firebase-admin/firestore";
import sanitizeHtml from "sanitize-html";
// Lazy load these imports only when needed
// import { DailyUpdateService } from "../services/dailyUpdateService.js";
// import { buildDailyUpdateTemplate } from "../templates/dailyUpdateEmail.js";

// Middleware to check authentication
const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No authentication token provided");
    }

    const token = authHeader.split(" ")[1];
    // TODO: Implement proper token verification with Firebase Auth
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = decodedToken;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: " + error.message });
  }
};

// Validate student emails
const validateStudentEmails = (emails) => {
  if (!Array.isArray(emails)) {
    emails = [emails];
  }

  // Ensure all emails are provided and valid
  const invalidEmails = emails.filter(
    (email) => !email || typeof email !== "string" || !email.includes("@")
  );
  if (invalidEmails.length > 0) {
    throw new Error(`Invalid student email(s): ${invalidEmails.join(", ")}`);
  }

  return emails;
};

// Send a single email to student(s)
export const sendEmail = onRequest(async (req, res) => {
  if (!(await requireAuth(req).catch(() => null))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });
  if (!req.is("application/json"))
    return res.status(415).json({ error: "Unsupported Media Type" });
  try {
    const { studentEmails, subject, content, templateType, templateData } =
      req.body;

    if (!studentEmails || !subject || (!content && !templateType)) {
      return res.status(400).json({
        error:
          "Missing required fields: 'studentEmails', 'subject', and either 'content' or 'templateType' are required",
      });
    }

    // Validate student emails
    const validatedEmails = validateStudentEmails(studentEmails);

    const emailOptions = {
      to: validatedEmails,
      subject,
      html: content,
    };

    if (templateType) {
      try {
        // Only import when needed
        const templates = await import("../templates/reportEmail.js");
        if (templateType === "report") {
          if (!templateData.studentName) {
            templateData.studentName = validatedEmails[0].split("@")[0]; // Use email username as fallback
          }
          const template = templates.buildEmailTemplate(templateData);
          emailOptions.subject = template.subject;
          emailOptions.html = template.html;
        } else if (templateType === "reminder") {
          if (!templateData.studentName) {
            templateData.studentName = validatedEmails[0].split("@")[0]; // Use email username as fallback
          }
          const template = templates.buildReminderTemplate(templateData);
          emailOptions.subject = template.subject;
          emailOptions.html = template.html;
        } else {
          return res.status(400).json({ error: "Invalid template type" });
        }
      } catch (error) {
        console.error("Error loading template:", error);
        return res.status(500).json({ error: "Failed to load email template" });
      }
    }

    const result = await emailService.sendEmail(emailOptions, req.user.uid);
    res.json({
      success: true,
      messageId: result.messageId,
      sentTo: validatedEmails,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: error.message });
  }
});

// Send batch emails to multiple students
export const sendBatchEmails = onRequest(async (req, res) => {
  if (!(await requireAuth(req).catch(() => null))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });
  if (!req.is("application/json"))
    return res.status(415).json({ error: "Unsupported Media Type" });
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: "Missing or invalid 'emails' array in request body",
      });
    }

    const results = [];
    const errors = [];

    for (const emailData of emails) {
      try {
        const { studentEmails, subject, content, templateType, templateData } =
          emailData;

        if (!studentEmails || !subject || (!content && !templateType)) {
          errors.push({
            emailData,
            error: "Missing required fields",
          });
          continue;
        }

        const validatedEmails = validateStudentEmails(studentEmails);

        const emailOptions = {
          to: validatedEmails,
          subject,
          html: content,
        };

        if (templateType) {
          try {
            const templates = await import("../templates/reportEmail.js");
            if (templateType === "report") {
              if (!templateData.studentName) {
                templateData.studentName = validatedEmails[0].split("@")[0];
              }
              const template = templates.buildEmailTemplate(templateData);
              emailOptions.subject = template.subject;
              emailOptions.html = template.html;
            } else if (templateType === "reminder") {
              if (!templateData.studentName) {
                templateData.studentName = validatedEmails[0].split("@")[0];
              }
              const template = templates.buildReminderTemplate(templateData);
              emailOptions.subject = template.subject;
              emailOptions.html = template.html;
            }
          } catch (templateError) {
            console.error("Error loading template:", templateError);
            errors.push({
              emailData,
              error: "Failed to load email template",
            });
            continue;
          }
        }

        const result = await emailService.sendEmail(emailOptions, req.user.uid);
        results.push({
          emailData,
          success: true,
          messageId: result.messageId,
          sentTo: validatedEmails,
        });
      } catch (error) {
        console.error("Error sending batch email:", error);
        errors.push({
          emailData,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      results,
      errors,
      summary: {
        total: emails.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Error processing batch emails:", error);
    res.status(500).json({ error: error.message });
  }
});

 
 

// Daily Update Functions - Using onCall for proper authentication
export const sendDailyUpdates = onCall(
  {
    timeoutSeconds: 300, // 5 minutes timeout
    memory: "256MiB",
    secrets: ["SMTP_EMAIL", "SMTP_PASSWORD"],
  },
  async (request) => {
    console.log("=== SEND DAILY UPDATES FUNCTION STARTED ===");
    try {
      console.log(
        "sendDailyUpdates called with request:",
        JSON.stringify(request.data, null, 2)
      );

      // The user is automatically authenticated in callable functions
      const { date, dataSources } = request.data;

      if (!date || !dataSources) {
        console.error(
          "Missing required fields - date:",
          !!date,
          "dataSources:",
          !!dataSources
        );
        throw new HttpsError(
          "invalid-argument",
          "Missing required fields: date and dataSources"
        );
      }

      console.log("Loading DailyUpdateService...");
      // Lazy load the daily update service
      const { DailyUpdateService } = await import(
        "../services/dailyUpdateService.js"
      );
      const dailyUpdateService = new DailyUpdateService();

      console.log("Generating daily updates...");
      const result = await dailyUpdateService.sendDailyUpdatesToAllParents(
        dataSources,
        new Date(date)
      );
      console.log(
        "Generated daily updates result:",
        JSON.stringify(result, null, 2)
      );

      // First, let's test if the email service works at all
      console.log("Testing email service initialization...");
      try {
        await emailService.initialize();
        console.log("Email service initialized successfully");
      } catch (initErr) {
        console.error("Email service initialization failed:", initErr.message);
        return {
          success: false,
          error: "Email service initialization failed: " + initErr.message,
          data: { ...result, emailsSent: 0 },
        };
      }

      // Attempt to actually send emails here and compute emailsSent
      let emailsSent = 0;
      const savedEmails = [];
      console.log("Starting email sending process...");

      const db = getFirestore();
      const dateString = new Date(date).toISOString().split("T")[0];

      // Load user preferences
      let userPrefs = {};
      try {
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (userDoc.exists) userPrefs = userDoc.data() || {};
      } catch (e) {
        console.warn("Could not load user prefs:", e.message);
      }

      const parseList = (val) => {
        if (!val || typeof val !== 'string') return undefined;
        const arr = val.split(',').map(s => s.trim()).filter(Boolean);
        return arr.length ? arr : undefined;
      };

      try {
        const updates = Array.isArray(result.dailyUpdates)
          ? result.dailyUpdates
          : [];
        console.log(
          `Processing ${updates.length} daily updates for email sending`
        );

        for (let i = 0; i < updates.length; i++) {
          const update = updates[i];
          // Apply preferences per email
          update.schoolName = update.schoolName || userPrefs.school_name || update.schoolName || "School";
          update.teacherName = update.teacherName || (request.auth?.token?.name) || userPrefs.teacher_display_name || "Teacher";
          update.subjectTemplate = userPrefs.dailyEmailSubjectTemplate || null;
          update.includeSections = userPrefs.dailyEmailIncludeSections || {};
          update.schoolLogoUrl = userPrefs.school_logo_url || null;
          update.emailSignature = userPrefs.email_signature || null;

          console.log(
            `Processing update ${i + 1}/${updates.length} for student:`,
            update.studentName
          );
          console.log("Parent emails for this student:", update.parentEmails);

          const recipients = Array.isArray(update.parentEmails)
            ? update.parentEmails.filter(Boolean)
            : [];
          console.log("Filtered recipients (non-empty emails):", recipients);

          if (recipients.length === 0) {
            console.log(
              `No valid parent emails found for student ${update.studentName}, skipping...`
            );
            continue;
          }

          // Use the beautiful HTML template instead of basic placeholder
          const emailTemplate = buildDailyUpdateTemplate(update);
          const subject = emailTemplate.subject;
          const html = emailTemplate.html;

          const cc = parseList(userPrefs.dailyEmailCc);
          const bcc = parseList(userPrefs.dailyEmailBcc);
          const replyTo = userPrefs.dailyEmailReplyTo || undefined;

          console.log(`Attempting to send email to: ${Array.isArray(update.parentEmails) ? update.parentEmails.filter(Boolean).join(", ") : ''}`);
          try {
            const emailResult = await emailService.sendEmail(
              { to: Array.isArray(update.parentEmails) ? update.parentEmails.filter(Boolean) : [], subject, html, cc, bcc, replyTo },
              request.auth.uid
            );
            emailsSent += (Array.isArray(update.parentEmails) ? update.parentEmails.filter(Boolean).length : 0);
            console.log(
              `Successfully sent email to recipients for student ${update.studentName}. Message ID:`,
              emailResult.messageId
            );

            // Persist the sent email to Firestore for history
            try {
              const docData = {
                userId: request.auth.uid,
                studentId: update.studentId,
                studentName: update.studentName,
                date: dateString,
                subject,
                content: sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }),
                html,
                sentStatus: "Sent",
                type: "daily_update",
                attendance: update.attendance || {},
                grades: update.grades || [],
                behavior: update.behavior || [],
                assignments: update.assignments || [],
                classwork: update.classwork || [],
                homework: update.homework || [],
                upcomingAssignments: update.upcomingAssignments || [],
                metadata: {
                  createdAt: new Date().toISOString(),
                  sentAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  teacherName: update.teacherName,
                  schoolName: update.schoolName,
                  cc: cc || [],
                  bcc: bcc || [],
                  replyTo: replyTo || null,
                },
                recipients: Array.isArray(update.parentEmails) ? update.parentEmails.filter(Boolean) : [],
              };
              await db.collection("dailyUpdateEmails").add(docData);
            } catch (persistErr) {
              console.error("Failed to persist daily update email:", persistErr);
            }
          } catch (sendErr) {
            console.error(
              "Failed to send daily update email for",
              update.studentId,
              "Error:",
              sendErr.message
            );
            console.error("Full error object:", sendErr);
          }
        }
      } catch (sendWrapperErr) {
        console.error(
          "Error while sending daily updates batch:",
          sendWrapperErr
        );
      }

      console.log(`Email sending complete. Total emails sent: ${emailsSent}`);
      const finalResult = {
        success: true,
        data: { ...result, emailsSent },
      };
      console.log(
        "Final result being returned:",
        JSON.stringify(finalResult, null, 2)
      );
      console.log("=== SEND DAILY UPDATES FUNCTION COMPLETED ===");

      return finalResult;
    } catch (error) {
      console.error("=== ERROR IN SEND DAILY UPDATES ===");
      console.error("Error sending daily updates:", error);
      console.error("Error stack:", error.stack);
      // Return a more detailed error response instead of throwing HttpsError
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
);

export const sendStudentDailyUpdate = onCall(async (request) => {
  try {
    const { studentId, date, dataSources } = request.data;

    if (!studentId || !date || !dataSources) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: studentId, date, and dataSources"
      );
    }

    // Lazy load the daily update service
    const { DailyUpdateService } = await import(
      "../services/dailyUpdateService.js"
    );
    const dailyUpdateService = new DailyUpdateService();

    const result = await dailyUpdateService.sendDailyUpdateForStudent(
      studentId,
      dataSources,
      new Date(date)
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error sending student daily update:", error);
    // Return a more detailed error response instead of throwing HttpsError
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
});

export const getDailyUpdateData = onCall(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: ["SMTP_EMAIL", "SMTP_PASSWORD"],
  },
  async (request) => {
    try {
      console.log("=== GET DAILY UPDATE DATA FUNCTION STARTED ===");
      console.log("Request data:", JSON.stringify(request.data, null, 2));

      const { studentId, dataSources, date } = request.data;

      if (!dataSources) {
        console.error("Missing dataSources in request");
        throw new HttpsError("invalid-argument", "Data sources are required");
      }

      if (!date) {
        console.warn("No date provided, using current date");
      }

      try {
        // Lazy load the daily update service
        console.log("Loading DailyUpdateService...");
        const { DailyUpdateService } = await import(
          "../services/dailyUpdateService.js"
        );
        const dailyUpdateService = new DailyUpdateService();

        console.log("Generating daily update data...");
        const result = await dailyUpdateService.getDailyUpdateData(
          studentId,
          dataSources,
          date ? new Date(date) : new Date()
        );
        console.log(
          "Generated daily update data:",
          JSON.stringify(result, null, 2)
        );

        return {
          success: true,
          data: result,
        };
      } catch (serviceError) {
        console.error("Error in DailyUpdateService:", serviceError);
        throw new HttpsError(
          "internal",
          `Error generating daily update data: ${serviceError.message}`
        );
      }
    } catch (error) {
      console.error("Error in getDailyUpdateData:", error);
      // Return a more detailed error response instead of throwing Error
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
);
