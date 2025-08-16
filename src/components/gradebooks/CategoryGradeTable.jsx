import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Collapse,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useGrades } from "../../contexts/GradeContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useStudents } from "../../contexts/StudentContext";
import {
  calculateCategoryAverage,
  calculateFinalGrade,
  getStudentGradeSummary,
  validateGradeCalculationSettings,
} from "../../services/gradeCalculationService";

const CategoryGradeTable = ({
  gradeBook,
  onGradeUpdate,
  onGradeDelete,
  onGradeAdd,
  showCalculations = true,
  showActions = true,
}) => {
  const { grades, updateGrade, deleteGrade, addGrade } = useGrades();
  const { assignments } = useAssignments();
  const { students } = useStudents();

  // State for grade editing
  const [editingGrade, setEditingGrade] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ score: "", comment: "" });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    studentId: "",
    assignmentId: "",
    score: "",
    comment: "",
  });

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Filter data for current gradebook
  const gradeBookData = useMemo(() => {
    if (!gradeBook) return { grades: [], assignments: [], students: [] };

    const gradeBookAssignments = assignments.filter(
      (assignment) => assignment.subject === gradeBook.subject
    );

    const gradeBookGrades = grades.filter((grade) => {
      const assignment = gradeBookAssignments.find((a) => a.id === grade.assignmentId);
      return assignment && assignment.subject === gradeBook.subject;
    });

    const gradeBookStudents = students.filter((student) =>
      gradeBookGrades.some((grade) => grade.studentId === student.id)
    );

    return {
      grades: gradeBookGrades,
      assignments: gradeBookAssignments,
      students: gradeBookStudents,
    };
  }, [gradeBook, grades, assignments, students]);

  // Calculate student grades
  const studentGrades = useMemo(() => {
    if (!gradeBook || !gradeBookData.students.length) return [];

    return gradeBookData.students.map((student) => {
      const studentGradeData = gradeBookData.grades.filter(
        (grade) => grade.studentId === student.id
      );

      const summary = getStudentGradeSummary(
        student.id,
        gradeBook,
        studentGradeData,
        gradeBookData.assignments
      );

      return {
        student,
        grades: studentGradeData,
        summary,
      };
    });
  }, [gradeBook, gradeBookData]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    if (!gradeBook || !gradeBook.categories) return {};

    const totals = {};
    gradeBook.categories.forEach((category) => {
      const categoryAssignments = gradeBookData.assignments.filter(
        (assignment) => assignment.category === category.name
      );

      const totalPoints = categoryAssignments.reduce(
        (sum, assignment) => sum + (parseFloat(assignment.points) || 0),
        0
      );

      totals[category.name] = {
        totalPoints,
        assignmentCount: categoryAssignments.length,
        color: category.color || "#1976d2",
      };
    });

    return totals;
  }, [gradeBook, gradeBookData.assignments]);

  // Validation
  const validation = useMemo(() => {
    if (!gradeBook) return { isValid: false, errors: [], warnings: [] };
    return validateGradeCalculationSettings(gradeBook);
  }, [gradeBook]);

  const handleEditGrade = (studentId, assignmentId, currentGrade) => {
    setEditingGrade({ studentId, assignmentId });
    setEditForm({
      score: currentGrade?.score || "",
      comment: currentGrade?.comment || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editingGrade) {
        await updateGrade(editingGrade.assignmentId, editingGrade.studentId, {
          score: parseFloat(editForm.score),
          comment: editForm.comment,
        });

        if (onGradeUpdate) {
          onGradeUpdate(editingGrade.studentId, editingGrade.assignmentId, editForm);
        }
      }
      setEditDialogOpen(false);
      setEditingGrade(null);
      setEditForm({ score: "", comment: "" });
    } catch (error) {
      console.error("Error updating grade:", error);
    }
  };

  const handleDeleteGrade = async (studentId, assignmentId) => {
    try {
      if (window.confirm("Are you sure you want to delete this grade?")) {
        await deleteGrade(assignmentId, studentId);
        if (onGradeDelete) {
          onGradeDelete(studentId, assignmentId);
        }
      }
    } catch (error) {
      console.error("Error deleting grade:", error);
    }
  };

  const handleAddGrade = async () => {
    try {
      await addGrade({
        studentId: addForm.studentId,
        assignmentId: addForm.assignmentId,
        score: parseFloat(addForm.score),
        comment: addForm.comment,
        subject: gradeBook.subject,
      });

      if (onGradeAdd) {
        onGradeAdd(addForm);
      }

      setAddDialogOpen(false);
      setAddForm({
        studentId: "",
        assignmentId: "",
        score: "",
        comment: "",
      });
    } catch (error) {
      console.error("Error adding grade:", error);
    }
  };

  const toggleRowExpansion = (studentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  const getGradeDisplay = (grade, assignment) => {
    if (!grade || grade.score === null || grade.score === undefined) {
      return "-";
    }

    const score = parseFloat(grade.score);
    const maxPoints = parseFloat(assignment.points);

    if (isNaN(score) || isNaN(maxPoints)) {
      return grade.score;
    }

    const percentage = (score / maxPoints) * 100;
    return `${score} / ${maxPoints} (${percentage.toFixed(1)}%)`;
  };

  const getGradeColor = (grade, assignment) => {
    if (!grade || grade.score === null || grade.score === undefined) {
      return "default";
    }

    const score = parseFloat(grade.score);
    const maxPoints = parseFloat(assignment.points);

    if (isNaN(score) || isNaN(maxPoints)) {
      return "default";
    }

    const percentage = (score / maxPoints) * 100;

    if (percentage >= 90) return "success";
    if (percentage >= 80) return "primary";
    if (percentage >= 70) return "warning";
    return "error";
  };

  if (!gradeBook) {
    return (
      <Alert severity="info">
        Please select a gradebook to view grades.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Gradebook Configuration Warnings:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validation.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {validation.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Gradebook Configuration Errors:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Grade Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "primary.main" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Students
              </TableCell>
              {gradeBook.categories?.map((category) => (
                <TableCell
                  key={category.name}
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    backgroundColor: category.color || "primary.main",
                    textAlign: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{category.name}</Typography>
                    <Typography variant="caption">
                      {categoryTotals[category.name]?.assignmentCount || 0} assignments
                    </Typography>
                  </Box>
                </TableCell>
              ))}
              {showCalculations && (
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                  Final Grade
                </TableCell>
              )}
              {showActions && (
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                  Actions
                </TableCell>
              )}
            </TableRow>

            {/* Assignment Headers Row */}
            <TableRow>
              <TableCell></TableCell>
              {gradeBook.categories?.map((category) => (
                <TableCell key={category.name} sx={{ textAlign: "center" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {categoryTotals[category.name]?.totalPoints || 0} total points
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Weight: {category.weight || 0}%
                    </Typography>
                  </Box>
                </TableCell>
              ))}
              {showCalculations && <TableCell></TableCell>}
              {showActions && <TableCell></TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {studentGrades.map(({ student, grades, summary }) => (
              <React.Fragment key={student.id}>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(student.id)}
                      >
                        {expandedRows.has(student.id) ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                      <Box>
                        <Typography variant="subtitle2">
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {summary.completedAssignments} / {summary.totalAssignments} completed
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {gradeBook.categories?.map((category) => {
                    const categoryGrades = grades.filter((grade) => {
                      const assignment = gradeBookData.assignments.find(
                        (a) => a.id === grade.assignmentId
                      );
                      return assignment && assignment.category === category.name;
                    });

                    const categoryCalculation = calculateCategoryAverage(
                      categoryGrades,
                      category
                    );

                    return (
                      <TableCell key={category.name} sx={{ textAlign: "center" }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {categoryCalculation.percentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {categoryCalculation.earnedPoints} / {categoryCalculation.totalPoints}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {categoryCalculation.count} assignments
                          </Typography>
                        </Box>
                      </TableCell>
                    );
                  })}

                  {showCalculations && (
                    <TableCell sx={{ textAlign: "center" }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {summary.finalGrade.toFixed(1)}%
                        </Typography>
                        <Chip
                          label={summary.letterGrade}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                  )}

                  {showActions && (
                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title="Add Grade">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAddForm((prev) => ({ ...prev, studentId: student.id }));
                            setAddDialogOpen(true);
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>

                {/* Expanded Row - Individual Assignment Grades */}
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={100}>
                    <Collapse in={expandedRows.has(student.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Assignment Details
                        </Typography>
                        <Grid container spacing={2}>
                          {gradeBook.categories?.map((category) => {
                            const categoryGrades = grades.filter((grade) => {
                              const assignment = gradeBookData.assignments.find(
                                (a) => a.id === grade.assignmentId
                              );
                              return assignment && assignment.category === category.name;
                            });

                            return (
                              <Grid item xs={12} md={6} key={category.name}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                      {category.name}
                                    </Typography>
                                    {categoryGrades.length > 0 ? (
                                      categoryGrades.map((grade) => {
                                        const assignment = gradeBookData.assignments.find(
                                          (a) => a.id === grade.assignmentId
                                        );
                                        return (
                                          <Box
                                            key={grade.id}
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              mb: 1,
                                              p: 1,
                                              border: "1px solid #e0e0e0",
                                              borderRadius: 1,
                                            }}
                                          >
                                            <Box>
                                              <Typography variant="body2">
                                                {assignment?.name || "Unknown Assignment"}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                Due: {assignment?.dueDate
                                                  ? new Date(assignment.dueDate).toLocaleDateString()
                                                  : "No due date"}
                                              </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                              <Chip
                                                label={getGradeDisplay(grade, assignment)}
                                                color={getGradeColor(grade, assignment)}
                                                size="small"
                                              />
                                              {showActions && (
                                                <>
                                                  <Tooltip title="Edit Grade">
                                                    <IconButton
                                                      size="small"
                                                      onClick={() =>
                                                        handleEditGrade(
                                                          student.id,
                                                          grade.assignmentId,
                                                          grade
                                                        )
                                                      }
                                                    >
                                                      <EditIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                  <Tooltip title="Delete Grade">
                                                    <IconButton
                                                      size="small"
                                                      color="error"
                                                      onClick={() =>
                                                        handleDeleteGrade(
                                                          student.id,
                                                          grade.assignmentId
                                                        )
                                                      }
                                                    >
                                                      <DeleteIcon />
                                                    </IconButton>
                                                  </Tooltip>
                                                </>
                                              )}
                                            </Box>
                                          </Box>
                                        );
                                      })
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        No assignments in this category
                                      </Typography>
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Grade Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Grade</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Score"
            type="number"
            value={editForm.score}
            onChange={(e) => setEditForm((prev) => ({ ...prev, score: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Comment"
            value={editForm.comment}
            onChange={(e) => setEditForm((prev) => ({ ...prev, comment: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Grade Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Grade</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Assignment</InputLabel>
            <Select
              value={addForm.assignmentId}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, assignmentId: e.target.value }))
              }
              label="Assignment"
            >
              {gradeBookData.assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  {assignment.name} ({assignment.category})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Score"
            type="number"
            value={addForm.score}
            onChange={(e) => setAddForm((prev) => ({ ...prev, score: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Comment"
            value={addForm.comment}
            onChange={(e) => setAddForm((prev) => ({ ...prev, comment: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddGrade} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryGradeTable; 