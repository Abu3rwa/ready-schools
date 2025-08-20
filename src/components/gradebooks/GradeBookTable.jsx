import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
} from "@mui/material";

/**
 * GradeBookTable displays students and their grades by category and overall.
 * Props:
 * - students: Array of student objects
 * - assignmentCategories: Array of category names
 * - getCategoryStats: function(category) => stats
 * - calculateCategoryAverage: function(studentId, category) => { average, totalPoints, earnedPoints }
 * - calculateStudentOverall: function(studentId) => { average, totalPoints, earnedPoints }
 * - getLetterGrade: function(percentage) => string
 */
const GradeBookTable = ({
  students,
  assignmentCategories,
  getCategoryStats,
  calculateCategoryAverage,
  calculateStudentOverall,
  getLetterGrade,
}) => (
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
          {students.map((student) => (
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
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {categoryData.average}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {categoryData.earnedPoints}/{categoryData.totalPoints}{" "}
                          pts
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
);

export default GradeBookTable;
