import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  TextField,
  AccordionDetails,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  EventNote as EventNoteIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEmail } from "../../contexts/EmailContext";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import LessonDetailsDialog from "../lessons/LessonDetailsDialog";
import DailyEmailPreferences from "../settings/DailyEmailPreferences";

const DailyUpdateManager = ({
  students,
  attendance,
  assignments,
  grades,
  behavior,
  onSendComplete,
}) => {
  const {
    dailyUpdateData,
    loadingDailyUpdates,
    sending,
    progress,
    error,
    successMessage,
    sendDailyUpdates,
    previewDailyUpdates,
    previewStudentDailyUpdate,
    sendStudentDailyUpdate,
    setSuccessMessage,
    clearError,
    clearSuccess,
  } = useEmail();

  const [selectedDate, setSelectedDate] = useState(dayjs()); // Use today's date
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // Lesson-related state
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonError, setLessonError] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [sendingStudents, setSendingStudents] = useState(false);
  const [lessonDetailsDialogOpen, setLessonDetailsDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
 
  // Tab state for switching between preview and settings
  const [activeTab, setActiveTab] = useState(0);

  const { currentUser } = useAuth();
  const [schoolNamePref, setSchoolNamePref] = useState("");

  // Compute includeLessons from user preferences
  const includeLessons = userPreferences?.lessons !== false; // Default to true if not set

  useEffect(() => {
    const loadPrefs = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.school_name) setSchoolNamePref(d.school_name);

          // Load user preferences for lesson inclusion
          if (d.dailyEmailIncludeSections) {
            setUserPreferences(d.dailyEmailIncludeSections);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };
    loadPrefs();
  }, [currentUser?.uid]);

  // Fetch lessons when date changes
  useEffect(() => {
    const fetchLessons = async () => {
      if (!students || students.length === 0) return;

      setLoadingLessons(true);
      setLessonError(null);

      try {
        // Get unique subjects from students and add common subjects
        const subjects = [
          "Math",
          "Mathematics",
          "Maths",
          "Science",
          "Physics",
          "Chemistry",
          "Biology",
          "Language Arts",
          "ELA",
          "English",
          "English Language Arts",
          "Social Studies",
          "History",
          "Geography",
          "Art",
          "Music",
          "Physical Education",
          "PE",
          "Computer Science",
          "Technology",
        ];

        const dateString = selectedDate.format("YYYY-MM-DD");

        const { dailyUpdateService } = await import(
          "../../services/dailyUpdateService"
        );
        const fetchedLessons = await dailyUpdateService.fetchLessonsForDate(
          dateString,
          subjects
        );

        // Ensure lessons is always an array
        setLessons(Array.isArray(fetchedLessons) ? fetchedLessons : []);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        setLessonError("Failed to fetch lessons");
        setLessons([]); // Set empty array on error
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, [selectedDate, students]);

  // Filter attendance data for the selected date
  const filteredAttendance = React.useMemo(() => {
    if (!attendance || !Array.isArray(attendance)) return [];

    const dateString = selectedDate.format("YYYY-MM-DD");

    const filtered = attendance.filter((record) => {
      const recordDate = record.date;
      const matches = recordDate === dateString;
      return matches;
    });

    return filtered;
  }, [attendance, selectedDate]);

  // Prepare contexts data
  const contexts = {
    students: students || [],
    attendance: filteredAttendance,
    assignments: assignments || [],
    grades: grades || [],
    behavior: behavior || [],
    lessons: lessons || [],
    schoolName: schoolNamePref || undefined,
    teacher: currentUser
      ? {
          name:
            currentUser.displayName ||
            (currentUser.email ? currentUser.email.split("@")[0] : "Teacher"),
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
        }
      : undefined,
  };

  

  // Generate preview data
  const generatePreview = async () => {
    try {
      const result = await previewDailyUpdates(contexts, selectedDate.toDate());
     
      if (!result.success) {
        console.error("Preview failed:", result.error);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      // Error is handled by the context
    }
  };

  // Send daily updates
  const handleSendDailyUpdates = async () => {
    try {
      const result = await sendDailyUpdates(contexts, selectedDate.toDate());
      if (result?.success && onSendComplete) {
        onSendComplete(result.data);
      }
    } catch (error) {
      console.error("Error sending daily updates:", error);
    }
  };

  // Send daily updates to all students (studentEmail recipients)
  const handleSendStudentEmails = async () => {
    try {
      setSendingStudents(true);
      const { dailyUpdateService } = await import(
        "../../services/dailyUpdateService"
      );
      const result = await dailyUpdateService.sendStudentEmailsToAll(
        contexts,
        selectedDate.toDate()
      );
      if (result?.success) {
       
      } else {
        console.error("Error sending student emails:", result?.error);
      }
    } catch (error) {
      console.error("Error sending student emails:", error);
    } finally {
      setSendingStudents(false);
    }
  };

  // Send student-specific emails manually for all students in the preview
  const handleSendToStudents = async () => {
    if (!dailyUpdateData?.data?.dailyUpdates) return;
    setSendingStudents(true);
    let sent = 0;
    let failed = 0;
    for (const update of dailyUpdateData.data.dailyUpdates) {
      try {
        const res = await sendStudentDailyUpdate(
          update.studentId,
          contexts,
          selectedDate.toDate()
        );
        if (res && res.success) sent++;
        else failed++;
      } catch (e) {
        console.error("Error sending student email for", update.studentId, e);
        failed++;
      }
    }
    setSendingStudents(false);
    try {
      setSuccessMessage &&
        setSuccessMessage(
          `Student emails sent: ${sent} success, ${failed} failed`
        );
    } catch (e) {
      console.log("Could not set success message", e);
    }
  };

  // Preview specific student
  const previewStudent = async (studentId) => {
    try {
      const result = await previewStudentDailyUpdate(
        studentId,
        contexts,
        selectedDate.toDate()
      );

      if (result.success) {
        setSelectedStudent(result.data);
        setPreviewDialogOpen(true);
      }
    } catch (error) {
      // Error is handled by the context
    }
  };

  // Open lesson details dialog
  const openLessonDetails = (lesson) => {
    setSelectedLesson(lesson);
    setLessonDetailsDialogOpen(true);
  };

  // Get status color for attendance
  const getAttendanceColor = (status) => {
    switch (status) {
      case "Present":
        return "success";
      case "Tardy":
        return "warning";
      case "Absent":
        return "error";
      default:
        return "default";
    }
  };

  // Get status icon for attendance
  const getAttendanceIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircleIcon />;
      case "Tardy":
        return <WarningIcon />;
      case "Absent":
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  useEffect(() => {
    if (students && students.length > 0) {
      console.log("Generating preview");      
      generatePreview();
    }
  }, [
    selectedDate,
    students,
    attendance,
    assignments,
    grades,
    behavior,
    lessons,
  ]);

  if (!students || students.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="textSecondary" align="center">
            No students found. Please add students first.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5" component="h2">
              Daily Update Manager
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Update Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </Box>

          {/* Progress indicator */}
          {progress && (
            <Box mb={2}>
              <Alert severity={progress.status === "error" ? "error" : "info"}>
                {progress.message}
              </Alert>
              {progress.status === "preparing" && (
                <LinearProgress sx={{ mt: 1 }} />
              )}
            </Box>
          )}

          {/* Tabs for switching between preview and settings */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
            >
              <Tab
                label="Preview & Send"
                icon={<PreviewIcon />}
                iconPosition="start"
              />
              <Tab
                label="Email Settings"
                icon={<SettingsIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab content */}
          {activeTab === 0 && (
            <>
              {/* Class Summary */}
              {dailyUpdateData?.data?.classSummary && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    ✨ Class Summary for {selectedDate.format("MMM DD, YYYY")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
                      <Card sx={{
                        background: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)",
                        color: "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0 6px 16px rgba(20, 89, 169, 0.25)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        <CardContent sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <Typography variant="overline" sx={{ opacity: 0.95, letterSpacing: 0.5 }}>✅ Present Today</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            {dailyUpdateData.data.classSummary.presentToday}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
                      <Card sx={{
                        background: "linear-gradient(135deg, #ed2024 0%, #b41418 100%)",
                        color: "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0 6px 16px rgba(237, 32, 36, 0.25)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        <CardContent sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <Typography variant="overline" sx={{ opacity: 0.95, letterSpacing: 0.5 }}>📊 New Grades</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            {dailyUpdateData.data.classSummary.newGradesToday}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
                      <Card sx={{
                        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                        color: "#1459a9",
                        borderRadius: 3,
                        border: "2px solid #1459a9",
                        boxShadow: "0 6px 16px rgba(20, 89, 169, 0.12)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        <CardContent sx={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <Typography variant="overline" sx={{ letterSpacing: 0.5 }}>⏰ Upcoming</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            {dailyUpdateData.data.classSummary.upcomingAssignments}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
                      <Card sx={{
                        background: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)",
                        color: "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0 6px 16px rgba(20, 89, 169, 0.25)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="overline" sx={{ opacity: 0.95, letterSpacing: 0.5 }}>🏆 Avg Grade</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800 }}>
                              {dailyUpdateData.data.classSummary.averageGrade}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Number(dailyUpdateData.data.classSummary.averageGrade) || 0}
                            sx={{
                              mt: 1,
                              height: 8,
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.3)",
                              "& .MuiLinearProgress-bar": { backgroundColor: "#ffffff" }
                            }}
                          />
                          <Typography variant="caption" sx={{ mt: 0.75, display: "block", opacity: 0.95, textAlign: "center" }}>
                            {(() => {
                              const g = Number(dailyUpdateData.data.classSummary.averageGrade) || 0;
                              return g >= 90
                                ? "On fire! 🔥"
                                : g >= 80
                                ? "Great momentum! 🚀"
                                : g >= 70
                                ? "Keep climbing! 🧗"
                                : "You’ve got this! 🌱";
                            })()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Lesson Summary */}
              {includeLessons &&
                Array.isArray(lessons) &&
                lessons.length > 0 && (
                  <Box mb={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                        📚 Today's Lessons (
                        {selectedDate.format("MMM DD, YYYY")})
                      </Typography>
                      <Chip
                        label="Included in emails"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h4" color="primary">
                              {lessons.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Lessons
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h4" color="success.main">
                              {lessons.reduce(
                                (sum, lesson) => sum + (lesson.duration || 0),
                                0
                              )}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Minutes
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h4" color="warning.main">
                              {
                                [
                                  ...new Set(
                                    lessons.map((lesson) => lesson.subject)
                                  ),
                                ].length
                              }
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Subjects
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h4" color="info.main">
                              {
                                lessons.filter((lesson) => lesson.homework)
                                  .length
                              }
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Homework Assigned
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h4" color="secondary">
                              {lessons.reduce(
                                (sum, lesson) =>
                                  sum +
                                  (Array.isArray(lesson.activities)
                                    ? lesson.activities.length
                                    : 0),
                                0
                              )}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Activities
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Lesson Details */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Lesson Details
                      </Typography>
                      <Grid container spacing={2}>
                        {lessons.map((lesson, index) => (
                          <Grid item xs={12} md={6} key={lesson.id || index}>
                            <Card variant="outlined" sx={{ height: "100%" }}>
                              <CardContent>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1,
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    component="h3"
                                    sx={{ flex: 1 }}
                                  >
                                    {lesson.title || "Untitled Lesson"}
                                  </Typography>
                                  <Chip
                                    label={`${lesson.duration || 0} min`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>

                                <Chip
                                  label={lesson.subject}
                                  size="small"
                                  color="secondary"
                                  sx={{ mb: 2 }}
                                />

                                <Button
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onClick={() => openLessonDetails(lesson)}
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                )}

              {/* Show message when lessons are disabled */}
              {!includeLessons && (
                <Box mb={3}>
                  <Alert severity="info">
                    Lessons are disabled in your email preferences. You can
                    enable them in the Email Settings tab.
                  </Alert>
                </Box>
              )}
              {/* Students List */}
              <Typography variant="h6" gutterBottom>
                Student Updates (
                {dailyUpdateData?.data?.dailyUpdates?.length || 0} students)
              </Typography>

              {loadingDailyUpdates ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {dailyUpdateData?.data?.dailyUpdates?.map((update, index) => (
                    <React.Fragment key={update.studentId}>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={update.studentName}
                          secondary={
                            <span
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                icon={getAttendanceIcon(
                                  update.attendance.status
                                )}
                                label={update.attendance.status}
                                color={getAttendanceColor(
                                  update.attendance.status
                                )}
                                size="small"
                              />
                              <Chip
                                icon={<GradeIcon />}
                                label={`${update.overallGrade}%`}
                                color="primary"
                                size="small"
                              />
                              <Chip
                                icon={<AssignmentIcon />}
                                label={`${update.assignments.length} activities`}
                                color="secondary"
                                size="small"
                              />
                              {update.grades.length > 0 && (
                                <Chip
                                  icon={<GradeIcon />}
                                  label={`${update.grades.length} new grades`}
                                  color="success"
                                  size="small"
                                />
                              )}
                              {update.behavior.length > 0 && (
                                <Chip
                                  icon={<PsychologyIcon />}
                                  label={`${update.behavior.length} incidents`}
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </span>
                          }
                        />
                        <Box>
                          <Tooltip title="Preview Update">
                            <IconButton
                              onClick={() => previewStudent(update.studentId)}
                              size="small"
                            >
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                      {index < dailyUpdateData.data.dailyUpdates.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </>
          )}

          {/* Email Settings Tab */}
          {activeTab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DailyEmailPreferences />
            </Box>
          )}
        </CardContent>

        {activeTab === 0 && (
          <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
            <Button
              onClick={generatePreview}
              disabled={loadingDailyUpdates}
              startIcon={
                loadingDailyUpdates ? (
                  <CircularProgress size={20} />
                ) : (
                  <PreviewIcon />
                )
              }
            >
              Refresh Preview
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Send the daily update to parents (uses parent emails)">
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendDailyUpdates}
                    disabled={
                      sending ||
                      loadingDailyUpdates ||
                      !dailyUpdateData ||
                      activeTab !== 0
                    }
                    startIcon={
                      sending ? <CircularProgress size={20} /> : <SendIcon />
                    }
                  >
                    {sending ? "Sending..." : "Send to Parents"}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Send the daily update directly to students (uses student emails)">
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleSendStudentEmails}
                    disabled={
                      sendingStudents ||
                      loadingDailyUpdates ||
                      !dailyUpdateData ||
                      activeTab !== 0
                    }
                    startIcon={
                      sendingStudents ? (
                        <CircularProgress size={20} />
                      ) : (
                        <EmailIcon />
                      )
                    }
                  >
                    {sendingStudents
                      ? "Sending to Students..."
                      : "Send to Students"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </CardActions>
        )}
      </Card>

      {/* Student Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontSize: 18, pb: 0 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon fontSize="small" />
            <span style={{ fontWeight: 500 }}>
              {selectedStudent?.studentName}
            </span>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {selectedStudent && (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  icon={getAttendanceIcon(selectedStudent.attendance.status)}
                  label={selectedStudent.attendance.status}
                  color={getAttendanceColor(selectedStudent.attendance.status)}
                  size="small"
                />
                <Chip
                  icon={<GradeIcon fontSize="small" />}
                  label={`${selectedStudent.overallGrade}%`}
                  color="primary"
                  size="small"
                />
                <Chip
                  icon={<AssignmentIcon fontSize="small" />}
                  label={`${selectedStudent.assignments.length} activities`}
                  color="secondary"
                  size="small"
                />
                {selectedStudent.grades.length > 0 && (
                  <Chip
                    icon={<GradeIcon fontSize="small" />}
                    label={`${selectedStudent.grades.length} new grades`}
                    color="success"
                    size="small"
                  />
                )}
                {selectedStudent.behavior.length > 0 && (
                  <Chip
                    icon={<PsychologyIcon fontSize="small" />}
                    label={`${selectedStudent.behavior.length} incidents`}
                    color="warning"
                    size="small"
                  />
                )}
              </Box>
              {/* Attendance notes */}
              {selectedStudent.attendance.notes && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 1 }}
                >
                  {selectedStudent.attendance.notes}
                </Typography>
              )}
              {/* Activities (show max 3) */}
              {selectedStudent.assignments.length > 0 && (
                <Box mb={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 500, mb: 0.5 }}
                  >
                    Activities
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {selectedStudent.assignments
                      .slice(0, 3)
                      .map((assignment, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={assignment.name}
                            secondary={`${assignment.subject} - ${assignment.points} pts`}
                          />
                        </ListItem>
                      ))}
                  </List>
                  {selectedStudent.assignments.length > 3 && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ ml: 1 }}
                    >
                      +{selectedStudent.assignments.length - 3} more
                    </Typography>
                  )}
                </Box>
              )}
              {/* Grades (show max 2) */}
              {selectedStudent.grades.length > 0 && (
                <Box mb={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 500, mb: 0.5 }}
                  >
                    New Grades
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {selectedStudent.grades.slice(0, 2).map((grade, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={grade.assignmentName}
                          secondary={`${grade.score}/${grade.points} (${grade.percentage}%) - ${grade.letterGrade}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {selectedStudent.grades.length > 2 && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ ml: 1 }}
                    >
                      +{selectedStudent.grades.length - 2} more
                    </Typography>
                  )}
                </Box>
              )}
              {/* Behavior (show max 2) */}
              {selectedStudent.behavior.length > 0 && (
                <Box mb={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 500, mb: 0.5 }}
                  >
                    Behavior
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {selectedStudent.behavior
                      .slice(0, 2)
                      .map((incident, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={incident.description}
                            secondary={`${incident.type} - ${incident.severity}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                  {selectedStudent.behavior.length > 2 && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ ml: 1 }}
                    >
                      +{selectedStudent.behavior.length - 2} more
                    </Typography>
                  )}
                </Box>
              )}
              {/* Upcoming assignments (show max 2) */}
              {selectedStudent.upcomingAssignments.length > 0 && (
                <Box mb={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 500, mb: 0.5 }}
                  >
                    Upcoming Assignments
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {selectedStudent.upcomingAssignments
                      .slice(0, 2)
                      .map((assignment, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={assignment.name}
                            secondary={`Due: ${dayjs(assignment.dueDate).format(
                              "MMM DD, YYYY"
                            )} - ${assignment.points} pts`}
                          />
                        </ListItem>
                      ))}
                  </List>
                  {selectedStudent.upcomingAssignments.length > 2 && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ ml: 1 }}
                    >
                      +{selectedStudent.upcomingAssignments.length - 2} more
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)} size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for errors */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={clearError}>
        <Alert onClose={clearError} severity="error">
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar for success messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={clearSuccess}
      >
        <Alert onClose={clearSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Lesson Details Dialog */}
      <LessonDetailsDialog
        open={lessonDetailsDialogOpen}
        onClose={() => {
          setLessonDetailsDialogOpen(false);
          setSelectedLesson(null);
        }}
        lesson={selectedLesson}
      />
    </>
  );
};

export default DailyUpdateManager;
