import dayjs from "dayjs";

export class DailyUpdateService {
  constructor() {
    this.dataSources = {};
  }

  // Set data sources (students, attendance, assignments, grades, behavior, lessons)
  setDataSources(sources) {
    console.log("Setting data sources:", {
      studentsCount: (sources.students || []).length,
      attendanceCount: (sources.attendance || []).length,
      assignmentsCount: (sources.assignments || []).length,
      gradesCount: (sources.grades || []).length,
      behaviorCount: (sources.behavior || []).length,
      lessonsCount: (sources.lessons || []).length,
      teacher: sources.teacher,
      schoolName: sources.schoolName,
    });

    // Ensure we have arrays for all data sources
    this.dataSources = {
      students: sources.students || [],
      attendance: sources.attendance || [],
      assignments: sources.assignments || [],
      grades: sources.grades || [],
      behavior: sources.behavior || [],
      lessons: sources.lessons || [],
      teacher: sources.teacher,
      schoolName: sources.schoolName,
    };
  }

  // Generate daily update data for a specific student
  generateDailyUpdate(studentId, date = new Date()) {
    const dateString = dayjs(date).format("YYYY-MM-DD");
    const student = this.getStudent(studentId);

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Get today's attendance
    const attendance = this.getTodayAttendance(studentId, dateString);

    // Get today's assignments/activities
    const assignments = this.getTodayAssignments(studentId, dateString);

    // Get new grades from today
    const grades = this.getTodayGrades(studentId, dateString);

    // Get today's behavior incidents
    const behavior = this.getTodayBehavior(studentId, dateString);

    // Get today's lessons
    const lessons = this.getTodayLessons(studentId, dateString);

    // Get upcoming assignments (next 7 days)
    const upcomingAssignments = this.getUpcomingAssignments(studentId, date);

    // Calculate overall grade
    const overallGrade = this.calculateOverallGrade(studentId);

    // Calculate per-subject grades
    const subjectGrades = this.calculateSubjectGrades(studentId);

    // Calculate attendance rate
    const attendanceRate = this.calculateAttendanceRate(studentId, dateString);

    // Get parent emails and optional parent display name
    const parentEmails = this.getParentEmails(student);
    const parentName = this.getParentName(student);

    // Debug logging for gender data
    console.log("Student gender data:", {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      rawGender: student.gender,
      genderType: typeof student.gender,
      processedGender: student.gender || null,
    });

    return {
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      studentGender: student.gender || null, // Add gender information - allow null for proper fallback
      parentEmails,
      parentName,
      date: dateString,
      attendance,
      assignments,
      grades,
      behavior,
      lessons,
      upcomingAssignments,
      overallGrade,
      subjectGrades,
      attendanceRate,
      // Additional metadata
      schoolName: this.dataSources.schoolName || "AMLY School",
      teacherName:
        this.dataSources.teacher?.name ||
        this.dataSources.teacher?.displayName ||
        "Teacher",
      teacherEmail: this.dataSources.teacher?.email || "",
    };
  }

  // Generate daily updates for all students
  generateAllDailyUpdates(date = new Date()) {
    console.log("Generating daily updates for date:", date);
    console.log("Data sources:", {
      studentsCount: (this.dataSources.students || []).length,
      attendanceCount: (this.dataSources.attendance || []).length,
      assignmentsCount: (this.dataSources.assignments || []).length,
      gradesCount: (this.dataSources.grades || []).length,
      behaviorCount: (this.dataSources.behavior || []).length,
      teacher: this.dataSources.teacher,
      schoolName: this.dataSources.schoolName,
    });

    const updates = [];

    for (const student of this.dataSources.students || []) {
      try {
        console.log("Generating update for student:", student.id);
        const update = this.generateDailyUpdate(student.id, date);
        console.log("Generated update:", update);
        updates.push(update);
      } catch (error) {
        console.error(
          `Error generating daily update for student ${student.id}:`,
          error
        );
      }
    }

    console.log("Generated updates for", updates.length, "students");
    return updates;
  }

  // Helper methods
  getStudent(studentId) {
    return (this.dataSources.students || []).find((s) => s.id === studentId);
  }

  getTodayAttendance(studentId, dateString) {
    const attendance = (this.dataSources.attendance || []).find(
      (a) => a.studentId === studentId && a.date === dateString
    );

    return (
      attendance || {
        status: "Not Recorded",
        notes: "Attendance not yet recorded for today",
        date: dateString,
      }
    );
  }

