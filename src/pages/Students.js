import React, { useState } from "react";
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
  ViewList as ViewListIcon,
  GridView as GridViewIcon,
  ArrowBack as ArrowBackIcon,
  Contacts as ContactsIcon,
  Event as EventIcon,
  Psychology as PsychologyIcon,
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
    studentEdmail: "",
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
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
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
          mb: 3,
          px: { xs: 2, sm: 0 },
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          Student Management
        </Typography>
        <Box 
          sx={{ 
            display: "flex", 
            gap: 1,
            width: { xs: "100%", sm: "auto" }
          }}
        >
          <Button
            variant={viewMode === "list" ? "contained" : "outlined"}
          size="small"
            onClick={() => setViewMode("list")}
            startIcon={<ViewListIcon />}
            fullWidth
            sx={{ 
              display: "flex",
              justifyContent: "center",
              minWidth: { xs: 0, sm: 100 }
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>List</Box>
            <ViewListIcon sx={{ display: { xs: "inline", sm: "none" } }} />
          </Button>
          <Button
            variant={viewMode === "grid" ? "contained" : "outlined"}
            size="small"
            onClick={() => setViewMode("grid")}
            startIcon={<GridViewIcon />}
            fullWidth
            sx={{ 
              display: "flex",
              justifyContent: "center",
              minWidth: { xs: 0, sm: 100 }
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Grid</Box>
            <GridViewIcon sx={{ display: { xs: "inline", sm: "none" } }} />
          </Button>
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
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Student
        </Button>
      </Box>

      {/* Student List and Details */}
      {viewMode === "list" ? (
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
                  bgcolor: "primary.main", 
                  color: "white",
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Student Roster ({filteredStudents.length})</span>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
                  <IconButton 
                    size="small" 
                    sx={{ color: 'white' }}
                    onClick={() => setViewMode("grid")}
                  >
                    <GridViewIcon fontSize="small" />
                  </IconButton>
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
                          py: { xs: 2, sm: 1 }, // Taller touch targets on mobile
                          px: { xs: 2, sm: 2 }
                        }}
                      >
                        <ListItemAvatar>
                            <Avatar
                            sx={{ 
                              bgcolor: getAvatarColor(student.id),
                              width: { xs: 40, sm: 40 },
                              height: { xs: 40, sm: 40 }
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
                              {student.studentEdmail}
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
                              p: { xs: 1, sm: 1 }
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
                              p: { xs: 1, sm: 1 }
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
              elevation={2}
              sx={{ 
                borderRadius: { xs: 0, sm: 1 },
                mx: { xs: -2, sm: 0 } // Negative margin on mobile to extend to edges
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
                    sx={{
                      bgcolor: getAvatarColor(selectedStudent.id),
                            width: { xs: 80, sm: 64 },
                            height: { xs: 80, sm: 64 },
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
                          variant="outlined"
                          onClick={() => setShowAnalytics(!showAnalytics)}
                          sx={{
                            minWidth: { xs: '100%', sm: 'auto' }
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
                                {selectedStudent.studentEdmail || "No student email"}
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
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            textAlign: "center",
                            bgcolor: "info.light",
                            color: "white",
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <SchoolIcon sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1 }} />
                          <Typography variant="h6" sx={{ mb: 1 }}>English</Typography>
                          <Typography 
                            variant="h4"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '1.75rem', sm: '2rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.grades.english || "N/A"}%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            textAlign: "center",
                            bgcolor: "secondary.light",
                            color: "white",
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <SchoolIcon sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1 }} />
                          <Typography variant="h6" sx={{ mb: 1 }}>
                                  Social Studies
                                </Typography>
                          <Typography 
                            variant="h4"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '1.75rem', sm: '2rem' }
                            }}
                          >
                            {getStudentDetails(selectedStudent)?.grades.socialStudies || "N/A"}%
                          </Typography>
                        </Paper>
                      </Grid>
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
                    borderTop: 1,
                    borderColor: 'divider',
                    gap: { xs: 1, sm: 2 },
                    flexWrap: 'wrap'
                  }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(selectedStudent)}
                    sx={{ 
                      flex: { xs: '1 1 auto', sm: '0 1 auto' },
                      minWidth: { xs: 0, sm: 120 }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleOpenDeleteDialog(selectedStudent)}
                    sx={{ 
                      flex: { xs: '1 1 auto', sm: '0 1 auto' },
                      minWidth: { xs: 0, sm: 120 }
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<EmailIcon />}
                    sx={{ 
                      flex: { xs: '1 1 auto', sm: '0 1 auto' },
                      minWidth: { xs: 0, sm: 120 }
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
              elevation={2}
              sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CardContent>
                <Typography variant="h6" color="textSecondary" align="center">
                  Select a student to view details
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      ) : (
        <Box 
          sx={{ 
            mx: { xs: -2, sm: 0 } // Negative margin on mobile to extend to edges
          }}
        >
          <Grid 
            container 
            spacing={{ xs: 0, sm: 2 }}
            sx={{
              mt: { xs: 0, sm: 2 }
            }}
          >
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  lg={3} 
                  key={student.id}
                  sx={{
                    borderBottom: { xs: 1, sm: 0 },
                    borderColor: { xs: 'divider', sm: 'transparent' }
                  }}
                >
                <EnhancedStudentCard
                  student={student}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                  onContact={(student) => {
                    // Handle contact action
                    console.log("Contact student:", student);
                  }}
                  onViewDetails={(student) => setSelectedStudent(student)}
                  showAnalytics={false}
                  compact={true}
                    sx={{
                      borderRadius: { xs: 0, sm: 1 },
                      boxShadow: { xs: 0, sm: 1 },
                      height: '100%',
                      '& .MuiCardContent-root': {
                        p: { xs: 2, sm: 3 }
                      },
                      '& .MuiCardActions-root': {
                        p: { xs: 2, sm: 2 },
                        gap: 1
                      }
                    }}
              />
            </Grid>
            ))
          ) : (
            <Grid item xs={12}>
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    color="textSecondary"
                    sx={{
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    No students found
                  </Typography>
                </Box>
            </Grid>
          )}
            </Grid>
        </Box>
      )}

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
