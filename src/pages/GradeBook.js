import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
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
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Link,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Grade as GradeIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useGrades } from "../contexts/GradeContext";
import { useAssignments } from "../contexts/AssignmentContext";
import { useGradeBooks } from "../contexts/GradeBookContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Loading from "../components/common/Loading";
import SimpleGradeBookSelector from "../components/gradebooks/SimpleGradeBookSelector";
import CategoryAveragesDisplay from "../components/gradebooks/CategoryAveragesDisplay";
import GradingInstructions from "../components/gradebooks/GradingInstructions";

const GradeBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { students, loading: studentsLoading } = useStudents();
  const {
    grades,
    loading: gradesLoading,
    addGrade,
    updateGrade,
    deleteGrade,
  } = useGrades();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const {
    currentGradeBook,
    loading: gradeBookLoading,
    loadGradeBook,
    deleteGradeBook,
    archiveGradeBook,
  } = useGradeBooks();
  // Delete/Archive Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Delete Gradebook Handler
  const handleDeleteGradeBook = async () => {
    if (!currentGradeBook) return;
    try {
      await deleteGradeBook(currentGradeBook.id);
      setSnackbar({
        open: true,
        message: "Gradebook deleted.",
        severity: "success",
      });
      setDeleteDialogOpen(false);
      navigate("/gradebooks");
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting gradebook: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Archive Gradebook Handler
  const handleArchiveGradeBook = async () => {
    if (!currentGradeBook) return;
    try {
      await archiveGradeBook(currentGradeBook.id);

      setSnackbar({
        open: true,
        message: "Gradebook archived.",
        severity: "info",
      });
      setArchiveDialogOpen(false);
      navigate("/gradebooks");
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error archiving gradebook: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Get URL parameters for assignment linking
  const urlParams = new URLSearchParams(location.search);
  const linkedAssignmentId = urlParams.get("assignment");
  const linkedSubject = urlParams.get("subject");

  // State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [highlightedAssignment, setHighlightedAssignment] =
    useState(linkedAssignmentId);
  const [viewMode, setViewMode] = useState("summary"); // 'summary' or 'detailed'

  // Load gradebook when component mounts
  useEffect(() => {
    if (id) {
      loadGradeBook(id)
        .then((gradeBook) => {})
        .catch((error) => {
          console.error("Error loading grade book:", error);
          if (error.message.includes("offline")) {
            setSnackbar({
              open: true,
              message:
                "You're currently offline. Please check your internet connection.",
              severity: "warning",
            });
          } else {
            setSnackbar({
              open: true,
              message: `Error loading gradebook: ${error.message}`,
              severity: "error",
            });
          }
        });
    } else {
      console.log("No gradebook ID provided, showing selector");
    }
    // Intentionally only depend on `id` to avoid re-running when
    // context functions change identity and cause a render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Highlight linked assignment if coming from assignments page
  useEffect(() => {
    if (linkedAssignmentId && assignments.length > 0) {
      setHighlightedAssignment(linkedAssignmentId);
      // Auto-scroll to the assignment after a short delay
      setTimeout(() => {
        const element = document.getElementById(
          `assignment-${linkedAssignmentId}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [linkedAssignmentId, assignments]);

  // Network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbar({
        open: true,
        message: "You're back online!",
        severity: "success",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSnackbar({
        open: true,
        message: "You're currently offline.",
        severity: "warning",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Loading state
  const loading =
    studentsLoading || gradesLoading || assignmentsLoading || gradeBookLoading;

  // Get unique assignment categories from current gradebook
  const assignmentCategories = useMemo(() => {
    if (!currentGradeBook || !currentGradeBook.categories) return [];
    return currentGradeBook.categories.map((c) => c.name);
  }, [currentGradeBook]);

  // Get students for current gradebook
  const gradebookStudents = useMemo(() => {
    if (!students || !currentGradeBook) return [];

    console.log("GradeBook Debug:", {
      currentGradeBook: currentGradeBook,
      currentSubject: currentGradeBook?.subject,
      totalStudents: students.length,
      students: students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        subject: s.subject,
      })),
    });

    // More flexible filtering - include students with matching subject OR no subject specified
    const filteredStudents = students.filter(
      (s) => s.subject === currentGradeBook.subject || !s.subject
    );

    console.log(
      "Filtered students:",
      filteredStudents.length,
      filteredStudents
    );

    return filteredStudents;
  }, [students, currentGradeBook]);

  // Calculate category average for a student
  /**
   * Calculates the average for a student in a category using raw points.
   * Assumes grade.score is stored as raw points earned (not percentage).
   * Returns average (%), total possible points, and earned points.
   */
  const calculateCategoryAverage = (studentId, category) => {
    if (!grades || !assignments || !currentGradeBook)
      return { average: 0, totalPoints: 0, earnedPoints: 0 };

    // Filter assignments by gradebookId first, then fallback to subject
    const categoryAssignments = assignments.filter(
      (a) =>
        (a.gradebookId === currentGradeBook.id && a.category === category) ||
        (a.subject === currentGradeBook.subject &&
          a.category === category &&
          !a.gradebookId)
    );

    if (categoryAssignments.length === 0)
      return { average: 0, totalPoints: 0, earnedPoints: 0 };

    let totalEarned = 0;
    let totalPossible = 0;
    let gradedCount = 0;

    categoryAssignments.forEach((assignment) => {
      const grade = grades.find(
        (g) => g.studentId === studentId && g.assignmentId === assignment.id
      );
      if (grade) {
        // Use raw points for earned score
        const earnedPoints = grade.score;
        totalEarned += earnedPoints;
        totalPossible += assignment.points;
        gradedCount++;
      }
    });

    if (gradedCount === 0)
      return { average: 0, totalPoints: totalPossible, earnedPoints: 0 };

    const average = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    return {
      average: Math.round(average * 10) / 10,
      totalPoints: totalPossible,
      earnedPoints: Math.round(totalEarned * 10) / 10,
    };
  };

  // Calculate student's overall average
  const calculateStudentOverall = (studentId) => {
    if (!assignmentCategories.length)
      return { average: 0, totalPoints: 0, earnedPoints: 0 };

    let totalEarned = 0;
    let totalPossible = 0;
    let categoriesWithGrades = 0;

    assignmentCategories.forEach((category) => {
      const categoryData = calculateCategoryAverage(studentId, category);
      if (categoryData.totalPoints > 0) {
        totalEarned += categoryData.earnedPoints;
        totalPossible += categoryData.totalPoints;
        categoriesWithGrades++;
      }
    });

    if (categoriesWithGrades === 0)
      return { average: 0, totalPoints: totalPossible, earnedPoints: 0 };

    const average = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    return {
      average: Math.round(average * 10) / 10,
      totalPoints: totalPossible,
      earnedPoints: Math.round(totalEarned * 10) / 10,
    };
  };

  // Get assignment statistics for a category
  /**
   * Returns assignment statistics for a category using raw points.
   * Deduplicates grades by studentId for each assignment.
   */
  const getCategoryStats = (category) => {
    if (!assignments || !grades || !gradebookStudents) return {};

    // Filter assignments by gradebookId first, then fallback to subject
    const categoryAssignments = assignments.filter(
      (a) =>
        (a.gradebookId === currentGradeBook.id && a.category === category) ||
        (a.subject === currentGradeBook.subject &&
          a.category === category &&
          !a.gradebookId)
    );

    if (categoryAssignments.length === 0) return {};

    let totalPoints = 0;
    let totalEarned = 0;
    let totalGrades = 0;

    categoryAssignments.forEach((assignment) => {
      totalPoints += assignment.points;
      const assignmentGrades = grades.filter(
        (g) => g.assignmentId === assignment.id
      );
      // Deduplicate grades by studentId so we don't count multiple grade records
      const uniqueByStudent = Object.values(
        assignmentGrades.reduce((acc, g) => {
          acc[g.studentId] = g;
          return acc;
        }, {})
      );
      uniqueByStudent.forEach((grade) => {
        // Use raw points for earned score
        totalEarned += grade.score;
        totalGrades++;
      });
    });

    const averageGrade =
      totalGrades > 0 ? (totalEarned / totalPoints) * 100 : 0;
    const completionRate =
      gradebookStudents.length > 0
        ? (totalGrades /
            (gradebookStudents.length * categoryAssignments.length)) *
          100
        : 0;

    return {
      totalAssignments: categoryAssignments.length,
      totalPoints,
      averageGrade: Math.round(averageGrade * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      totalGrades,
    };
  };

  // Get assignments by category
  const getAssignmentsByCategory = (category) => {
    if (!assignments || !currentGradeBook) return [];

    return assignments.filter(
      (a) => a.subject === currentGradeBook.subject && a.category === category
    );
  };

  // Get category details with assignments
  const getCategoryDetails = (category) => {
    const stats = getCategoryStats(category);
    const categoryAssignments = getAssignmentsByCategory(category);
    const categoryConfig = currentGradeBook.categories?.find(
      (c) => c.name === category
    );

    return {
      ...stats,
      assignments: categoryAssignments,
      config: categoryConfig,
    };
  };

  // Navigate to assignments page
  const navigateToAssignments = () => {
    navigate("/assignments");
  };

  // Get letter grade
  const getLetterGrade = (percentage) => {
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  };

  if (loading) {
    return <Loading message="Loading gradebook..." />;
  }

  if (!currentGradeBook) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h5" gutterBottom>
          Select a Gradebook
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Click on a gradebook below to view its details and manage grades.
        </Typography>

        <SimpleGradeBookSelector
          onGradeBookChange={(gradeBook) => {
            console.log("GradeBook: onGradeBookChange called with:", gradeBook);
            console.log(
              "GradeBook: Navigating to:",
              `/gradebooks/${gradeBook.id}`
            );
            // Navigate to the specific gradebook
            navigate(`/gradebooks/${gradeBook.id}`);
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/gradebooks")}
          sx={{ minWidth: "auto", px: 2 }}
        >
          ← Back to Grade Books
        </Button>
        <Typography variant="h4" gutterBottom>
          {currentGradeBook.name}
        </Typography>
        <Chip
          label={currentGradeBook.subject}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={isOnline ? "Online" : "Offline"}
          color={isOnline ? "success" : "error"}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Gradebook Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {currentGradeBook.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentGradeBook.description ||
                `Grade book for ${currentGradeBook.subject}`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <Chip
                label={currentGradeBook.gradeLevel || "All Grades"}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={currentGradeBook.academicYear || "2025"}
                color="secondary"
                variant="outlined"
              />
              <Chip
                label={currentGradeBook.semester || "Current"}
                color="info"
                variant="outlined"
              />
              <Chip
                label={currentGradeBook.status || "active"}
                color="success"
                variant="outlined"
              />
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={navigateToAssignments}
                size="small"
              >
                Manage Assignments
              </Button>
              <Tooltip title="Archive Gradebook (soft delete)">
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<ArchiveIcon />}
                  onClick={() => setArchiveDialogOpen(true)}
                  size="small"
                >
                  Archive
                </Button>
              </Tooltip>
              <Tooltip title="Delete Gradebook (permanent)">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  size="small"
                >
                  Delete
                </Button>
              </Tooltip>
              {/* Delete Gradebook Dialog */}
              <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
              >
                <DialogTitle>Delete Gradebook</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to permanently delete "
                    {currentGradeBook?.name}"? This action cannot be undone.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteGradeBook}
                    color="error"
                    variant="contained"
                  >
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Archive Gradebook Dialog */}
              <Dialog
                open={archiveDialogOpen}
                onClose={() => setArchiveDialogOpen(false)}
              >
                <DialogTitle>Archive Gradebook</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to archive "{currentGradeBook?.name}"?
                    You can reactivate it later from the filters.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setArchiveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleArchiveGradeBook}
                    color="warning"
                    variant="contained"
                  >
                    Archive
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {(() => {
          const subjectAssignments = assignments.filter(
            (a) => a.subject === currentGradeBook.subject
          );
          const subjectGrades = grades.filter(
            (g) =>
              assignments.find((a) => a.id === g.assignmentId)?.subject ===
              currentGradeBook.subject
          );

          console.log("Quick Stats Debug:", {
            currentSubject: currentGradeBook.subject,
            totalAssignments: assignments.length,
            subjectAssignments: subjectAssignments.length,
            assignments: assignments.map((a) => ({
              id: a.id,
              name: a.name,
              subject: a.subject,
            })),
            totalGrades: grades.length,
            subjectGrades: subjectGrades.length,
          });

          return (
            <>
              <Chip
                label={`${gradebookStudents.length} Students`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${subjectAssignments.length} Assignments`}
                color="secondary"
                variant="outlined"
              />
              <Chip
                label={`${assignmentCategories.length} Categories`}
                color="info"
                variant="outlined"
              />
              <Chip
                label={`${subjectGrades.length} Grades`}
                color="default"
                variant="outlined"
              />
            </>
          );
        })()}
      </Box>

      {/* Gradebook Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "primary.main",
                    color: "white",
                  }}
                >
                  Students
                </TableCell>
                {assignmentCategories.map((category) => {
                  const stats = getCategoryStats(category);
                  return (
                    <TableCell
                      key={category}
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "secondary.main",
                        color: "white",
                        minWidth: 120,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {category}
                        </Typography>
                        {stats.totalAssignments > 0 && (
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {stats.totalAssignments} assignments •{" "}
                            {stats.totalPoints} pts
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "success.main",
                    color: "white",
                    minWidth: 100,
                  }}
                >
                  Overall
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gradebookStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.studentId || "No ID"}
                      </Typography>
                    </Box>
                  </TableCell>
                  {assignmentCategories.map((category) => {
                    const categoryData = calculateCategoryAverage(
                      student.id,
                      category
                    );
                    return (
                      <TableCell key={category} align="center">
                        {categoryData.totalPoints > 0 ? (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {categoryData.average}%
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {categoryData.earnedPoints}/
                              {categoryData.totalPoints} pts
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              color="primary"
                            >
                              {getLetterGrade(categoryData.average)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No grades
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    {(() => {
                      const overall = calculateStudentOverall(student.id);
                      return overall.totalPoints > 0 ? (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold", color: "success.main" }}
                          >
                            {overall.average}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {overall.earnedPoints}/{overall.totalPoints} pts
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="success.main"
                          >
                            {getLetterGrade(overall.average)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No grades
                        </Typography>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GradeBook;
