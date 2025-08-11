import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

const StudentAnalytics = ({ student, grades, attendance, behavior }) => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState("month");

  // Mock data - in real implementation, this would come from the contexts
  const mockGradeData = [
    { month: "Sep", english: 85, math: 78, science: 92, socialStudies: 88 },
    { month: "Oct", english: 87, math: 82, science: 89, socialStudies: 85 },
    { month: "Nov", english: 90, math: 85, science: 91, socialStudies: 87 },
    { month: "Dec", english: 88, math: 88, science: 93, socialStudies: 90 },
    { month: "Jan", english: 92, math: 90, science: 94, socialStudies: 89 },
  ];

  const mockAttendanceData = [
    { month: "Sep", present: 22, absent: 2, tardy: 1 },
    { month: "Oct", present: 20, absent: 3, tardy: 2 },
    { month: "Nov", present: 21, absent: 1, tardy: 0 },
    { month: "Dec", present: 19, absent: 2, tardy: 1 },
    { month: "Jan", present: 23, absent: 0, tardy: 0 },
  ];

  const mockBehaviorData = [
    { month: "Sep", positive: 15, negative: 2 },
    { month: "Oct", positive: 18, negative: 1 },
    { month: "Nov", positive: 20, negative: 0 },
    { month: "Dec", positive: 16, negative: 1 },
    { month: "Jan", positive: 22, negative: 0 },
  ];

  const calculateOverallGPA = () => {
    if (!grades || !grades.overall) return 0;
    return grades.overall;
  };

  const calculateAttendanceRate = () => {
    if (!attendance) return 0;
    const total = attendance.present + attendance.absent + attendance.tardy;
    return total > 0 ? Math.round((attendance.present / total) * 100) : 0;
  };

  const calculateBehaviorScore = () => {
    if (!behavior) return 0;
    const total = behavior.positive + behavior.negative;
    return total > 0 ? Math.round((behavior.positive / total) * 100) : 0;
  };

  const getPerformanceTrend = () => {
    const currentGPA = calculateOverallGPA();
    const currentAttendance = calculateAttendanceRate();
    const currentBehavior = calculateBehaviorScore();

    if (currentGPA >= 3.5 && currentAttendance >= 95 && currentBehavior >= 90) {
      return {
        trend: "excellent",
        color: "success",
        icon: <CheckCircleIcon />,
      };
    } else if (
      currentGPA >= 3.0 &&
      currentAttendance >= 90 &&
      currentBehavior >= 80
    ) {
      return { trend: "good", color: "info", icon: <InfoIcon /> };
    } else if (
      currentGPA < 2.0 ||
      currentAttendance < 85 ||
      currentBehavior < 70
    ) {
      return { trend: "at-risk", color: "error", icon: <WarningIcon /> };
    } else {
      return { trend: "improving", color: "warning", icon: <TrendingUpIcon /> };
    }
  };

  const getSubjectPerformance = () => {
    if (!grades) return [];

    return [
      { subject: "English", grade: grades.english || 0, color: "#0088FE" },
      { subject: "Math", grade: grades.math || 0, color: "#00C49F" },
      { subject: "Science", grade: grades.science || 0, color: "#FFBB28" },
      {
        subject: "Social Studies",
        grade: grades.socialStudies || 0,
        color: "#FF8042",
      },
    ];
  };

  const getAttendanceBreakdown = () => {
    if (!attendance) return [];

    return [
      { name: "Present", value: attendance.present || 0, color: "#4caf50" },
      { name: "Absent", value: attendance.absent || 0, color: "#f44336" },
      { name: "Tardy", value: attendance.tardy || 0, color: "#ff9800" },
    ];
  };

  const getBehaviorBreakdown = () => {
    if (!behavior) return [];

    return [
      { name: "Positive", value: behavior.positive || 0, color: "#4caf50" },
      { name: "Negative", value: behavior.negative || 0, color: "#f44336" },
    ];
  };

  const performanceTrend = getPerformanceTrend();
  const subjectPerformance = getSubjectPerformance();
  const attendanceBreakdown = getAttendanceBreakdown();
  const behaviorBreakdown = getBehaviorBreakdown();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <SchoolIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h5" gutterBottom>
            Student Analytics
          </Typography>
          <Chip
            icon={performanceTrend.icon}
            label={performanceTrend.trend}
            color={performanceTrend.color}
            sx={{ ml: "auto" }}
          />
        </Box>

        {/* Overall Performance Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {calculateOverallGPA()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall GPA
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(calculateOverallGPA() / 4) * 100}
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {calculateAttendanceRate()}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Attendance Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateAttendanceRate()}
                color="success"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" color="info.main">
                {calculateBehaviorScore()}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Behavior Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateBehaviorScore()}
                color="info"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Alerts */}
        {performanceTrend.trend === "at-risk" && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This student may need additional support. Consider scheduling a
              parent conference or academic intervention.
            </Typography>
          </Alert>
        )}

        {/* Analytics Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Academic Performance" />
            <Tab label="Attendance Patterns" />
            <Tab label="Behavior Trends" />
            <Tab label="Subject Breakdown" />
          </Tabs>
        </Box>

        {/* Academic Performance Tab */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Grade Trends Over Time
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell>English</TableCell>
                    <TableCell>Math</TableCell>
                    <TableCell>Science</TableCell>
                    <TableCell>Social Studies</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockGradeData.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell>{row.english}%</TableCell>
                      <TableCell>{row.math}%</TableCell>
                      <TableCell>{row.science}%</TableCell>
                      <TableCell>{row.socialStudies}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Attendance Patterns Tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Attendance Patterns
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly Attendance Data
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell>Present</TableCell>
                        <TableCell>Absent</TableCell>
                        <TableCell>Tardy</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockAttendanceData.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell>{row.present}</TableCell>
                          <TableCell>{row.absent}</TableCell>
                          <TableCell>{row.tardy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Attendance Breakdown
                </Typography>
                <Box sx={{ p: 2 }}>
                  {attendanceBreakdown.map((item) => (
                    <Box key={item.name} sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {item.name}: {item.value} (
                        {(
                          (item.value /
                            attendanceBreakdown.reduce(
                              (sum, i) => sum + i.value,
                              0
                            )) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (item.value /
                            attendanceBreakdown.reduce(
                              (sum, i) => sum + i.value,
                              0
                            )) *
                          100
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                        color={
                          item.name === "Present"
                            ? "success"
                            : item.name === "Absent"
                            ? "error"
                            : "warning"
                        }
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Behavior Trends Tab */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Behavior Trends
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly Behavior Data
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell>Positive</TableCell>
                        <TableCell>Negative</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockBehaviorData.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell>{row.positive}</TableCell>
                          <TableCell>{row.negative}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Behavior Breakdown
                </Typography>
                <Box sx={{ p: 2 }}>
                  {behaviorBreakdown.map((item) => (
                    <Box key={item.name} sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {item.name}: {item.value} (
                        {(
                          (item.value /
                            behaviorBreakdown.reduce(
                              (sum, i) => sum + i.value,
                              0
                            )) *
                          100
                        ).toFixed(0)}
                        %)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (item.value /
                            behaviorBreakdown.reduce(
                              (sum, i) => sum + i.value,
                              0
                            )) *
                          100
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                        color={item.name === "Positive" ? "success" : "error"}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Subject Breakdown Tab */}
        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Subject Performance Analysis
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Current Grade</TableCell>
                    <TableCell>Performance Level</TableCell>
                    <TableCell>Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectPerformance.map((subject) => (
                    <TableRow key={subject.subject}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: subject.color,
                              mr: 1,
                            }}
                          />
                          {subject.subject}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          {subject.grade}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            subject.grade >= 90
                              ? "Excellent"
                              : subject.grade >= 80
                              ? "Good"
                              : subject.grade >= 70
                              ? "Average"
                              : "Needs Improvement"
                          }
                          color={
                            subject.grade >= 90
                              ? "success"
                              : subject.grade >= 80
                              ? "info"
                              : subject.grade >= 70
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {subject.grade >= 85 ? (
                          <Tooltip title="Improving">
                            <IconButton size="small" color="success">
                              <TrendingUpIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Needs Attention">
                            <IconButton size="small" color="warning">
                              <TrendingDownIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentAnalytics;
