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
} from "@mui/material";
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
} from "@mui/icons-material";
import { useAssignments } from "../contexts/AssignmentContext";
import { useGrades } from "../contexts/GradeContext";
import Loading from "../components/common/Loading";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import EnhancedAssignmentCard from "../components/assignments/EnhancedAssignmentCard";
import AssignmentTemplates from "../components/assignments/AssignmentTemplates";
import dayjs from "dayjs";

const Assignments = () => {
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
  const { deleteGradesByAssignment } = useGrades();

  // State for UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    subject: "English",
    name: "",
    category: "",
    points: "",
    dueDate: dayjs().add(7, "day"),
    description: "",
  });
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openTemplatesDialog, setOpenTemplatesDialog] = useState(false);

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

  // Get all available categories from the enhanced context
  const getAllCategories = () => {
    const allCategories = [];
    Object.values(assignmentCategories).forEach((subcategories) => {
      allCategories.push(...subcategories);
    });
    return allCategories;
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setAssignmentForm({
      ...assignmentForm,
      [name]: value,
    });
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setAssignmentForm({
      ...assignmentForm,
      dueDate: newDate,
    });
  };

  // Open add assignment dialog
  const handleOpenAddDialog = () => {
    setAssignmentForm({
      subject: "English",
      name: "",
      category: "",
      points: "",
      dueDate: dayjs().add(7, "day"),
      description: "",
    });
    setOpenAddDialog(true);
  };

  // Close add assignment dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Submit add assignment form
  const handleAddAssignment = async () => {
    try {
      const newAssignment = {
        ...assignmentForm,
        points: parseInt(assignmentForm.points, 10),
        dueDate: assignmentForm.dueDate.format("YYYY-MM-DD"),
      };

      await addAssignment(newAssignment);
      setOpenAddDialog(false);
      setSnackbar({
        open: true,
        message: "Assignment added successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error adding assignment: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open edit assignment dialog
  const handleOpenEditDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentForm({
      subject: assignment.subject,
      name: assignment.name,
      category: assignment.category,
      points: assignment.points.toString(),
      dueDate: dayjs(assignment.dueDate),
      description: assignment.description,
    });
    setOpenEditDialog(true);
  };

  // Close edit assignment dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Submit edit assignment form
  const handleEditAssignment = async () => {
    try {
      const updatedAssignment = {
        ...assignmentForm,
        points: parseInt(assignmentForm.points, 10),
        dueDate: assignmentForm.dueDate.format("YYYY-MM-DD"),
      };

      await updateAssignment(selectedAssignment.id, updatedAssignment);
      setOpenEditDialog(false);
      setSnackbar({
        open: true,
        message: "Assignment updated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating assignment: ${error.message}`,
        severity: "error",
      });
    }
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

  // Toggle view mode
  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setFilterSubject("All");
    } else if (newValue === 1) {
      setFilterSubject("English");
    } else if (newValue === 2) {
      setFilterSubject("Social Studies");
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

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="assignment tabs"
          >
            <Tab label="All Assignments" />
            <Tab label="English" />
            <Tab label="Social Studies" />
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
            <Grid item xs={12} sm={3}>
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
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                fullWidth
              >
                Add
              </Button>
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
          <Grid container spacing={3}>
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => (
                <Grid item xs={12} sm={6} md={4} key={assignment.id}>
                  <EnhancedAssignmentCard
                    assignment={assignment}
                    onEdit={handleOpenEditDialog}
                    onDelete={handleOpenDeleteDialog}
                    showActions={true}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    No assignments found
                  </Typography>
                  <Typography variant="body2">
                    Create your first assignment or adjust your filters.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
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
                                  "0"
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
        <Dialog
          open={openAddDialog}
          onClose={handleCloseAddDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Assignment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={assignmentForm.subject}
                    onChange={handleFormChange}
                    label="Subject"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Social Studies">Social Studies</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={assignmentForm.category}
                    onChange={handleFormChange}
                    label="Category"
                  >
                    {getAllCategories().map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Assignment Name"
                  value={assignmentForm.name}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="points"
                  label="Points"
                  type="number"
                  value={assignmentForm.points}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date"
                  value={assignmentForm.dueDate}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={assignmentForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>Cancel</Button>
            <Button
              onClick={handleAddAssignment}
              variant="contained"
              color="primary"
              disabled={
                !assignmentForm.name ||
                !assignmentForm.category ||
                !assignmentForm.points ||
                !assignmentForm.dueDate
              }
            >
              Add Assignment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={assignmentForm.subject}
                    onChange={handleFormChange}
                    label="Subject"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Social Studies">Social Studies</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={assignmentForm.category}
                    onChange={handleFormChange}
                    label="Category"
                  >
                    {getAllCategories().map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Assignment Name"
                  value={assignmentForm.name}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="points"
                  label="Points"
                  type="number"
                  value={assignmentForm.points}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date"
                  value={assignmentForm.dueDate}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={assignmentForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button
              onClick={handleEditAssignment}
              variant="contained"
              color="primary"
              disabled={
                !assignmentForm.name ||
                !assignmentForm.category ||
                !assignmentForm.points ||
                !assignmentForm.dueDate
              }
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

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

export default Assignments;