  getTodayAssignments(studentId, dateString) {
    // Get assignments that are due today or were assigned today
    const todayAssignments = (this.dataSources.assignments || []).filter(
      (assignment) => {
        const dueDate = assignment.dueDate
          ? dayjs(assignment.dueDate).format("YYYY-MM-DD")
          : null;
        const createdDate = assignment.createdAt
          ? dayjs(assignment.createdAt).format("YYYY-MM-DD")
          : null;
        return dueDate === dateString || createdDate === dateString;
      }
    );

    // Also get classwork/homework that was completed today
    const todayClasswork = (this.dataSources.grades || [])
      .filter((grade) => {
        const gradeDate = dayjs(grade.dateEntered).format("YYYY-MM-DD");
        return grade.studentId === studentId && gradeDate === dateString;
      })
      .map((grade) => {
        const assignment = (this.dataSources.assignments || []).find(
          (a) => a.id === grade.assignmentId
        );
        return {
          ...assignment,
          completed: true,
          grade: grade,
        };
      });

    return [...todayAssignments, ...todayClasswork];
  }

  getTodayGrades(studentId, dateString) {
    return (this.dataSources.grades || [])
      .filter((grade) => {
        if (!grade.dateEntered) {
          return false;
        }
        const gradeDate = dayjs(grade.dateEntered).format("YYYY-MM-DD");
        return grade.studentId === studentId && gradeDate === dateString;
      })
      .map((grade) => {
        const assignment = (this.dataSources.assignments || []).find(
          (a) => a.id === grade.assignmentId
        );
        return {
          ...grade,
          assignmentName: assignment ? assignment.name : "Unknown Assignment",
          subject: assignment ? assignment.subject : "Unknown Subject",
        };
      });
  }

  getTodayBehavior(studentId, dateString) {
    return (this.dataSources.behavior || []).filter((incident) => {
      if (!incident.date) {
        return false;
      }
      const incidentDate = dayjs(incident.date).format("YYYY-MM-DD");
      return incident.studentId === studentId && incidentDate === dateString;
    });
  }

  getTodayLessons(studentId, dateString) {
    return (this.dataSources.lessons || []).filter((lesson) => {
      if (!lesson.date) {
        return false;
      }
      const lessonDate = dayjs(lesson.date).format("YYYY-MM-DD");
      return lessonDate === dateString;
    });
  }

  getUpcomingAssignments(studentId, date) {
    const nextWeek = dayjs(date).add(7, "day");

    return (this.dataSources.assignments || [])
      .filter((assignment) => {
        if (!assignment.dueDate) {
          return false;
        }
        const dueDate = dayjs(assignment.dueDate);
        return dueDate.isAfter(dayjs(date)) && dueDate.isBefore(nextWeek);
      })
      .sort((a, b) => dayjs(a.dueDate) - dayjs(b.dueDate));
  }

  calculateOverallGrade(studentId) {
    const studentGrades = (this.dataSources.grades || []).filter(
      (grade) => grade.studentId === studentId
    );

    console.log(`Calculating overall grade for student ${studentId}:`, {
      totalGrades: studentGrades.length,
      grades: studentGrades,
    });

    if (studentGrades.length === 0) return null;

    const validGrades = studentGrades.filter(
      (grade) => grade.score != null && grade.points != null && grade.points > 0
    );

    console.log(`Valid grades for student ${studentId}:`, {
      validCount: validGrades.length,
      validGrades: validGrades,
    });

    if (validGrades.length === 0) return null;

    const totalPercentage = validGrades.reduce((sum, grade) => {
      const percentage = (grade.score / grade.points) * 100;
      console.log(
        `Grade calculation: ${grade.score}/${grade.points} = ${percentage}%`
      );
      return sum + percentage;
    }, 0);

    const averageGrade = Math.round(totalPercentage / validGrades.length);
    console.log(
      `Final average grade for student ${studentId}: ${averageGrade}%`
    );

    return averageGrade;
  }

