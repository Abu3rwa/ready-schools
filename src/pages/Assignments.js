import React, { useEffect, useMemo, useState } from "react";
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Tooltip,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  LinearProgress,
} from "@mui/material";
import { useAssignments } from "../contexts/AssignmentContext";
import { useGrades } from "../contexts/GradeContext";
import { useStudents } from "../contexts/StudentContext";
import { useGradeBooks } from "../contexts/GradeBookContext";
import { useNavigate } from "react-router-dom";
import Loading from "../components/common/Loading";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import EnhancedAssignmentCard from "../components/assignments/EnhancedAssignmentCard";
import EnhancedAssignmentForm from "../components/assignments/EnhancedAssignmentForm";
import AssignmentTemplates from "../components/assignments/AssignmentTemplates";
import CategoryManager from "../components/assignments/CategoryManager";
import dayjs from "dayjs";
import { getSubjects as getManagedSubjects } from "../services/subjectsService";
import { getStandards, getStandardsMappings } from "../services/standardsService";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListView,
  Grade as GradeIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

const Assignments = () => {
  const navigate = useNavigate();
  const {
    assignments,
    loading,
    error,
    categories: assignmentCategories,
    templates,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    createFromTemplate,
    saveAsTemplate,
  } = useAssignments();
  const { grades, deleteGradesByAssignment } = useGrades();
  const { students } = useStudents();
  const { currentGradeBook } = useGradeBooks();

  // State for UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [managedSubjects, setManagedSubjects] = useState([]);
  const [standardsBySubject, setStandardsBySubject] = useState({});
  const [mappedStandardIdsByAssignment, setMappedStandardIdsByAssignment] = useState({});

  // Build subjects options: prefer teacher-managed subjects; fallback to subjects seen in assignments
  const subjectsOptions = useMemo(() => {
    if (managedSubjects && managedSubjects.length > 0) {
      return managedSubjects.map((s) => ({ value: s.code || s.name, label: s.name }));
    }
    const uniques = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));
    return uniques.map((u) => ({ value: u, label: u }));
  }, [managedSubjects, assignments]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getManagedSubjects();
        setManagedSubjects(list);
        // Preload standards per subject for quick filters/info
        const allStandards = await getStandards();
        const bySubject = allStandards.reduce((acc, s) => {
          const key = s.subject || "General";
          if (!acc[key]) acc[key] = [];
          acc[key].push(s);
          return acc;
        }, {});
        setStandardsBySubject(bySubject);
      } catch (e) {
        setManagedSubjects([]);
      }
    })();
  }, []);

  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openTemplatesDialog, setOpenTemplatesDialog] = useState(false);
  const [openCategoryManager, setOpenCategoryManager] = useState(false);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle filter changes
  const handleFilterSubjectChange = (event) => {
    setFilterSubject(event.target.value);
  };

  const handleFilterCategoryChange = (event) => {
    setFilterCategory(event.target.value);
  };

  // Filter assignments based on search term and filters
  const filteredAssignments = assignments
    .filter((assignment) => {
      const matchesSearch =
        assignment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject =
        filterSubject === "All" || assignment.subject === filterSubject;
      const matchesCategory =
        filterCategory === "All" || assignment.category === filterCategory;

      return matchesSearch && matchesSubject && matchesCategory;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Get unique categories for filter dropdown
  const categories = [...new Set(assignments.map((a) => a.category))].filter(
    Boolean
  );

  // Calculate assignment statistics
  const assignmentStats = useMemo(() => {
    if (!assignments || !grades || !students) return {};
    
    return assignments.reduce((acc, assignment) => {
      const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id);
      const completionRate = students.length > 0 ? (assignmentGrades.length / students.length) * 100 : 0;
      const averageGrade = assignmentGrades.length > 0 
        ? assignmentGrades.reduce((sum, g) => sum + g.score, 0) / assignmentGrades.length 
        : 0;
      
      acc[assignment.id] = {
        completionRate,
        averageGrade,
        gradedCount: assignmentGrades.length,
        totalStudents: students.length,
        needsGrading: students.length - assignmentGrades.length
      };
      return acc;
    }, {});
  }, [assignments, grades, students]);

  // Open add assignment dialog
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  // Close add assignment dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Open edit assignment dialog
  const handleOpenEditDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenEditDialog(true);
  };

  // Close edit assignment dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Open delete assignment dialog
  const handleOpenDeleteDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenDeleteDialog(true);
  };

  // Close delete assignment dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Submit delete assignment
  const handleDeleteAssignment = async () => {
    try {
      // First, delete all grades associated with the assignment
      await deleteGradesByAssignment(selectedAssignment.id);

      // Then, delete the assignment itself
      await deleteAssignment(selectedAssignment.id);
      setOpenDeleteDialog(false);
      setSnackbar({
        open: true,
        message: "Assignment deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting assignment: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Navigate to gradebook for grading
  const handleNavigateToGradebook = (assignment) => {
    // Find the gradebook for this subject
    const subject = assignment.subject;
    if (subject) {
      navigate(`/gradebooks?subject=${encodeURIComponent(subject)}&assignment=${assignment.id}`);
    } else {
      navigate('/gradebooks');
    }
  };

  // Navigate to gradebook overview
  const handleNavigateToGradebookOverview = () => {
    navigate('/gradebooks');
  };

  // Toggle view mode
  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setFilterSubject("All");
    } else {
      const idx = newValue - 1;
      setFilterSubject(subjectsOptions[idx]?.value || "All");
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Template handlers
  const handleUseTemplate = async (assignmentData) => {
    try {
      await addAssignment(assignmentData);
      setSnackbar({
        open: true,
        message: "Assignment created from template successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error creating assignment from template",
        severity: "error",
      });
    }
  };

  const handleSaveAsTemplate = (templateData) => {
    saveAsTemplate(templateData);
    setSnackbar({
      open: true,
      message: "Template saved successfully!",
      severity: "success",
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if date is past due
  const isPastDue = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
  };

  // Get color for due date chip
  const getDueDateColor = (dateString) => {
    if (isPastDue(dateString)) return "error";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return "warning";
    if (diffDays <= 7) return "info";
    return "success";
  };

  // Get assignment status
  const getAssignmentStatus = (assignment) => {
    const stats = assignmentStats[assignment.id];
    if (!stats) return { status: 'Unknown', color: 'default' };
    
    if (stats.needsGrading > 0) {
      if (isPastDue(assignment.dueDate)) {
        return { status: 'Overdue', color: 'error' };
      } else if (stats.completionRate < 50) {
        return { status: 'Needs Grading', color: 'warning' };
      } else {
        return { status: 'In Progress', color: 'info' };
      }
    } else {
      return { status: 'Completed', color: 'success' };
    }
  };

  // Group assignments by month and day for calendar view
  const groupAssignmentsByDate = () => {
    const grouped = {};

    filteredAssignments.forEach((assignment) => {
      const date = assignment.dueDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(assignment);
    });

    return grouped;
  };

  // Get all months between earliest and latest assignment
  const getMonthsRange = () => {
    if (filteredAssignments.length === 0) return [];

    const dates = filteredAssignments.map((a) => new Date(a.dueDate));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const months = [];
    const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

    while (currentDate <= maxDate) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get assignments for a specific day
  const getAssignmentsForDay = (year, month, day) => {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return filteredAssignments.filter((a) => a.dueDate === dateString);
  };

  if (loading) {
    return <Loading message="Loading assignments..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading assignments: {error}</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Assignment Management
        </Typography>

        {/* Quick Stats and Navigation */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${assignments.length} Assignments`} 
                  color="primary" 
                  variant="outlined" 
                  icon={<AssignmentIcon />}
                />
                <Chip 
                  label={`${students.length} Students`} 
                  color="secondary" 
                  variant="outlined" 
                  icon={<SchoolIcon />}
                />
                <Chip 
                  label={`${categories.length} Categories`} 
                  color="info" 
                  variant="outlined" 
                  icon={<CategoryIcon />}
                />
                <Chip 
                  label={`${grades.length} Grades`} 
                  color="success" 
                  variant="outlined" 
                  icon={<GradeIcon />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={handleNavigateToGradebookOverview}
                >
                  View Gradebook
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                >
                  Add Assignment
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="assignment tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Assignments" />
            {subjectsOptions.map((s) => (
              <Tab key={s.value} label={s.label} />
            ))}
          </Tabs>
        </Box>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                placeholder="Search assignments..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={handleFilterCategoryChange}
                  label="Category"
                  startAdornment={
                    <InputAdornment position="start">
                      <CategoryIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="outlined"
                onClick={() => setOpenCategoryManager(true)}
                fullWidth
              >
                Manage
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Tabs
                  value={viewMode}
                  onChange={handleViewModeChange}
                  aria-label="view mode"
                >
                  <Tab
                    icon={<ListView />}
                    label="List"
                    value="list"
                    aria-label="list view"
                  />
                  <Tab
                    icon={<CalendarIcon />}
                    label="Calendar"
                    value="calendar"
                    aria-label="calendar view"
                  />
                </Tabs>
              </Box>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AssignmentIcon />}
                onClick={() => setOpenTemplatesDialog(true)}
                fullWidth
              >
                Templates
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* List View */}
        {viewMode === "list" && (
          <AssignmentsTab
            assignments={filteredAssignments}
            students={students}
            grades={grades}
            assignmentStats={assignmentStats}
            onCreateAssignment={handleOpenAddDialog}
            onEditAssignment={handleOpenEditDialog}
            onDeleteAssignment={handleOpenDeleteDialog}
            onNavigateToGradebook={handleNavigateToGradebook}
            getAssignmentStatus={getAssignmentStatus}
          />
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Box>
            {getMonthsRange().map((month) => (
              <Card key={month.toString()} elevation={2} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {month.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1}>
                    {Array.from(
                      {
                        length: getDaysInMonth(
                          month.getFullYear(),
                          month.getMonth()
                        ),
                      },
                      (_, i) => i + 1
                    ).map((day) => {
                      const dayAssignments = getAssignmentsForDay(
                        month.getFullYear(),
                        month.getMonth(),
                        day
                      );

                      if (dayAssignments.length === 0) return null;

                      return (
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          md={4}
                          key={`${month.getFullYear()}-${month.getMonth()}-${day}`}
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              height: "100%",
                              bgcolor: isPastDue(
                                `${month.getFullYear()}-${String(
                                  month.getMonth() + 1
                                ).padStart(2, "0")}-${String(day).padStart(
                                  2,
                                  0
                                )}`
                              )
                                ? "rgba(255, 0, 0, 0.05)"
                                : "inherit",
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold">
                              {day}{" "}
                              {month.toLocaleString("default", {
                                month: "short",
                              })}
                            </Typography>
                            <Grid container spacing={1}>
                              {dayAssignments.map((assignment) => (
                                <Grid item xs={12} key={assignment.id}>
                                  <EnhancedAssignmentCard
                                    assignment={assignment}
                                    onEdit={handleOpenEditDialog}
                                    onDelete={handleOpenDeleteDialog}
                                    showActions={true}
                                    compact={true}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            ))}
            {filteredAssignments.length === 0 && (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography>No assignments found</Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Add Assignment Dialog */}
        <EnhancedAssignmentForm
          open={openAddDialog}
          onClose={handleCloseAddDialog}
          onSave={addAssignment}
          isEdit={false}
        />

        {/* Edit Assignment Dialog */}
        <EnhancedAssignmentForm
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          assignment={selectedAssignment}
          onSave={(data) => updateAssignment(selectedAssignment.id, data)}
          isEdit={true}
        />

        {/* Delete Assignment Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Assignment</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedAssignment?.name}"? This
              action cannot be undone.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              All grades associated with this assignment will also be
              permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleDeleteAssignment}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assignment Templates Dialog */}
        <AssignmentTemplates
          open={openTemplatesDialog}
          onClose={() => setOpenTemplatesDialog(false)}
          templates={templates}
          onUseTemplate={handleUseTemplate}
          onSaveTemplate={handleSaveAsTemplate}
          categories={assignmentCategories}
        />

        {/* Category Manager Dialog */}
        <CategoryManager
          open={openCategoryManager}
          onClose={() => setOpenCategoryManager(false)}
        />

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
    </LocalizationProvider>
  );
};

// Enhanced Assignments Tab Component with better GradeBook integration
const AssignmentsTab = ({
  assignments,
  students,
  grades,
  assignmentStats,
  onCreateAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onNavigateToGradebook,
  getAssignmentStatus
}) => {
  // Check if date is past due (moved here to fix scope issue)
  const isPastDue = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Assignments ({assignments.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateAssignment}
        >
          Create Assignment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Grading Progress</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => {
              const stats = assignmentStats[assignment.id];
              const status = getAssignmentStatus(assignment);

              return (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {assignment.name}
                    </Typography>
                    {assignment.description && (
                      <Typography variant="caption" color="text.secondary">
                        {assignment.description.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assignment.subject} 
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={assignment.category} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                    <Typography variant="body2">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                    </Typography>
                      <Chip
                        label={isPastDue(assignment.dueDate) ? 'Overdue' : 'On Time'}
                        size="small"
                        color={isPastDue(assignment.dueDate) ? 'error' : 'success'}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {assignment.points} pts
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {stats && (
                      <Box sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">
                            {stats.gradedCount}/{stats.totalStudents}
                          </Typography>
                          <Typography variant="caption">
                            {stats.completionRate.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={stats.completionRate} 
                          color={stats.completionRate === 100 ? 'success' : 'primary'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        {stats.averageGrade > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Avg: {stats.averageGrade.toFixed(1)}%
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status.status}
                      color={status.color}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Assignment">
                        <IconButton size="small" onClick={() => onEditAssignment(assignment)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Grade in Gradebook">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onNavigateToGradebook(assignment)}
                        >
                          <GradeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Assignment">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteAssignment(assignment)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Assignments;
