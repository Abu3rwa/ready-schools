import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Checkbox,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Drafts as DraftsIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlinedIcon,
  FormatListBulleted as ListIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useCommunication } from "../contexts/CommunicationContext";
import { getDailyUpdateEmails } from "../services/dailyUpdateEmailService";
import { useAttendance } from "../contexts/AttendanceContext";
import { useAssignments } from "../contexts/AssignmentContext";
import { useGrades } from "../contexts/GradeContext";
import { useBehavior } from "../contexts/BehaviorContext";
import Loading from "../components/common/Loading";
import DailyUpdateManager from "../components/communication/DailyUpdateManager";
import EmailStatus from "../components/communication/EmailStatus";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import DailyEmailsHistory from "../components/communication/DailyEmailsHistory";

const Communication = () => {
  const { students, loading: studentsLoading } = useStudents();
  const {
    communications: initialCommunications,
    loading: communicationsLoading,
    createCommunication,
    updateCommunication,
    deleteCommunication,
    getCommunicationsByStudent,
    getCommunicationsByStatus,
    sendCommunication,
    createBulkCommunication,
  } = useCommunication();
  
  const [communications, setCommunications] = useState(initialCommunications);

  // Keep communications in sync with context
  useEffect(() => {
    setCommunications(initialCommunications);
  }, [initialCommunications]);

  const { attendance, loading: attendanceLoading } = useAttendance();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { grades, loading: gradesLoading } = useGrades();
  const { behavior, loading: behaviorLoading } = useBehavior();

  // State for UI
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All"); // "All", "Sent", or "Draft"
  const [searchTerm, setSearchTerm] = useState("");
  const [openComposeDialog, setOpenComposeDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [emailForm, setEmailForm] = useState({
    studentId: "",
    date: dayjs(),
    type: "Email",
    subject: "",
    content: "",
    sentStatus: "Draft",
  });
  const [bulkEmailForm, setBulkEmailForm] = useState({
    type: "Email",
    subject: "",
    content: "",
    sentStatus: "Draft",
  });
  const [tabValue, setTabValue] = useState(0);
  const [templateToCompose, setTemplateToCompose] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Email templates
  const emailTemplates = [
    {
      name: "Weekly Progress Update",
      subject: "Weekly Progress Update for [Student Name]",
      content:
        "Dear Parent/Guardian,\n\nI wanted to provide you with a weekly update on [Student Name]'s progress. This week, your child has been working on [subject/topic] and has shown [observations].\n\nSome highlights include:\n- [Highlight 1]\n- [Highlight 2]\n- [Highlight 3]\n\nAreas that may need additional support at home:\n- [Area 1]\n- [Area 2]\n\nPlease feel free to contact me if you have any questions or concerns.\n\nBest regards,\nMs. Smith",
    },
    {
      name: "Missing Assignment Notice",
      subject: "Missing Assignment Notice for [Student Name]",
      content:
        "Dear Parent/Guardian,\n\nI'm writing to inform you that [Student Name] has not submitted the following assignment(s):\n\n- [Assignment Name] - Due on [Due Date]\n\nIt's important that this work is completed as soon as possible to ensure [Student Name] stays on track with the curriculum. Please encourage your child to complete and submit this work by [Extended Due Date].\n\nIf there are any challenges preventing the completion of this work, please let me know so we can find a solution together.\n\nThank you for your support,\nMs. Smith",
    },
    {
      name: "Positive Behavior Recognition",
      subject: "Recognizing [Student Name]'s Positive Behavior",
      content:
        "Dear Parent/Guardian,\n\nI wanted to take a moment to recognize [Student Name] for demonstrating excellent behavior in class. Specifically, [he/she] has shown [specific positive behaviors or traits].\n\nThis kind of behavior contributes positively to our classroom environment and sets a great example for other students. I wanted to make sure you were aware of this achievement.\n\nThank you for your continued support in [Student Name]'s education.\n\nBest regards,\nMs. Smith",
    },
    {
      name: "Upcoming Test Reminder",
      subject: "Upcoming Test Reminder for [Student Name]",
      content:
        "Dear Parent/Guardian,\n\nThis is a reminder that [Student Name]'s class will have an upcoming test on [subject] scheduled for [test date].\n\nThe test will cover the following topics:\n- [Topic 1]\n- [Topic 2]\n- [Topic 3]\n\nTo prepare, students should review their notes, complete the practice problems assigned, and study the relevant textbook sections.\n\nPlease encourage your child to start studying early and to ask questions in class if they need clarification on any topics.\n\nThank you for your support,\nMs. Smith",
    },
    {
      name: "Class Announcement",
      subject: "Important Class Announcement",
      content:
        "Dear Parents/Guardians,\n\nI wanted to inform you about an upcoming event/change in our classroom:\n\n[Announcement details]\n\nThis will take place on [date] at [time].\n\n[Any action items or preparations needed]\n\nPlease let me know if you have any questions.\n\nBest regards,\nMs. Smith",
    },
  ];

  // Loading state
  const loading =
    studentsLoading ||
    communicationsLoading ||
    attendanceLoading ||
    assignmentsLoading ||
    gradesLoading ||
    behaviorLoading;

  // Initialize form with first student when data loads
  useEffect(() => {
    if (!loading && students.length > 0 && !emailForm.studentId) {
      setEmailForm((prev) => ({
        ...prev,
        studentId: students[0].id,
      }));
    }
  }, [loading, students, emailForm.studentId]);

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  // Handle filter changes
  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter communications
  const getFilteredCommunications = () => {
    let filtered = communications;

    // Filter by student if selected
    if (selectedStudent) {
      filtered = filtered.filter(
        (comm) => comm.studentId === selectedStudent.id
      );
    }

    // Filter by status
    if (filterStatus !== "All") {
      filtered = filtered.filter((comm) => comm.sentStatus === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (comm) =>
          comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comm.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
  };

  // Open compose email dialog
  const handleOpenComposeDialog = () => {
    setEmailForm({
      studentId: selectedStudent
        ? selectedStudent.id
        : students.length > 0
        ? students[0].id
        : "",
      date: dayjs(),
      type: "Email",
      subject: "",
      content: "",
      sentStatus: "Draft",
    });
    setOpenComposeDialog(true);
  };

  // Close compose email dialog
  const handleCloseComposeDialog = () => {
    setOpenComposeDialog(false);
  };

  // Open bulk email dialog
  const handleOpenBulkDialog = () => {
    setSelectedStudents([]);
    setBulkEmailForm({
      type: "Email",
      subject: "",
      content: "",
      sentStatus: "Draft",
    });
    setOpenBulkDialog(true);
  };

  // Close bulk email dialog
  const handleCloseBulkDialog = () => {
    setOpenBulkDialog(false);
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setEmailForm({
      ...emailForm,
      [name]: value,
    });
  };

  // Handle bulk form input changes
  const handleBulkFormChange = (event) => {
    const { name, value } = event.target;
    setBulkEmailForm({
      ...bulkEmailForm,
      [name]: value,
    });
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setEmailForm({
      ...emailForm,
      date: newDate,
    });
  };

  // Handle student selection for bulk email
  const handleStudentCheckboxChange = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Handle select all students for bulk email
  const handleSelectAllStudents = (event) => {
    if (event.target.checked) {
      setSelectedStudents(students.map((student) => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Apply email template
  const handleApplyTemplate = (template) => {
    const studentName = emailForm.studentId
      ? `${getStudentName(emailForm.studentId)}`
      : "[Student Name]";

    const content = template.content
      .replace(/\[Student Name\]/g, studentName)
      .replace(/\[he\/she\]/g, "they");

    const subject = template.subject.replace(/\[Student Name\]/g, studentName);

    setEmailForm({
      ...emailForm,
      subject,
      content,
    });
  };

  // Apply email template to bulk email
  const handleApplyBulkTemplate = (template) => {
    setBulkEmailForm({
      ...bulkEmailForm,
      subject: template.subject.replace(/\[Student Name\]/g, ""),
      content: template.content
        .replace(/\[Student Name\]/g, "[Student Name]")
        .replace(/\[he\/she\]/g, "they"),
    });
  };

  // Submit compose email form
  const handleSaveEmail = async (sendNow = false) => {
    try {
      const formattedDate = emailForm.date.format("YYYY-MM-DD");
      const student = students.find(s => s.id === emailForm.studentId);
      
      // Create a daily update email
      const newEmail = {
        studentId: emailForm.studentId,
        date: formattedDate,
        subject: emailForm.subject,
        content: emailForm.content,
        sentStatus: sendNow ? "Sent" : "Draft",
        type: "daily_update",
        studentName: student ? `${student.firstName} ${student.lastName}` : "",
        // Include relevant student data
        attendance: attendance.find(a => 
          a.studentId === emailForm.studentId && 
          a.date === formattedDate
        ) || { status: "Present", notes: "" },
        grades: grades.filter(g => 
          g.studentId === emailForm.studentId && 
          g.date === formattedDate
        ),
        behavior: behavior.filter(b => 
          b.studentId === emailForm.studentId && 
          b.date === formattedDate
        ),
        assignments: assignments.filter(a => 
          a.studentId === emailForm.studentId && 
          a.date === formattedDate
        ),
        // Add metadata
        metadata: {
          createdAt: new Date().toISOString(),
          sentAt: sendNow ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
          teacherName: "Ms. Smith", // You should get this from user context
          schoolName: "Your School Name" // You should get this from settings
        }
      };

      console.log('Preparing to save email with data:', newEmail);
      console.log('Student data:', student);
      console.log('Attendance data:', attendance.find(a => a.studentId === emailForm.studentId && a.date === formattedDate));
      console.log('Grades data:', grades.filter(g => g.studentId === emailForm.studentId && g.date === formattedDate));
      console.log('Behavior data:', behavior.filter(b => b.studentId === emailForm.studentId && b.date === formattedDate));
      console.log('Assignments data:', assignments.filter(a => a.studentId === emailForm.studentId && a.date === formattedDate));
      
      console.log('Calling createCommunication with:', newEmail);
      const result = await createCommunication(newEmail);
      console.log('Create communication result:', result);
      
      if (result) {
        console.log('Successfully created email with ID:', result.id);
      } else {
        console.error('No result returned from createCommunication');
      }
      
      if (!result || !result.id) {
        throw new Error('Failed to save email - no document ID returned');
      }
      
      // Refresh the communications list
      const updatedEmails = await getDailyUpdateEmails();
      setCommunications(updatedEmails);

      setOpenComposeDialog(false);
      setSnackbar({
        open: true,
        message: sendNow ? "Daily update email sent successfully" : "Daily update email saved as draft",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${sendNow ? "sending" : "saving"} daily update email: ${
          error.message
        }`,
        severity: "error",
      });
    }
  };

  // Submit bulk email form
  const handleSaveBulkEmail = async (sendNow = false) => {
    try {
      if (selectedStudents.length === 0) {
        setSnackbar({
          open: true,
          message: "Please select at least one student",
          severity: "error",
        });
        return;
      }

      const bulkEmail = {
        ...bulkEmailForm,
        sentStatus: sendNow ? "Sent" : "Draft",
      };

      await createBulkCommunication(selectedStudents, bulkEmail);
      setOpenBulkDialog(false);
      setSnackbar({
        open: true,
        message: sendNow
          ? `Email sent to ${selectedStudents.length} students`
          : `Draft saved for ${selectedStudents.length} students`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${sendNow ? "sending" : "saving"} bulk email: ${
          error.message
        }`,
        severity: "error",
      });
    }
  };

  // Open edit email dialog
  const handleOpenEditDialog = (communication) => {
    setSelectedCommunication(communication);
    setEmailForm({
      studentId: communication.studentId,
      date: dayjs(communication.date),
      type: communication.type,
      subject: communication.subject,
      content: communication.content,
      sentStatus: communication.sentStatus,
    });
    setOpenEditDialog(true);
  };

  // Close edit email dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Submit edit email form
  const handleUpdateEmail = async (sendNow = false) => {
    try {
      const updatedEmail = {
        ...emailForm,
        date: emailForm.date.format("YYYY-MM-DD"),
        sentStatus: sendNow ? "Sent" : "Draft",
      };

      await updateCommunication(
        selectedCommunication.studentId,
        selectedCommunication.date,
        selectedCommunication.subject,
        updatedEmail
      );

      setOpenEditDialog(false);
      setSnackbar({
        open: true,
        message: sendNow ? "Email sent successfully" : "Email updated",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${sendNow ? "sending" : "updating"} email: ${
          error.message
        }`,
        severity: "error",
      });
    }
  };

  // Open delete email dialog
  const handleOpenDeleteDialog = (communication) => {
    setSelectedCommunication(communication);
    setOpenDeleteDialog(true);
  };

  // Close delete email dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Submit delete email
  const handleDeleteEmail = async () => {
    try {
      await deleteCommunication(
        selectedCommunication.studentId,
        selectedCommunication.date,
        selectedCommunication.subject
      );

      setOpenDeleteDialog(false);
      setSnackbar({
        open: true,
        message: "Email deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting email: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Send a draft email
  const handleSendDraft = async (communication) => {
    try {
      await sendCommunication(
        communication.studentId,
        communication.date,
        communication.subject
      );

      setSnackbar({
        open: true,
        message: "Email sent successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error sending email: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return dayjs(dateString).toDate().toLocaleDateString(undefined, options);
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  // Get color for email status
  const getStatusColor = (status) => {
    return status === "Sent" ? "success" : "warning";
  };

  // Get icon for email status
  const getStatusIcon = (status) => {
    return status === "Sent" ? <CheckCircleIcon /> : <DraftsIcon />;
  };

  if (loading) {
    return <Loading message="Loading communication data..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" }, textAlign: { xs: "center", sm: "left" } }}
        >
          Communication Center
        </Typography>

        {/* Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 3,
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "background.paper",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="communication tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 48, sm: 48 },
              "& .MuiTab-root": {
                minHeight: { xs: 48, sm: 48 },
                px: { xs: 2, sm: 3 },
              },
            }}
          >
            <Tab label="Email History" />
            <Tab label="Email Templates" />
            <Tab label="Daily Updates" />
          </Tabs>
        </Box>

        {/* Email History Tab */}
        {tabValue === 0 && <DailyEmailsHistory initialTemplate={templateToCompose} />}

        {/* Email Templates Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {emailTemplates.map((template, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Subject: {template.subject}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-line", mb: 2 }}
                    >
                      {template.content}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EmailIcon />}
                        onClick={() => {
                          setTemplateToCompose(template);
                          setTabValue(0);
                        }}
                      >
                        Use Template
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Daily Updates Tab */}
        {tabValue === 2 && (
          <>
            <EmailStatus />
            <DailyUpdateManager
              students={students}
              attendance={attendance}
              assignments={assignments}
              grades={grades}
              behavior={behavior}
              onSendComplete={(data) => {
                // Success message is handled by EmailProvider
              }}
            />
          </>
        )}

      </Box>
    </LocalizationProvider>
  );
};

export default Communication;