  // Calculate per-subject average grades for a student
  calculateSubjectGrades(studentId) {
    const grades = (this.dataSources.grades || []).filter(
      (g) => g.studentId === studentId
    );
    if (grades.length === 0) return {};

    const assignmentsById = new Map(
      (this.dataSources.assignments || []).map((a) => [a.id, a])
    );

    const subjectTotals = new Map();

    for (const grade of grades) {
      // Skip grades with invalid data
      if (grade.score == null) {
        continue;
      }

      const assignment = assignmentsById.get(grade.assignmentId);
      const subject = assignment?.subject || "General";

      let percentage;
      if (grade.points && grade.points > 0) {
        percentage = (grade.score / grade.points) * 100;
      } else {
        // For grades without points, use the score as a percentage (assuming it's already a percentage)
        percentage = grade.score;
      }

      if (!subjectTotals.has(subject)) {
        subjectTotals.set(subject, { sum: 0, count: 0 });
      }
      const agg = subjectTotals.get(subject);
      agg.sum += percentage;
      agg.count += 1;
    }

    const subjectAverages = {};
    for (const [subject, { sum, count }] of subjectTotals) {
      if (count > 0) {
        subjectAverages[subject] = Math.round(sum / count);
      }
    }

    return subjectAverages;
  }

  calculateAttendanceRate(studentId, dateString = null) {
    let studentAttendance = (this.dataSources.attendance || []).filter(
      (record) => record.studentId === studentId
    );

    // If dateString is provided, filter by date
    if (dateString) {
      studentAttendance = studentAttendance.filter(
        (record) => record.date === dateString
      );
    }

    console.log(`Calculating attendance rate for student ${studentId}:`, {
      dateString,
      totalRecords: studentAttendance.length,
      records: studentAttendance,
      statuses: studentAttendance.map((r) => r.status),
    });

    if (studentAttendance.length === 0) return 0;

    const presentCount = studentAttendance.filter(
      (record) => record.status === "Present"
    ).length;

    const attendanceRate = Math.round(
      (presentCount / studentAttendance.length) * 100
    );

    console.log(
      `Attendance rate result: ${presentCount}/${studentAttendance.length} = ${attendanceRate}%`
    );

    return attendanceRate;
  }

  getParentEmails(student) {
    const emails = [student.parentEmail1, student.parentEmail2]
      .filter(Boolean)
      .map((e) => (typeof e === "string" ? e.trim() : e))
      .filter((e) => typeof e === "string" && e.length > 0);
    // normalize to lowercase for uniqueness; sender transports are case-insensitive on local-part for most providers
    const uniqueLower = Array.from(new Set(emails.map((e) => e.toLowerCase())));
    return uniqueLower;
  }

  getParentName(student) {
    // Derive a display name for greeting; prefer explicit parentName fields if available
    if (student.parentName1) return student.parentName1;
    if (student.parentName2) return student.parentName2;
    // Fallback to first names if present
    if (student.parentFirstName1) return student.parentFirstName1;
    if (student.parentFirstName2) return student.parentFirstName2;
    return null;
  }

  // Filter students who should receive daily updates
  getStudentsForDailyUpdates() {
    return (this.dataSources.students || []).filter((student) => {
      // Check if student has parent emails
      const hasParentEmails = student.parentEmail1 || student.parentEmail2;

      // Check if student is active (you might have a status field)
      const isActive = student.status !== "inactive";

      return hasParentEmails && isActive;
    });
  }

