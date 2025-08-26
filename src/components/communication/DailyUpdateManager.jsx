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
  TextField,
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
  Psychology as PsychologyIcon,
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
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import LessonDetailsDialog from "../lessons/LessonDetailsDialog";
import DailyEmailPreferences from "../settings/DailyEmailPreferences";
import { getContentLibrary } from "../../services/contentLibraryService";
import { EMAIL_SECTIONS, normalizePreferences } from "../../constants/emailSections";

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

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Lesson-related state
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonError, setLessonError] = useState(null);
  
  // Unified email preferences
  const [emailPreferences, setEmailPreferences] = useState(null);
  const [sendingStudents, setSendingStudents] = useState(false);
  const [lessonDetailsDialogOpen, setLessonDetailsDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [emailContentLibrary, setEmailContentLibrary] = useState({});
 
  // Tab state for switching between preview and settings
  const [activeTab, setActiveTab] = useState(0);

  const { currentUser } = useAuth();
  const [schoolNamePref, setSchoolNamePref] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.school_name) setSchoolNamePref(data.school_name);

      // Prefer unifiedEmailPreferences if present; else build from legacy fields
      const unified = data.unifiedEmailPreferences || {
        parent: {
          enabled: true,
          sections: {
            attendance: { enabled: data.dailyEmailIncludeSections?.attendance !== false, showEmpty: true },
            grades: { enabled: data.dailyEmailIncludeSections?.grades !== false, showEmpty: false },
            subjectGrades: { enabled: data.dailyEmailIncludeSections?.subjectGrades !== false, showEmpty: false },
            behavior: { enabled: data.dailyEmailIncludeSections?.behavior !== false, showEmpty: true },
            assignments: { enabled: data.dailyEmailIncludeSections?.assignments !== false, showEmpty: true },
            upcoming: { enabled: data.dailyEmailIncludeSections?.upcoming !== false, showEmpty: true },
            lessons: { enabled: data.dailyEmailIncludeSections?.lessons !== false, showEmpty: false },
            reminders: { enabled: data.dailyEmailIncludeSections?.reminders !== false, showEmpty: true },
          }
        },
        student: {
          enabled: data.studentDailyEmail?.enabled || false,
          sections: {
            attendance: { enabled: data.studentDailyEmail?.contentToggles?.attendance ?? true, showEmpty: false },
            grades: { enabled: data.studentDailyEmail?.contentToggles?.grades ?? true, showEmpty: false },
            subjectGrades: { enabled: data.studentDailyEmail?.contentToggles?.subjectGrades ?? true, showEmpty: false },
            behavior: { enabled: data.studentDailyEmail?.contentToggles?.behavior ?? true, showEmpty: false },
            assignments: { enabled: data.studentDailyEmail?.contentToggles?.assignments ?? true, showEmpty: true },
            upcoming: { enabled: data.studentDailyEmail?.contentToggles?.upcoming ?? true, showEmpty: true },
            lessons: { enabled: data.studentDailyEmail?.contentToggles?.lessons ?? true, showEmpty: false },
            reminders: { enabled: data.studentDailyEmail?.contentToggles?.reminders ?? false, showEmpty: false },
          }
        }
      };

      setEmailPreferences(unified);
      console.log("DailyUpdateManager: Realtime unified preferences:", { unified });
    }, (err) => {
      console.error("Error subscribing to preferences:", err);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Load email content library when user changes
  useEffect(() => {
    const loadEmailContentLibrary = async () => {
      if (!currentUser?.uid) return;
      try {
        const library = await getContentLibrary(currentUser.uid);
        setEmailContentLibrary(library);
      } catch (error) {
        console.error("Error loading email content library:", error);
        setEmailContentLibrary({});
      }
    };
    loadEmailContentLibrary();
  }, [currentUser?.uid]);

  // Fetch lessons when date changes
  useEffect(() => {
    const fetchLessons = async () => {
      if (!students || students.length === 0) return;

      setLoadingLessons(true);
      setLessonError(null);

      try {
        const subjects = [
          "Math", "Mathematics", "Maths", "Science", "Physics", "Chemistry", "Biology",
          "Language Arts", "ELA", "English", "English Language Arts", "Social Studies", 
          "History", "Geography", "Art", "Music", "Physical Education", "PE",
          "Computer Science", "Technology",
        ];

        const dateString = selectedDate.format("YYYY-MM-DD");

        const { dailyUpdateService } = await import("../../services/dailyUpdateService");
        const fetchedLessons = await dailyUpdateService.fetchLessonsForDate(dateString, subjects);

        setLessons(Array.isArray(fetchedLessons) ? fetchedLessons : []);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        setLessonError("Failed to fetch lessons");
        setLessons([]);
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
    return attendance.filter((record) => record.date === dateString);
  }, [attendance, selectedDate]);

  // Prepare contexts data with unified email preferences
  const contexts = React.useMemo(() => {
    if (!emailPreferences) return null;

    // Filter data to only include current teacher's data
    const currentUserId = currentUser?.uid;
    if (!currentUserId) {
      console.warn('No current user ID found for filtering data');
      return null;
    }

    // Filter grades to only include those created by current teacher
    const filteredGrades = (grades || []).filter(grade => 
      grade.userId === currentUserId || grade.teacherId === currentUserId
    );

    // Filter assignments to only include those created by current teacher  
    const filteredAssignments = (assignments || []).filter(assignment =>
      assignment.userId === currentUserId || assignment.teacherId === currentUserId
    );

    // Filter behavior to only include those created by current teacher
    const filteredBehavior = (behavior || []).filter(incident =>
      incident.userId === currentUserId || incident.teacherId === currentUserId
    );

    // Filter attendance to only include current teacher's records
    const filteredAttendanceForContext = filteredAttendance.filter(record =>
      record.userId === currentUserId || record.teacherId === currentUserId
    );

    console.log('Data filtering summary:', {
      originalGrades: (grades || []).length,
      filteredGrades: filteredGrades.length,
      originalAssignments: (assignments || []).length, 
      filteredAssignments: filteredAssignments.length,
      originalBehavior: (behavior || []).length,
      filteredBehavior: filteredBehavior.length,
      originalAttendance: filteredAttendance.length,
      filteredAttendanceForContext: filteredAttendanceForContext.length,
      currentUserId
    });

    return {
    students: students || [],
    attendance: filteredAttendanceForContext,
    assignments: filteredAssignments,
    grades: filteredGrades,
    behavior: filteredBehavior,
    lessons: lessons || [],
    schoolName: schoolNamePref || undefined,
      teacher: currentUser ? {
        name: currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "Teacher"),
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
      } : undefined,
    emailContentLibrary: emailContentLibrary,
      emailPreferences: emailPreferences,
    };
  }, [
    students,
    filteredAttendance,
    assignments,
    grades,
    behavior,
    lessons,
    schoolNamePref,
    currentUser,
    emailContentLibrary,
    emailPreferences
  ]);

  // Check if lessons should be displayed in the UI based on parent preferences
  const shouldShowLessons = React.useMemo(() => {
    if (!emailPreferences) return false;
    
    const parentSections = emailPreferences.parent?.sections || {};
    const lessonsSection = parentSections[EMAIL_SECTIONS.LESSONS];
    
    if (!lessonsSection?.enabled) return false;
    
    // Check if we should show empty sections
    if (!lessonsSection.showEmpty && (!lessons || lessons.length === 0)) {
      return false;
    }
    
    return true;
  }, [emailPreferences, lessons]);

  // Generate preview data
  const generatePreview = async () => {
    if (!contexts) return;

    try {
      const result = await previewDailyUpdates(contexts, selectedDate.toDate());
      if (!result.success) {
        console.error("Preview failed:", result.error);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  // Send daily updates
  const handleSendDailyUpdates = async () => {
    if (!contexts) return;

    try {
      const result = await sendDailyUpdates(contexts, selectedDate.toDate());
      if (result?.success && onSendComplete) {
        onSendComplete(result.data);
      }
    } catch (error) {
      console.error("Error sending daily updates:", error);
    }
  };

  // Send daily updates to all students
  const handleSendStudentEmails = async () => {
    if (!contexts) return;

    try {
      setSendingStudents(true);
      const { dailyUpdateService } = await import("../../services/dailyUpdateService");
      const result = await dailyUpdateService.sendStudentEmailsToAll(contexts, selectedDate.toDate());
      
      if (result?.success) {
        console.log("Student emails sent successfully");
      } else {
        console.error("Error sending student emails:", result?.error);
      }
    } catch (error) {
      console.error("Error sending student emails:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
    } finally {
      setSendingStudents(false);
    }
  };

  // Preview specific student
  const previewStudent = async (studentId) => {
    if (!contexts) return;

    try {
      const result = await previewStudentDailyUpdate(studentId, contexts, selectedDate.toDate());
      if (result.success) {
        setSelectedStudent(result.data);
        setPreviewDialogOpen(true);
      }
    } catch (error) {
      console.error("Error previewing student update:", error);
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
      case "Present": return "success";
      case "Tardy": return "warning";
      case "Absent": return "error";
      default: return "default";
    }
  };

  // Get status icon for attendance
  const getAttendanceIcon = (status) => {
    switch (status) {
      case "Present": return <CheckCircleIcon />;
      case "Tardy": return <WarningIcon />;
      case "Absent": return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  // Auto-generate preview when data changes
  useEffect(() => {
    if (students && students.length > 0 && contexts) {
      generatePreview();
    }
  }, [contexts]);

  // Show loading state if email preferences aren't loaded yet
  if (!emailPreferences) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading email preferences...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Preview & Send" icon={<PreviewIcon />} iconPosition="start" />
              <Tab label="Email Settings" icon={<SettingsIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Tab content */}
          {activeTab === 0 && (
            <>
            {/* Class Summary */}
            {(dailyUpdateData?.data?.classSummary || dailyUpdateData?.classSummary) && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  ✨ Class Summary for {selectedDate.format("MMM DD, YYYY")}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ background: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)", color: "#ffffff", borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography variant="overline">✅ Present Today</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>
                          {(dailyUpdateData?.data?.classSummary || dailyUpdateData?.classSummary)?.presentToday}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ background: "linear-gradient(135deg, #ed2024 0%, #b41418 100%)", color: "#ffffff", borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography variant="overline">📊 New Grades</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>
                          {(dailyUpdateData?.data?.classSummary || dailyUpdateData?.classSummary)?.newGradesToday}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", color: "#1459a9", borderRadius: 3, border: "2px solid #1459a9" }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography variant="overline">⏰ Upcoming</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>
                          {(dailyUpdateData?.data?.classSummary || dailyUpdateData?.classSummary)?.upcomingAssignments}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ background: "linear-gradient(135deg, #1459a9 0%, #0d3d7a 100%)", color: "#ffffff", borderRadius: 3 }}>
                        <CardContent>
                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="overline">🏆 Avg Grade</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            {(dailyUpdateData?.data?.classSummary || dailyUpdateData?.classSummary)?.averageGrade}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

              {/* Lesson Summary */}
              {shouldShowLessons && Array.isArray(lessons) && lessons.length > 0 && (
                  <Box mb={3}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                      📚 Today's Lessons ({selectedDate.format("MMM DD, YYYY")})
                      </Typography>
                    <Chip label="Included in emails" color="success" size="small" variant="outlined" />
                    </Box>
                      <Grid container spacing={2}>
                        {lessons.map((lesson, index) => (
                          <Grid item xs={12} md={6} key={lesson.id || index}>
                        <Card variant="outlined">
                              <CardContent>
                            <Typography variant="h6">{lesson.title || "Untitled Lesson"}</Typography>
                            <Chip label={lesson.subject} size="small" color="secondary" sx={{ mb: 2 }} />
                            <Button variant="outlined" size="small" fullWidth onClick={() => openLessonDetails(lesson)}>
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                  </Box>
                )}

              {/* Show message when lessons are disabled */}
              {!shouldShowLessons && (
                <Box mb={3}>
                  <Alert severity="info">
                    {emailPreferences.parent.sections[EMAIL_SECTIONS.LESSONS]?.enabled 
                      ? "No lessons available for today's date."
                      : "Lessons are disabled in your parent email preferences. You can enable them in the Email Settings tab."
                    }
                  </Alert>
                </Box>
              )}

              {/* Students List */}
              {(() => {
                let updates = [];
                try {
                  const dataSource = dailyUpdateData?.data || dailyUpdateData;
                  if (dataSource?.dailyUpdates && Array.isArray(dataSource.dailyUpdates)) {
                    updates = dataSource.dailyUpdates;
                  }
                } catch (error) {
                  console.error("Error extracting dailyUpdates:", error);
                }

                return (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Student Updates ({Array.isArray(updates) ? updates.length : 0} students)
                    </Typography>

                    {loadingDailyUpdates ? (
                      <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                      </Box>
                    ) : Array.isArray(updates) && updates.length > 0 ? (
                      <List>
                        {updates.map((update, index) => (
                          <React.Fragment key={update.studentId}>
                            <ListItem>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={update.studentName}
                                secondary={
                                  <span style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                    <Chip
                                      icon={getAttendanceIcon(update.attendance.status)}
                                      label={update.attendance.status}
                                      color={getAttendanceColor(update.attendance.status)}
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
                                secondaryTypographyProps={{
                                  component: "div"
                                }}
                              />
                              <Box>
                                <Tooltip title="Preview Update">
                                  <IconButton onClick={() => previewStudent(update.studentId)} size="small">
                                    <PreviewIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItem>
                            {index < updates.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Box display="flex" justifyContent="center" p={3}>
                        <Typography color="textSecondary">
                          No student updates available
                        </Typography>
                      </Box>
                    )}
                  </>
                );
              })()}
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
              startIcon={loadingDailyUpdates ? <CircularProgress size={20} /> : <PreviewIcon />}
            >
              Refresh Preview
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Send daily update to parents">
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendDailyUpdates}
                    disabled={sending || loadingDailyUpdates || !dailyUpdateData || activeTab !== 0}
                    startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                  >
                    {sending ? "Sending..." : "Send to Parents"}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Send daily update to students">
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleSendStudentEmails}
                    disabled={sendingStudents || loadingDailyUpdates || !dailyUpdateData || activeTab !== 0}
                    startIcon={sendingStudents ? <CircularProgress size={20} /> : <EmailIcon />}
                  >
                    {sendingStudents ? "Sending to Students..." : "Send to Students"}
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
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon fontSize="small" />
            <span>{selectedStudent?.studentName}</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Typography>Preview content would go here...</Typography>
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
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={clearSuccess}>
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
