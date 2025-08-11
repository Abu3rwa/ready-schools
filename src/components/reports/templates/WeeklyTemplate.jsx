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
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function WeeklyTemplate({ data, startDate, endDate }) {
  const {
    academicProgress,
    attendanceSummary,
    behaviorSummary,
    upcomingAssessments,
    weeklyGradeChanges,
  } = data;

  const getStatusColor = (value) => {
    if (value >= 80) return "success";
    if (value >= 60) return "warning";
    return "error";
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Grade Progress",
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

  const chartData = {
    labels: weeklyGradeChanges.map((grade) => grade.subject),
    datasets: [
      {
        label: "Previous Week",
        data: weeklyGradeChanges.map((grade) => grade.previousWeek),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
      {
        label: "Current Week",
        data: weeklyGradeChanges.map((grade) => grade.currentWeek),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Weekly Progress Report
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {dayjs(startDate).format("MMM D")} -{" "}
        {dayjs(endDate).format("MMM D, YYYY")}
      </Typography>

      <Grid container spacing={3}>
        {/* Academic Progress */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Academic Progress
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Assignments Completed</TableCell>
                    <TableCell>Average Score</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {academicProgress.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>
                        {subject.completedAssignments}/
                        {subject.totalAssignments}
                      </TableCell>
                      <TableCell>{subject.averageScore}%</TableCell>
                      <TableCell sx={{ width: "30%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={subject.averageScore}
                          color={getStatusColor(subject.averageScore)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Attendance Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Summary
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(attendanceSummary).map(([status, count]) => (
                <Grid item xs={4} key={status}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      color={
                        status === "present"
                          ? "success.main"
                          : status === "late"
                          ? "warning.main"
                          : "error.main"
                      }
                    >
                      {count}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>

        {/* Behavior Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Behavior Summary
            </Typography>
            {behaviorSummary.incidents.length === 0 ? (
              <Typography variant="body1" color="success.main">
                No incidents this week
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {behaviorSummary.incidents.map((incident, index) => (
                      <TableRow key={index}>
                        <TableCell>{incident.type}</TableCell>
                        <TableCell>{incident.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Upcoming Assessments */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Assessments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingAssessments.map((assessment, index) => (
                    <TableRow key={index}>
                      <TableCell>{assessment.subject}</TableCell>
                      <TableCell>{assessment.title}</TableCell>
                      <TableCell>
                        {dayjs(assessment.dueDate).format("MMM D, YYYY")}
                      </TableCell>
                      <TableCell>{assessment.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Weekly Grade Changes Chart */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Grade Progress
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar options={chartOptions} data={chartData} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
