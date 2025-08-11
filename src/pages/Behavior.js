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
  ToggleButtonGroup,
  ToggleButton,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ThumbUp as PositiveIcon,
  ThumbDown as NegativeIcon,
  BarChart as ChartIcon,
  ViewList as ListView,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useBehavior } from "../contexts/BehaviorContext";
import Loading from "../components/common/Loading";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

// Chart.js components
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const Behavior = () => {
  const { students, loading: studentsLoading } = useStudents();
  const {
    behavior,
    loading: behaviorLoading,
    logBehavior,
    updateBehavior,
    deleteBehavior,
    getBehaviorByStudent,
    getBehaviorByType,
    calculateBehaviorStats,
  } = useBehavior();

  // State for UI
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list", "chart", or "calendar"
  const [filterType, setFilterType] = useState("All"); // "All", "Positive", or "Negative"
  const [filterSeverity, setFilterSeverity] = useState("All"); // "All", "Low", "Medium", or "High"
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [behaviorForm, setBehaviorForm] = useState({
    studentId: "",
    date: dayjs(),
    type: "Positive",
    description: "",
    severity: "Low",
    actionTaken: "",
  });
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Loading state
  const loading = studentsLoading || behaviorLoading;

  // Initialize form with first student when data loads
  useEffect(() => {
    if (!loading && students.length > 0 && !behaviorForm.studentId) {
      setBehaviorForm((prev) => ({
        ...prev,
        studentId: students[0].id,
      }));
    }
  }, [loading, students, behaviorForm.studentId]);

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle filter changes
  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
  };

  const handleFilterSeverityChange = (event) => {
    setFilterSeverity(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter behavior records
  const getFilteredBehavior = () => {
    let filtered = behavior;

    // Filter by student if selected
    if (selectedStudent) {
      filtered = filtered.filter(
        (record) => record.studentId === selectedStudent.id
      );
    }

    // Filter by type
    if (filterType !== "All") {
      filtered = filtered.filter((record) => record.type === filterType);
    }

    // Filter by severity
    if (filterSeverity !== "All") {
      filtered = filtered.filter(
        (record) => record.severity === filterSeverity
      );
    }

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
  };

  // Open add behavior dialog
  const handleOpenAddDialog = () => {
    setBehaviorForm({
      studentId: selectedStudent
        ? selectedStudent.id
        : students.length > 0
        ? students[0].id
        : "",
      date: dayjs(),
      type: "Positive",
      description: "",
      severity: "Low",
      actionTaken: "",
    });
    setOpenAddDialog(true);
  };

  // Close add behavior dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setBehaviorForm({
      ...behaviorForm,
      [name]: value,
    });
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setBehaviorForm({
      ...behaviorForm,
      date: newDate,
    });
  };

  // Submit add behavior form
  const handleAddBehavior = async () => {
    try {
      const newBehavior = {
        ...behaviorForm,
        date: behaviorForm.date.format("YYYY-MM-DD"),
      };

      await logBehavior(newBehavior);
      setOpenAddDialog(false);
      setSnackbar({
        open: true,
        message: "Behavior record added successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error adding behavior record: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open edit behavior dialog
  const handleOpenEditDialog = (record) => {
    setSelectedBehavior(record);
    setBehaviorForm({
      studentId: record.studentId,
      date: dayjs(record.date),
      type: record.type,
      description: record.description,
      severity: record.severity,
      actionTaken: record.actionTaken,
    });
    setOpenEditDialog(true);
  };

  // Close edit behavior dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Submit edit behavior form
  const handleEditBehavior = async () => {
    try {
      const updatedBehavior = {
        ...behaviorForm,
        date: behaviorForm.date.format("YYYY-MM-DD"),
      };

      await updateBehavior(selectedBehavior.id, updatedBehavior);

      setOpenEditDialog(false);
      setSnackbar({
        open: true,
        message: "Behavior record updated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating behavior record: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open delete behavior dialog
  const handleOpenDeleteDialog = (record) => {
    setSelectedBehavior(record);
    setOpenDeleteDialog(true);
  };

  // Close delete behavior dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Submit delete behavior
  const handleDeleteBehavior = async () => {
    try {
      await deleteBehavior(selectedBehavior.id);

      setOpenDeleteDialog(false);
      setSnackbar({
        open: true,
        message: "Behavior record deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting behavior record: ${error.message}`,
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

  // Get color for behavior type
  const getTypeColor = (type) => {
    return type === "Positive" ? "success" : "error";
  };

  // Get color for behavior severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Low":
        return "info";
      case "Medium":
        return "warning";
      case "High":
        return "error";
      default:
        return "default";
    }
  };

  // Get icon for behavior type
  const getTypeIcon = (type) => {
    return type === "Positive" ? <PositiveIcon /> : <NegativeIcon />;
  };

  // Get behavior chart data
  const getBehaviorChartData = () => {
    const stats = calculateBehaviorStats(selectedStudent?.id);

    return {
      labels: ["Positive", "Negative"],
      datasets: [
        {
          data: [stats.positive, stats.negative],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
      ],
    };
  };

  // Get behavior by severity chart data
  const getBehaviorBySeverityData = () => {
    let filtered = behavior;

    if (selectedStudent) {
      filtered = filtered.filter(
        (record) => record.studentId === selectedStudent.id
      );
    }

    const lowPositive = filtered.filter(
      (r) => r.type === "Positive" && r.severity === "Low"
    ).length;
    const mediumPositive = filtered.filter(
      (r) => r.type === "Positive" && r.severity === "Medium"
    ).length;
    const highPositive = filtered.filter(
      (r) => r.type === "Positive" && r.severity === "High"
    ).length;

    const lowNegative = filtered.filter(
      (r) => r.type === "Negative" && r.severity === "Low"
    ).length;
    const mediumNegative = filtered.filter(
      (r) => r.type === "Negative" && r.severity === "Medium"
    ).length;
    const highNegative = filtered.filter(
      (r) => r.type === "Negative" && r.severity === "High"
    ).length;

    return {
      labels: ["Low", "Medium", "High"],
      datasets: [
        {
          label: "Positive",
          data: [lowPositive, mediumPositive, highPositive],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Negative",
          data: [lowNegative, mediumNegative, highNegative],
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Get student behavior comparison data
  const getStudentBehaviorData = () => {
    return {
      labels: students.map(
        (student) => `${student.firstName} ${student.lastName.charAt(0)}.`
      ),
      datasets: [
        {
          label: "Positive",
          data: students.map((student) => {
            const studentRecords = behavior.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter((record) => record.type === "Positive")
              .length;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Negative",
          data: students.map((student) => {
            const studentRecords = behavior.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter((record) => record.type === "Negative")
              .length;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Group behavior records by month and day for calendar view
  const groupBehaviorByDate = () => {
    const filtered = getFilteredBehavior();
    const grouped = {};

    filtered.forEach((record) => {
      const date = record.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    return grouped;
  };

  // Get all months between earliest and latest behavior record
  const getMonthsRange = () => {
    const filtered = getFilteredBehavior();
    if (filtered.length === 0) return [];

    const dates = filtered.map((r) => dayjs(r.date).toDate());
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

  // Get behavior records for a specific day
  const getBehaviorForDay = (year, month, day) => {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return getFilteredBehavior().filter((r) => r.date === dateString);
  };

  if (loading) {
    return <Loading message="Loading behavior data..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Behavior Tracking
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="behavior tabs"
          >
            <Tab label="Behavior Log" />
            <Tab label="Behavior Analytics" />
          </Tabs>
        </Box>

        {/* Behavior Log Tab */}
        {tabValue === 0 && (
          <>
            {/* Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Student</InputLabel>
                    <Select
                      value={selectedStudent ? selectedStudent.id : ""}
                      onChange={(e) => {
                        const student = students.find(
                          (s) => s.id === e.target.value
                        );
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
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      onChange={handleFilterTypeChange}
                      label="Type"
                    >
                      <MenuItem value="All">All Types</MenuItem>
                      <MenuItem value="Positive">Positive</MenuItem>
                      <MenuItem value="Negative">Negative</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Severity</InputLabel>
                    <Select
                      value={filterSeverity}
                      onChange={handleFilterSeverityChange}
                      label="Severity"
                    >
                      <MenuItem value="All">All Severities</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                    size="small"
                  >
                    <ToggleButton value="list" aria-label="list view">
                      <ListView />
                    </ToggleButton>
                    <ToggleButton value="calendar" aria-label="calendar view">
                      <CalendarIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid item xs={12} sm={2}>
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
              </Grid>
            </Paper>

            {/* List View */}
            {viewMode === "list" && (
              <Card elevation={2}>
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {getFilteredBehavior().length > 0 ? (
                      getFilteredBehavior().map((record, index) => (
                        <React.Fragment key={record.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              bgcolor:
                                record.type === "Negative"
                                  ? "rgba(255, 0, 0, 0.05)"
                                  : "rgba(0, 255, 0, 0.05)",
                            }}
                          >
                            <ListItemIcon>
                              <Avatar
                                sx={{
                                  bgcolor: getTypeColor(record.type),
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                {getTypeIcon(record.type)}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    component="span"
                                  >
                                    {getStudentName(record.studentId)}
                                  </Typography>
                                  <Chip
                                    label={record.type}
                                    color={getTypeColor(record.type)}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                  <Chip
                                    label={record.severity}
                                    color={getSeverityColor(record.severity)}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                  >
                                    {formatDate(record.date)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body1"
                                    color="text.primary"
                                  >
                                    {record.description}
                                  </Typography>
                                  {record.actionTaken && (
                                    <>
                                      <br />
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Action Taken: {record.actionTaken}
                                      </Typography>
                                    </>
                                  )}
                                </React.Fragment>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleOpenEditDialog(record)}
                                size="small"
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleOpenDeleteDialog(record)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < getFilteredBehavior().length - 1 && (
                            <Divider component="li" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No behavior records found" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
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
                          const dayBehavior = getBehaviorForDay(
                            month.getFullYear(),
                            month.getMonth(),
                            day
                          );

                          if (dayBehavior.length === 0) return null;

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
                                sx={{ p: 2, height: "100%" }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {day}{" "}
                                  {month.toLocaleString("default", {
                                    month: "short",
                                  })}
                                </Typography>
                                <List dense>
                                  {dayBehavior.map((record) => (
                                    <ListItem
                                      key={record.id}
                                      disablePadding
                                      sx={{ mt: 1 }}
                                    >
                                      <ListItemIcon>
                                        <Avatar
                                          sx={{
                                            bgcolor: getTypeColor(record.type),
                                            width: 24,
                                            height: 24,
                                          }}
                                        >
                                          {getTypeIcon(record.type)}
                                        </Avatar>
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                            }}
                                          >
                                            <Typography variant="body2">
                                              {getStudentName(record.studentId)}
                                            </Typography>
                                            <Chip
                                              label={record.severity}
                                              color={getSeverityColor(
                                                record.severity
                                              )}
                                              size="small"
                                              sx={{ ml: 1 }}
                                            />
                                          </Box>
                                        }
                                        secondary={record.description}
                                        secondaryTypographyProps={{
                                          noWrap: true,
                                        }}
                                      />
                                      <ListItemSecondaryAction>
                                        <IconButton
                                          edge="end"
                                          aria-label="edit"
                                          onClick={() =>
                                            handleOpenEditDialog(record)
                                          }
                                          size="small"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                  ))}
                                </List>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                {getFilteredBehavior().length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography>No behavior records found</Typography>
                  </Paper>
                )}
              </Box>
            )}
          </>
        )}

        {/* Behavior Analytics Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Behavior Distribution
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box
                    sx={{
                      height: 300,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ width: "100%", maxWidth: 400 }}>
                      <Pie
                        data={getBehaviorChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                            title: {
                              display: true,
                              text: selectedStudent
                                ? `Behavior for ${getStudentName(
                                    selectedStudent.id
                                  )}`
                                : "Overall Behavior Distribution",
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Behavior by Severity
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={getBehaviorBySeverityData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                          },
                          title: {
                            display: true,
                            text: selectedStudent
                              ? `Behavior Severity for ${getStudentName(
                                  selectedStudent.id
                                )}`
                              : "Behavior by Severity",
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Student Behavior Comparison
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 400 }}>
                    <Bar
                      data={getStudentBehaviorData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                          },
                          title: {
                            display: true,
                            text: "Behavior by Student",
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              autoSkip: false,
                              maxRotation: 90,
                              minRotation: 45,
                            },
                          },
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Behavior Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell align="center">Positive</TableCell>
                          <TableCell align="center">Negative</TableCell>
                          <TableCell align="center">Ratio</TableCell>
                          <TableCell align="center">Low</TableCell>
                          <TableCell align="center">Medium</TableCell>
                          <TableCell align="center">High</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((student) => {
                          const studentRecords = behavior.filter(
                            (record) => record.studentId === student.id
                          );
                          const positive = studentRecords.filter(
                            (record) => record.type === "Positive"
                          ).length;
                          const negative = studentRecords.filter(
                            (record) => record.type === "Negative"
                          ).length;
                          const ratio =
                            positive + negative > 0
                              ? (
                                  (positive / (positive + negative)) *
                                  100
                                ).toFixed(0)
                              : "N/A";

                          const low = studentRecords.filter(
                            (record) => record.severity === "Low"
                          ).length;
                          const medium = studentRecords.filter(
                            (record) => record.severity === "Medium"
                          ).length;
                          const high = studentRecords.filter(
                            (record) => record.severity === "High"
                          ).length;

                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                {getStudentName(student.id)}
                              </TableCell>
                              <TableCell align="center">{positive}</TableCell>
                              <TableCell align="center">{negative}</TableCell>
                              <TableCell align="center">
                                {ratio !== "N/A" ? (
                                  <Chip
                                    label={`${ratio}%`}
                                    color={
                                      parseInt(ratio) > 50
                                        ? "success"
                                        : "warning"
                                    }
                                    size="small"
                                  />
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell align="center">{low}</TableCell>
                              <TableCell align="center">{medium}</TableCell>
                              <TableCell align="center">{high}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Add Behavior Dialog */}
        <Dialog
          open={openAddDialog}
          onClose={handleCloseAddDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Behavior Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={behaviorForm.studentId}
                    onChange={handleFormChange}
                    label="Student"
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={behaviorForm.date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={behaviorForm.type}
                    onChange={handleFormChange}
                    label="Type"
                  >
                    <MenuItem value="Positive">Positive</MenuItem>
                    <MenuItem value="Negative">Negative</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    name="severity"
                    value={behaviorForm.severity}
                    onChange={handleFormChange}
                    label="Severity"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={behaviorForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="actionTaken"
                  label="Action Taken (Optional)"
                  value={behaviorForm.actionTaken}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>Cancel</Button>
            <Button
              onClick={handleAddBehavior}
              variant="contained"
              color="primary"
              disabled={!behaviorForm.studentId || !behaviorForm.description}
            >
              Add Record
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Behavior Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Behavior Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={behaviorForm.studentId}
                    onChange={handleFormChange}
                    label="Student"
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={behaviorForm.date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={behaviorForm.type}
                    onChange={handleFormChange}
                    label="Type"
                  >
                    <MenuItem value="Positive">Positive</MenuItem>
                    <MenuItem value="Negative">Negative</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    name="severity"
                    value={behaviorForm.severity}
                    onChange={handleFormChange}
                    label="Severity"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={behaviorForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="actionTaken"
                  label="Action Taken (Optional)"
                  value={behaviorForm.actionTaken}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button
              onClick={handleEditBehavior}
              variant="contained"
              color="primary"
              disabled={!behaviorForm.studentId || !behaviorForm.description}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Behavior Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Behavior Record</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this behavior record? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleDeleteBehavior}
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
    </LocalizationProvider>
  );
};

export default Behavior;
