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
  const firstName = student.firstName || (studentName || "Student").split(" ");
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
    // Email content library for personalization
    emailContentLibrary: data.emailContentLibrary || {},
  };
};

export { normalizeContext };