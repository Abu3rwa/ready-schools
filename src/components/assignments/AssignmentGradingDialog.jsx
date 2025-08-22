import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Paper,
  Grid,
} from "@mui/material";
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const AssignmentGradingDialog = ({
  open,
  onClose,
  assignment,
  students,
  grades,
  onSaveGrades,
}) => {
  const [studentGrades, setStudentGrades] = useState({});
  const [inputMode, setInputMode] = useState("points"); // Only points mode
  const [notSubmittedStudents, setNotSubmittedStudents] = useState(new Set());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize grades when dialog opens
  useEffect(() => {
    if (open && assignment && students) {
      const initialGrades = {};
      students.forEach((student) => {
        const existingGrade = grades.find(
          (g) => g.studentId === student.id && g.assignmentId === assignment.id
        );
        if (existingGrade) {
          // Check if the stored score is a percentage (0-100) or raw points
          let pointsEarned;
          if (existingGrade.score > assignment.points) {
            // Score is greater than assignment points, likely a percentage
            // Convert percentage back to points: (score / 100) * assignment.points
            pointsEarned = (existingGrade.score / 100) * assignment.points;
          } else {
            // Score is within assignment points range, likely raw points
            // Use the score as-is
            pointsEarned = existingGrade.score;
          }
          initialGrades[student.id] = pointsEarned.toString();
        } else {
          initialGrades[student.id] = "";
        }
      });
      setStudentGrades(initialGrades);
    }
  }, [open, assignment, students, grades]);

  const handleGradeChange = (studentId, value) => {
    setStudentGrades((prev) => ({
      ...prev,
      [studentId]: value,
    }));
    // Remove from not submitted if they now have a grade
    if (value && value.trim() !== "") {
      setNotSubmittedStudents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const quickGrade = (studentId, letter) => {
    if (!assignment?.points) return;
    const map = { A: 0.95, B: 0.85, C: 0.75, D: 0.65, F: 0.5 };
    const pct = map[letter] ?? 0.0;
    const pts = (assignment.points * pct).toFixed(1);
    handleGradeChange(studentId, String(pts));
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(students.length - 1, i + 1));

  const toggleNotSubmitted = (studentId) => {
    setNotSubmittedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
        // Clear any existing grade when marking as submitted
        setStudentGrades((prevGrades) => ({
          ...prevGrades,
          [studentId]: "",
        }));
      } else {
        newSet.add(studentId);
        // Clear grade when marking as not submitted
        setStudentGrades((prevGrades) => ({
          ...prevGrades,
          [studentId]: "",
        }));
      }
      return newSet;
    });
  };

  const validateGrade = (value) => {
    if (!value || !assignment) return true; // Allow empty values or if no assignment
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) return false; // Invalid number
    
    // For points mode, validate against assignment total points
    return numValue >= 0 && numValue <= (assignment.points || 0);
  };

  const convertToPercentage = (value) => {
    if (!value || !assignment || !assignment.points) return 0;
    const numValue = parseFloat(value);
    
    // Convert points to percentage: (points earned / total points) * 100
    return (numValue / assignment.points) * 100;
  };

  const convertToPoints = (value) => {
    if (!value || !assignment || !assignment.points) return 0;
    const numValue = parseFloat(value);
    
    // Already points
    return numValue;
  };

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

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "primary";
    if (percentage >= 70) return "warning";
    return "error";
  };

  const handleSave = async () => {
    try {
      const gradesToSave = [];
      const gradesToDelete = [];
      
      // Validate all grades
      const invalidGrades = [];
      Object.entries(studentGrades).forEach(([studentId, gradeValue]) => {
        if (gradeValue && !validateGrade(gradeValue)) {
          const student = students.find((s) => s.id === studentId);
          invalidGrades.push(
            student
              ? `${student.firstName} ${student.lastName}`
              : "Unknown Student"
          );
        }
      });

      if (invalidGrades.length > 0) {
        setSnackbar({
          open: true,
          message: `Invalid grades for: ${invalidGrades.join(
            ", "
          )}. Please enter values between 0-${assignment.points}.`,
          severity: "error",
        });
        return;
      }

      // Process all students
      students.forEach((student) => {
        const gradeValue = studentGrades[student.id] || "";
          const existingGrade = grades.find(
          (g) => g.studentId === student.id && g.assignmentId === assignment.id
          );
          
        if (gradeValue && gradeValue.trim() !== "") {
          // Student has a grade - add or update
          const gradeData = {
            studentId: student.id,
            assignmentId: assignment.id,
            score: parseFloat(gradeValue), // Store as raw points (5, 4, etc.)
            points: assignment.points, // Add the total possible points
            subject: assignment.subject,
            dateEntered: new Date().toISOString(),
          };

          gradesToSave.push({
            gradeData,
            isUpdate: !!existingGrade,
            existingGradeId: existingGrade?.id,
          });
        } else if (existingGrade) {
          // Student had a grade but now it's cleared - delete the grade
          gradesToDelete.push(existingGrade.id);
        }
      });

      // Save grades and delete cleared grades
      await onSaveGrades(gradesToSave, gradesToDelete);

      const notSubmittedMessage =
        stats.notSubmittedCount > 0
        ? ` (${stats.notSubmittedCount} students marked as not submitted)` 
          : "";

      setSnackbar({
        open: true,
        message: `Grades saved successfully for ${assignment.name}${notSubmittedMessage}`,
        severity: "success",
      });

      onClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error saving grades: ${error.message}`,
        severity: "error",
      });
    }
  };

  const getCompletionStats = () => {
    const totalStudents = students.length;
    const gradedStudents = Object.values(studentGrades).filter(
      (grade) => grade && grade.trim() !== ""
    ).length;
    const notSubmittedCount = notSubmittedStudents.size;
    const availableForGrading = totalStudents - notSubmittedCount;
    const completionRate =
      availableForGrading > 0
        ? (gradedStudents / availableForGrading) * 100
        : 0;
    
    // Calculate average percentage, not average points
    const validGrades = Object.values(studentGrades)
      .filter((grade) => grade && grade.trim() !== "")
      .map((grade) => {
        const points = parseFloat(grade);
        if (isNaN(points) || !assignment?.points) return 0;
        // Convert points to percentage
        return (points / assignment.points) * 100;
      })
      .filter((percentage) => percentage > 0);

    const averageGrade =
      validGrades.length > 0
        ? validGrades.reduce((sum, percentage) => sum + percentage, 0) /
          validGrades.length
      : 0;

    return {
      totalStudents,
      gradedStudents,
      notSubmittedCount,
      availableForGrading,
      completionRate,
      averageGrade,
    };
  };

  const stats = getCompletionStats();

  // Don't render if assignment is not available
  if (!assignment) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ position: isMobile ? 'sticky' : 'static', top: 0, zIndex: 2, bgcolor: 'background.paper' }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h6">
                Grade Assignment: {assignment?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assignment?.category} • {assignment?.points} points
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <>
                  <Button size="small" onClick={goPrev} disabled={currentIndex === 0}>Prev</Button>
                  <Button size="small" onClick={goNext} disabled={currentIndex >= students.length - 1}>Next</Button>
                </>
              )}
              <IconButton onClick={onClose} aria-label="Close grading dialog">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6" color="primary">
                    {stats.totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6" color="secondary">
                    {stats.gradedStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Graded
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6" color="warning">
                    {stats.notSubmittedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Not Submitted
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6" color="success">
                    {stats.averageGrade.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            {stats.notSubmittedCount > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Progress:</strong> {stats.gradedStudents} graded,{" "}
                  {stats.notSubmittedCount} marked as not submitted. You can
                  save your progress and return later to finish grading.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Mobile list layout */}
          {isMobile ? (
            <List sx={{ width: '100%' }}>
              {students.map((student, idx) => {
                const gradeValue = studentGrades[student.id] || "";
                const percentage = gradeValue ? convertToPercentage(gradeValue) : 0;
                const pointsEarned = gradeValue ? convertToPoints(gradeValue) : 0;
                const letterGrade = gradeValue ? getLetterGrade(percentage) : "";
                const gradeColor = gradeValue ? getGradeColor(percentage) : "default";
                const hasGrade = gradeValue && gradeValue.trim() !== "";
                const isNotSubmitted = notSubmittedStudents.has(student.id);

                const isFocused = idx === currentIndex;
                return (
                  <ListItem key={student.id} sx={{ flexDirection: 'column', alignItems: 'stretch', p: { xs: 2, sm: 1 }, display: isFocused ? 'flex' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.studentId || "No ID"}
                        </Typography>
                      </Box>
                      {hasGrade && (
                        <Chip label={letterGrade} color={gradeColor} size="small" variant="outlined" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        type="number"
                        value={gradeValue}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        inputProps={{ min: 0, max: assignment?.points || 0, step: 0.1 }}
                        fullWidth
                        size="medium"
                        error={gradeValue && !validateGrade(gradeValue)}
                        helperText={gradeValue && !validateGrade(gradeValue) ? `0-${assignment?.points || 0}` : ""}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => toggleNotSubmitted(student.id)}
                        color={isNotSubmitted ? 'warning' : 'inherit'}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        {isNotSubmitted ? 'Undo' : 'No Submit'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleGradeChange(student.id, String(assignment?.points || 0))}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        Full
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {['A','B','C','D','F'].map((L) => (
                        <Button key={L} size="small" variant="contained" onClick={() => quickGrade(student.id, L)} sx={{ minWidth: 44, minHeight: 36 }}>
                          {L}
                        </Button>
                      ))}
                    </Box>
                    {hasGrade && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {pointsEarned.toFixed(1)} / {assignment?.points || 0} • {percentage.toFixed(0)}%
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Button onClick={goPrev} disabled={currentIndex === 0}>Previous</Button>
                      <Button onClick={goNext} disabled={currentIndex >= students.length - 1}>Next</Button>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            // Desktop fallback: existing table layout (unchanged)
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Points Earned</TableCell>
                    <TableCell>Letter Grade</TableCell>
                    <TableCell>Points Earned</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const gradeValue = studentGrades[student.id] || "";
                    const percentage = gradeValue ? convertToPercentage(gradeValue) : 0;
                    const pointsEarned = gradeValue ? convertToPoints(gradeValue) : 0;
                    const letterGrade = gradeValue ? getLetterGrade(percentage) : "";
                    const gradeColor = gradeValue ? getGradeColor(percentage) : "default";
                    const hasGrade = gradeValue && gradeValue.trim() !== "";
                    const isNotSubmitted = notSubmittedStudents.has(student.id);

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {student.firstName} {student.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.studentId || "No ID"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={gradeValue}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            inputProps={{ min: 0, max: assignment?.points || 0, step: 0.1, style: { width: "80px" } }}
                            size="small"
                            error={gradeValue && !validateGrade(gradeValue)}
                            helperText={gradeValue && !validateGrade(gradeValue) ? `0-${assignment?.points || 0}` : ""}
                          />
                        </TableCell>
                        <TableCell>
                          {hasGrade && (
                            <Chip label={letterGrade} color={gradeColor} size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          {hasGrade && (
                            <Typography variant="body2">
                              {pointsEarned.toFixed(1)} / {assignment?.points || 0}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {isNotSubmitted ? (
                            <Chip
                              label="Not Submitted"
                              color="warning"
                              size="small"
                              variant="outlined"
                              onClick={() => toggleNotSubmitted(student.id)}
                              sx={{ cursor: "pointer" }}
                            />
                          ) : hasGrade ? (
                            <Chip icon={<CheckCircleIcon />} label="Graded" color="success" size="small" />
                          ) : (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Chip label="Not Graded" color="default" size="small" variant="outlined" />
                              <Button size="small" variant="text" color="warning" onClick={() => toggleNotSubmitted(student.id)} sx={{ minWidth: "auto", p: 0.5 }}>
                                Mark Not Submitted
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={stats.gradedStudents === 0}
          >
            {stats.gradedStudents === stats.availableForGrading
              ? `Save All Grades (${stats.gradedStudents} students)`
              : `Save Progress (${stats.gradedStudents}/${stats.availableForGrading} students)`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignmentGradingDialog;
