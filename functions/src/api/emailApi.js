import { buildDailyUpdateTemplate } from "../templates/dailyUpdateEmail.js";
import { buildStudentDailyEmailTemplate } from "../templates/studentDailyUpdateEmail.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpsError } from "firebase-functions/v2/https";


// Student-specific: preview student daily email (admin/teacher)
export const studentPreviewDailyEmail = async (req, res) => {
  try {
    const authed = await requireAuth(req).catch(() => null);
    if (!authed) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    if (!req.is("application/json")) return res.status(415).json({ error: "Unsupported Media Type" });

    const { data } = req.body || {};
    if (!data || !data.studentName || !data.date) {
      return res.status(400).json({ error: "Missing data.studentName or data.date" });
    }
    const tpl = buildStudentDailyEmailTemplate(data);
    return res.json({ success: true, subject: tpl.subject, html: tpl.html, text: tpl.text });
  } catch (error) {
    console.error("studentPreviewDailyEmail error", error);
    return res.status(500).json({ error: error.message });
  }
};

// Student-specific: queue/send now to one or more students
export const studentQueueDailyEmail = async (req, res) => {
  try {
    const authed = await requireAuth(req).catch(() => null);
    if (!authed) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    if (!req.is("application/json")) return res.status(415).json({ error: "Unsupported Media Type" });

    const { recipients, data } = req.body || {};
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "Missing recipients[]" });
    }
    
    // Add userId to data for character traits integration
    const templateData = {
      ...data,
      userId: req.user?.uid
    };
    
    const tpl = await buildStudentDailyEmailTemplate(templateData);
    const emailService = (await import("../services/emailService.js")).default;
    const result = await emailService.sendEmail({ to: recipients, subject: tpl.subject, html: tpl.html, text: tpl.text }, req.user?.uid);
    return res.json({ success: true, messageId: result?.messageId, sentTo: recipients });
  } catch (error) {
    console.error("studentQueueDailyEmail error", error);
    return res.status(500).json({ error: error.message });
  }
};

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

// Send batch emails
export const sendBatchEmails = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const { emails, userId } = req.body || {};
    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: "Missing emails array" });
    }
    const emailService = (await import("../services/emailService.js")).default;
    const result = await emailService.sendBatchEmails(emails, userId);
    return res.json({ success: true, result });
  } catch (error) {
    console.error("sendBatchEmails error", error);
    return res.status(500).json({ error: error.message });
  }
};

// (Removed test/diagnostic helpers: , verifyEmailConfig)

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

    console.log("sendDailyUpdates: Starting daily update process...");
    console.log("sendDailyUpdates: Date:", date);
    console.log("sendDailyUpdates: Data sources:", {
      students: dataSources.students?.length || 0,
      attendance: dataSources.attendance?.length || 0,
      behavior: dataSources.behavior?.length || 0,
      schoolName: dataSources.schoolName,
      teacher: dataSources.teacher
    });

    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdates = dailyUpdateService.generateAllDailyUpdates(new Date(date));
    
    console.log(`sendDailyUpdates: Generated ${dailyUpdates.length} daily updates`);

    let emailsSent = 0;
    const savedEmails = [];

    for (const update of dailyUpdates) {
      console.log(`sendDailyUpdates: Processing update for student: ${update.studentName} (${update.studentId})`);
      
      if (update.parentEmails && update.parentEmails.length > 0) {
        console.log(`sendDailyUpdates: Found ${update.parentEmails.length} parent emails for ${update.studentName}`);
        
        try {
          const emailContent = buildDailyUpdateTemplate({
            ...update,
            schoolName: dataSources.schoolName || "School",
            teacherName: dataSources.teacher?.name || "Teacher",
            teacherEmail: dataSources.teacher?.email || "",
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
              
              savedEmails.push({
                id: `email-${Date.now()}-${update.studentId}-${parentEmail}`,
                studentId: update.studentId,
                studentName: update.studentName,
                subject: emailContent.subject,
                recipients: [parentEmail],
                date: new Date().toISOString(),
                sentStatus: "sent",
                messageId: result?.messageId,
                method: result?.method
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
    throw new Error(error.message);
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
    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdate = dailyUpdateService.generateDailyUpdate(studentId, new Date(date));
    if (!dailyUpdate || !dailyUpdate.parentEmails || dailyUpdate.parentEmails.length === 0) {
      return res.status(400).json({
        error: "No parent emails found for student"
      });
    }
    const emailContent = buildDailyUpdateTemplate({
      ...dailyUpdate,
      schoolName: dataSources.schoolName || "School",
      teacherName: dataSources.teacher?.name || "Teacher",
      teacherEmail: dataSources.teacher?.email || "",
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
    // Normalize payload shape: accept either direct or nested under data (defensive for various callers)
    const actualData = (data && typeof data === "object" && "data" in data) ? data.data : data;
    const studentId = actualData?.studentId;
    const date = actualData?.date;
    const dataSources = actualData?.dataSources;

    // Basic validation
    if (!dataSources) {
      throw new Error("Missing dataSources");
    }
    
    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    
    if (studentId) {
      const dailyUpdate = dailyUpdateService.generateDailyUpdate(studentId, new Date(date));
      return {
        success: true,
        data: dailyUpdate,
        message: `Retrieved daily update data for ${dailyUpdate.studentName}`
      };
    } else {
      const dailyUpdates = dailyUpdateService.generateAllDailyUpdates(new Date(date));
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
    throw new Error(error.message);
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

    console.log("sendStudentEmailsCallable: payload summary:", {
      hasDate: !!date,
      students: Array.isArray(dataSources.students) ? dataSources.students.length : 0,
      attendance: Array.isArray(dataSources.attendance) ? dataSources.attendance.length : 0,
    });

    const { DailyUpdateService } = await import("../services/dailyUpdateService.js");
    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdates = dailyUpdateService.generateAllDailyUpdates(new Date(date));

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

        console.log(`Sending email to student: ${update.studentName} at ${studentEmail}`);

        const emailContent = await buildStudentDailyEmailTemplate({
          ...update,
          schoolName: dataSources.schoolName || "School",
          teacherName: dataSources.teacher?.name || "Teacher",
          teacherEmail: dataSources.teacher?.email || "",
        });

        const result = await emailService.sendEmail(
          {
            to: studentEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          },
          authUid
        );
        emailsSent++;
        savedEmails.push({
          id: `student-email-${Date.now()}-${update.studentId}`,
          studentId: update.studentId,
          studentName: update.studentName,
          subject: emailContent.subject,
          recipients: [studentEmail],
          date: new Date().toISOString(),
          sentStatus: "sent",
          recipientType: "student",
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

    const emailContent = buildStudentDailyEmailTemplate({
      ...dailyUpdate,
      schoolName: dataSources.schoolName || "School",
      teacherName: dataSources.teacher?.name || "Teacher",
      teacherEmail: dataSources.teacher?.email || "",
    });

    const emailService = (await import("../services/emailService.js")).default;
    const result = await emailService.sendEmail(
      {
        to: studentEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
      authUid
    );

    return {
      success: true,
      message: `Student email sent to ${studentEmail}`,
      studentName: dailyUpdate.studentName,
      studentEmail,
      messageId: result?.messageId,
    };
  } catch (error) {
    console.error("sendStudentEmailCallable error", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error?.message || "Unknown error");
  }
};

// (Removed testGmailDelivery)

// (Removed getGmailQuotas)

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

// (Removed fixGmailConfig)

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

// (Removed fixSpecificUser)

// (Removed resetGmailConfiguration)