import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  HeatMap as HeatMapIcon,
} from "@mui/icons-material";
import { useStandardsGrading } from "../../contexts/StandardsGradingContext";
import { useStudents } from "../../contexts/StudentContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useGrades } from "../../contexts/GradeContext";

const StandardsProgressDashboard = ({
  studentId = null, // null for class view
  subject = null,
  timeRange = "semester",
}) => {
  const { students } = useStudents();
  const { assignments } = useAssignments();
  const { grades } = useGrades();
  const { 
    getStudentStandardsProgress, 
    generateStudentProgressReport,
    getStudentMasteryLevel,
    standardsGrades,
    getStandardsGradesByStudent,
    getStandardsGradesByAssignment,
  } = useStandardsGrading();

  const [selectedStudent, setSelectedStudent] = useState(studentId);
  const [selectedSubject, setSelectedSubject] = useState(subject);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState(null);
  
  // Phase 3 Enhanced Features
  const [showInterventionAlerts, setShowInterventionAlerts] = useState(true);
  const [masteryThreshold, setMasteryThreshold] = useState(3.0);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'class'
  const [filterByStandard, setFilterByStandard] = useState('');
  const [sortBy, setSortBy] = useState('mastery'); // 'mastery', 'progress', 'name'

  // Load progress data
  useEffect(() => {
    const loadProgressData = async () => {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const report = generateStudentProgressReport(
          selectedStudent,
          assignments,
          getTimeRangeDates(selectedTimeRange)
        );
        setProgressData(report);
      } catch (error) {
        console.error("Error loading progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [selectedStudent, selectedTimeRange, assignments, generateStudentProgressReport]);

  // Get time range dates
  const getTimeRangeDates = (range) => {
    const now = new Date();
    const start = new Date();

    switch (range) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      case "semester":
        start.setMonth(now.getMonth() - 6);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 3);
    }

    return { start, end: now };
  };

  // Phase 3: Enhanced Analytics Functions

  // Mastery Tracking System
  const calculateMasteryLevel = (proficiencyLevel, threshold = masteryThreshold) => {
    if (proficiencyLevel >= threshold) return 'Mastered';
    if (proficiencyLevel >= threshold - 0.5) return 'Approaching';
    if (proficiencyLevel >= threshold - 1.0) return 'Developing';
    return 'Beginning';
  };

  const getMasteryColor = (masteryLevel) => {
    switch (masteryLevel) {
      case 'Mastered': return '#4caf50';
      case 'Approaching': return '#ff9800';
      case 'Developing': return '#ff5722';
      case 'Beginning': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // Standards Gap Analysis
  const performGapAnalysis = useMemo(() => {
    if (!standardsGrades || !students) return [];

    const standardsMap = new Map();
    
    // Group standards grades by standard
    standardsGrades.forEach(grade => {
      if (!standardsMap.has(grade.standardId)) {
        standardsMap.set(grade.standardId, {
          standardId: grade.standardId,
          standardCode: grade.standardCode,
          standardName: grade.standardName,
          grades: [],
          masteryCount: 0,
          totalCount: 0,
        });
      }
      
      const standard = standardsMap.get(grade.standardId);
      standard.grades.push(grade.proficiencyLevel);
      standard.totalCount++;
      
      if (grade.proficiencyLevel >= masteryThreshold) {
        standard.masteryCount++;
      }
    });

    // Calculate mastery rates and identify gaps
    const gapAnalysis = Array.from(standardsMap.values()).map(standard => ({
      ...standard,
      masteryRate: (standard.masteryCount / standard.totalCount) * 100,
      averageProficiency: standard.grades.reduce((sum, grade) => sum + grade, 0) / standard.grades.length,
      gap: standard.masteryRate < 70, // Flag standards with <70% mastery
    }));

    return gapAnalysis.sort((a, b) => a.masteryRate - b.masteryRate); // Sort by lowest mastery first
  }, [standardsGrades, students, masteryThreshold]);

  // Student Intervention Alerts
  const generateInterventionAlerts = useMemo(() => {
    if (!students || !standardsGrades) return [];

    const alerts = [];
    
    students.forEach(student => {
      const studentGrades = standardsGrades.filter(sg => sg.studentId === student.id);
      
      if (studentGrades.length === 0) return;

      // Calculate student's overall performance
      const averageProficiency = studentGrades.reduce((sum, grade) => sum + grade.proficiencyLevel, 0) / studentGrades.length;
      
      // Find standards where student is struggling
      const strugglingStandards = studentGrades.filter(grade => grade.proficiencyLevel < masteryThreshold - 0.5);
      
      if (averageProficiency < masteryThreshold - 0.5 || strugglingStandards.length > 2) {
        alerts.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          severity: averageProficiency < masteryThreshold - 1.0 ? 'high' : 'medium',
          averageProficiency,
          strugglingStandards: strugglingStandards.length,
          recommendations: generateRecommendations(studentGrades, averageProficiency),
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.severity === 'high' && b.severity !== 'high') return -1;
      if (b.severity === 'high' && a.severity !== 'high') return 1;
      return a.averageProficiency - b.averageProficiency;
    });
  }, [students, standardsGrades, masteryThreshold]);

  // Growth Metrics
  const calculateGrowthMetrics = useMemo(() => {
    if (!standardsGrades || !assignments) return {};

    const growthData = {};
    
    // Group assignments by date to track progress over time
    const assignmentsByDate = assignments
      .filter(assignment => assignment.hasStandardsAssessment)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    assignmentsByDate.forEach(assignment => {
      const assignmentGrades = standardsGrades.filter(sg => sg.assignmentId === assignment.id);
      
      if (assignmentGrades.length === 0) return;

      const averageProficiency = assignmentGrades.reduce((sum, grade) => sum + grade.proficiencyLevel, 0) / assignmentGrades.length;
      
      growthData[assignment.id] = {
        assignmentName: assignment.name,
        date: assignment.dueDate,
        averageProficiency,
        totalStudents: assignmentGrades.length,
        masteryCount: assignmentGrades.filter(grade => grade.proficiencyLevel >= masteryThreshold).length,
      };
    });

    return growthData;
  }, [standardsGrades, assignments, masteryThreshold]);

  // Generate recommendations for struggling students
  const generateRecommendations = (studentGrades, averageProficiency) => {
    const recommendations = [];
    
    if (averageProficiency < masteryThreshold - 1.0) {
      recommendations.push('Consider additional one-on-one support');
    }
    
    if (averageProficiency < masteryThreshold - 0.5) {
      recommendations.push('Provide targeted intervention activities');
    }
    
    const lowStandards = studentGrades.filter(grade => grade.proficiencyLevel < masteryThreshold - 0.5);
    if (lowStandards.length > 0) {
      recommendations.push(`Focus on ${lowStandards.length} specific standards`);
    }
    
    return recommendations;
  };

  // Calculate mastery statistics
  const masteryStats = useMemo(() => {
    if (!progressData) return null;

    const totalStandards = progressData.standards.length;
    const masteredStandards = progressData.standards.filter(
      (s) => s.masteryLevel === "Mastered"
    ).length;
    const approachingStandards = progressData.standards.filter(
      (s) => s.masteryLevel === "Approaching"
    ).length;

    return {
      total: totalStandards,
      mastered: masteredStandards,
      approaching: approachingStandards,
      masteryRate: (masteredStandards / totalStandards) * 100,
      approachingRate: (approachingStandards / totalStandards) * 100,
    };
  }, [progressData]);

  // Phase 3: Enhanced Dashboard Components

  // Standards Heatmap Component
  const StandardsHeatmap = () => {
    if (!students || !standardsGrades) return null;

    const uniqueStandards = [...new Set(standardsGrades.map(sg => sg.standardId))];
    const uniqueStudents = students.map(s => s.id);

    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <HeatMapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Standards Mastery Heatmap
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Student</TableCell>
                  {uniqueStandards.map(standardId => {
                    const standard = standardsGrades.find(sg => sg.standardId === standardId);
                    return (
                      <TableCell key={standardId} align="center" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                        {standard?.standardCode || standardId}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {uniqueStudents.map(studentId => {
                  const student = students.find(s => s.id === studentId);
                  return (
                    <TableRow key={studentId}>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {student ? `${student.firstName} ${student.lastName}` : 'Unknown'}
                      </TableCell>
                      {uniqueStandards.map(standardId => {
                        const grade = standardsGrades.find(sg => 
                          sg.studentId === studentId && sg.standardId === standardId
                        );
                        const masteryLevel = grade ? calculateMasteryLevel(grade.proficiencyLevel) : 'No Data';
                        const color = grade ? getMasteryColor(masteryLevel) : '#f5f5f5';
                        
                        return (
                          <TableCell key={standardId} align="center">
                            <Tooltip title={`${masteryLevel} (${grade?.proficiencyLevel || 'N/A'}/4)`}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  backgroundColor: color,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {grade?.proficiencyLevel || '-'}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Intervention Alerts Component
  const InterventionAlerts = () => {
    if (!showInterventionAlerts || generateInterventionAlerts.length === 0) return null;

    return (
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Intervention Alerts ({generateInterventionAlerts.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {generateInterventionAlerts.map((alert, index) => (
            <Alert
              key={alert.studentId}
              severity={alert.severity === 'high' ? 'error' : 'warning'}
              sx={{ mb: 1 }}
              action={
                <Button color="inherit" size="small">
                  View Details
                </Button>
              }
            >
              <Typography variant="subtitle2">
                {alert.studentName} - {alert.strugglingStandards} struggling standards
              </Typography>
              <Typography variant="body2">
                Average Proficiency: {alert.averageProficiency.toFixed(1)}/4
              </Typography>
              <Typography variant="caption" display="block">
                Recommendations: {alert.recommendations.join(', ')}
              </Typography>
            </Alert>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Gap Analysis Component
  const GapAnalysis = () => {
    if (performGapAnalysis.length === 0) return null;

    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Standards Gap Analysis
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Standard</TableCell>
                  <TableCell align="center">Mastery Rate</TableCell>
                  <TableCell align="center">Avg Proficiency</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performGapAnalysis.map((standard) => (
                  <TableRow key={standard.standardId}>
                    <TableCell>
                      <Typography variant="subtitle2">{standard.standardCode}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {standard.standardName}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {standard.masteryRate.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={standard.masteryRate}
                          sx={{ width: 60, height: 8, borderRadius: 4 }}
                          color={standard.gap ? 'error' : 'success'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standard.averageProficiency.toFixed(1)}/4
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={standard.gap ? 'Needs Attention' : 'On Track'}
                        color={standard.gap ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (trend.direction === "improving") {
      return <TrendingUpIcon sx={{ color: "#2e7d32" }} />;
    } else if (trend.direction === "declining") {
      return <TrendingDownIcon sx={{ color: "#d32f2f" }} />;
    }
    return <TimelineIcon sx={{ color: "#666" }} />;
  };

  // Get mastery icon
  const getMasteryIcon = (level) => {
    if (level.includes("Mastery")) return <CheckCircleIcon sx={{ color: "#2e7d32" }} />;
    if (level === "Approaching") return <WarningIcon sx={{ color: "#f57c00" }} />;
    return <ErrorIcon sx={{ color: "#d32f2f" }} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Standards Progress Dashboard
      </Typography>

      {/* Phase 3: Enhanced Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>View Mode</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                label="View Mode"
              >
                <MenuItem value="individual">Individual Student</MenuItem>
                <MenuItem value="class">Class Overview</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {viewMode === 'individual' && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent || ""}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Student"
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="semester">Last Semester</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInterventionAlerts}
                  onChange={(e) => setShowInterventionAlerts(e.target.checked)}
                />
              }
              label="Show Alerts"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mastery Threshold</InputLabel>
              <Select
                value={masteryThreshold}
                onChange={(e) => setMasteryThreshold(e.target.value)}
                label="Mastery Threshold"
              >
                <MenuItem value={2.5}>2.5+ (Basic)</MenuItem>
                <MenuItem value={3.0}>3.0+ (Proficient)</MenuItem>
                <MenuItem value={3.5}>3.5+ (Advanced)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Phase 3: Intervention Alerts */}
      <InterventionAlerts />

      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Phase 3: Standards Heatmap */}
        <Grid item xs={12}>
          <StandardsHeatmap />
        </Grid>

        {/* Phase 3: Gap Analysis */}
        <Grid item xs={12} md={6}>
          <GapAnalysis />
        </Grid>

        {/* Mastery Statistics */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Mastery Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {masteryStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {masteryStats.masteryRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Mastery Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary">
                        {masteryStats.approachingRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Approaching Mastery
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <LinearProgress
                      variant="determinate"
                      value={masteryStats.masteryRate}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">No mastery data available.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tabs for Detailed Views */}
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Overview" />
              <Tab label="Progress Trends" />
              <Tab label="Detailed Analysis" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <OverviewTab progressData={progressData} masteryStats={masteryStats} />}
              {activeTab === 1 && <ProgressTrendsTab progressData={progressData} />}
              {activeTab === 2 && <DetailedAnalysisTab progressData={progressData} />}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Standards Overview Tab
const StandardsOverviewTab = ({ progressData, masteryStats }) => {
  if (!progressData?.progressData) {
    return <Alert severity="info">No progress data available.</Alert>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Standard</TableCell>
                  <TableCell>Mastery Level</TableCell>
                  <TableCell>Average Proficiency</TableCell>
                  <TableCell>Trend</TableCell>
                  <TableCell>Assignments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progressData.progressData.map((standard) => (
                  <TableRow key={standard.standardId}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {standard.standardId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getMasteryIcon(standard.mastery.level)}
                        <Chip
                          label={standard.mastery.level}
                          size="small"
                          color={
                            standard.mastery.level.includes("Mastery") ? "success" :
                            standard.mastery.level === "Approaching" ? "warning" : "error"
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {standard.mastery.average.toFixed(1)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(standard.mastery.average / 4) * 100}
                          sx={{ width: 60, height: 6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTrendIcon(standard.trend)}
                        <Typography variant="body2">
                          {standard.trend.improvement > 0 ? "+" : ""}
                          {standard.trend.improvement.toFixed(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {standard.assignmentsCount}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Mastery Distribution
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Mastered</Typography>
              <Typography variant="body2">{masteryStats.mastered}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(masteryStats.mastered / masteryStats.total) * 100}
              sx={{ height: 8, mb: 2 }}
              color="success"
            />
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Approaching</Typography>
              <Typography variant="body2">{masteryStats.approaching}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(masteryStats.approaching / masteryStats.total) * 100}
              sx={{ height: 8, mb: 2 }}
              color="warning"
            />
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Developing</Typography>
              <Typography variant="body2">{masteryStats.developing}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(masteryStats.developing / masteryStats.total) * 100}
              sx={{ height: 8, mb: 2 }}
              color="error"
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

// Progress Trends Tab
const ProgressTrendsTab = ({ progressData }) => {
  if (!progressData?.progressData) {
    return <Alert severity="info">No progress data available.</Alert>;
  }

  const improvingStandards = progressData.progressData.filter(s => s.trend.direction === "improving");
  const decliningStandards = progressData.progressData.filter(s => s.trend.direction === "declining");

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Improving Standards ({improvingStandards.length})
          </Typography>
          {improvingStandards.map((standard) => (
            <Box key={standard.standardId} sx={{ mb: 2, p: 1, border: "1px solid", borderColor: "success.main", borderRadius: 1 }}>
              <Typography variant="subtitle2">{standard.standardId}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUpIcon sx={{ color: "#2e7d32" }} />
                <Typography variant="body2">
                  +{standard.trend.improvement.toFixed(1)} improvement
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Standards Needing Attention ({decliningStandards.length})
          </Typography>
          {decliningStandards.map((standard) => (
            <Box key={standard.standardId} sx={{ mb: 2, p: 1, border: "1px solid", borderColor: "error.main", borderRadius: 1 }}>
              <Typography variant="subtitle2">{standard.standardId}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingDownIcon sx={{ color: "#d32f2f" }} />
                <Typography variant="body2">
                  {standard.trend.improvement.toFixed(1)} decline
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
};

// Detailed Analysis Tab
const DetailedAnalysisTab = ({ progressData }) => {
  if (!progressData?.overallProgress) {
    return <Alert severity="info">No detailed analysis available.</Alert>;
  }

  const { overallProgress } = progressData;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Overall Progress Analysis
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Trend Direction</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {getTrendIcon(overallProgress.trend)}
                <Typography>{overallProgress.trend.direction}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Average Improvement</Typography>
              <Typography>
                {overallProgress.trend.averageImprovement > 0 ? "+" : ""}
                {overallProgress.trend.averageImprovement.toFixed(1)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Improving Standards</Typography>
              <Typography>
                {overallProgress.trend.improvingStandards} / {overallProgress.trend.totalStandards}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {overallProgress.recommendations && overallProgress.recommendations.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            {overallProgress.recommendations.map((rec, index) => (
              <Alert key={index} severity={rec.priority === "high" ? "error" : "info"} sx={{ mb: 1 }}>
                {rec.message}
              </Alert>
            ))}
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default StandardsProgressDashboard; 