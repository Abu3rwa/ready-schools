import React, { useState, useEffect, useMemo } from "react";
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
  const { currentUser } = useAuth();
  console.log(currentUser);
  const navigate = useNavigate();
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { grades, loading: gradesLoading } = useGrades();
  const { attendance, loading: attendanceLoading } = useAttendance();
  const { behavior, loading: behaviorLoading } = useBehavior();
  const { communications, loading: communicationsLoading } = useCommunication();

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
      (g) => typeof g.score === "number" && typeof g.points === "number" && g.points > 0
    );
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, g) => acc + (g.score / g.points) * 100, 0);
    return Math.round(sum / valid.length);
  }, [grades]);

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
            ?
              englishGrades.reduce((sum, grade) => sum + (grade.score / grade.points) * 100, 0) /
              englishGrades.length
            : 0;
        const socialAvg =
          socialStudiesGrades.length > 0
            ?
              socialStudiesGrades.reduce((sum, grade) => sum + (grade.score / grade.points) * 100, 0) /
              socialStudiesGrades.length
            : 0;
        setClassAverages({ english: Math.round(englishAvg), socialStudies: Math.round(socialAvg) });
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
                (sum, grade) => sum + (grade.score / grade.points) * 100,
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
                (sum, grade) => sum + (grade.score / grade.points) * 100,
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
      (g) => typeof g.score === "number" && typeof g.points === "number" && g.points > 0
    );
    const bins = [0, 0, 0, 0, 0]; // A, B, C, D, F
    for (const g of all) {
      const pct = (g.score / g.points) * 100;
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
  }, [grades]);

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
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
        Welcome, {currentUser?.displayName || currentUser?.email}!
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
        Here's an overview of your class.
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
              height: '100%'
            }}
          >
            <Avatar sx={{ bgcolor: "primary.main", mr: { xs: 1, sm: 2 }, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
              <PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Students
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
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
              height: '100%'
            }}
          >
            <Avatar sx={{ bgcolor: "secondary.main", mr: { xs: 1, sm: 2 }, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
              <AssignmentIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Assignments
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
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
              height: '100%'
            }}
          >
            <Avatar sx={{ bgcolor: "success.main", mr: { xs: 1, sm: 2 }, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
              <MenuBookIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Class Average
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {classAverage}
                %
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
              height: '100%'
            }}
          >
            <Avatar sx={{ bgcolor: "warning.main", mr: { xs: 1, sm: 2 }, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
              <WarningIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Alerts
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {lowGradeAlerts.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Grade Distribution */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardHeader 
              title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Grade Distribution</Typography>}
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
                            size: window.innerWidth < 600 ? 10 : 12
                          }
                        }
                      },
                      title: {
                        display: false
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          font: {
                            size: window.innerWidth < 600 ? 8 : 10
                          }
                        }
                      },
                      y: {
                        ticks: {
                          font: {
                            size: window.innerWidth < 600 ? 8 : 10
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Overview */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2}>
            <CardHeader 
              title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Attendance Overview</Typography>}
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box sx={{ 
                  height: { xs: 180, sm: 200, md: 250 }, 
                  width: "100%", 
                  maxWidth: { xs: 180, sm: 200, md: 250 }
                }}>
                  <Pie data={attendanceChartData} options={{
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: window.innerWidth < 600 ? 10 : 12
                          }
                        }
                      }
                    }
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Overview */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2}>
            <CardHeader 
              title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Behavior Overview</Typography>}
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box sx={{ 
                  height: { xs: 180, sm: 200, md: 250 }, 
                  width: "100%", 
                  maxWidth: { xs: 180, sm: 200, md: 250 }
                }}>
                  <Pie data={behaviorChartData} options={{
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: window.innerWidth < 600 ? 10 : 12
                          }
                        }
                      }
                    }
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Assignments */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Upcoming Assignments</Typography>}
              action={
                <Button size="small" onClick={() => navigate("/assignments")} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  View All
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ 
                maxHeight: { xs: 200, sm: 250, md: 300 },
                overflow: 'auto'
              }}>
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.map((assignment) => (
                    <ListItem key={assignment.id} divider>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: assignment.subject === "English" ? "primary.main" : "secondary.main",
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 }
                          }}
                        >
                          {assignment.subject === "English" ? "E" : "S"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{assignment.name}</Typography>}
                        secondary={
                          <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {`Due: ${new Date(assignment.dueDate).toLocaleDateString()} • ${assignment.subject}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          No upcoming assignments
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
              title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Low Grade Alerts</Typography>}
              action={
                <Button size="small" onClick={() => navigate("/gradebook")} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  View Grades
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ 
                maxHeight: { xs: 200, sm: 250, md: 300 },
                overflow: 'auto'
              }}>
                {lowGradeAlerts.length > 0 ? (
                  lowGradeAlerts.map((alert, index) => (
                    <ListItem
                      key={`${alert.studentId}-${alert.subject}`}
                      divider={index < lowGradeAlerts.length - 1}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: "error.main",
                          width: { xs: 32, sm: 40 },
                          height: { xs: 32, sm: 40 }
                        }}>
                          <WarningIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{alert.name}</Typography>}
                        secondary={
                          <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
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
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          height: { xs: 24, sm: 32 }
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          No low grade alerts
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
              title={<Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Recent Communications</Typography>}
              action={
                <Button size="small" onClick={() => navigate("/communication")} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  View All
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 } }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ 
                maxHeight: { xs: 250, sm: 300, md: 400 },
                overflow: 'auto'
              }}>
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
                              bgcolor: comm.sentStatus === "Sent" ? "success.main" : "warning.main",
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 }
                            }}
                          >
                            {comm.sentStatus === "Sent" ? (
                              <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            ) : (
                              <EmailIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{comm.subject}</Typography>}
                          secondary={
                            <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {`To: ${studentName} • ${new Date(comm.date).toLocaleDateString()}`}
                            </Typography>
                          }
                        />
                        <Chip
                          label={comm.sentStatus}
                          size="small"
                          color={comm.sentStatus === "Sent" ? "success" : "warning"}
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            height: { xs: 24, sm: 32 }
                          }}
                        />
                      </ListItem>
                    );
                  })
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          No recent communications
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
