import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Chip,
  Paper,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MedicalServices as MedicalIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon,
  Contacts as ContactsIcon,
  Event as EventIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useGrades } from "../contexts/GradeContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { useBehavior } from "../contexts/BehaviorContext";
import Loading from "../components/common/Loading";
import EnhancedStudentCard from "../components/students/EnhancedStudentCard";
import EnhancedStudentForm from "../components/students/EnhancedStudentForm";
import AdvancedStudentSearch from "../components/students/AdvancedStudentSearch";
import StudentAnalytics from "../components/students/StudentAnalytics";

const Students = () => {
  const theme = useTheme();
  // Use real context functions
  const { students, loading, error, addStudent, updateStudent, deleteStudent } =
    useStudents();
  const { calculateStudentAverages } = useGrades();
  const { calculateAttendanceStats } = useAttendance();
  const { calculateBehaviorStats } = useBehavior();

  const [searchTerm, setSearchTerm] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    parentEmail1: "",
    studentEmail: "",
    phone: "",
    medicalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // State for form validation errors
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [filters, setFilters] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle advanced search
  const handleAdvancedSearch = (searchFilters) => {
    setFilters(searchFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  // Enhanced filtering function
  const filterStudents = (students, filters) => {
    return students.filter((student) => {
      // Basic search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          student.firstName?.toLowerCase().includes(searchLower) ||
          student.lastName?.toLowerCase().includes(searchLower) ||
          student.studentId?.toLowerCase().includes(searchLower) ||
          student.parentEmail1?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Grade level filter
      if (filters.gradeLevel && student.gradeLevel !== filters.gradeLevel) {
        return false;
      }

      // Status filter
      if (filters.status && student.status !== filters.status) {
        return false;
      }

      // Special needs filter
      if (filters.specialNeeds && filters.specialNeeds.length > 0) {
        const hasMatchingNeed = filters.specialNeeds.some((need) =>
          student.specialNeeds?.includes(need)
        );
        if (!hasMatchingNeed) return false;
      }

      // IEP filter
      if (typeof filters.hasIEP === 'boolean' && student.iepPlan !== filters.hasIEP) {
        return false;
      }

      // Medical notes filter
      if (typeof filters.hasMedicalNotes === 'boolean') {
        const hasMedicalNotes = !!(
          student.medicalNotes && student.medicalNotes.trim()
        );
        if (hasMedicalNotes !== filters.hasMedicalNotes) {
          return false;
        }
      }

      return true;
    });
  };

  // Filter students based on search term and filters
  const filteredStudents = filterStudents(students, { searchTerm, ...filters });

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setStudentForm({
      ...studentForm,
      [name]: value,
    });
    // Clear error for the field being changed
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: undefined,
    }));
  };

  // Open add student dialog
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await addStudent(formData);
      setOpenAddDialog(false);
      setSnackbar({
        open: true,
        message: "Student added successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Add student error:", error);
      setSnackbar({
        open: true,
        message: `Error adding student: ${error.message}`,
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close add student dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Open edit student dialog
  const handleOpenEditDialog = (student) => {
    setSelectedStudent(student);
    setOpenEditDialog(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await updateStudent(selectedStudent.id, formData);
      setOpenEditDialog(false);
      setSnackbar({
        open: true,
        message: "Student updated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating student: ${error.message}`,
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close edit student dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Open delete student dialog
  const handleOpenDeleteDialog = (student) => {
    setSelectedStudent(student);
    setOpenDeleteDialog(true);
  };

  // Close delete student dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Submit delete student
  const handleDeleteStudent = async () => {
    setIsSubmitting(true);
    try {
      await deleteStudent(selectedStudent.id);
      setOpenDeleteDialog(false);
      setSelectedStudent(null);
      setSnackbar({
        open: true,
        message: "Student deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting student: ${error.message}`,
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Get student details for selected student
  const getStudentDetails = (student) => {
    if (!student) return null;

    const grades = calculateStudentAverages(student.id);
    const attendance = calculateAttendanceStats(student.id);
    const behavior = calculateBehaviorStats(student.id);

    return { grades, attendance, behavior };
  };

  // Helper function to get subject grade
  const getSubjectGrade = (student, subjectName) => {
    const grades = getStudentDetails(student)?.grades;
    if (!grades || !grades.subjects) return "N/A";
    
    // Try exact match first
    if (grades.subjects[subjectName]) return grades.subjects[subjectName];
    
    // Try case-insensitive match
    const subjectKey = Object.keys(grades.subjects).find(
      key => key.toLowerCase() === subjectName.toLowerCase()
    );
    
    return subjectKey ? grades.subjects[subjectKey] : "N/A";
  };

  // Helper function to get all subjects for a student
  const getStudentSubjects = (student) => {
    const grades = getStudentDetails(student)?.grades;
    if (!grades || !grades.subjects) return [];
    
    return Object.keys(grades.subjects);
  };

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Get avatar color based on student ID
  const getAvatarColor = (id) => {
    const colors = [
      "#1976d2", // blue
      "#dc004e", // pink
      "#4caf50", // green
      "#ff9800", // orange
      "#9c27b0", // purple
    ];
    const index = parseInt(id.replace(/\D/g, "")) % colors.length;
    return colors[index];
  };

  if (loading) {
    return <Loading message="Loading students..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading students: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 4,
          px: { xs: 2, sm: 0 },
          py: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 2,
          color: 'white',
          boxShadow: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }} />
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                fontWeight: 600,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Student Management
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Manage your students and view their progress
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ 
            background: 'rgba(255,255,255,0.2)', 
            px: 2, 
            py: 1, 
            borderRadius: 1,
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            {filteredStudents.length} Students
          </Typography>
        </Box>
      </Box>

      {/* Advanced Search */}
      <AdvancedStudentSearch
        onSearch={handleAdvancedSearch}
        onClear={handleClearFilters}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Add Student Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.accent.main} 100%)`,
            color: 'white',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            boxShadow: 3,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-1px)'
            }
          }}
        >
          Add Student
        </Button>
      </Box>

      {/* Student List and Details */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Student List */}
        <Grid 
          item 
          xs={12} 
          md={4}
          sx={{
            order: { xs: 2, md: 1 }, // Move list below details on mobile
            display: { 
              xs: selectedStudent ? 'none' : 'block', // Hide list when student selected on mobile
              md: 'block' 
            }
          }}
        >
          <Card 
            elevation={2} 
            sx={{ 
              height: "100%",
              borderRadius: { xs: 0, sm: 1 },
              mx: { xs: -2, sm: 0 } // Negative margin on mobile to extend to edges
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="h6"
                sx={{ 
                  p: 2, 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.accent.main} 100%)`,
                  color: "white",
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactsIcon fontSize="small" />
                  <span>Student Roster ({filteredStudents.length})</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="Active" 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 500
                    }} 
                  />
                </Box>
              </Typography>
                <List
                sx={{ 
                  maxHeight: { 
                    xs: "calc(100vh - 200px)", // Taller on mobile
                    sm: "calc(100vh - 300px)" 
                  }, 
                  overflow: "auto",
                  pb: { xs: 7, sm: 0 } // Space for bottom nav on mobile
                }}
                >
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <React.Fragment key={student.id}>
                      <ListItem
                        button
                        selected={
                          selectedStudent && selectedStudent.id === student.id
                        }
                        onClick={() => setSelectedStudent(student)}
                        sx={{
                          py: { xs: 2, sm: 2 },
                          px: { xs: 2, sm: 2 },
                          transition: 'all 0.2s ease-in-out',
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: 'rgba(20, 89, 169, 0.08)',
                            transform: 'translateX(4px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: `${theme.palette.primary.main}15`,
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            '&:hover': {
                              backgroundColor: `${theme.palette.primary.main}20`,
                            }
                          }
                        }}
                      >
                        <ListItemAvatar>
                            <Avatar
                            src={student.studentImage || student.imagePreview}
                            sx={{ 
                              bgcolor: getAvatarColor(student.id),
                              width: { xs: 48, sm: 48 },
                              height: { xs: 48, sm: 48 },
                              border: `2px solid ${theme.palette.background.paper}`,
                              boxShadow: 2,
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                            onError={(e) => {
                              e.target.src = ''; // Clear src to show fallback initials
                            }}
                            >
                            {getInitials(student.firstName, student.lastName)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="body1"
                              sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '1rem', sm: '1rem' }
                              }}
                            >
                              {`${student.firstName} ${student.lastName}`}
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                color: 'text.secondary'
                              }}
                            >
                              {student.studentEmail || student.email || "No student email"}
                            </Typography>
                          }
                        />
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            gap: { xs: 1, sm: 1 }
                          }}
                        >
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDialog(student);
                          }}
                            sx={{ 
                              p: { xs: 1, sm: 1 },
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.primary.main}15`,
                                transform: 'scale(1.1)'
                              }
                          }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteDialog(student);
                          }}
                            sx={{ 
                              p: { xs: 1, sm: 1 },
                              color: theme.palette.secondary.main,
                              '&:hover': {
                                backgroundColor: `${theme.palette.secondary.main}15`,
                                transform: 'scale(1.1)'
                              }
                          }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        </Box>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Typography 
                          sx={{ 
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary'
                          }}
                        >
                          No students found
                        </Typography>
                      } 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Student Details */}
        <Grid 
          item 
          xs={12} 
          md={8}
          sx={{
            order: { xs: 1, md: 2 }, // Move details above list on mobile
            display: { 
              xs: selectedStudent ? 'block' : 'none', // Show details only when student selected on mobile
              md: 'block' 
            }
          }}
        >
          {selectedStudent ? (
              <Box>
                {showAnalytics ? (
                  <StudentAnalytics
                    student={selectedStudent}
                    grades={getStudentDetails(selectedStudent)?.grades}
                    attendance={getStudentDetails(selectedStudent)?.attendance}
                    behavior={getStudentDetails(selectedStudent)?.behavior}
                  />
                ) : (
            <Card 
              elevation={3}
              sx={{ 
                borderRadius: { xs: 0, sm: 2 },
                mx: { xs: -2, sm: 0 },
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                border: `1px solid ${theme.palette.primary.main}20`
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box
                        sx={{ 
                          display: "flex", 
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "center", sm: "flex-start" },
                          gap: { xs: 2, sm: 3 },
                          mb: 3,
                          position: 'relative'
                        }}
                      >
                        {/* Back button for mobile */}
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            display: { xs: 'block', md: 'none' }
                          }}
                        >
                          <IconButton
                            onClick={() => setSelectedStudent(null)}
                            size="small"
                          >
                            <ArrowBackIcon />
                          </IconButton>
                        </Box>
                        
                  <Avatar
                    src={selectedStudent.studentImage || selectedStudent.imagePreview}
                    sx={{
                      bgcolor: getAvatarColor(selectedStudent.id),
                      width: { xs: 80, sm: 80 },
                      height: { xs: 80, sm: 80 },
                      border: `4px solid ${theme.palette.background.paper}`,
                      boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                    onError={(e) => {
                      e.target.src = ''; // Clear src to show fallback initials
                    }}
                  >
                    {getInitials(
                      selectedStudent.firstName,
                      selectedStudent.lastName
                    )}
                  </Avatar>
                        <Box 
                          sx={{ 
                            flexGrow: 1,
                            textAlign: { xs: 'center', sm: 'left' }
                          }}
                        >
                          <Typography 
                            variant="h5"
                            sx={{
                              fontSize: { xs: '1.5rem', sm: '1.75rem' },
                              fontWeight: 500
                            }}
                          >
                            {selectedStudent.firstName}{" "}
                            {selectedStudent.lastName}
                    </Typography>
                          <Typography 
                            variant="body2" 
                            color="textSecondary"
                            sx={{
                              mt: 0.5,
                              fontSize: { xs: '0.875rem', sm: '0.875rem' }
                            }}
                          >
                      Student ID: {selectedStudent.id}
                    </Typography>
                  </Box>
                        <Button
                          variant="contained"
                          startIcon={<AnalyticsIcon />}
                          onClick={() => setShowAnalytics(!showAnalytics)}
                          sx={{
                            minWidth: { xs: '100%', sm: 'auto' },
                            background: `linear-gradient(135deg, ${theme.palette.accent.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-1px)'
                            }
                          }}
                        >
                          {showAnalytics ? "Hide Analytics" : "Show Analytics"}
                        </Button>
                </Box>

                <Box
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: { xs: 0, sm: 2 },
                    mx: { xs: -2, sm: 0 }, // Negative margin on mobile to extend to edges
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    pb: { xs: 1, sm: 0 }
                  }}
                >
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{ 
                      minHeight: { xs: 48, sm: 48 },
                      '& .MuiTabs-flexContainer': {
                        gap: { xs: 3, sm: 4 }
                      },
                      '& .MuiTabs-indicator': {
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                      },
                      '& .MuiTab-root': {
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                        fontWeight: 500,
                        minWidth: 'auto',
                        minHeight: { xs: 48, sm: 48 },
                        px: { xs: 2, sm: 3 },
                        '&.Mui-selected': {
                          color: 'primary.main',
                          fontWeight: 600
                        }
                      },
                      '& .MuiTabScrollButton-root': {
                        width: { xs: 28, sm: 40 },
                        '&.Mui-disabled': {
                          opacity: 0.3
                        }
                      }
                    }}
                  >
                    <Tab 
                      label="Contact" 
                      icon={<ContactsIcon />}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          mr: 1,
                          mb: '0 !important'
                        }
                      }}
                    />
                    <Tab 
                      label="Academic" 
                      icon={<SchoolIcon />}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          mr: 1,
                          mb: '0 !important'
                        }
                      }}
                    />
                    <Tab 
                      label="Attendance" 
                      icon={<EventIcon />}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          mr: 1,
                          mb: '0 !important'
                        }
                      }}
                    />
                    <Tab 
                      label="Behavior" 
                      icon={<PsychologyIcon />}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          mr: 1,
                          mb: '0 !important'
                        }
                      }}
                    />
                </Tabs>
                </Box>

                {/* Contact Info Tab */}
                {tabValue === 0 && (
                  <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: 'background.default',
                            borderRadius: 1
                          }}
                        >
                        <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                              gap: 2
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'primary.light',
                                width: 40,
                                height: 40
                              }}
                            >
                              <EmailIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Primary Email
                              </Typography>
                              <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                {selectedStudent.parentEmail1 || "No primary email"}
                          </Typography>
                        </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: 'background.default',
                            borderRadius: 1
                          }}
                        >
                        <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                              gap: 2
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'secondary.light',
                                width: 40,
                                height: 40
                              }}
                            >
                              <EmailIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Student Email
                              </Typography>
                              <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                {selectedStudent.studentEmail || selectedStudent.email || "No student email"}
                          </Typography>
                        </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: 'background.default',
                            borderRadius: 1
                          }}
                        >
                        <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                              gap: 2
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: 'info.light',
                                width: 40,
                                height: 40
                              }}
                            >
                              <PhoneIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Phone Number
                              </Typography>
                          <Typography variant="body1">
                            {selectedStudent.phone || "No phone number"}
                          </Typography>
                        </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: 'background.default',
                            borderRadius: 1
                          }}
                        >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                              gap: 2
                          }}
                        >
                            <Avatar
                                  sx={{
                                bgcolor: 'warning.light',
                                width: 40,
                                height: 40
                              }}
                            >
                              <MedicalIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Medical Notes
                              </Typography>
                              <Typography 
                                variant="body1"
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {selectedStudent.medicalNotes || "No medical notes"}
                          </Typography>
                        </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Academic Tab */}
                {tabValue === 1 && (
                  <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: "primary.light",
                            color: "white",
                            borderRadius: 2
                          }}
                        >
                          <SchoolIcon sx={{ fontSize: { xs: 48, sm: 56 }, mb: 1 }} />
                          <Typography variant="h6" sx={{ mb: 1 }}>
                                  Overall Average
                                </Typography>
                          <Typography 
                            variant="h3" 
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '2.5rem', sm: '3rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.grades.overall || "N/A"}%
                          </Typography>
                        </Paper>
                      </Grid>
                      {getStudentSubjects(selectedStudent).map((subject, index) => {
                        const colors = [
                          "info.light",
                          "secondary.light", 
                          "success.light",
                          "warning.light",
                          "error.light"
                        ];
                        const color = colors[index % colors.length];
                        
                        return (
                          <Grid item xs={12} sm={6} key={subject}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                textAlign: "center",
                                bgcolor: color,
                                color: "white",
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              <SchoolIcon sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1 }} />
                              <Typography variant="h6" sx={{ mb: 1 }}>{subject}</Typography>
                              <Typography 
                                variant="h4"
                                sx={{ 
                                  fontWeight: 'bold',
                                  fontSize: { xs: '1.75rem', sm: '2rem' }
                                }}
                              >
                                {getSubjectGrade(selectedStudent, subject)}%
                              </Typography>
                            </Paper>
                          </Grid>
                        );
                      })}
                      {getStudentSubjects(selectedStudent).length === 0 && (
                        <Grid item xs={12}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 3,
                              textAlign: "center",
                              bgcolor: "grey.100",
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="h6" color="textSecondary">
                              No subject grades available
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Grades will appear here once assignments are graded
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* Attendance Tab */}
                {tabValue === 2 && (
                  <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: "success.light",
                            color: "white",
                            borderRadius: 2,
                            mb: 2
                          }}
                        >
                          <Typography 
                            variant="h4"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '2rem', sm: '2.5rem' },
                              mb: 1
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.attendance.presentPercentage || "0"}%
                          </Typography>
                          <Typography variant="h6">Overall Attendance Rate</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            textAlign: "center",
                            bgcolor: "success.light",
                            color: "white",
                            borderRadius: 2,
                            height: '100%'
                          }}
                        >
                          <Typography variant="h6">Present</Typography>
                          <Typography 
                            variant="h4"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '1.75rem', sm: '2rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.attendance.present || "0"}
                          </Typography>
                          <Typography variant="body2">Days</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            textAlign: "center",
                            bgcolor: "error.light",
                            color: "white",
                            borderRadius: 2,
                            height: '100%'
                          }}
                        >
                          <Typography variant="h6">Absent</Typography>
                          <Typography 
                            variant="h4"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '1.75rem', sm: '2rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.attendance.absent || "0"}
                          </Typography>
                          <Typography variant="body2">Days</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            textAlign: "center",
                            bgcolor: "warning.light",
                            color: "white",
                            borderRadius: 2,
                            height: '100%'
                          }}
                        >
                          <Typography variant="h6">Tardy</Typography>
                          <Typography 
                            variant="h4"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '1.75rem', sm: '2rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.attendance.tardy || "0"}
                          </Typography>
                          <Typography variant="body2">Days</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Behavior Tab */}
                {tabValue === 3 && (
                  <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: (theme) => theme.palette.grey[100],
                            borderRadius: 2,
                            mb: 2
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            color="textSecondary"
                            sx={{ mb: 2 }}
                          >
                            Behavior Overview
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: 3,
                              flexWrap: 'wrap'
                            }}
                          >
                  <Box>
                              <Typography 
                                variant="h4"
                                color="success.main"
                                sx={{ 
                                  fontWeight: 'bold',
                                  fontSize: { xs: '2rem', sm: '2.5rem' }
                                }}
                              >
                                {getStudentDetails(selectedStudent)?.behavior.positivePercentage || "0"}%
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Positive
                              </Typography>
                            </Box>
                            <Box>
                              <Typography 
                                variant="h4"
                                color="error.main"
                                sx={{ 
                                  fontWeight: 'bold',
                                  fontSize: { xs: '2rem', sm: '2.5rem' }
                                }}
                              >
                                {getStudentDetails(selectedStudent)?.behavior.negativePercentage || "0"}%
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Needs Improvement
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: "success.light",
                            color: "white",
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Positive Behavior
                          </Typography>
                          <Typography 
                            variant="h3"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '2.5rem', sm: '3rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.behavior.positive || "0"}
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                            Incidents
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: "error.light",
                            color: "white",
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Needs Improvement
                          </Typography>
                          <Typography 
                            variant="h3"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '2.5rem', sm: '3rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.behavior.negative || "0"}
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                            Incidents
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <CardActions 
                  sx={{ 
                    justifyContent: { xs: "center", sm: "flex-end" },
                    mt: 3,
                    pt: 3,
                    borderTop: `1px solid ${theme.palette.primary.main}20`,
                    gap: { xs: 1, sm: 2 },
                    flexWrap: 'wrap',
                    background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(selectedStudent)}
                    sx={{ 
                      flex: { xs: '1 1 auto', sm: '0 1 auto' },
                      minWidth: { xs: 0, sm: 120 },
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: `${theme.palette.primary.main}10`,
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleOpenDeleteDialog(selectedStudent)}
                    sx={{ 
                      flex: { xs: '1 1 auto', sm: '0 1 auto' },
                      minWidth: { xs: 0, sm: 120 },
                      borderColor: theme.palette.secondary.main,
                      color: theme.palette.secondary.main,
                      '&:hover': {
                        backgroundColor: `${theme.palette.secondary.main}10`,
                        borderColor: theme.palette.secondary.main,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    sx={{ 
                      flex: { xs: '1 1 auto', sm: '0 1 auto' },
                      minWidth: { xs: 0, sm: 120 },
                      background: `linear-gradient(135deg, ${theme.palette.accent.main} 0%, ${theme.palette.primary.main} 100%)`,
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Contact
                  </Button>
                </CardActions>
              </CardContent>
            </Card>
                )}
              </Box>
          ) : (
            <Card
              elevation={3}
              sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                border: `2px dashed ${theme.palette.primary.main}40`,
                borderRadius: 2
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <ContactsIcon 
                  sx={{ 
                    fontSize: { xs: '4rem', sm: '5rem' }, 
                    color: theme.palette.primary.main,
                    opacity: 0.5,
                    mb: 2
                  }} 
                />
                <Typography variant="h5" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Select a student to view details
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ opacity: 0.7 }}>
                  Choose a student from the list to see their information and progress
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Enhanced Student Forms */}
      <EnhancedStudentForm
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onSubmit={handleFormSubmit}
        loading={isSubmitting}
      />

      <EnhancedStudentForm
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        onSubmit={handleEditSubmit}
        student={selectedStudent}
        isEdit={true}
        loading={isSubmitting}
      />

      {/* Delete Student Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedStudent?.firstName}{" "}
            {selectedStudent?.lastName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteStudent}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Students;
