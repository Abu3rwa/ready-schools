import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  TextField,
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
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  BarChart as ChartIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useGrades } from "../contexts/GradeContext";
import { useAssignments } from "../contexts/AssignmentContext";
import Loading from "../components/common/Loading";
import VirtualizedGradeTable from "../components/grades/VirtualizedGradeTable";
import AdvancedFilterPanel from "../components/grades/AdvancedFilterPanel";
import {
  gradeCalculator,
  generateEnhancedGrade,
  validateGrade,
  calculateStandardDeviation,
} from "../utils/gradeCalculations";
import {
  dataManager,
  filterByMonth,
  filterByQuarter,
  filterBySemester,
} from "../utils/dataManagement";

// Chart.js components
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getSubjects as getManagedSubjects } from "../services/subjectsService";
import { getStandards, getStandardsMappings } from "../services/standardsService";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const GradeBook = () => {
  const { students, loading: studentsLoading } = useStudents();
  const {
    grades,
    loading: gradesLoading,
    addGrade,
    updateGrade,
    deleteGrade,
  } = useGrades();
  const { assignments, loading: assignmentsLoading } = useAssignments();

  // Subjects for tabs: prefer teacher-managed subjects; fallback to subjects from assignments
  const [managedSubjects, setManagedSubjects] = useState([]);
  const [standardsForSubject, setStandardsForSubject] = useState([]);
  const subjects = useMemo(() => {
    if (managedSubjects && managedSubjects.length > 0) {
      const values = managedSubjects.map((s) => {
        const code = s.code || s.name;
        if (assignments && assignments.some((a) => a.subject === code)) return code;
        if (assignments && assignments.some((a) => a.subject === s.name)) return s.name;
        return code;
      });
      return Array.from(new Set(values)).sort();
    }
    return Array.from(new Set((assignments || []).map((a) => a.subject))).sort();
  }, [managedSubjects, assignments]);

  // State for UI
  const [subject, setSubject] = useState(subjects[0] || "");
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newGradeForm, setNewGradeForm] = useState({
    studentId: "",
    assignmentId: "",
    score: "",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showCharts, setShowCharts] = useState(false);
  const [filters, setFilters] = useState({});
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table', 'grid', 'chart'
  const [sortBy, setSortBy] = useState("studentName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);

  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(subject)) {
      setSubject(subjects[0]);
    }
  }, [subjects, subject]);

  // Load teacher-managed subjects
  useEffect(() => {
    (async () => {
      try {
        const list = await getManagedSubjects();
        setManagedSubjects(list);
      } catch (e) {
        setManagedSubjects([]);
      }
    })();
  }, []);

  // Load standards when subject changes
  useEffect(() => {
    (async () => {
      try {
        const all = await getStandards({ subject });
        setStandardsForSubject(all || []);
      } catch (e) {
        setStandardsForSubject([]);
      }
    })();
  }, [subject]);

  // Loading state
  const loading = studentsLoading || gradesLoading || assignmentsLoading;

  // Enhanced data processing with filtering and sorting
  const processedData = useMemo(() => {
    if (!grades || !assignments || !students) {
      return { grades: [], assignments: [] };
    }

    // Filter grades by subject
    let filteredGrades = grades.filter((grade) => grade.subject === subject);

    // Apply advanced filters
    if (Object.keys(filters).length > 0) {
      filteredGrades = dataManager.filterData(filteredGrades, filters);
    }

    // Get assignments for the selected subject
    let filteredAssignments = assignments
      .filter((assignment) => assignment.subject === subject)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Apply assignment filters if specified
    if (filters.assignment) {
      filteredAssignments = filteredAssignments.filter(
        (assignment) => assignment.id === filters.assignment
      );
    }

    return {
      grades: filteredGrades,
      assignments: filteredAssignments,
    };
  }, [grades, assignments, students, subject, filters]);

  const { grades: currentGrades, assignments: subjectAssignments } =
    processedData;

  // Handle subject change
  const handleSubjectChange = (event, newSubject) => {
    setSubject(newSubject);
    setEditingCell(null);
  };

  // Start editing a cell
  const handleEditCell = (studentId, assignmentId, currentScore) => {
    setEditingCell({ studentId, assignmentId });
    setEditValue(currentScore !== undefined ? currentScore.toString() : "");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Get grade for a student and assignment
  const getGrade = useCallback(
    (studentId, assignmentId) => {
      return currentGrades.find(
        (g) => g.studentId === studentId && g.assignmentId === assignmentId
      );
    },
    [currentGrades]
  );

  // Enhanced grade save with validation and enhanced data
  const handleSaveGrade = useCallback(
    async (studentId, assignmentId, score) => {
      try {
        const assignment = assignments.find((a) => a.id === assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        // Validate grade data
        const gradeData = {
          studentId,
          assignmentId,
          score,
          points: assignment.points,
          dueDate: assignment.dueDate,
          submissionDate: new Date().toISOString(),
          subject,
          category: assignment.category,
        };

        const validation = validateGrade(gradeData);
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: validation.errors.join(", "),
            severity: "error",
          });
          return;
        }

        // Generate enhanced grade object
        const enhancedGrade = generateEnhancedGrade(gradeData);

        const existingGrade = getGrade(studentId, assignmentId);

        if (existingGrade) {
          await updateGrade(existingGrade.id, enhancedGrade);
        } else {
          await addGrade(enhancedGrade);
        }

        setSnackbar({
          open: true,
          message: "Grade saved successfully",
          severity: "success",
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error saving grade: ${error.message}`,
          severity: "error",
        });
      }
    },
    [assignments, subject, addGrade, updateGrade, getGrade]
  );

  // Enhanced grade delete for table
  const handleDeleteGradeFromTable = useCallback(
    async (studentId, assignmentId) => {
      try {
        const grade = getGrade(studentId, assignmentId);
        if (grade) {
          await deleteGrade(grade.id);
          setSnackbar({
            open: true,
            message: "Grade deleted successfully",
            severity: "success",
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error deleting grade: ${error.message}`,
          severity: "error",
        });
      }
    },
    [deleteGrade, getGrade]
  );

  // Open add grade dialog
  const handleOpenAddDialog = () => {
    setNewGradeForm({
      studentId: students.length > 0 ? students[0].id : "",
      assignmentId:
        subjectAssignments.length > 0 ? subjectAssignments[0].id : "",
      score: "",
    });
    setOpenAddDialog(true);
  };

  // Close add grade dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setNewGradeForm({
      ...newGradeForm,
      [name]: value,
    });
  };

  // Add new grade
  const handleAddGrade = async () => {
    const { studentId, assignmentId, score } = newGradeForm;
    const scoreNum = parseInt(score, 10);

    if (!studentId || !assignmentId || isNaN(scoreNum) || scoreNum < 0) {
      setSnackbar({
        open: true,
        message: "Please fill all fields with valid values",
        severity: "error",
      });
      return;
    }

    try {
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) throw new Error("Assignment not found");

      if (scoreNum > assignment.points) {
        setSnackbar({
          open: true,
          message: `Score cannot exceed maximum points (${assignment.points})`,
          severity: "error",
        });
        return;
      }

      // Check if grade already exists
      const existingGrade = currentGrades.find(
        (g) => g.studentId === studentId && g.assignmentId === assignmentId
      );

      if (existingGrade) {
        setSnackbar({
          open: true,
          message: "A grade already exists for this student and assignment",
          severity: "error",
        });
        return;
      }

      const newGrade = {
        studentId,
        assignmentId,
        subject,
        assignmentName: assignment.name,
        category: assignment.category,
        points: assignment.points,
        score: scoreNum,
        dateEntered: new Date().toISOString().split("T")[0],
      };

      await addGrade(newGrade);

      setSnackbar({
        open: true,
        message: "Grade added successfully",
        severity: "success",
      });
      setOpenAddDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error adding grade: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open delete grade dialog
  const handleOpenDeleteDialog = (studentId, assignmentId) => {
    setGradeToDelete({ studentId, assignmentId });
    setOpenDeleteDialog(true);
  };

  // Close delete grade dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setGradeToDelete(null);
  };

  // Delete grade from dialog
  const handleDeleteGradeFromDialog = async () => {
    if (!gradeToDelete) return;

    try {
      const { studentId, assignmentId } = gradeToDelete;
      const grade = getGrade(studentId, assignmentId);

      if (grade) {
        await deleteGrade(grade.id);
      }

      setSnackbar({
        open: true,
        message: "Grade deleted successfully",
        severity: "success",
      });
      setOpenDeleteDialog(false);
      setGradeToDelete(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting grade: ${error.message}`,
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

  // Filter management
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleToggleFilterPanel = useCallback(() => {
    setFilterPanelExpanded(!filterPanelExpanded);
  }, [filterPanelExpanded]);

  // Toggle charts view
  const handleToggleCharts = () => {
    setShowCharts(!showCharts);
  };

  // Export functionality
  const handleExportData = useCallback(
    (format = "csv") => {
      const exportData = dataManager.exportFilteredData(currentGrades, format);

      if (format === "csv") {
        const blob = new Blob([exportData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${subject}_grades_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
    [currentGrades, subject]
  );

  // Generate analytics
  const gradeAnalytics = useMemo(() => {
    if (!subject || !currentGrades || currentGrades.length === 0) {
      return null;
    }
    
    // Get all grades for the current subject
    const subjectGrades = currentGrades.filter(grade => 
      grade.subject === subject && 
      grade.score !== null && 
      grade.score !== undefined
    );
    
    if (subjectGrades.length === 0) {
      return null;
    }
    
    // Calculate percentages from scores and points
    const percentages = subjectGrades.map(grade => {
      if (grade.points && grade.points > 0) {
        return (grade.score / grade.points) * 100;
      }
      return 0;
    }).filter(percent => percent > 0);
    
    if (percentages.length === 0) {
      return null;
    }
    
    const average = percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const standardDeviation = calculateStandardDeviation(percentages);
    
    // Ensure all values are valid numbers before returning
    if (!isFinite(average) || !isFinite(highest) || !isFinite(lowest) || !isFinite(standardDeviation)) {
      return null;
    }
    
    return {
      average: Math.round(average * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100
    };
  }, [subject, currentGrades]);

  // Get student name by ID
  const getStudentName = useCallback(
    (studentId) => {
      const student = students.find((s) => s.id === studentId);
      return student ? `${student.firstName} ${student.lastName}` : "Unknown";
    },
    [students]
  );

  // Get assignment name by ID
  const getAssignmentName = useCallback(
    (assignmentId) => {
      const assignment = assignments.find((a) => a.id === assignmentId);
      return assignment ? assignment.name : "Unknown";
    },
    [assignments]
  );

  // Calculate class average for an assignment
  const calculateAssignmentAverage = (assignmentId) => {
    const assignmentGrades = currentGrades.filter(
      (g) => g.assignmentId === assignmentId
    );
    if (assignmentGrades.length === 0) return "N/A";

    const total = assignmentGrades.reduce((sum, grade) => sum + grade.score, 0);
    const average = total / assignmentGrades.length;
    return average.toFixed(1);
  };

  // Calculate student average for the current subject
  const calculateStudentSubjectAverage = (studentId) => {
    const studentGrades = currentGrades.filter(
      (g) => g.studentId === studentId
    );
    if (studentGrades.length === 0) return "N/A";

    const totalPoints = studentGrades.reduce(
      (sum, grade) => sum + grade.points,
      0
    );
    const earnedPoints = studentGrades.reduce(
      (sum, grade) => sum + grade.score,
      0
    );
    const average = (earnedPoints / totalPoints) * 100;
    return average.toFixed(1);
  };

  // Get letter grade based on percentage
  const getLetterGrade = (percentage) => {
    if (percentage === "N/A") return "N/A";
    const percent = parseFloat(percentage);
    if (percent >= 90) return "A";
    if (percent >= 80) return "B";
    if (percent >= 70) return "C";
    if (percent >= 60) return "D";
    return "F";
  };

  // Prepare chart data for grade distribution
  const gradeDistributionData = {
    labels: [
      "A (90-100%)",
      "B (80-89%)",
      "C (70-79%)",
      "D (60-69%)",
      "F (Below 60%)",
    ],
    datasets: [
      {
        label: "Number of Students",
        data: [
          students.filter((s) => {
            const avg = calculateStudentSubjectAverage(s.id);
            return avg !== "N/A" && parseFloat(avg) >= 90;
          }).length,
          students.filter((s) => {
            const avg = calculateStudentSubjectAverage(s.id);
            return (
              avg !== "N/A" && parseFloat(avg) >= 80 && parseFloat(avg) < 90
            );
          }).length,
          students.filter((s) => {
            const avg = calculateStudentSubjectAverage(s.id);
            return (
              avg !== "N/A" && parseFloat(avg) >= 70 && parseFloat(avg) < 80
            );
          }).length,
          students.filter((s) => {
            const avg = calculateStudentSubjectAverage(s.id);
            return (
              avg !== "N/A" && parseFloat(avg) >= 60 && parseFloat(avg) < 70
            );
          }).length,
          students.filter((s) => {
            const avg = calculateStudentSubjectAverage(s.id);
            return avg !== "N/A" && parseFloat(avg) < 60;
          }).length,
        ],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for assignment averages
  const assignmentAveragesData = {
    labels: subjectAssignments.map((a) => a.name),
    datasets: [
      {
        label: "Class Average (%)",
        data: subjectAssignments.map((a) => {
          const avg = calculateAssignmentAverage(a.id);
          return avg === "N/A" ? 0 : (parseFloat(avg) / a.points) * 100;
        }),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Maximum Points",
        data: subjectAssignments.map((a) => 100),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        type: "line",
      },
    ],
  };

  if (loading) {
    return <Loading message="Loading grade book data..." />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Grade Book
      </Typography>

      {/* Subject Tabs */}
      {subjects.length > 0 ? (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={subject}
            onChange={handleSubjectChange}
            aria-label="subject tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {subjects.map((s) => (
              <Tab label={s} value={s} key={s} />
            ))}
          </Tabs>
        </Box>
      ) : (
        !loading && (
          <Typography sx={{ mb: 3, ml: 1 }}>
            No subjects found. Please create an assignment with a subject first.
          </Typography>
        )
      )}

      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        data={currentGrades}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        expanded={filterPanelExpanded}
        onToggleExpanded={handleToggleFilterPanel}
      />



      {/* Enhanced Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          mt: 2,
          px: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            disabled={students.length === 0 || subjectAssignments.length === 0}
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: "medium",
              boxShadow: 2,
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            Add Grade
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={showCharts ? <FilterIcon /> : <ChartIcon />}
            onClick={handleToggleCharts}
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: "medium",
            }}
          >
            {showCharts ? "Show Table" : "Show Charts"}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportData("csv")}
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: "medium",
            }}
          >
            Export
          </Button>
        </Box>

        {/* Quick Stats incl. Standards count */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Chip
            label={`${currentGrades.length} Grades`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${students.length} Students`}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label={`${subjectAssignments.length} Assignments`}
            color="info"
            variant="outlined"
          />
          <Chip
            label={`${standardsForSubject.length} Standards`}
            color="default"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Enhanced Charts View with Analytics */}
      {showCharts && (
        <Grid container spacing={3}>
          {/* Enhanced Analytics Cards */}
          <Grid item xs={12}>
            {gradeAnalytics ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {gradeAnalytics.average.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Class Average
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color="success.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      {gradeAnalytics.highest.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Highest Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color="error.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      {gradeAnalytics.lowest.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Lowest Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color="info.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      {gradeAnalytics.standardDeviation.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Std Deviation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            ) : (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        No grade data available for selected subject
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Select a subject with grades to view analytics
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Grade Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={gradeDistributionData}
                    redraw
                    datasetIdKey="label"
                    key={`dist-${subject}-${students.length}-${currentGrades.length}`}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        title: {
                          display: true,
                          text: `${subject} Grade Distribution`,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assignment Averages
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={assignmentAveragesData}
                    redraw
                    datasetIdKey="label"
                    key={`assign-${subject}-${subjectAssignments.length}`}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        title: {
                          display: true,
                          text: `${subject} Assignment Averages`,
                        },
                      },
                      scales: {
                        y: {
                          min: 0,
                          max: 100,
                          title: {
                            display: true,
                            text: "Percentage (%)",
                          },
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
                  Student Averages
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell align="center">Average</TableCell>
                        <TableCell align="center">Letter Grade</TableCell>
                        <TableCell align="center">Performance Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => {
                        const average = calculateStudentSubjectAverage(
                          student.id
                        );
                        const letterGrade = getLetterGrade(average);
                        const performanceLevel =
                          gradeCalculator.getPerformanceLevel(average);
                        
                        // Fix letter grade color assignment
                        let letterGradeColor = "default";
                        if (letterGrade === "A") letterGradeColor = "success";
                        else if (letterGrade === "B") letterGradeColor = "info";
                        else if (letterGrade === "C") letterGradeColor = "warning";
                        else if (letterGrade === "D") letterGradeColor = "warning";
                        else if (letterGrade === "F") letterGradeColor = "error";

                        // Fix performance level color assignment
                        let performanceColor = "default";
                        if (performanceLevel === "Excellent" || performanceLevel === "Outstanding") {
                          performanceColor = "success";
                        } else if (performanceLevel === "Good" || performanceLevel === "Satisfactory") {
                          performanceColor = "info";
                        } else if (performanceLevel === "Average" || performanceLevel === "Fair") {
                          performanceColor = "warning";
                        } else if (performanceLevel === "Needs Improvement" || performanceLevel === "Poor") {
                          performanceColor = "error";
                        }

                        return (
                          <TableRow key={student.id}>
                            <TableCell>{getStudentName(student.id)}</TableCell>
                            <TableCell align="center">
                              {average === "N/A" ? "N/A" : `${average}%`}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={letterGrade}
                                color={letterGradeColor}
                                size="small"
                                variant={
                                  letterGrade === "N/A" ? "outlined" : "filled"
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={performanceLevel}
                                size="small"
                                variant="outlined"
                                color={performanceColor}
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
          </Grid>
        </Grid>
      )}

      {/* Enhanced Table View with Virtualization */}
      {!showCharts && (
        <Paper
          elevation={2}
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            color: 'text.primary',
            minHeight: 420,
            p: 1.5,
          }}
        >
          {currentGrades.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.primary' }}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                No grades found for {subject}
              </Typography>
              <Typography variant="body2" color="text.primary">
                {subjectAssignments.length === 0 
                  ? 'No assignments available for this subject. Please create assignments first.'
                  : 'No grades have been entered yet. Use the "Add Grade" button to start entering grades.'
                }
              </Typography>
            </Box>
          ) : (
            <Box sx={{ color: 'text.primary' }}>
          <VirtualizedGradeTable
            students={students}
            assignments={subjectAssignments}
            grades={currentGrades}
            onGradeSave={handleSaveGrade}
            onGradeDelete={handleDeleteGradeFromTable}
            loading={loading}
            subject={subject}
            filters={filters}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
            </Box>
          )}
        </Paper>
      )}

      {/* Add Grade Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            backgroundColor: "primary.light",
            color: "primary.contrastText",
            fontWeight: "bold",
            fontSize: "1.25rem",
          }}
        >
          Add New Grade
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "medium", color: "text.secondary" }}
              >
                Student Information
              </Typography>
              {students.length > 0 ? (
                <FormControl fullWidth size="medium">
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={newGradeForm.studentId}
                    onChange={handleFormChange}
                    label="Student"
                    sx={{ mb: 1 }}
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {getStudentName(student.id)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Typography sx={{ mt: 1, color: "text.secondary" }}>
                  No students found. Please add students in the Students page.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "medium", color: "text.secondary" }}
              >
                Assignment Details
              </Typography>
              {subjectAssignments.length > 0 ? (
                <FormControl fullWidth size="medium">
                  <InputLabel>Assignment</InputLabel>
                  <Select
                    name="assignmentId"
                    value={newGradeForm.assignmentId}
                    onChange={handleFormChange}
                    label="Assignment"
                    sx={{ mb: 1 }}
                  >
                    {subjectAssignments.map((assignment) => (
                      <MenuItem key={assignment.id} value={assignment.id}>
                        {assignment.name} ({assignment.points} pts)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Typography sx={{ mt: 1, color: "text.secondary" }}>
                  No assignments available for {subject}. Please create one in
                  the Assignments page.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "medium", color: "text.secondary" }}
              >
                Grade Information
              </Typography>
              <TextField
                name="score"
                label="Score"
                type="number"
                value={newGradeForm.score}
                onChange={handleFormChange}
                fullWidth
                required
                size="medium"
                InputProps={{
                  sx: { borderRadius: 1 },
                }}
                inputProps={{
                  min: 0,
                  max: newGradeForm.assignmentId
                    ? assignments.find(
                        (a) => a.id === newGradeForm.assignmentId
                      )?.points
                    : 100,
                }}
                helperText={
                  newGradeForm.assignmentId
                    ? `Maximum: ${
                        assignments.find(
                          (a) => a.id === newGradeForm.assignmentId
                        )?.points
                      } points`
                    : "Select an assignment first"
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }}
        >
          <Button
            onClick={handleCloseAddDialog}
            variant="outlined"
            sx={{ borderRadius: 1, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddGrade}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 1, px: 3, ml: 2 }}
            disabled={
              !newGradeForm.studentId ||
              !newGradeForm.assignmentId ||
              !newGradeForm.score ||
              students.length === 0 ||
              subjectAssignments.length === 0
            }
          >
            Add Grade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Grade Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            backgroundColor: "error.light",
            color: "error.contrastText",
            fontWeight: "bold",
            fontSize: "1.25rem",
          }}
        >
          Delete Grade
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <Typography sx={{ fontSize: "1rem", mt: 1 }}>
            Are you sure you want to delete this grade for{" "}
            <strong>
              {gradeToDelete ? getStudentName(gradeToDelete.studentId) : ""}
            </strong>{" "}
            on{" "}
            <strong>
              {gradeToDelete
                ? getAssignmentName(gradeToDelete.assignmentId)
                : ""}
            </strong>
            ?
          </Typography>
          <Typography
            sx={{ fontSize: "0.875rem", mt: 2, color: "text.secondary" }}
          >
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }}
        >
          <Button
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{ borderRadius: 1, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteGradeFromDialog}
            variant="contained"
            color="error"
            sx={{ borderRadius: 1, px: 3, ml: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ mb: 2, mr: 2 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: "100%",
            borderRadius: 1.5,
            "& .MuiAlert-icon": {
              fontSize: "1.25rem",
            },
            "& .MuiAlert-message": {
              fontSize: "0.95rem",
              fontWeight: "medium",
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GradeBook;
