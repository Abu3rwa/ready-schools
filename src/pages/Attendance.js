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
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useAttendance } from "../contexts/AttendanceContext";
import Loading from "../components/common/Loading";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {theme } from "../theme";

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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
        console.log('Saving new attendance records:', {
          dateString,
          newRecordsCount: newRecords.length,
          sampleRecord: newRecords[0],
          allRecords: newRecords
        });
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
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
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
            <Card 
              elevation={2}
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                overflow: "hidden"
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  {formatDate(selectedDate)}
                </Typography>
                
                {/* Quick Actions */}
                <Box sx={{ 
                  mb: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 },
                  alignItems: { xs: 'stretch', sm: 'center' }
                }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="medium"
                    startIcon={<PresentIcon />}
                    onClick={() => {
                              attendanceRecords.forEach(record => {
                        handleStatusChange(record.studentId, "Present");
                              });
                            }}
                    sx={{ 
                      bgcolor: theme.palette.success.main,
                      "&:hover": { bgcolor: theme.palette.success.dark },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      py: { xs: 1, sm: 1.5 },
                      fontWeight: 600
                    }}
                  >
                    Mark All Present
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="medium"
                    startIcon={<AbsentIcon />}
                    onClick={() => {
                      attendanceRecords.forEach(record => {
                        handleStatusChange(record.studentId, "Absent");
                      });
                    }}
                    sx={{ 
                      borderColor: theme.palette.error.main,
                      color: theme.palette.error.main,
                      borderWidth: 2,
                      "&:hover": { 
                        borderColor: theme.palette.error.dark,
                        bgcolor: `${theme.palette.error.main}10`,
                        borderWidth: 2
                      },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      py: { xs: 1, sm: 1.5 },
                      fontWeight: 600
                    }}
                  >
                    Mark All Absent
                  </Button>
                </Box>

                <Divider sx={{ mb: { xs: 2, sm: 3 }, bgcolor: theme.palette.divider }} />

                {/* Student Cards Layout */}
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                      {attendanceRecords.map((record) => {
                    const studentName = getStudentName(record.studentId);
                        return (
                      <Grid item xs={12} sm={6} lg={4} key={record.id || `${record.studentId}-${record.date}`}>
                        <Card 
                          elevation={3}
                          sx={{
                            border: `3px solid ${
                              record.status === 'Present' 
                                ? theme.palette.success.main
                                : record.status === 'Absent'
                                ? theme.palette.error.main
                                : record.status === 'Tardy'
                                ? theme.palette.warning.main
                                : theme.palette.divider
                            }`,
                            borderRadius: 3,
                            bgcolor: record.status === 'Present' 
                              ? `${theme.palette.success.main}12` 
                              : record.status === 'Absent'
                              ? `${theme.palette.error.main}12`
                              : record.status === 'Tardy'
                              ? `${theme.palette.warning.main}12`
                              : theme.palette.background.paper,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[6]
                            }
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            {/* Student Name and Current Status */}
                            <Box sx={{ 
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 2
                            }}>
                              <Typography 
                                variant="h6"
                                sx={{ 
                                  fontSize: { xs: '1rem', sm: '1.1rem' },
                                  fontWeight: 700,
                                  color: theme.palette.text.primary,
                                  flex: 1,
                                  lineHeight: 1.2
                                }}
                              >
                                {studentName}
                              </Typography>
                                <Chip
                                  icon={getStatusIcon(record.status)}
                                  label={record.status}
                                  color={getStatusColor(record.status)}
                                size="medium"
                                sx={{ 
                                  ml: 1,
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                            
                            {/* Large, Touch-Friendly Status Buttons */}
                            <Box sx={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 1.5,
                              mb: 2
                            }}>
                              <Button
                                variant={record.status === 'Present' ? 'contained' : 'outlined'}
                                color="success"
                                size="large"
                                startIcon={<PresentIcon />}
                                onClick={() => handleStatusChange(record.studentId, 'Present')}
                                sx={{
                                  py: { xs: 1.5, sm: 2 },
                                  fontSize: { xs: '0.875rem', sm: '1rem' },
                                  fontWeight: 700,
                                  borderWidth: 2,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  minHeight: { xs: 48, sm: 56 },
                                  "&:hover": {
                                    borderWidth: 2,
                                    transform: 'scale(1.02)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Present
                              </Button>
                              <Button
                                variant={record.status === 'Absent' ? 'contained' : 'outlined'}
                                color="error"
                                size="large"
                                startIcon={<AbsentIcon />}
                                onClick={() => handleStatusChange(record.studentId, 'Absent')}
                                sx={{
                                  py: { xs: 1.5, sm: 2 },
                                  fontSize: { xs: '0.875rem', sm: '1rem' },
                                  fontWeight: 700,
                                  borderWidth: 2,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  minHeight: { xs: 48, sm: 56 },
                                  "&:hover": {
                                    borderWidth: 2,
                                    transform: 'scale(1.02)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Absent
                              </Button>
                              <Button
                                variant={record.status === 'Tardy' ? 'contained' : 'outlined'}
                                color="warning"
                                size="large"
                                startIcon={<TardyIcon />}
                                onClick={() => handleStatusChange(record.studentId, 'Tardy')}
                                sx={{
                                  py: { xs: 1.5, sm: 2 },
                                  fontSize: { xs: '0.875rem', sm: '1rem' },
                                  fontWeight: 700,
                                  borderWidth: 2,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  minHeight: { xs: 48, sm: 56 },
                                  "&:hover": {
                                    borderWidth: 2,
                                    transform: 'scale(1.02)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Tardy
                              </Button>
                              <Button
                                variant={record.status === 'Absent with Excuse' ? 'contained' : 'outlined'}
                                color="info"
                                size="large"
                                startIcon={<ExcusedIcon />}
                                onClick={() => handleStatusChange(record.studentId, 'Absent with Excuse')}
                                sx={{
                                  py: { xs: 1.5, sm: 2 },
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  fontWeight: 700,
                                  borderWidth: 2,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  minHeight: { xs: 48, sm: 56 },
                                  "&:hover": {
                                    borderWidth: 2,
                                    transform: 'scale(1.02)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Excused
                              </Button>
                              </Box>
                            
                            {/* Notes Field */}
                              <TextField
                                value={record.notes}
                              onChange={(e) => handleNotesChange(record.studentId, e.target.value)}
                                placeholder="Add notes here..."
                                size="small"
                                fullWidth
                              multiline
                              rows={2}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  "&:hover fieldset": {
                                    borderColor: theme.palette.primary.main,
                                    borderWidth: 2
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: theme.palette.primary.main,
                                    borderWidth: 2
                                  }
                                }
                              }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                        );
                      })}
                </Grid>
              </CardContent>
            </Card>
          </>
        )}

        {/* Attendance Reports Tab */}
        {tabValue === 1 && (
          <Box sx={{ px: { xs: 1, sm: 0 } }}>
            {/* Controls */}
            <Paper 
              elevation={2}
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: { xs: 2, sm: 3 },
                bgcolor: theme.palette.background.paper,
                borderLeft: `4px solid ${theme.palette.primary.main}`
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <ToggleButtonGroup
                    value={dateRange}
                    exclusive
                    onChange={handleDateRangeChange}
                    aria-label="date range"
                    size="small"
                    sx={{
                      width: "100%",
                      "& .MuiToggleButton-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        px: { xs: 1, sm: 2 },
                        "&.Mui-selected": {
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText
                        }
                      }
                    }}
                  >
                    <ToggleButton value="day">Today</ToggleButton>
                    <ToggleButton value="week">Week</ToggleButton>
                    <ToggleButton value="month">Month</ToggleButton>
                    <ToggleButton value="all">All Time</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                    size="small"
                    sx={{
                      width: "100%",
                      "& .MuiToggleButton-root": {
                        "&.Mui-selected": {
                          bgcolor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText
                        }
                      }
                    }}
                  >
                    <ToggleButton value="table"><TableIcon /></ToggleButton>
                    <ToggleButton value="chart"><ChartIcon /></ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
            </Paper>

            {/* Table View */}
            {viewMode === "table" && (
              <Card 
                elevation={2}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 2,
                  overflow: "hidden"
                }}
              >
                <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.25rem" },
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      mb: { xs: 1, sm: 2 }
                    }}
                  >
                    Attendance Summary
                  </Typography>
                  <Divider sx={{ mb: { xs: 1, sm: 2 }, bgcolor: theme.palette.primary.light }} />
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size={window.innerWidth < 600 ? "small" : "medium"}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: `${theme.palette.primary.main}08` }}>
                          <TableCell sx={{ 
                            fontWeight: 600, 
                            color: theme.palette.primary.main,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            minWidth: { xs: 120, sm: 150 }
                          }}>
                            Student
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              minWidth: { xs: 60, sm: 80 }
                            }}
                          >
                            Present
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              display: { xs: "none", sm: "table-cell" },
                              minWidth: 80
                            }}
                          >
                            Absent
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              display: { xs: "none", md: "table-cell" },
                              minWidth: 120
                            }}
                          >
                            Absent (Excused)
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              display: { xs: "none", md: "table-cell" },
                              minWidth: 80
                            }}
                          >
                            Tardy
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              display: { xs: "none", lg: "table-cell" },
                              minWidth: 120
                            }}
                          >
                            Tardy (Excused)
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              minWidth: { xs: 100, sm: 120 }
                            }}
                          >
                            Rate
                          </TableCell>
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
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} lg={6}>
                  <Card 
                    elevation={2}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      overflow: "hidden"
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{
                          fontSize: { xs: "1rem", sm: "1.25rem" },
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          mb: { xs: 1, sm: 2 }
                        }}
                      >
                        Overall Attendance
                      </Typography>
                      <Divider sx={{ mb: { xs: 1, sm: 2 }, bgcolor: theme.palette.primary.light }} />
                      <Box
                        sx={{
                          height: { xs: 250, sm: 300 },
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Box sx={{ width: "100%", maxWidth: { xs: 300, sm: 400 } }}>
                          <Pie
                            data={getAttendanceChartData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "bottom",
                                  labels: {
                                    fontSize: window.innerWidth < 600 ? 10 : 12,
                                    padding: window.innerWidth < 600 ? 10 : 20
                                  }
                                },
                                title: {
                                  display: true,
                                  text: "Attendance Distribution",
                                  font: {
                                    size: window.innerWidth < 600 ? 12 : 14
                                  }
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <Card 
                    elevation={2}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      overflow: "hidden"
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{
                          fontSize: { xs: "1rem", sm: "1.25rem" },
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          mb: { xs: 1, sm: 2 }
                        }}
                      >
                        Attendance Trend
                      </Typography>
                      <Divider sx={{ mb: { xs: 1, sm: 2 }, bgcolor: theme.palette.primary.light }} />
                      <Box sx={{ height: { xs: 250, sm: 300 } }}>
                        <Bar
                          data={getAttendanceTrendData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "top",
                                labels: {
                                  fontSize: window.innerWidth < 600 ? 9 : 11,
                                  padding: window.innerWidth < 600 ? 5 : 10
                                }
                              },
                              title: {
                                display: true,
                                text: "Attendance Trend (Last 14 Days)",
                                font: {
                                  size: window.innerWidth < 600 ? 11 : 13
                                }
                              },
                            },
                            scales: {
                              x: {
                                stacked: true,
                                ticks: {
                                  fontSize: window.innerWidth < 600 ? 8 : 10
                                }
                              },
                              y: {
                                stacked: true,
                                beginAtZero: true,
                                ticks: {
                                  fontSize: window.innerWidth < 600 ? 8 : 10
                                }
                              },
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card 
                    elevation={2}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      overflow: "hidden"
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{
                          fontSize: { xs: "1rem", sm: "1.25rem" },
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          mb: { xs: 1, sm: 2 }
                        }}
                      >
                        Student Attendance Comparison
                      </Typography>
                      <Divider sx={{ mb: { xs: 1, sm: 2 }, bgcolor: theme.palette.primary.light }} />
                      <Box sx={{ height: { xs: 300, sm: 400 } }}>
                        <Bar
                          data={getStudentAttendanceData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "top",
                                labels: {
                                  fontSize: window.innerWidth < 600 ? 9 : 11,
                                  padding: window.innerWidth < 600 ? 5 : 10
                                }
                              },
                              title: {
                                display: true,
                                text: "Attendance by Student",
                                font: {
                                  size: window.innerWidth < 600 ? 11 : 13
                                }
                              },
                            },
                            scales: {
                              x: {
                                ticks: {
                                  autoSkip: false,
                                  maxRotation: 90,
                                  minRotation: 45,
                                  fontSize: window.innerWidth < 600 ? 8 : 10
                                },
                              },
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  fontSize: window.innerWidth < 600 ? 8 : 10
                                }
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
          </Box>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ 
            vertical: "bottom", 
            horizontal: "center"
          }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity && typeof snackbar.severity === 'string' ? snackbar.severity : 'info'}
          >
            {snackbar.message || ''}
          </Alert>
        </Snackbar>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={openDeleteDialog} 
          onClose={handleCloseDeleteDialog}
          sx={{
            "& .MuiDialog-paper": {
              bgcolor: theme.palette.background.paper,
              mx: { xs: 2, sm: 0 },
              width: { xs: '90%', sm: 'auto' }
            }
          }}
        >
          <DialogTitle sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Delete Attendance Record
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Are you sure you want to delete this attendance record? This
              action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button 
              onClick={handleCloseDeleteDialog}
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAttendance}
              variant="contained"
              sx={{
                bgcolor: theme.palette.error.main,
                "&:hover": {
                  bgcolor: theme.palette.error.dark
                },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
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
