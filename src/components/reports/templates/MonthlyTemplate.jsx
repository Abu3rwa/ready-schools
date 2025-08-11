import React from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import dayjs from "dayjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyTemplate({ data, startDate, endDate }) {
  const {
    gradeDistribution,
    attendancePatterns,
    behaviorPatterns,
    teacherComments,
    monthlyProgress,
    goals,
  } = data;

  const getStatusColor = (value) => {
    if (value >= 80) return "success";
    if (value >= 60) return "warning";
    return "error";
  };

  const gradeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Grade Distribution",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    barThickness: 50,
    maxBarThickness: 50,
  };

  const gradeChartData = {
    labels: gradeDistribution.map((grade) => grade.range),
    datasets: [
      {
        label: "Number of Assignments",
        data: gradeDistribution.map((grade) => grade.count),
        backgroundColor: gradeDistribution.map((grade) => {
          const avg = grade.range.split("-").reduce((a, b) => +a + +b, 0) / 2;
          if (avg >= 80) return "rgba(76, 175, 80, 0.5)";
          if (avg >= 60) return "rgba(255, 152, 0, 0.5)";
          return "rgba(244, 67, 54, 0.5)";
        }),
      },
    ],
  };

  const attendanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Attendance Trends",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const attendanceChartData = {
    labels: attendancePatterns.map((day) => dayjs(day.date).format("MMM D")),
    datasets: [
      {
        label: "Present",
        data: attendancePatterns.map((day) =>
          day.status === "present" ? 1 : 0
        ),
        borderColor: "rgba(76, 175, 80, 1)",
        backgroundColor: "rgba(76, 175, 80, 0.5)",
      },
      {
        label: "Late",
        data: attendancePatterns.map((day) => (day.status === "late" ? 1 : 0)),
        borderColor: "rgba(255, 152, 0, 1)",
        backgroundColor: "rgba(255, 152, 0, 0.5)",
      },
      {
        label: "Absent",
        data: attendancePatterns.map((day) =>
          day.status === "absent" ? 1 : 0
        ),
        borderColor: "rgba(244, 67, 54, 1)",
        backgroundColor: "rgba(244, 67, 54, 0.5)",
      },
    ],
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Monthly Academic Report
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {dayjs(startDate).format("MMMM YYYY")}
      </Typography>

      <Grid container spacing={3}>
        {/* Monthly Progress */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Progress Overview
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Current Grade</TableCell>
                    <TableCell>Previous Month</TableCell>
                    <TableCell>Change</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyProgress.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>{subject.currentGrade}%</TableCell>
                      <TableCell>{subject.previousGrade}%</TableCell>
                      <TableCell>
                        <Typography
                          color={
                            subject.change > 0
                              ? "success.main"
                              : subject.change < 0
                              ? "error.main"
                              : "text.secondary"
                          }
                        >
                          {subject.change > 0 ? "+" : ""}
                          {subject.change}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: "30%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={subject.currentGrade}
                          color={getStatusColor(subject.currentGrade)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Grade Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar options={gradeChartOptions} data={gradeChartData} />
            </Box>
          </Card>
        </Grid>

        {/* Attendance Patterns */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Patterns
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                options={attendanceChartOptions}
                data={attendanceChartData}
              />
            </Box>
          </Card>
        </Grid>

        {/* Behavior Patterns */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Behavior Summary
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {behaviorPatterns.map((pattern, index) => (
                    <TableRow key={index}>
                      <TableCell>{pattern.category}</TableCell>
                      <TableCell>{pattern.count}</TableCell>
                      <TableCell>
                        <Typography
                          color={
                            pattern.trend === "improving"
                              ? "success.main"
                              : pattern.trend === "declining"
                              ? "error.main"
                              : "text.secondary"
                          }
                        >
                          {pattern.trend.charAt(0).toUpperCase() +
                            pattern.trend.slice(1)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Teacher Comments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Teacher Comments
            </Typography>
            {teacherComments.map((comment, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" gutterBottom>
                  {comment.subject}
                </Typography>
                <Typography variant="body2">{comment.content}</Typography>
              </Paper>
            ))}
          </Card>
        </Grid>

        {/* Goals and Recommendations */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Goals and Recommendations
            </Typography>
            <Grid container spacing={2}>
              {goals.map((goal, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {goal.area}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Current Status: {goal.currentStatus}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Recommendation: {goal.recommendation}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
