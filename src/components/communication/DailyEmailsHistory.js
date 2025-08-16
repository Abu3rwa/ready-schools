import React, { useEffect, useMemo, useState } from "react";
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Drafts as DraftsIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { useStudents } from "../../contexts/StudentContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useGrades } from "../../contexts/GradeContext";
import { useBehavior } from "../../contexts/BehaviorContext";
import { useCommunication } from "../../contexts/CommunicationContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

const DailyEmailsHistory = ({ initialTemplate = null }) => {
  const { students, loading: studentsLoading } = useStudents();
  const { attendance, loading: attendanceLoading } = useAttendance();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { grades, loading: gradesLoading } = useGrades();
  const { behavior, loading: behaviorLoading } = useBehavior();
  const {
    communications,
    loading: communicationsLoading,
    createCommunication,
    updateCommunication,
    deleteCommunication,
    sendCommunication,
  } = useCommunication();

  const { currentUser } = useAuth();
  const [schoolNamePref, setSchoolNamePref] = useState("");
  const [teacherNamePref, setTeacherNamePref] = useState("");

  useEffect(() => {
    const loadPrefs = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.school_name) setSchoolNamePref(d.school_name);
          if (d.teacher_display_name) setTeacherNamePref(d.teacher_display_name);
        }
      } catch {}
    };
    loadPrefs();
  }, [currentUser?.uid]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // If a template is provided from parent (e.g., Templates tab), open compose with it
  useEffect(() => {
    if (initialTemplate) {
      setEmailForm((prev) => ({
        ...prev,
        studentId: prev.studentId || students[0]?.id || "",
      }));
      // Apply the template after ensuring studentId is set
      setTimeout(() => {
        handleApplyTemplate(initialTemplate);
        setOpenComposeDialog(true);
      }, 0);
    }
  }, [initialTemplate, students]);

  const loading =
    studentsLoading ||
    communicationsLoading ||
    attendanceLoading ||
    assignmentsLoading ||
    gradesLoading ||
    behaviorLoading;

  useEffect(() => {
    if (!loading && students.length > 0 && !emailForm.studentId) {
      setEmailForm((prev) => ({
        ...prev,
        studentId: students[0].id,
      }));
    }
  }, [loading, students, emailForm.studentId]);

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

  const handleStudentSelect = (student) => setSelectedStudent(student);
  const handleFilterStatusChange = (event) => setFilterStatus(event.target.value);
  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return dayjs(dateString).toDate().toLocaleDateString(undefined, options);
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  const getStatusColor = (status) => (status === "Sent" ? "success" : "warning");
  const getStatusIcon = (status) => (status === "Sent" ? <CheckCircleIcon /> : <DraftsIcon />);

  const filteredCommunications = useMemo(() => {
    let filtered = communications || [];

    if (selectedStudent) {
      filtered = filtered.filter((comm) => comm.studentId === selectedStudent.id);
    }
    if (filterStatus !== "All") {
      filtered = filtered.filter((comm) => comm.sentStatus === filterStatus);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (comm) =>
          (comm.subject || "").toLowerCase().includes(term) ||
          (comm.content || "").toLowerCase().includes(term)
      );
    }

    return [...filtered].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [communications, selectedStudent, filterStatus, searchTerm]);

  const handleOpenComposeDialog = () => {
    setEmailForm({
      studentId: selectedStudent ? selectedStudent.id : students[0]?.id || "",
      date: dayjs(),
      type: "Email",
      subject: "",
      content: "",
      sentStatus: "Draft",
    });
    setOpenComposeDialog(true);
  };
  const handleCloseComposeDialog = () => setOpenComposeDialog(false);

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
  const handleCloseEditDialog = () => setOpenEditDialog(false);

  const handleOpenDeleteDialog = (communication) => {
    setSelectedCommunication(communication);
    setOpenDeleteDialog(true);
  };
  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);

  const handleOpenBulkDialog = () => {
    setSelectedStudents([]);
    setBulkEmailForm({ type: "Email", subject: "", content: "", sentStatus: "Draft" });
    setOpenBulkDialog(true);
  };
  const handleCloseBulkDialog = () => setOpenBulkDialog(false);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setEmailForm({ ...emailForm, [name]: value });
  };
  const handleBulkFormChange = (event) => {
    const { name, value } = event.target;
    setBulkEmailForm({ ...bulkEmailForm, [name]: value });
  };
  const handleDateChange = (newDate) => setEmailForm({ ...emailForm, date: newDate });

  const handleStudentCheckboxChange = (studentId) => {
    setSelectedStudents((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };
  const handleSelectAllStudents = (event) => {
    if (event.target.checked) setSelectedStudents(students.map((s) => s.id));
    else setSelectedStudents([]);
  };

  const handleApplyTemplate = (template) => {
    const studentName = emailForm.studentId ? `${getStudentName(emailForm.studentId)}` : "[Student Name]";
    const content = template.content.replace(/\[Student Name\]/g, studentName).replace(/\[he\/she\]/g, "they");
    const subject = template.subject.replace(/\[Student Name\]/g, studentName);
    setEmailForm({ ...emailForm, subject, content });
  };

  const handleApplyBulkTemplate = (template) => {
    setBulkEmailForm({
      ...bulkEmailForm,
      subject: template.subject.replace(/\[Student Name\]/g, ""),
      content: template.content.replace(/\[Student Name\]/g, "[Student Name]").replace(/\[he\/she\]/g, "they"),
    });
  };

  const handleSaveEmail = async (sendNow = false) => {
    try {
      const formattedDate = emailForm.date.format("YYYY-MM-DD");
      const student = students.find((s) => s.id === emailForm.studentId);
      const newEmail = {
        studentId: emailForm.studentId,
        date: formattedDate,
        subject: emailForm.subject,
        content: emailForm.content,
        sentStatus: sendNow ? "Sent" : "Draft",
        type: "daily_update",
        studentName: student ? `${student.firstName} ${student.lastName}` : "",
        attendance:
          attendance.find((a) => a.studentId === emailForm.studentId && a.date === formattedDate) || {
            status: "Present",
            notes: "",
          },
        grades: grades.filter((g) => g.studentId === emailForm.studentId && g.date === formattedDate),
        behavior: behavior.filter((b) => b.studentId === emailForm.studentId && b.date === formattedDate),
        assignments: assignments.filter((a) => a.studentId === emailForm.studentId && a.date === formattedDate),
        metadata: {
          createdAt: new Date().toISOString(),
          sentAt: sendNow ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
          teacherName: teacherNamePref || "Teacher",
          schoolName: schoolNamePref || "School",
        },
      };

      await createCommunication(newEmail);
      setOpenComposeDialog(false);
      setSnackbar({ open: true, message: sendNow ? "Daily update email sent successfully" : "Daily update email saved as draft", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: `Error ${sendNow ? "sending" : "saving"} daily update email: ${error.message}`, severity: "error" });
    }
  };

  const handleUpdateEmail = async (sendNow = false) => {
    try {
      const updatedEmail = {
        ...emailForm,
        date: emailForm.date.format("YYYY-MM-DD"),
        sentStatus: sendNow ? "Sent" : "Draft",
      };
      await updateCommunication(selectedCommunication.id, updatedEmail);
      setOpenEditDialog(false);
      setSnackbar({ open: true, message: sendNow ? "Email sent successfully" : "Email updated", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: `Error ${sendNow ? "sending" : "updating"} email: ${error.message}`, severity: "error" });
    }
  };

  const handleDeleteEmail = async () => {
    try {
      await deleteCommunication(selectedCommunication.id);
      setOpenDeleteDialog(false);
      setSnackbar({ open: true, message: "Email deleted successfully", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: `Error deleting email: ${error.message}`, severity: "error" });
    }
  };

  const handleSendDraft = async (communication) => {
    try {
      await sendCommunication(communication.id);
      setSnackbar({ open: true, message: "Email sent successfully", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: `Error sending email: ${error.message}`, severity: "error" });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body1">Loading email history...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent ? selectedStudent.id : ""}
                  onChange={(e) => {
                    const student = students.find((s) => s.id === e.target.value);
                    handleStudentSelect(student || null);
                  }}
                  label="Student"
                >
                  <MenuItem value="">All Students</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} onChange={handleFilterStatusChange} label="Status">
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="Sent">Sent</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                placeholder="Search emails..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                fullWidth
                InputProps={{ startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1 }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: "flex", gap: 1, width: "100%", flexDirection: { xs: "column", sm: "row" } }}>
                <Button variant="contained" color="primary" startIcon={<EmailIcon />} onClick={handleOpenComposeDialog} fullWidth>
                  Compose
                </Button>
                <Button variant="outlined" color="primary" startIcon={<GroupIcon />} onClick={handleOpenBulkDialog} fullWidth>
                  Bulk
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Card elevation={2}>
            <CardContent sx={{ p: 0 }}>
              <List>
                {filteredCommunications.length > 0 ? (
                  filteredCommunications.map((communication) => (
                    <ListItem key={communication.id} alignItems="flex-start" divider secondaryAction={
                      <Box>
                        {communication.sentStatus === "Draft" && (
                          <Tooltip title="Send">
                            <IconButton color="success" onClick={() => handleSendDraft(communication)} size="small">
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleOpenEditDialog(communication)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(communication)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip icon={getStatusIcon(communication.sentStatus)} label={communication.sentStatus} color={getStatusColor(communication.sentStatus)} size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(communication.date)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="subtitle2">{getStudentName(communication.studentId)}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {communication.subject}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {(communication.content || "").substring(0, 80)}
                              {(communication.content || "").length > 80 ? "..." : ""}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No communications found" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Card elevation={2}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Preview</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCommunications.length > 0 ? (
                      filteredCommunications.map((communication) => (
                        <TableRow key={communication.id}>
                          <TableCell>
                            <Chip icon={getStatusIcon(communication.sentStatus)} label={communication.sentStatus} color={getStatusColor(communication.sentStatus)} size="small" />
                          </TableCell>
                          <TableCell>{formatDate(communication.date)}</TableCell>
                          <TableCell>{getStudentName(communication.studentId)}</TableCell>
                          <TableCell>{communication.subject}</TableCell>
                          <TableCell>
                            <Typography noWrap sx={{ maxWidth: 200 }}>
                              {(communication.content || "").substring(0, 50)}
                              {(communication.content || "").length > 50 ? "..." : ""}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                              {communication.sentStatus === "Draft" && (
                                <Tooltip title="Send">
                                  <IconButton color="success" onClick={() => handleSendDraft(communication)} size="small">
                                    <SendIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Edit">
                                <IconButton color="primary" onClick={() => handleOpenEditDialog(communication)} size="small">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton color="error" onClick={() => handleOpenDeleteDialog(communication)} size="small">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No communications found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        <Dialog open={openComposeDialog} onClose={handleCloseComposeDialog} maxWidth="md" fullWidth>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select name="studentId" value={emailForm.studentId} onChange={handleFormChange} label="Student">
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField name="subject" label="Subject" value={emailForm.subject} onChange={handleFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Templates:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {emailTemplates.map((template, index) => (
                      <Chip key={index} label={template.name} onClick={() => handleApplyTemplate(template)} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <TextField name="content" label="Message" value={emailForm.content} onChange={handleFormChange} fullWidth required multiline rows={12} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <DatePicker
                      label="Schedule for"
                      value={emailForm.date}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  }
                  label=""
                  labelPlacement="start"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseComposeDialog}>Cancel</Button>
            <Button onClick={() => handleSaveEmail(false)} variant="outlined" color="primary" startIcon={<SaveIcon />} disabled={!emailForm.studentId || !emailForm.subject || !emailForm.content}>
              Save Draft
            </Button>
            <Button onClick={() => handleSaveEmail(true)} variant="contained" color="primary" startIcon={<SendIcon />} disabled={!emailForm.studentId || !emailForm.subject || !emailForm.content}>
              Send
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
          <DialogTitle>Edit Email</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select name="studentId" value={emailForm.studentId} onChange={handleFormChange} label="Student">
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField name="subject" label="Subject" value={emailForm.subject} onChange={handleFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Templates:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {emailTemplates.map((template, index) => (
                      <Chip key={index} label={template.name} onClick={() => handleApplyTemplate(template)} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <TextField name="content" label="Message" value={emailForm.content} onChange={handleFormChange} fullWidth required multiline rows={12} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <DatePicker
                      label="Schedule for"
                      value={emailForm.date}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  }
                  label=""
                  labelPlacement="start"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={() => handleUpdateEmail(false)} variant="outlined" color="primary" startIcon={<SaveIcon />} disabled={!emailForm.studentId || !emailForm.subject || !emailForm.content}>
              Save Draft
            </Button>
            <Button onClick={() => handleUpdateEmail(true)} variant="contained" color="primary" startIcon={<SendIcon />} disabled={!emailForm.studentId || !emailForm.subject || !emailForm.content}>
              Send
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openBulkDialog} onClose={handleCloseBulkDialog} maxWidth="md" fullWidth>
          <DialogTitle>Bulk Email</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedStudents.length === students.length}
                      onChange={handleSelectAllStudents}
                      indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                    />
                  }
                  label="Select All Students"
                />
                <Box sx={{ maxHeight: 200, overflow: "auto", mt: 1, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                  <List dense>
                    {students.map((student) => (
                      <ListItem key={student.id}>
                        <ListItemIcon>
                          <Checkbox edge="start" checked={selectedStudents.includes(student.id)} onChange={() => handleStudentCheckboxChange(student.id)} />
                        </ListItemIcon>
                        <ListItemText primary={`${student.firstName} ${student.lastName}`} secondary={student.grade} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {selectedStudents.length} students selected
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField name="subject" label="Subject" value={bulkEmailForm.subject} onChange={handleBulkFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Templates:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {emailTemplates.map((template, index) => (
                      <Chip key={index} label={template.name} onClick={() => handleApplyBulkTemplate(template)} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
                <TextField name="content" label="Message" value={bulkEmailForm.content} onChange={handleBulkFormChange} fullWidth required multiline rows={12} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkDialog}>Cancel</Button>
            <Button
              onClick={() => {
                // For now, create individually via createCommunication to keep behavior consistent
                // Could be optimized by a dedicated bulk API in the context
                (async () => {
                  try {
                    if (selectedStudents.length === 0) {
                      setSnackbar({ open: true, message: "Please select at least one student", severity: "error" });
                      return;
                    }
                    for (const studentId of selectedStudents) {
                      await createCommunication({
                        studentId,
                        date: dayjs().format("YYYY-MM-DD"),
                        subject: bulkEmailForm.subject,
                        content: bulkEmailForm.content,
                        sentStatus: "Draft",
                        type: "daily_update",
                      });
                    }
                    setOpenBulkDialog(false);
                    setSnackbar({ open: true, message: `Draft saved for ${selectedStudents.length} students`, severity: "success" });
                  } catch (error) {
                    setSnackbar({ open: true, message: `Error saving bulk email: ${error.message}`, severity: "error" });
                  }
                })();
              }}
              variant="outlined"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={selectedStudents.length === 0 || !bulkEmailForm.subject || !bulkEmailForm.content}
            >
              Save Drafts
            </Button>
            <Button
              onClick={() => {
                (async () => {
                  try {
                    if (selectedStudents.length === 0) {
                      setSnackbar({ open: true, message: "Please select at least one student", severity: "error" });
                      return;
                    }
                    for (const studentId of selectedStudents) {
                      await createCommunication({
                        studentId,
                        date: dayjs().format("YYYY-MM-DD"),
                        subject: bulkEmailForm.subject,
                        content: bulkEmailForm.content,
                        sentStatus: "Sent",
                        type: "daily_update",
                      });
                    }
                    setOpenBulkDialog(false);
                    setSnackbar({ open: true, message: `Email sent to ${selectedStudents.length} students`, severity: "success" });
                  } catch (error) {
                    setSnackbar({ open: true, message: `Error sending bulk email: ${error.message}`, severity: "error" });
                  }
                })();
              }}
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              disabled={selectedStudents.length === 0 || !bulkEmailForm.subject || !bulkEmailForm.content}
            >
              Send to All Selected
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Email</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this email?</Typography>
            {selectedCommunication && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Subject: {selectedCommunication.subject}</Typography>
                <Typography variant="body2" color="text.secondary">To: {getStudentName(selectedCommunication.studentId)}</Typography>
                <Typography variant="body2" color="text.secondary">Date: {formatDate(selectedCommunication.date)}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleDeleteEmail} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default DailyEmailsHistory;