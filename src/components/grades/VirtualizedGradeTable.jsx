import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
} from "@mui/icons-material";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { gradeCalculator } from "../../utils/gradeCalculations";
import StandardsGradeCell from "./StandardsGradeCell";

const VirtualizedGradeTable = ({
  students,
  assignments,
  grades,
  onGradeEdit,
  onGradeSave,
  onGradeDelete,
  onGradeAdd,
  loading = false,
  subject,
  filters = {},
  sortBy = "studentName",
  sortOrder = "asc",
  // Standards grading props
  showStandardsGrading = false,
  standardsGradingMode = 'both',
  getAssignmentStandards = () => [],
  getStandardsGrade = () => null,
  onStandardsGradeChange = () => {},
  standardsGrades = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State for editing
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: sortBy,
    order: sortOrder,
  });

  // Memoized data processing
  const processedData = useMemo(() => {
    if (!students || !assignments || !grades) return [];

    // Combine student and grade data
    const studentGrades = students.map((student) => {
      const studentGrades = grades.filter((g) => g.studentId === student.id);
      const assignmentGrades = assignments.map((assignment) => {
        const grade = studentGrades.find(
          (g) => g.assignmentId === assignment.id
        );
        return {
          assignmentId: assignment.id,
          assignmentName: assignment.name,
          category: assignment.category,
          points: assignment.points,
          score: grade?.score || null,
          percentage: grade?.percentage || null,
          letterGrade: grade?.letterGrade || null,
          isLate: grade?.isLate || false,
          dateEntered: grade?.dateEntered || null,
        };
      });

      const gradedAssignments = assignmentGrades.filter(ag => ag.score !== null);
      const totalPossiblePointsForGraded = gradedAssignments.reduce(
        (sum, ag) => sum + (ag.points || 0),
        0
      );
      const earnedPointsForGraded = gradedAssignments.reduce(
        (sum, ag) => sum + (ag.score || 0),
        0
      );
      const average = totalPossiblePointsForGraded > 0 ? (earnedPointsForGraded / totalPossiblePointsForGraded) * 100 : 0;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        assignments: assignmentGrades,
        average: gradeCalculator.calculatePercentage(earnedPointsForGraded, totalPossiblePointsForGraded),
        letterGrade: gradeCalculator.getLetterGrade(average),
        totalPoints: totalPossiblePointsForGraded,
        earnedPoints: earnedPointsForGraded,
      };
    });

    // Apply sorting
    return studentGrades.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (sortConfig.order === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [students, assignments, grades, sortConfig]);

  // Handle sorting
  const handleSort = useCallback((field) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Handle cell editing
  const handleEditCell = useCallback(
    (studentId, assignmentId, currentScore) => {
      setEditingCell({ studentId, assignmentId });
      setEditValue(currentScore !== null ? currentScore.toString() : "");
    },
    []
  );

  // Handle save grade
  const handleSaveGrade = useCallback(() => {
    if (!editingCell) return;

    const { studentId, assignmentId } = editingCell;
    const score = parseInt(editValue, 10);
    const assignment = assignments.find((a) => a.id === assignmentId);

    if (
      isNaN(score) ||
      score < 0 ||
      (assignment && score > assignment.points)
    ) {
      return; // Invalid score
    }

    onGradeSave(studentId, assignmentId, score);
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, assignments, onGradeSave]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // Row renderer for virtualized list
  const RowRenderer = useCallback(
    ({ index, style }) => {
      const studentData = processedData[index];
      if (!studentData) return null;

      return (
        <TableRow
          style={style}
          hover
          sx={{
            backgroundColor: theme.palette.background.paper,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <TableCell
            sx={{
              minWidth: 180,
              fontWeight: 600,
              backgroundColor: theme.palette.grey[50],
              borderRight: `1px solid ${theme.palette.divider}`,
              position: "sticky",
              left: 0,
              zIndex: 2,
            }}
          >
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {studentData.studentName || "Unknown Student"}
            </Typography>
          </TableCell>

          {studentData.assignments.map((assignment, assignmentIndex) => {
            const isEditing =
              editingCell &&
              editingCell.studentId === studentData.studentId &&
              editingCell.assignmentId === assignment.assignmentId;
            
            const assignmentStandards = showStandardsGrading ? getAssignmentStandards(assignment.assignmentId) : [];

            return (
              <React.Fragment key={assignment.assignmentId}>
                {/* Traditional grade cell */}
                {(standardsGradingMode === 'traditional' || standardsGradingMode === 'both') && (
              <TableCell
                align="center"
                sx={{
                  minWidth: 120,
                  position: "relative",
                  backgroundColor: theme.palette.background.paper,
                  borderRight: `1px solid ${theme.palette.divider}`,
                }}
              >
                {isEditing ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                    }}
                  >
                    <TextField
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      type="number"
                      size="small"
                      inputProps={{
                        min: 0,
                        max: assignment.points,
                        style: { textAlign: "center", width: 60 },
                      }}
                      sx={{ width: 80 }}
                      autoFocus
                    />
                    <IconButton
                      size="small"
                      onClick={handleSaveGrade}
                      color="primary"
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCancelEdit}
                      color="error"
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                    }}
                  >
                    {assignment.score !== null ? (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {assignment.score}/{assignment.points}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                            }}
                          >
                            {assignment.percentage?.toFixed(1)}%
                          </Typography>
                          <Chip
                            label={assignment.letterGrade}
                            size="small"
                            variant="filled"
                            color={
                              assignment.letterGrade === "A"
                                ? "success"
                                : assignment.letterGrade === "F"
                                ? "error"
                                : "default"
                            }
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              color:
                                assignment.letterGrade === "A" ||
                                assignment.letterGrade === "F"
                                  ? "white"
                                  : "inherit",
                            }}
                          />
                        </Box>
                          </>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontStyle: "italic",
                            }}
                          >
                            No Grade
                          </Typography>
                        )}
                          <IconButton
                            size="small"
                            onClick={() =>
                            onGradeEdit(
                                studentData.studentId,
                                assignment.assignmentId,
                                assignment.score
                              )
                            }
                          sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                    )}
                  </TableCell>
                )}
                
                {/* Standards grade cells */}
                {showStandardsGrading && (standardsGradingMode === 'standards' || standardsGradingMode === 'both') && 
                  assignmentStandards.map((standard) => {
                    const standardsGrade = getStandardsGrade(
                      studentData.studentId, 
                      assignment.assignmentId, 
                      standard.standardId
                    );
                    
                    return (
                      <TableCell
                        key={`${assignment.assignmentId}-${standard.standardId}`}
                        align="center"
                        sx={{
                          minWidth: 100,
                          position: "relative",
                          backgroundColor: theme.palette.background.paper,
                          borderRight: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <StandardsGradeCell
                          studentId={studentData.studentId}
                          assignmentId={assignment.assignmentId}
                          standardId={standard.standardId}
                          currentGrade={standardsGrade}
                          onGradeChange={(gradeData) => 
                            onStandardsGradeChange(
                              studentData.studentId, 
                              assignment.assignmentId, 
                              standard.standardId, 
                              gradeData
                            )
                          }
                          proficiencyScale="four_point"
                          compact={true}
                        />
              </TableCell>
                    );
                  })
                }
              </React.Fragment>
            );
          })}

          <TableCell
            align="center"
            sx={{
              minWidth: 100,
              backgroundColor: theme.palette.grey[50],
              borderLeft: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {studentData.average.toFixed(1)}%
              </Typography>
              <Chip
                label={studentData.letterGrade}
                size="small"
                color={
                  studentData.letterGrade === "A"
                    ? "success"
                    : studentData.letterGrade === "B"
                    ? "info"
                    : studentData.letterGrade === "C"
                    ? "warning"
                    : studentData.letterGrade === "D"
                    ? "warning"
                    : studentData.letterGrade === "F"
                    ? "error"
                    : "default"
                }
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            </Box>
          </TableCell>
        </TableRow>
      );
    },
    [
      processedData,
      editingCell,
      editValue,
      assignments,
      theme,
      handleEditCell,
      handleSaveGrade,
      handleCancelEdit,
      onGradeDelete,
      showStandardsGrading,
      standardsGradingMode,
      getAssignmentStandards,
      getStandardsGrade,
      onStandardsGradeChange,
    ]
  );

  // Header row
  const HeaderRow = useMemo(
    () => (
      <TableRow
        sx={{
          backgroundColor: theme.palette.primary.main,
          "& .MuiTableCell-root": {
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <TableCell
          sx={{
            minWidth: 180,
            fontWeight: 700,
            cursor: "pointer",
            "&:hover": { backgroundColor: theme.palette.primary.dark },
            position: "sticky",
            left: 0,
            zIndex: 3,
          }}
          onClick={() => handleSort("studentName")}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            Student
            <SortIcon fontSize="small" />
          </Box>
        </TableCell>

        {assignments.map((assignment) => {
          const assignmentStandards = showStandardsGrading ? getAssignmentStandards(assignment.id) : [];
          
          return (
            <React.Fragment key={assignment.id}>
              {/* Traditional grade column */}
              {(standardsGradingMode === 'traditional' || standardsGradingMode === 'both') && (
          <TableCell
            align="center"
            sx={{
              minWidth: 120,
              fontWeight: 600,
            }}
          >
            <Tooltip
              title={`${assignment.name} (${assignment.category}) - ${assignment.points} pts`}
            >
              <Box>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {assignment.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {assignment.category} - {assignment.points} pts
                </Typography>
              </Box>
            </Tooltip>
          </TableCell>
              )}
              
              {/* Standards columns */}
              {showStandardsGrading && (standardsGradingMode === 'standards' || standardsGradingMode === 'both') && 
                assignmentStandards.map((standard) => (
                  <TableCell
                    key={`${assignment.id}-${standard.standardId}`}
                    align="center"
                    sx={{
                      minWidth: 100,
                      fontWeight: 600,
                    }}
                  >
                    <Tooltip title={standard.standardDescription}>
                      <Box>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                          {standard.standardCode}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {assignment.name}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                ))
              }
            </React.Fragment>
          );
        })}

        <TableCell
          align="center"
          sx={{
            minWidth: 100,
            fontWeight: 600,
            cursor: "pointer",
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          }}
          onClick={() => handleSort("average")}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            Average
            <SortIcon fontSize="small" />
          </Box>
        </TableCell>
      </TableRow>
    ),
    [assignments, theme, handleSort, showStandardsGrading, standardsGradingMode, getAssignmentStandards]
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!processedData.length) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No grade data available
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Add students and assignments to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "70vh", width: "100%" }}>
      <TableContainer
        component={Paper}
        sx={{
          height: "100%",
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>{HeaderRow}</TableHead>
          <TableBody sx={{ backgroundColor: theme.palette.background.paper }}>
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height - 48} // Subtract header height
                  itemCount={processedData.length}
                  itemSize={60} // Row height
                  width={width}
                >
                  {RowRenderer}
                </List>
              )}
            </AutoSizer>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VirtualizedGradeTable;
