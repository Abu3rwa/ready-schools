import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

const CategoryAveragesDisplay = ({ 
  categories, 
  assignments, 
  grades, 
  students,
  currentGradeBook 
}) => {
  // Calculate category statistics
  const getCategoryStats = (category) => {
    if (!assignments || !grades || !students) return {};

    const categoryAssignments = assignments.filter(
      (a) => a.subject === currentGradeBook?.subject && a.category === category
    );

    if (categoryAssignments.length === 0) return {};

    let totalPoints = 0;
    let totalEarned = 0;
    let totalGrades = 0;

    categoryAssignments.forEach((assignment) => {
      totalPoints += assignment.points || 0;
      const assignmentGrades = grades.filter(
        (g) => g.assignmentId === assignment.id
      );
      assignmentGrades.forEach((grade) => {
        totalEarned += (grade.score / 100) * (assignment.points || 0);
        totalGrades++;
      });
    });

    const averageGrade =
      totalGrades > 0 ? (totalEarned / totalPoints) * 100 : 0;
    const completionRate =
      students.length > 0
        ? (totalGrades / (students.length * categoryAssignments.length)) * 100
        : 0;

    return {
      totalAssignments: categoryAssignments.length,
      totalPoints,
      averageGrade: Math.round(averageGrade * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      totalGrades,
    };
  };

  // Get category configuration
  const getCategoryConfig = (category) => {
    return currentGradeBook?.categories?.find((c) => c.name === category);
  };

  // Calculate overall average
  const calculateOverallAverage = () => {
    const categoryAverages = categories.map(category => {
      const stats = getCategoryStats(category);
      return stats.averageGrade || 0;
    });
    
    const validAverages = categoryAverages.filter(avg => avg > 0);
    return validAverages.length > 0 
      ? Math.round((validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length) * 10) / 10
      : 0;
  };

  return (
    <Box>
      {/* Category Averages Cards */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Category Averages Overview
        </Typography>
        <Grid container spacing={2}>
          {categories.map((category) => {
            const stats = getCategoryStats(category);
            const config = getCategoryConfig(category);
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={category}>
                <Card
                  sx={{
                    height: "100%",
                    border: `2px solid ${config?.color || "#ccc"}`,
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 2 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        backgroundColor: config?.color || "#ccc",
                        mx: "auto",
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {category}
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {stats.averageGrade || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stats.totalAssignments} assignments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.totalPoints} total points
                    </Typography>
                    {config?.weight && (
                      <Chip
                        label={`${config.weight}% weight`}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    )}
                    {stats.completionRate > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {stats.completionRate}% completion
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Traditional Gradebook Summary Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Gradebook Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", backgroundColor: "primary.main", color: "white" }}>
                  Category
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "primary.main", color: "white" }}>
                  Average
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "primary.main", color: "white" }}>
                  Assignments
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "primary.main", color: "white" }}>
                  Total Points
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "primary.main", color: "white" }}>
                  Weight
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => {
                const stats = getCategoryStats(category);
                const config = getCategoryConfig(category);
                
                return (
                  <TableRow key={category} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: config?.color || "#ccc",
                          }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {stats.averageGrade || 0}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {stats.totalAssignments}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {stats.totalPoints}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {config?.weight ? (
                        <Chip
                          label={`${config.weight}%`}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Overall Summary Row */}
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    Overall Average
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {calculateOverallAverage()}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {assignments.filter(a => a.subject === currentGradeBook?.subject).length}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {assignments
                      .filter(a => a.subject === currentGradeBook?.subject)
                      .reduce((sum, a) => sum + (a.points || 0), 0)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    100%
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CategoryAveragesDisplay;
