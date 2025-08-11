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
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Save as SaveIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Today as TodayIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as TardyIcon,
  Delete as DeleteIcon,
  EventBusy as ExcusedIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useAttendance } from "../contexts/AttendanceContext";
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

const Attendance = () => {
  const { students, loading: studentsLoading } = useStudents();
  const {
    attendance,
    loading: attendanceLoading,
    recordAttendance,
    recordBulkAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceByDate,
    calculateAttendanceStats,
  } = useAttendance();

  // State for UI
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "chart"
  const [dateRange, setDateRange] = useState("week"); // "day", "week", "month", "all"
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Menu handlers
  const handleMenuClick = (event, studentId) => {
    setSelectedStudentId(studentId);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedStudentId(null);
  };

  const handleStatusMenuSelect = (newStatus) => {
    if (selectedStudentId) {
      handleStatusChange(selectedStudentId, newStatus);
    }
    handleMenuClose();
  };

  // Loading state
  const loading = studentsLoading || attendanceLoading;

  // Initialize attendance records for the selected date
  useEffect(() => {
    if (!loading) {
      const dateString = selectedDate.format("YYYY-MM-DD");
      const existingRecords = getAttendanceByDate(dateString);

      // Create a record for each student
      const records = students.map((student) => {
        const existingRecord = existingRecords.find(
          (record) => record.studentId === student.id
        );

        if (existingRecord) {
          return existingRecord;
        } else {
          return {
            studentId: student.id,
            date: dateString,
            status: "Present", // Default status
            notes: "",
            timeEntered: dayjs().format("HH:mm:ss"),
          };
        }
      });

      setAttendanceRecords(records);
    }
  }, [loading, students, selectedDate, getAttendanceByDate]);

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(dayjs(newDate));
  };

  // Handle status change for a student
  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.studentId === studentId
          ? { ...record, status: newStatus }
          : record
      )
    );
  };

  // Handle notes change for a student
  const handleNotesChange = (studentId, newNotes) => {
    setAttendanceRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.studentId === studentId ? { ...record, notes: newNotes } : record
      )
    );
  };

  // Save attendance records
  const handleSaveAttendance = async () => {
    try {
      const dateString = selectedDate.format("YYYY-MM-DD");
      const existingRecords = getAttendanceByDate(dateString);

      // Determine which records are new and which are updates
      const newRecords = [];
      const updatedRecords = [];

      attendanceRecords.forEach((record) => {
        const existingRecord = existingRecords.find(
          (r) => r.studentId === record.studentId
        );

        if (existingRecord) {
          if (
            existingRecord.status !== record.status ||
            existingRecord.notes !== record.notes
          ) {
            updatedRecords.push(record);
          }
        } else {
          newRecords.push(record);
        }
      });

      // Save new records
      if (newRecords.length > 0) {
        await recordBulkAttendance(dateString, newRecords);
      }

      // Update existing records
      for (const record of updatedRecords) {
        await updateAttendance(record.id, {
          status: record.status,
          notes: record.notes,
        });
      }

      setSnackbar({
        open: true,
        message: "Attendance saved successfully",
        severity: "success",
      });
      setEditMode(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error saving attendance: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Toggle view mode
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setDateRange(newValue);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (record) => {
    setSelectedRecord(record);
    setOpenDeleteDialog(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Handle delete
  const handleDeleteAttendance = async () => {
    try {
      await deleteAttendance(selectedRecord.id);
      setSnackbar({
        open: true,
        message: "Attendance record deleted successfully",
        severity: "success",
      });
      setOpenDeleteDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting attendance: ${error.message}`,
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
  const formatDate = (date) => {
    return dayjs(date).format("dddd, MMMM D, YYYY");
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  // Get color for attendance status
  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "success";
      case "Absent":
        return "error";
      case "Absent with Excuse":
        return "warning";
      case "Tardy":
        return "warning";
      case "Tardy with Excuse":
        return "info";
      default:
        return "default";
    }
  };

  // Get icon for attendance status
  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <PresentIcon />;
      case "Absent":
        return <AbsentIcon />;
      case "Absent with Excuse":
        return <ExcusedIcon />;
      case "Tardy":
        return <TardyIcon />;
      case "Tardy with Excuse":
        return <ExcusedIcon />;
      default:
        return null;
    }
  };

  // Get attendance trend data
  const getAttendanceTrendData = () => {
    // Get dates for the last 14 days
    const dates = [];
    const today = dayjs().startOf('day');

    for (let i = 13; i >= 0; i--) {
      dates.push(today.subtract(i, 'day').format('YYYY-MM-DD'));
    }

    // Count attendance for each date
    const presentCounts = [];
    const absentCounts = [];
    const absentExcusedCounts = [];
    const tardyCounts = [];
    const tardyExcusedCounts = [];

    dates.forEach((date) => {
      const dayRecords = attendance.filter((record) => record.date === date);
      const presentCount = dayRecords.filter(
        (record) => record.status === "Present"
      ).length;
      const absentCount = dayRecords.filter(
        (record) => record.status === "Absent"
      ).length;
      const absentExcusedCount = dayRecords.filter(
        (record) => record.status === "Absent with Excuse"
      ).length;
      const tardyCount = dayRecords.filter(
        (record) => record.status === "Tardy"
      ).length;
      const tardyExcusedCount = dayRecords.filter(
        (record) => record.status === "Tardy with Excuse"
      ).length;

      presentCounts.push(presentCount);
      absentCounts.push(absentCount);
      absentExcusedCounts.push(absentExcusedCount);
      tardyCounts.push(tardyCount);
      tardyExcusedCounts.push(tardyExcusedCount);
    });

    return {
      labels: dates.map((date) =>
        dayjs(date).format('MMM D')
      ),
      datasets: [
        {
          label: "Present",
          data: presentCounts,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          tension: 0.1,
        },
        {
          label: "Absent",
          data: absentCounts,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          tension: 0.1,
        },
        {
          label: "Absent (Excused)",
          data: absentExcusedCounts,
          backgroundColor: "rgba(255, 159, 64, 0.6)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1,
          tension: 0.1,
        },
        {
          label: "Tardy",
          data: tardyCounts,
          backgroundColor: "rgba(255, 206, 86, 0.6)",
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 1,
          tension: 0.1,
        },
        {
          label: "Tardy (Excused)",
          data: tardyExcusedCounts,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          tension: 0.1,
        },
      ],
    };
  };

  // Filter attendance records based on date range
  const getFilteredAttendance = () => {
    const today = dayjs().startOf('day');
    let startDate = today.clone();

    switch (dateRange) {
      case "day":
        // Just today
        break;
      case "week":
        // Last 7 days
        startDate = today.subtract(7, 'day');
        break;
      case "month":
        // Last 30 days
        startDate = today.subtract(30, 'day');
        break;
      case "all":
        // All records
        return attendance;
      default:
        break;
    }

    return attendance.filter((record) => {
      const recordDate = dayjs(record.date).startOf('day');
      return recordDate.isAfter(startDate) || recordDate.isSame(startDate);
    });
  };

  // Get attendance data for charts
  const getAttendanceChartData = () => {
    const stats = calculateAttendanceStats();

    return {
      labels: ["Present", "Absent", "Absent with Excuse", "Tardy", "Tardy with Excuse"],
      datasets: [
        {
          data: [
            stats.present,
            stats.absent,
            stats.absentExcused,
            stats.tardy,
            stats.tardyExcused
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",  // Present - Green
            "rgba(255, 99, 132, 0.6)",  // Absent - Red
            "rgba(255, 159, 64, 0.6)",  // Absent with Excuse - Orange
            "rgba(255, 206, 86, 0.6)",  // Tardy - Yellow
            "rgba(54, 162, 235, 0.6)",  // Tardy with Excuse - Blue
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(54, 162, 235, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Get student attendance data for bar chart
  const getStudentAttendanceData = () => {
    return {
      labels: students.map(
        (student) => `${student.firstName} ${student.lastName.charAt(0)}.`
      ),
      datasets: [
        {
          label: "Present",
          data: students.map((student) => {
            const studentRecords = attendance.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter(
              (record) => record.status === "Present"
            ).length;
          }),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Absent",
          data: students.map((student) => {
            const studentRecords = attendance.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter(
              (record) => record.status === "Absent"
            ).length;
          }),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: "Absent (Excused)",
          data: students.map((student) => {
            const studentRecords = attendance.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter(
              (record) => record.status === "Absent with Excuse"
            ).length;
          }),
          backgroundColor: "rgba(255, 159, 64, 0.6)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1,
        },
        {
          label: "Tardy",
          data: students.map((student) => {
            const studentRecords = attendance.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter(
              (record) => record.status === "Tardy"
            ).length;
          }),
          backgroundColor: "rgba(255, 206, 86, 0.6)",
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 1,
        },
        {
          label: "Tardy (Excused)",
          data: students.map((student) => {
            const studentRecords = attendance.filter(
              (record) => record.studentId === student.id
            );
            return studentRecords.filter(
              (record) => record.status === "Tardy with Excuse"
            ).length;
          }),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return <Loading message="Loading attendance data..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Tracking
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="attendance tabs"
          >
            <Tab label="Daily Attendance" />
            <Tab label="Attendance Reports" />
          </Tabs>
        </Box>

        {/* Daily Attendance Tab */}
        {tabValue === 0 && (
          <>
            {/* Date Selector and Controls */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 200 },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<TodayIcon />}
                  onClick={() => setSelectedDate(dayjs())}
                  sx={{ ml: 2 }}
                >
                  Today
                </Button>
              </Box>
              <Button
                variant="contained"
                color={editMode ? "success" : "primary"}
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                onClick={editMode ? handleSaveAttendance : handleToggleEditMode}
              >
                {editMode ? "Save Attendance" : "Edit Attendance"}
              </Button>
            </Paper>

            {/* Attendance Table */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {formatDate(selectedDate)}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            indeterminate={
                              attendanceRecords.some(record => record.status === "Present") &&
                              !attendanceRecords.every(record => record.status === "Present")
                            }
                            checked={attendanceRecords.every(record => record.status === "Present")}
                            onChange={(event) => {
                              const newStatus = event.target.checked ? "Present" : "Absent";
                              attendanceRecords.forEach(record => {
                                handleStatusChange(record.studentId, newStatus);
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceRecords.map((record) => {
                        return (
                          <TableRow key={record.id || `${record.studentId}-${record.date}`}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={record.status === "Present"}
                                onChange={(event) => {
                                  handleStatusChange(
                                    record.studentId,
                                    event.target.checked ? "Present" : "Absent"
                                  );
                                }}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>{getStudentName(record.studentId)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  icon={getStatusIcon(record.status)}
                                  label={record.status}
                                  color={getStatusColor(record.status)}
                                  size="small"
                                />
                                <IconButton 
                                  size="small"
                                  onClick={(e) => handleMenuClick(e, record.studentId)}
                                  sx={{ ml: 1 }}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={record.notes}
                                onChange={(e) =>
                                  handleNotesChange(
                                    record.studentId,
                                    e.target.value
                                  )
                                }
                                placeholder="Add notes here..."
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(record)}
                                disabled={!record.id}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* Add the Menu outside of the map function */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleStatusMenuSelect("Present")}>
            <ListItemIcon><PresentIcon /></ListItemIcon>
            <ListItemText>Present</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusMenuSelect("Absent")}>
            <ListItemIcon><AbsentIcon /></ListItemIcon>
            <ListItemText>Absent</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusMenuSelect("Absent with Excuse")}>
            <ListItemIcon><ExcusedIcon /></ListItemIcon>
            <ListItemText>Absent (Excused)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusMenuSelect("Tardy")}>
            <ListItemIcon><TardyIcon /></ListItemIcon>
            <ListItemText>Tardy</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusMenuSelect("Tardy with Excuse")}>
            <ListItemIcon><ExcusedIcon /></ListItemIcon>
            <ListItemText>Tardy (Excused)</ListItemText>
          </MenuItem>
        </Menu>

        {/* Attendance Reports Tab */}
        {tabValue === 1 && (
          <>
            {/* Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <ToggleButtonGroup
                    value={dateRange}
                    exclusive
                    onChange={handleDateRangeChange}
                    aria-label="date range"
                    size="small"
                  >
                    <ToggleButton value="day" aria-label="today">
                      Today
                    </ToggleButton>
                    <ToggleButton value="week" aria-label="week">
                      Week
                    </ToggleButton>
                    <ToggleButton value="month" aria-label="month">
                      Month
                    </ToggleButton>
                    <ToggleButton value="all" aria-label="all time">
                      All Time
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid item>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                    size="small"
                  >
                    <ToggleButton value="table" aria-label="table view">
                      <TableIcon />
                    </ToggleButton>
                    <ToggleButton value="chart" aria-label="chart view">
                      <ChartIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
            </Paper>

            {/* Table View */}
            {viewMode === "table" && (
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell align="center">Present</TableCell>
                          <TableCell align="center">Absent</TableCell>
                          <TableCell align="center">Absent (Excused)</TableCell>
                          <TableCell align="center">Tardy</TableCell>
                          <TableCell align="center">Tardy (Excused)</TableCell>
                          <TableCell align="center">Attendance Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((student) => {
                          const studentRecords = getFilteredAttendance().filter(
                            (record) => record.studentId === student.id
                          );
                          const present = studentRecords.filter(
                            (record) => record.status === "Present"
                          ).length;
                          const absent = studentRecords.filter(
                            (record) => record.status === "Absent"
                          ).length;
                          const absentExcused = studentRecords.filter(
                            (record) => record.status === "Absent with Excuse"
                          ).length;
                          const tardy = studentRecords.filter(
                            (record) => record.status === "Tardy"
                          ).length;
                          const tardyExcused = studentRecords.filter(
                            (record) => record.status === "Tardy with Excuse"
                          ).length;
                          const total = studentRecords.length;
                          const attendanceRate =
                            total > 0 ? Math.round(((present + tardyExcused + tardy) / total) * 100) : 0;

                          let rateColor = "success";
                          if (attendanceRate < 90) rateColor = "warning";
                          if (attendanceRate < 80) rateColor = "error";

                          return (
                            <TableRow key={student.id}>
                              <TableCell>{getStudentName(student.id)}</TableCell>
                              <TableCell align="center">{present}</TableCell>
                              <TableCell align="center">{absent}</TableCell>
                              <TableCell align="center">{absentExcused}</TableCell>
                              <TableCell align="center">{tardy}</TableCell>
                              <TableCell align="center">{tardyExcused}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${attendanceRate}%`}
                                  color={rateColor}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* Chart View */}
            {viewMode === "chart" && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Overall Attendance
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
                            data={getAttendanceChartData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "bottom",
                                },
                                title: {
                                  display: true,
                                  text: "Attendance Distribution",
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
                        Attendance Trend
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: 300 }}>
                        <Bar
                          data={getAttendanceTrendData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "top",
                              },
                              title: {
                                display: true,
                                text: "Attendance Trend (Last 14 Days)",
                              },
                            },
                            scales: {
                              x: {
                                stacked: true,
                              },
                              y: {
                                stacked: true,
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
                        Student Attendance Comparison
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ height: 400 }}>
                        <Bar
                          data={getStudentAttendanceData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "top",
                              },
                              title: {
                                display: true,
                                text: "Attendance by Student",
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
              </Grid>
            )}
          </>
        )}

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

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Attendance Record</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this attendance record? This
              action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleDeleteAttendance}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Attendance;
