import { HttpsError } from "firebase-functions/v2/https";
import { buildDailyUpdateTemplate } from "../templates/dailyUpdateEmail.js";
import emailService from "../services/emailService.js";
import { DailyUpdateService } from "../services/dailyUpdateService.js";
import { getFirestore } from "firebase-admin/firestore";

const adminDb = getFirestore();

// Helper function to validate authentication
const validateAuth = (context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  return context.auth;
};

// Send daily updates to all parents (callable function)
export const sendDailyUpdates = async (data, context) => {
  try {
    // Validate authentication
    const auth = validateAuth(context);
    console.log("sendDailyUpdates called by user:", auth.uid);

    const { date, dataSources } = data;
    if (!dataSources) {
      throw new HttpsError("invalid-argument", "Missing dataSources");
    }

    console.log("Processing daily updates with data sources:", {
      studentsCount: (dataSources.students || []).length,
      attendanceCount: (dataSources.attendance || []).length,
      assignmentsCount: (dataSources.assignments || []).length,
      gradesCount: (dataSources.grades || []).length,
      behaviorCount: (dataSources.behavior || []).length,
      lessonsCount: (dataSources.lessons || []).length,
    });

    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdates = await dailyUpdateService.generateAllDailyUpdates(new Date(date));
    
    let emailsSent = 0;
    const savedEmails = [];
    
    for (const update of dailyUpdates) {
      if (update.parentEmails && update.parentEmails.length > 0) {
        try {
          const emailContent = buildDailyUpdateTemplate({
            ...update,
            schoolName: dataSources.schoolName || "School",
            teacherName: dataSources.teacher?.name || "Teacher",
            teacherEmail: dataSources.teacher?.email || "",
          });
          
          for (const parentEmail of update.parentEmails) {
            const result = await emailService.sendEmail({
              to: parentEmail,
              subject: emailContent.subject,
              html: emailContent.html,
            }, auth.uid);
            emailsSent++;
          }
          
          // Save email record to Firestore
          const emailRecord = {
            studentId: update.studentId,
            studentName: update.studentName,
            subject: emailContent.subject,
            recipients: update.parentEmails,
            date: new Date().toISOString(),
            sentStatus: "sent",
            recipientType: "parent",
            userId: auth.uid,
            metadata: {
              createdAt: new Date().toISOString(),
              sentAt: new Date().toISOString(),
              teacherName: dataSources.teacher?.name || "Teacher",
              schoolName: dataSources.schoolName || "School",
            }
          };
          
          await adminDb.collection("dailyUpdateEmails").add(emailRecord);
          savedEmails.push({
            id: `email-${Date.now()}-${update.studentId}`,
            ...emailRecord,
          });
        } catch (emailError) {
          console.error(`Error sending email for student ${update.studentId}:`, emailError);
        }
      }
    }
    
    return {
      success: true,
      message: `Daily updates sent successfully! ${emailsSent} emails sent.`,
      emailsSent,
      savedEmails,
    };
  } catch (error) {
    console.error("sendDailyUpdates error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message);
  }
};

// Send daily update for a specific student (callable function)
export const sendStudentDailyUpdate = async (data, context) => {
  try {
    // Validate authentication
    const auth = validateAuth(context);
    console.log("sendStudentDailyUpdate called by user:", auth.uid);

    const { studentId, date, dataSources } = data;
    if (!studentId || !dataSources) {
      throw new HttpsError("invalid-argument", "Missing studentId or dataSources");
    }

    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    const dailyUpdate = dailyUpdateService.generateDailyUpdate(studentId, new Date(date));
    
    if (!dailyUpdate || !dailyUpdate.parentEmails || dailyUpdate.parentEmails.length === 0) {
      throw new HttpsError("failed-precondition", "No parent emails found for student");
    }
    
    const emailContent = buildDailyUpdateTemplate({
      ...dailyUpdate,
      schoolName: dataSources.schoolName || "School",
      teacherName: dataSources.teacher?.name || "Teacher",
      teacherEmail: dataSources.teacher?.email || "",
    });
    
    const results = [];
    const savedEmails = [];
    
    for (const parentEmail of dailyUpdate.parentEmails) {
      try {
        const result = await emailService.sendEmail({
          to: parentEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        }, auth.uid);
        results.push({ email: parentEmail, success: true, messageId: result?.messageId });
        
        // Save email record to Firestore
        const emailRecord = {
          studentId: dailyUpdate.studentId,
          studentName: dailyUpdate.studentName,
          subject: emailContent.subject,
          recipients: [parentEmail],
          date: new Date().toISOString(),
          sentStatus: "sent",
          recipientType: "parent",
          userId: auth.uid,
          messageId: result?.messageId,
          metadata: {
            createdAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            teacherName: dataSources.teacher?.name || "Teacher",
            schoolName: dataSources.schoolName || "School",
          }
        };
        
        await adminDb.collection("dailyUpdateEmails").add(emailRecord);
        savedEmails.push({
          id: `email-${Date.now()}-${dailyUpdate.studentId}`,
          ...emailRecord,
        });
      } catch (emailError) {
        console.error(`Error sending email to ${parentEmail}:`, emailError);
        results.push({ email: parentEmail, success: false, error: emailError.message });
      }
    }
    
    return {
      success: true,
      message: `Daily update sent to ${results.filter(r => r.success).length} parents.`,
      studentName: dailyUpdate.studentName,
      parentEmails: dailyUpdate.parentEmails,
      results,
      savedEmails,
    };
  } catch (error) {
    console.error("sendStudentDailyUpdate error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message);
  }
};

// Get daily update data without sending emails (callable function)
export const getDailyUpdateData = async (data, context) => {
  try {
    // Validate authentication
    const auth = validateAuth(context);
    console.log("getDailyUpdateData called by user:", auth.uid);
    console.log("Request data:", {
      hasStudentId: !!data.studentId,
      hasDate: !!data.date,
      hasDataSources: !!data.dataSources,
      dataSourcesKeys: data.dataSources ? Object.keys(data.dataSources) : [],
    });

    const { studentId, date, dataSources } = data;
    if (!dataSources) {
      throw new HttpsError("invalid-argument", "Missing dataSources");
    }

    console.log("Data sources details:", {
      studentsCount: (dataSources.students || []).length,
      attendanceCount: (dataSources.attendance || []).length,
      assignmentsCount: (dataSources.assignments || []).length,
      gradesCount: (dataSources.grades || []).length,
      behaviorCount: (dataSources.behavior || []).length,
      lessonsCount: (dataSources.lessons || []).length,
      teacher: dataSources.teacher,
      schoolName: dataSources.schoolName,
    });

    const dailyUpdateService = new DailyUpdateService();
    dailyUpdateService.setDataSources(dataSources);
    
    if (studentId) {
      console.log(`Generating daily update for student: ${studentId}`);
      const dailyUpdate = dailyUpdateService.generateDailyUpdate(studentId, new Date(date));
      console.log("Generated student update successfully");
      
      return {
        success: true,
        data: dailyUpdate,
        message: `Retrieved daily update data for ${dailyUpdate.studentName}`
      };
    } else {
      console.log("Generating daily updates for all students");
      const dailyUpdates = await dailyUpdateService.generateAllDailyUpdates(new Date(date));
      console.log(`Generated updates for ${dailyUpdates.length} students`);
      
      const classSummary = dailyUpdateService.getClassSummary(new Date(date));
      console.log("Generated class summary:", classSummary);
      
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
    console.error("getDailyUpdateData error:", error);
    console.error("Error stack:", error.stack);
    
    // Log more details about the error
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.details) {
      console.error("Error details:", error.details);
    }
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Provide more specific error message
    throw new HttpsError("internal", `Failed to get daily update data: ${error.message}`);
  }
};