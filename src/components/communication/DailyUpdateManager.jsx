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
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEmail } from "../../contexts/EmailContext";
import { useAuth } from "../../contexts/AuthContext";

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
    clearError,
    clearSuccess,
  } = useEmail();

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { currentUser } = useAuth();

  // Prepare contexts data
  const contexts = {
    students: students || [],
    attendance: attendance || [],
    assignments: assignments || [],
    grades: grades || [],
    behavior: behavior || [],
    schoolName: "AMLY - The American Libyan School",
    teacher: currentUser ? {
      name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Teacher'),
      email: currentUser.email || '',
      displayName: currentUser.displayName || '',
    } : undefined,
  };

  console.log('Prepared contexts:', {
    studentsCount: contexts.students.length,
    attendanceCount: contexts.attendance.length,
    assignmentsCount: contexts.assignments.length,
    gradesCount: contexts.grades.length,
    behaviorCount: contexts.behavior.length,
    teacher: contexts.teacher,
    schoolName: contexts.schoolName
  });





  // Generate preview data
  const generatePreview = async () => {
    try {
      console.log('Generating preview with contexts:', contexts);
      const result = await previewDailyUpdates(contexts, selectedDate.toDate());
      console.log('Preview result:', {
        success: result.success,
        data: result.data,
        dailyUpdates: result.data?.data?.dailyUpdates,
        classSummary: result.data?.data?.classSummary,
        message: result.data?.message
      });
      if (!result.success) {
        console.error('Preview failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
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
      // Error is handled by the context
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
      console.log('Students data changed, regenerating preview. Students:', students);
      generatePreview();
    }
  }, [
    selectedDate,
    students,
    attendance,
    assignments,
    grades,
    behavior,
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

          {/* Class Summary */}
          {dailyUpdateData?.data?.classSummary && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Class Summary for {selectedDate.format("MMM DD, YYYY")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="primary">
                        {dailyUpdateData.data.classSummary.presentToday}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Present Today
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="warning.main">
                        {dailyUpdateData.data.classSummary.newGradesToday}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        New Grades
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="info.main">
                        {dailyUpdateData.data.classSummary.upcomingAssignments}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Upcoming
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="success.main">
                        {dailyUpdateData.data.classSummary.averageGrade}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Avg Grade
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Students List */}
          <Typography variant="h6" gutterBottom>
            Student Updates ({dailyUpdateData?.data?.data?.dailyUpdates?.length || 0}{" "}
            students)
          </Typography>

          {loadingDailyUpdates ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {dailyUpdateData?.data?.data?.dailyUpdates?.map((update, index) => (
                <React.Fragment key={update.studentId}>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={update.studentName}
                      secondary={
                        <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  {index < dailyUpdateData.data.data.dailyUpdates.length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>

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
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendDailyUpdates}
            disabled={sending || loadingDailyUpdates || !dailyUpdateData}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sending ? "Sending..." : "Send Daily Updates"}
          </Button>
        </CardActions>
      </Card>

      {/* Student Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Daily Update Preview - {selectedStudent?.studentName}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    📅 Attendance
                  </Typography>
                  <Chip
                    icon={getAttendanceIcon(selectedStudent.attendance.status)}
                    label={selectedStudent.attendance.status}
                    color={getAttendanceColor(
                      selectedStudent.attendance.status
                    )}
                    size="medium"
                  />
                  {selectedStudent.attendance.notes && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 1 }}
                    >
                      {selectedStudent.attendance.notes}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    📊 Overall Grade
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {selectedStudent.overallGrade}%
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    📚 Today's Activities ({selectedStudent.assignments.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedStudent.assignments.length > 0 ? (
                    <List dense>
                      {selectedStudent.assignments.map((assignment, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={assignment.name}
                            secondary={`${assignment.subject} - ${assignment.points} points`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      No activities for today
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              {selectedStudent.grades.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      📊 New Grades ({selectedStudent.grades.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {selectedStudent.grades.map((grade, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={grade.assignmentName}
                            secondary={`${grade.score}/${grade.points} (${grade.percentage}%) - ${grade.letterGrade}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedStudent.behavior.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      🎯 Behavior ({selectedStudent.behavior.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {selectedStudent.behavior.map((incident, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={incident.description}
                            secondary={`${incident.type} - ${incident.severity}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    ⏰ Upcoming Assignments (
                    {selectedStudent.upcomingAssignments.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedStudent.upcomingAssignments.length > 0 ? (
                    <List dense>
                      {selectedStudent.upcomingAssignments.map(
                        (assignment, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={assignment.name}
                              secondary={`Due: ${dayjs(
                                assignment.dueDate
                              ).format("MMM DD, YYYY")} - ${
                                assignment.points
                              } points`}
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      No upcoming assignments
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
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
    </>
  );
};

export default DailyUpdateManager;