  // Get class summary for a specific date
  getClassSummary(date = new Date()) {
    const dateString = dayjs(date).format("YYYY-MM-DD");
    const totalStudents = (this.dataSources.students || []).length;

    console.log(`Generating class summary for date: ${dateString}`);
    console.log(
      "Available attendance records:",
      this.dataSources.attendance || []
    );

    const presentStudents = (this.dataSources.attendance || []).filter(
      (a) => a.date === dateString && a.status === "Present"
    ).length;
    const absentStudents = (this.dataSources.attendance || []).filter(
      (a) => a.date === dateString && a.status === "Absent"
    ).length;
    const lateStudents = (this.dataSources.attendance || []).filter(
      (a) => a.date === dateString && a.status === "Tardy"
    ).length;

    console.log(`Class summary attendance counts:`, {
      dateString,
      totalStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      attendanceRate:
        totalStudents > 0
          ? Math.round((presentStudents / totalStudents) * 100)
          : 0,
    });

    // Calculate new grades today
    const newGradesToday = (this.dataSources.grades || []).filter(
      (grade) => dayjs(grade.dateEntered).format("YYYY-MM-DD") === dateString
    ).length;

    // Calculate upcoming assignments (next 7 days)
    const nextWeek = dayjs(date).add(7, "day");
    const upcomingAssignments = (this.dataSources.assignments || []).filter(
      (assignment) => {
        const dueDate = dayjs(assignment.dueDate);
        return dueDate.isAfter(dayjs(date)) && dueDate.isBefore(nextWeek);
      }
    ).length;

    // Calculate average grade across all students
    let totalGrade = 0;
    let gradeCount = 0;

    for (const student of this.dataSources.students || []) {
      const studentGrades = (this.dataSources.grades || []).filter(
        (grade) => grade.studentId === student.id
      );

      if (studentGrades.length > 0) {
        // Filter out invalid grades
        const validGrades = studentGrades.filter(
          (grade) =>
            grade.score != null && grade.points != null && grade.points > 0
        );

        if (validGrades.length > 0) {
          const studentAverage =
            validGrades.reduce((sum, grade) => {
              return sum + (grade.score / grade.points) * 100;
            }, 0) / validGrades.length;

          totalGrade += studentAverage;
          gradeCount++;
        }
      }
    }

    const averageGrade =
      gradeCount > 0 ? Math.round(totalGrade / gradeCount) : null;

    return {
      date: dateString,
      totalStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      attendanceRate:
        totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0,
      // Frontend expected properties - map existing data to expected names
      presentToday: presentStudents,
      newGradesToday,
      upcomingAssignments,
      averageGrade,
    };
  }

  // Send daily updates to all parents (placeholder - actual email sending is handled by the API)
  async sendDailyUpdatesToAllParents(dataSources, date = new Date()) {
    try {
      this.setDataSources(dataSources);
      const dailyUpdates = this.generateAllDailyUpdates(date);
      const classSummary = this.getClassSummary(date);

      return {
        dailyUpdates,
        classSummary,
        totalStudents: dailyUpdates.length,
        success: true,
        message: `Generated daily updates for ${dailyUpdates.length} students`,
      };
    } catch (error) {
      console.error("Error generating daily updates:", error);
      return {
        success: false,
        error: error.message,
        dailyUpdates: [],
        classSummary: null,
        totalStudents: 0,
      };
    }
  }

  // Send daily update for a specific student (placeholder - actual email sending is handled by the API)
  async sendDailyUpdateForStudent(studentId, dataSources, date = new Date()) {
    try {
      this.setDataSources(dataSources);
      const dailyUpdate = this.generateDailyUpdate(studentId, date);

      return {
        success: true,
        data: dailyUpdate,
        message: `Generated daily update for ${dailyUpdate.studentName}`,
      };
    } catch (error) {
      console.error("Error generating student daily update:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  // Get daily update data without sending emails
  async getDailyUpdateData(studentId = null, dataSources, date = new Date()) {
    try {
      console.log("getDailyUpdateData called with:", {
        studentId,
        date,
        dataSources: {
          studentsCount: (dataSources.students || []).length,
          attendanceCount: (dataSources.attendance || []).length,
          assignmentsCount: (dataSources.assignments || []).length,
          gradesCount: (dataSources.grades || []).length,
          behaviorCount: (dataSources.behavior || []).length,
          teacher: dataSources.teacher,
          schoolName: dataSources.schoolName,
        },
      });

      this.setDataSources(dataSources);

      if (studentId) {
        console.log("Generating single student update");
        const dailyUpdate = this.generateDailyUpdate(studentId, date);
        console.log("Generated single student update:", dailyUpdate);
        return {
          success: true,
          data: dailyUpdate,
          message: `Retrieved daily update data for ${dailyUpdate.studentName}`,
        };
      } else {
        console.log("Generating all student updates");
        const dailyUpdates = this.generateAllDailyUpdates(date);
        console.log("Generated updates for", dailyUpdates.length, "students");

        const classSummary = this.getClassSummary(date);
        console.log("Generated class summary:", classSummary);

        const result = {
          success: true,
          data: {
            dailyUpdates,
            classSummary,
            totalStudents: dailyUpdates.length,
          },
          message: `Retrieved daily update data for ${dailyUpdates.length} students`,
        };
        console.log("Returning result:", result);
        return result;
      }
    } catch (error) {
      console.error("Error getting daily update data:", error);
      console.error("Error stack:", error.stack);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        data: null,
      };
    }
  }
}
