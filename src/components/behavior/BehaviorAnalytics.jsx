import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  LinearProgress,
  Alert,
} from "@mui/material";
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
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useBehavior } from "../../contexts/BehaviorContext";
import { getSkillFrequencyAnalysis, getStudentBehaviorTrends } from "../../services/behaviorService";
import { useStudents } from "../../contexts/StudentContext";
import Loading from "../common/Loading";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const BehaviorAnalytics = () => {
  const { students } = useStudents();
  const { behavior, loading } = useBehavior();
  
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [selectedStudent, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      
      // Load skill frequency analysis
      const filters = selectedStudent !== "all" ? { studentId: selectedStudent } : {};
      const skillAnalysis = await getSkillFrequencyAnalysis(filters);
      setAnalyticsData(skillAnalysis);

      // Load trends data for selected student
      if (selectedStudent !== "all") {
        const trends = await getStudentBehaviorTrends(selectedStudent, timeRange);
        setTrendsData(trends);
      } else {
        setTrendsData(null);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const prepareSkillChartData = () => {
    if (!analyticsData) return { labels: [], datasets: [] };
    
    const skills = Object.keys(analyticsData.skillFrequency);
    const strengthData = skills.map(skill => analyticsData.skillTypeCount[skill]?.strength || 0);
    const growthData = skills.map(skill => analyticsData.skillTypeCount[skill]?.growth || 0);
    
    return {
      labels: skills,
      datasets: [
        {
          label: 'Strengths',
          data: strengthData,
          backgroundColor: '#00C49F',
          borderColor: '#00C49F',
          borderWidth: 1,
        },
        {
          label: 'Growth Areas',
          data: growthData,
          backgroundColor: '#FF8042',
          borderColor: '#FF8042',
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareTrendsChartData = () => {
    if (!trendsData) return { labels: [], datasets: [] };
    
    const dates = Object.keys(trendsData);
    const strengthData = dates.map(date => trendsData[date].strengths);
    const growthData = dates.map(date => trendsData[date].growthAreas);
    
    return {
      labels: dates.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Strengths',
          data: strengthData,
          borderColor: '#00C49F',
          backgroundColor: 'rgba(0, 196, 159, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Growth Areas',
          data: growthData,
          borderColor: '#FF8042',
          backgroundColor: 'rgba(255, 128, 66, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const preparePieChartData = () => {
    if (!analyticsData) return { labels: [], datasets: [] };
    
    const totalStrengths = Object.values(analyticsData.skillTypeCount)
      .reduce((sum, skill) => sum + skill.strength, 0);
    const totalGrowth = Object.values(analyticsData.skillTypeCount)
      .reduce((sum, skill) => sum + skill.growth, 0);
    
    return {
      labels: ['Strengths', 'Growth Areas'],
      datasets: [
        {
          data: [totalStrengths, totalGrowth],
          backgroundColor: ['#00C49F', '#FF8042'],
          borderColor: ['#00C49F', '#FF8042'],
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading || loadingAnalytics) {
    return <Loading />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Behavior Analytics
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Student</InputLabel>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <MenuItem value="all">All Students</MenuItem>
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {analyticsData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Observations
                  </Typography>
                  <Typography variant="h4">
                    {analyticsData.totalBehaviors}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Skills Tracked
                  </Typography>
                  <Typography variant="h4">
                    {Object.keys(analyticsData.skillFrequency).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Most Observed Skill
                  </Typography>
                  <Typography variant="h6">
                    {Object.entries(analyticsData.skillFrequency)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Skill Frequency Chart */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Skill Frequency Analysis
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={prepareSkillChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Pie Chart */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Strengths vs Growth Areas
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Pie 
                      data={preparePieChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Trends Chart (for individual students) */}
            {selectedStudent !== "all" && trendsData && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Behavior Trends Over Time
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line 
                        data={prepareTrendsChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default BehaviorAnalytics;
