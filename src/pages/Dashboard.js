import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Psychology as PsychologyIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useStudents } from "../contexts/StudentContext";
import { useAssignments } from "../contexts/AssignmentContext";
import { useGrades } from "../contexts/GradeContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { useBehavior } from "../contexts/BehaviorContext";
import { useCommunication } from "../contexts/CommunicationContext";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/common/Loading";


// Chart.js components
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Handle welcome message from login
  useEffect(() => {
    if (location.state?.newLogin) {
      setShowWelcome(true);
      setWelcomeMessage(location.state.message);
      // Clear the state after showing the message
      navigate("/", { replace: true });
    }
  }, [location, navigate]);
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { grades, loading: gradesLoading } = useGrades();
  const { attendance, loading: attendanceLoading } = useAttendance();
  const { behavior, loading: behaviorLoading } = useBehavior();
  const { communications, loading: communicationsLoading } = useCommunication();

  // Helper function to get consistent colors for subjects
  const getSubjectColor = (subject) => {
    const colorMap = {
      'ELA': '#1976d2',      // Blue
      'English': '#1976d2',  // Blue
      'Math': '#2e7d32',     // Green
      'Mathematics': '#2e7d32', // Green
      'Science': '#ed6c02',  // Orange
      'Social Studies': '#9c27b0', // Purple
      'History': '#9c27b0',  // Purple
      'Art': '#d32f2f',      // Red
      'Music': '#d32f2f',    // Red
      'PE': '#388e3c',       // Dark Green
      'Physical Education': '#388e3c', // Dark Green
    };
    return colorMap[subject] || '#666666'; // Default gray
  };

  const englishGrades = useMemo(
    () => (grades ? grades.filter((g) => g.subject === "English") : []),
    [grades]
  );
  const socialStudiesGrades = useMemo(
    () => (grades ? grades.filter((g) => g.subject === "Social Studies") : []),
    [grades]
  );

  // Overall class average across all available grades (dynamic subjects)
  const classAverage = useMemo(() => {
    const valid = (grades || []).filter(
      (g) => typeof g.score === "number"
    );
    if (valid.length === 0) return null;
    
    const sum = valid.reduce((acc, g) => {
      if (g.points && g.points > 0) {
        // Calculate percentage: (score / points) * 100
        return acc + (g.score / g.points) * 100;
      } else {
        // For grades without points, we need to look up the assignment
        const assignment = assignments.find(a => a.id === g.assignmentId);
        if (assignment && assignment.points && assignment.points > 0) {
          // Calculate percentage using assignment points
          return acc + (g.score / assignment.points) * 100;
        } else {
          // Skip grades where we can't determine points
          return acc;
        }
      }
    }, 0);
    
    return Math.round(sum / valid.length);
  }, [grades, assignments]);

  // Subject-specific class averages
  const subjectAverages = useMemo(() => {
    if (!grades || grades.length === 0) return {};
    
    const subjectGroups = {};
    
    grades.forEach(grade => {
      if (typeof grade.score === "number") {
        if (!subjectGroups[grade.subject]) {
          subjectGroups[grade.subject] = [];
        }
        subjectGroups[grade.subject].push(grade);
      }
    });
    
    const averages = {};
    Object.entries(subjectGroups).forEach(([subject, subjectGrades]) => {
      if (subjectGrades.length > 0) {
        const sum = subjectGrades.reduce((acc, g) => {
          if (g.points && g.points > 0) {
            // Calculate percentage: (score / points) * 100
            return acc + (g.score / g.points) * 100;
          } else {
            // For grades without points, we need to look up the assignment
            const assignment = assignments.find(a => a.id === g.assignmentId);
            if (assignment && assignment.points && assignment.points > 0) {
              // Calculate percentage using assignment points
              return acc + (g.score / assignment.points) * 100;
            } else {
              // Skip grades where we can't determine points
              return acc;
            }
          }
        }, 0);
        averages[subject] = Math.round(sum / subjectGrades.length);
      }
    });
    
    return averages;
  }, [grades, assignments]);

  const [classAverages, setClassAverages] = useState({
    english: 0,
    socialStudies: 0,
  });
  const [attendanceData, setAttendanceData] = useState({
    present: 0,
    absent: 0,
    tardy: 0,
  });
  const [behaviorData, setBehaviorData] = useState({
    positive: 0,
    negative: 0,
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentCommunications, setRecentCommunications] = useState([]);
  const [lowGradeAlerts, setLowGradeAlerts] = useState([]);

  const loading =
    studentsLoading ||
    assignmentsLoading ||
    gradesLoading ||
    attendanceLoading ||
    behaviorLoading ||
    communicationsLoading;

  useEffect(() => {
    if (!loading) {
      // Optional: keep legacy per-subject averages if needed for other widgets
      if (englishGrades.length > 0 || socialStudiesGrades.length > 0) {
        const englishAvg =
          englishGrades.length > 0
            ? englishGrades.reduce(
                (sum, grade) => sum + (grade.points && grade.points > 0 ? (grade.score / grade.points) * 100 : 0),
                0
              ) / englishGrades.length
            : 0;
        const socialAvg =
          socialStudiesGrades.length > 0
            ? socialStudiesGrades.reduce(
                (sum, grade) => sum + (grade.points && grade.points > 0 ? (grade.score / grade.points) * 100 : 0),
                0
              ) / socialStudiesGrades.length
            : 0;
        setClassAverages({
          english: Math.round(englishAvg),
          socialStudies: Math.round(socialAvg),
        });
      }

      // Calculate attendance statistics
      if (attendance.length > 0) {
        const present = attendance.filter((a) => a.status === "Present").length;
        const absent = attendance.filter((a) => a.status === "Absent").length;
        const tardy = attendance.filter((a) => a.status === "Tardy").length;

        setAttendanceData({ present, absent, tardy });
      }

      // Calculate behavior statistics
      if (behavior.length > 0) {
        const positive = behavior.filter((b) => b.type === "Positive").length;
        const negative = behavior.filter((b) => b.type === "Negative").length;

        setBehaviorData({ positive, negative });
      }

      // Get upcoming assignments (due in the next 7 days)
      if (assignments.length > 0) {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcoming = assignments
          .filter((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
          })
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setUpcomingAssignments(upcoming.slice(0, 5)); // Show top 5
      }

      // Get recent communications
      if (communications.length > 0) {
        const recent = [...communications]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setRecentCommunications(recent);
      }

      // Generate low grade alerts (students with grades below 70%)
      if (students.length > 0 && englishGrades.length > 0) {
        const alerts = [];

        students.forEach((student) => {
          const studentEnglishGrades = englishGrades.filter(
            (g) => g.studentId === student.id
          );
          const studentSocialGrades = socialStudiesGrades.filter(
            (g) => g.studentId === student.id
          );

          if (studentEnglishGrades.length > 0) {
            const englishAvg =
              studentEnglishGrades.reduce(
                (sum, grade) => sum + (grade.points && grade.points > 0 ? (grade.score / grade.points) * 100 : 0),
                0
              ) / studentEnglishGrades.length;

            if (englishAvg < 70) {
              alerts.push({
                studentId: student.id,
                name: `${student.firstName} ${student.lastName}`,
                subject: "English",
                average: Math.round(englishAvg),
              });
            }
          }

          if (studentSocialGrades.length > 0) {
            const socialAvg =
              studentSocialGrades.reduce(
                (sum, grade) => sum + (grade.points && grade.points > 0 ? (grade.score / grade.points) * 100 : 0),
                0
              ) / studentSocialGrades.length;

            if (socialAvg < 70) {
              alerts.push({
                studentId: student.id,
                name: `${student.firstName} ${student.lastName}`,
                subject: "Social Studies",
                average: Math.round(socialAvg),
              });
            }
          }
        });

        setLowGradeAlerts(alerts);
      }
    }
  }, [
    loading,
    students,
    assignments,
    englishGrades,
    socialStudiesGrades,
    attendance,
    behavior,
    communications,
  ]);

  // Prepare chart data
  // Grade distribution across all subjects
  const gradeDistributionData = useMemo(() => {
    const all = (grades || []).filter(
      (g) => typeof g.score === "number"
    );
    const bins = [0, 0, 0, 0, 0]; // A, B, C, D, F
    for (const g of all) {
      let pct;
      if (g.points && g.points > 0) {
        // Calculate percentage: (score / points) * 100
        pct = (g.score / g.points) * 100;
      } else {
        // For grades without points, we need to look up the assignment
        const assignment = assignments.find(a => a.id === g.assignmentId);
        if (assignment && assignment.points && assignment.points > 0) {
          // Calculate percentage using assignment points
          pct = (g.score / assignment.points) * 100;
        } else {
          // Skip grades where we can't determine points
          continue;
        }
      }
      
      if (pct >= 90) bins[0]++;
      else if (pct >= 80) bins[1]++;
      else if (pct >= 70) bins[2]++;
      else if (pct >= 60) bins[3]++;
      else bins[4]++;
    }
    return {
      labels: [
        "A (90-100%)",
        "B (80-89%)",
        "C (70-79%)",
        "D (60-69%)",
        "F (Below 60%)",
      ],
      datasets: [
        {
          label: "All Subjects",
          data: bins,
          backgroundColor: "rgba(25, 118, 210, 0.5)", // MUI primary
          borderColor: "rgba(25, 118, 210, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [grades, assignments]);

  // Grade distribution per subject
  const subjectGradeDistributionData = useMemo(() => {
    if (!grades || grades.length === 0) return {};
    
    const subjectGroups = {};
    
    // Group grades by subject
    grades.forEach(grade => {
      if (typeof grade.score === "number") {
        if (!subjectGroups[grade.subject]) {
          subjectGroups[grade.subject] = [];
        }
        subjectGroups[grade.subject].push(grade);
      }
    });
    
    const distributions = {};
    
    Object.entries(subjectGroups).forEach(([subject, subjectGrades]) => {
      const bins = [0, 0, 0, 0, 0]; // A, B, C, D, F
      
      for (const grade of subjectGrades) {
        let pct;
        if (grade.points && grade.points > 0) {
          // Calculate percentage: (score / points) * 100
          pct = (grade.score / grade.points) * 100;
        } else {
          // For grades without points, we need to look up the assignment
          const assignment = assignments.find(a => a.id === grade.assignmentId);
          if (assignment && assignment.points && assignment.points > 0) {
            // Calculate percentage using assignment points
            pct = (grade.score / assignment.points) * 100;
          } else {
            // Skip grades where we can't determine points
            continue;
          }
        }
        
        if (pct >= 90) bins[0]++;
        else if (pct >= 80) bins[1]++;
        else if (pct >= 70) bins[2]++;
        else if (pct >= 60) bins[3]++;
        else bins[4]++;
      }
      
      distributions[subject] = {
        labels: [
          "A (90-100%)",
          "B (80-89%)",
          "C (70-79%)",
          "D (60-69%)",
          "F (Below 60%)",
        ],
        datasets: [
          {
            label: subject,
            data: bins,
            backgroundColor: `${getSubjectColor(subject)}80`, // Subject color with transparency
            borderColor: getSubjectColor(subject),
            borderWidth: 2,
          },
        ],
      };
    });
    
    return distributions;
  }, [grades, assignments]);

  const attendanceChartData = {
    labels: ["Present", "Absent", "Tardy"],
    datasets: [
      {
        data: [
          attendanceData.present,
          attendanceData.absent,
          attendanceData.tardy,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const behaviorChartData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        data: [behaviorData.positive, behaviorData.negative],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return <Loading message="Loading dashboard data..." />;
  }

  return (
    <Box sx={{ flexGrow: 1, px: { xs: 2, sm: 0 } }}>
      <Snackbar
        open={showWelcome}
        autoHideDuration={6000}
        onClose={() => setShowWelcome(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowWelcome(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {welcomeMessage}
        </Alert>
      </Snackbar>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.25rem" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        {t('welcomeMessage', { name: currentUser?.displayName || currentUser?.email })}
      </Typography>
      <Typography
        variant="subtitle1"
        color="textSecondary"
        gutterBottom
        sx={{
          fontSize: { xs: "0.875rem", sm: "1rem" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        {t('overview')}
      </Typography>



      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: { xs: 2, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: { xs: 1, sm: 2 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
              }}
            >
              <PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {t('navigation.students')}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
              >
                {students.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "secondary.main",
                mr: { xs: 1, sm: 2 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
              }}
            >
              <AssignmentIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {t('navigation.assignments')}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
              >
                {assignments.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "success.main",
                mr: { xs: 1, sm: 2 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
              }}
            >
              <MenuBookIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {t('classAverage')}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
              >
                {classAverage !== null ? `${classAverage}%` : 'N/A'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "warning.main",
                mr: { xs: 1, sm: 2 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
              }}
            >
              <WarningIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {t('alerts')}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
              >
                {lowGradeAlerts.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Subject-Specific Averages */}
      {Object.keys(subjectAverages).length > 0 && (
        <Box sx={{ mb: { xs: 2, md: 4 } }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            📊 Subject Averages
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(subjectAverages).map(([subject, average]) => (
              <Grid item xs={6} sm={4} md={3} key={subject}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    textAlign: "center",
                    height: "100%",
                    background: `linear-gradient(135deg, ${getSubjectColor(subject)}20 0%, ${getSubjectColor(subject)}10 100%)`,
                    border: `1px solid ${getSubjectColor(subject)}30`,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      color: getSubjectColor(subject),
                      fontWeight: "bold",
                    }}
                  >
                    {average}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    {subject}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Main Dashboard Content */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Grade Distribution */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardHeader
              title={
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {t('gradeDistribution')}
                </Typography>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Box sx={{ height: { xs: 200, sm: 300 } }}>
                <Bar
                  data={gradeDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: window.innerWidth < 600 ? 10 : 12,
                          },
                        },
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          font: {
                            size: window.innerWidth < 600 ? 8 : 10,
                          },
                        },
                      },
                      y: {
                        ticks: {
                          font: {
                            size: window.innerWidth < 600 ? 8 : 10,
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Subject-Specific Grade Distributions */}
        {Object.keys(subjectGradeDistributionData).length > 0 && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardHeader
                title={
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                  >
                    📊 Grade Distribution by Subject
                  </Typography>
                }
                sx={{ p: { xs: 2, sm: 3 } }}
              />
              <Divider />
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Grid container spacing={2}>
                  {Object.entries(subjectGradeDistributionData).map(([subject, chartData]) => (
                    <Grid item xs={12} sm={6} md={4} key={subject}>
                      <Box sx={{ height: { xs: 200, sm: 250 } }}>
                        <Typography variant="subtitle2" gutterBottom align="center" color="textSecondary">
                          {subject}
                        </Typography>
                        <Bar
                          data={chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false, // Hide legend for individual subject charts
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              x: {
                                ticks: {
                                  font: {
                                    size: window.innerWidth < 600 ? 6 : 8,
                                  },
                                },
                              },
                              y: {
                                ticks: {
                                  font: {
                                    size: window.innerWidth < 600 ? 6 : 8,
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Attendance Overview */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2}>
            <CardHeader
              title={
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {t('attendanceOverview')}
                </Typography>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    height: { xs: 180, sm: 200, md: 250 },
                    width: "100%",
                    maxWidth: { xs: 180, sm: 200, md: 250 },
                  }}
                >
                  <Pie
                    data={attendanceChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                              size: window.innerWidth < 600 ? 10 : 12,
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Overview */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2}>
            <CardHeader
              title={
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {t('behaviorOverview')}
                </Typography>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    height: { xs: 180, sm: 200, md: 250 },
                    width: "100%",
                    maxWidth: { xs: 180, sm: 200, md: 250 },
                  }}
                >
                  <Pie
                    data={behaviorChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                              size: window.innerWidth < 600 ? 10 : 12,
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Assignments */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardHeader
              title={
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {t('upcomingAssignments')}
                </Typography>
              }
              action={
                <Button
                  size="small"
                  onClick={() => navigate("/assignments")}
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {t('viewAll')}
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List
                sx={{
                  maxHeight: { xs: 200, sm: 250, md: 300 },
                  overflow: "auto",
                }}
              >
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.map((assignment) => (
                    <ListItem key={assignment.id} divider>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              assignment.subject === "English"
                                ? "primary.main"
                                : "secondary.main",
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                          }}
                        >
                          {assignment.subject === "English" ? "E" : "S"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                          >
                            {assignment.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                          >
                            {`Due: ${new Date(
                              assignment.dueDate
                            ).toLocaleDateString()} • ${assignment.subject}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                        >
                          {t('noUpcomingAssignments')}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Grade Alerts */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardHeader
              title={
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {t('lowGradeAlerts')}
                </Typography>
              }
              action={
                <Button
                  size="small"
                  onClick={() => navigate("/gradebook")}
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {t('viewGrades')}
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List
                sx={{
                  maxHeight: { xs: 200, sm: 250, md: 300 },
                  overflow: "auto",
                }}
              >
                {lowGradeAlerts.length > 0 ? (
                  lowGradeAlerts.map((alert, index) => (
                    <ListItem
                      key={`${alert.studentId}-${alert.subject}`}
                      divider={index < lowGradeAlerts.length - 1}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: "error.main",
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                          }}
                        >
                          <WarningIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                          >
                            {alert.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                          >
                            {`${alert.subject}: ${alert.average}%`}
                          </Typography>
                        }
                      />
                      <Chip
                        label="Contact"
                        size="small"
                        color="primary"
                        onClick={() => navigate("/communication")}
                        sx={{
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          height: { xs: 24, sm: 32 },
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                        >
                          {t('noLowGradeAlerts')}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Communications */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader
              title={
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  {t('recentCommunications')}
                </Typography>
              }
              action={
                <Button
                  size="small"
                  onClick={() => navigate("/communication")}
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {t('viewAll')}
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List
                sx={{
                  maxHeight: { xs: 250, sm: 300, md: 400 },
                  overflow: "auto",
                }}
              >
                {recentCommunications.length > 0 ? (
                  recentCommunications.map((comm, index) => {
                    const student = students.find(
                      (s) => s.id === comm.studentId
                    );
                    const studentName = student
                      ? `${student.firstName} ${student.lastName}`
                      : "Unknown Student";

                    return (
                      <ListItem
                        key={`${comm.studentId}-${comm.date}`}
                        divider={index < recentCommunications.length - 1}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                comm.sentStatus === "Sent"
                                  ? "success.main"
                                  : "warning.main",
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 },
                            }}
                          >
                            {comm.sentStatus === "Sent" ? (
                              <CheckCircleIcon
                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                              />
                            ) : (
                              <EmailIcon
                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                              />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                            >
                              {comm.subject}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              sx={{
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              {`To: ${studentName} • ${new Date(
                                comm.date
                              ).toLocaleDateString()}`}
                            </Typography>
                          }
                        />
                        <Chip
                          label={comm.sentStatus}
                          size="small"
                          color={
                            comm.sentStatus === "Sent" ? "success" : "warning"
                          }
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            height: { xs: 24, sm: 32 },
                          }}
                        />
                      </ListItem>
                    );
                  })
                ) : (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                        >
                          {t('noRecentCommunications')}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
