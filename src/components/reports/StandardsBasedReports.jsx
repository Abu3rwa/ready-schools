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
  Button,
  Chip,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useStandardsGrading } from "../../contexts/StandardsGradingContext";
import { useStudents } from "../../contexts/StudentContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useGrades } from "../../contexts/GradeContext";

const StandardsBasedReports = () => {
  const { students } = useStudents();
  const { assignments } = useAssignments();
  const { grades } = useGrades();
  const { 
    standardsGrades,
    getStandardsGradesByStudent,
    getStandardsGradesByAssignment,
  } = useStandardsGrading();

  const [selectedReportType, setSelectedReportType] = useState('individual');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('semester');
  const [includeTraditionalGrades, setIncludeTraditionalGrades] = useState(true);
  const [includeStandardsGrades, setIncludeStandardsGrades] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Report types available
  const reportTypes = [
    { value: 'individual', label: 'Individual Student Report', icon: SchoolIcon },
    { value: 'class', label: 'Class Progress Report', icon: AssessmentIcon },
    { value: 'subject', label: 'Subject-Level Report', icon: TimelineIcon },
    { value: 'intervention', label: 'Intervention Report', icon: WarningIcon },
  ];

  // Generate report data
  const generateReport = async () => {
    setLoading(true);
    try {
      let data = null;
      
      switch (selectedReportType) {
        case 'individual':
          data = await generateIndividualStudentReport();
          break;
        case 'class':
          data = await generateClassProgressReport();
          break;
        case 'subject':
          data = await generateSubjectLevelReport();
          break;
        case 'intervention':
          data = await generateInterventionReport();
          break;
        default:
          data = null;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Individual Student Report
  const generateIndividualStudentReport = async () => {
    if (!selectedStudent) return null;

    const student = students.find(s => s.id === selectedStudent);
    const studentStandardsGrades = standardsGrades.filter(sg => sg.studentId === selectedStudent);
    const studentTraditionalGrades = grades.filter(g => g.studentId === selectedStudent);

    // Calculate standards mastery
    const standardsMastery = {};
    studentStandardsGrades.forEach(grade => {
      if (!standardsMastery[grade.standardId]) {
        standardsMastery[grade.standardId] = {
          standardCode: grade.standardCode,
          standardName: grade.standardName,
          grades: [],
          averageProficiency: 0,
          masteryLevel: 'Beginning',
        };
      }
      standardsMastery[grade.standardId].grades.push(grade.proficiencyLevel);
    });

    // Calculate averages and mastery levels
    Object.values(standardsMastery).forEach(standard => {
      standard.averageProficiency = standard.grades.reduce((sum, grade) => sum + grade, 0) / standard.grades.length;
      standard.masteryLevel = getMasteryLevel(standard.averageProficiency);
    });

    // Calculate traditional grade average
    const traditionalAverage = studentTraditionalGrades.length > 0 
      ? studentTraditionalGrades.reduce((sum, grade) => sum + (grade.score / grade.points * 100), 0) / studentTraditionalGrades.length
      : 0;

    return {
      type: 'individual',
      student,
      standardsMastery: Object.values(standardsMastery),
      traditionalAverage,
      totalStandards: Object.keys(standardsMastery).length,
      masteredStandards: Object.values(standardsMastery).filter(s => s.masteryLevel === 'Mastered').length,
      timeRange: selectedTimeRange,
    };
  };

  // Class Progress Report
  const generateClassProgressReport = async () => {
    const classStandardsData = {};
    
    // Group standards grades by standard
    standardsGrades.forEach(grade => {
      if (!classStandardsData[grade.standardId]) {
        classStandardsData[grade.standardId] = {
          standardCode: grade.standardCode,
          standardName: grade.standardName,
          grades: [],
          masteryCount: 0,
          totalCount: 0,
        };
      }
      
      classStandardsData[grade.standardId].grades.push(grade.proficiencyLevel);
      classStandardsData[grade.standardId].totalCount++;
      
      if (grade.proficiencyLevel >= 3.0) {
        classStandardsData[grade.standardId].masteryCount++;
      }
    });

    // Calculate statistics for each standard
    const standardsStats = Object.values(classStandardsData).map(standard => ({
      ...standard,
      averageProficiency: standard.grades.reduce((sum, grade) => sum + grade, 0) / standard.grades.length,
      masteryRate: (standard.masteryCount / standard.totalCount) * 100,
      needsAttention: standard.masteryRate < 70,
    }));

    return {
      type: 'class',
      standardsStats,
      totalStudents: students.length,
      totalStandards: Object.keys(classStandardsData).length,
      averageMasteryRate: standardsStats.reduce((sum, s) => sum + s.masteryRate, 0) / standardsStats.length,
      standardsNeedingAttention: standardsStats.filter(s => s.needsAttention).length,
    };
  };

  // Subject-Level Report
  const generateSubjectLevelReport = async () => {
    if (!selectedSubject) return null;

    const subjectAssignments = assignments.filter(a => a.subject === selectedSubject);
    const subjectStandardsGrades = standardsGrades.filter(sg => 
      subjectAssignments.some(a => a.id === sg.assignmentId)
    );

    // Group by standard and calculate subject-level statistics
    const subjectStandardsData = {};
    subjectStandardsGrades.forEach(grade => {
      if (!subjectStandardsData[grade.standardId]) {
        subjectStandardsData[grade.standardId] = {
          standardCode: grade.standardCode,
          standardName: grade.standardName,
          grades: [],
          assignments: new Set(),
        };
      }
      
      subjectStandardsData[grade.standardId].grades.push(grade.proficiencyLevel);
      subjectStandardsData[grade.standardId].assignments.add(grade.assignmentId);
    });

    const subjectStats = Object.values(subjectStandardsData).map(standard => ({
      ...standard,
      averageProficiency: standard.grades.reduce((sum, grade) => sum + grade, 0) / standard.grades.length,
      totalAssessments: standard.assignments.size,
      masteryLevel: getMasteryLevel(standard.averageProficiency),
    }));

    return {
      type: 'subject',
      subject: selectedSubject,
      standardsStats: subjectStats,
      totalStandards: subjectStats.length,
      averageProficiency: subjectStats.reduce((sum, s) => sum + s.averageProficiency, 0) / subjectStats.length,
      totalAssessments: subjectAssignments.length,
    };
  };

  // Intervention Report
  const generateInterventionReport = async () => {
    const interventionData = [];
    
    students.forEach(student => {
      const studentGrades = standardsGrades.filter(sg => sg.studentId === student.id);
      
      if (studentGrades.length === 0) return;

      const averageProficiency = studentGrades.reduce((sum, grade) => sum + grade.proficiencyLevel, 0) / studentGrades.length;
      const strugglingStandards = studentGrades.filter(grade => grade.proficiencyLevel < 2.5);
      
      if (averageProficiency < 2.5 || strugglingStandards.length > 2) {
        interventionData.push({
          student,
          averageProficiency,
          strugglingStandards: strugglingStandards.length,
          totalStandards: studentGrades.length,
          severity: averageProficiency < 2.0 ? 'high' : 'medium',
          recommendations: generateInterventionRecommendations(studentGrades, averageProficiency),
        });
      }
    });

    return {
      type: 'intervention',
      studentsNeedingIntervention: interventionData.length,
      highPriority: interventionData.filter(d => d.severity === 'high').length,
      mediumPriority: interventionData.filter(d => d.severity === 'medium').length,
      interventionData: interventionData.sort((a, b) => a.averageProficiency - b.averageProficiency),
    };
  };

  // Helper functions
  const getMasteryLevel = (proficiencyLevel) => {
    if (proficiencyLevel >= 3.5) return 'Mastered';
    if (proficiencyLevel >= 3.0) return 'Approaching';
    if (proficiencyLevel >= 2.0) return 'Developing';
    return 'Beginning';
  };

  const generateInterventionRecommendations = (studentGrades, averageProficiency) => {
    const recommendations = [];
    
    if (averageProficiency < 2.0) {
      recommendations.push('Immediate one-on-one support needed');
    }
    
    if (averageProficiency < 2.5) {
      recommendations.push('Targeted intervention activities required');
    }
    
    const lowStandards = studentGrades.filter(grade => grade.proficiencyLevel < 2.5);
    if (lowStandards.length > 0) {
      recommendations.push(`Focus on ${lowStandards.length} specific standards`);
    }
    
    return recommendations;
  };

  // Export functions
  const exportToPDF = () => {
    // PDF export implementation
    console.log('Exporting to PDF:', reportData);
  };

  const exportToCSV = () => {
    // CSV export implementation
    console.log('Exporting to CSV:', reportData);
  };

  const sendEmail = () => {
    // Email implementation
    console.log('Sending email with report:', reportData);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Standards-Based Reports
      </Typography>

      {/* Report Configuration */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                label="Report Type"
              >
                {reportTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedReportType === 'individual' && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Student"
                >
                  {students.map(student => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {selectedReportType === 'subject' && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="Subject"
                >
                  {Array.from(new Set(assignments.map(a => a.subject))).map(subject => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
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
            <Button
              variant="contained"
              onClick={generateReport}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={20} /> : 'Generate Report'}
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Export to PDF">
                <IconButton onClick={exportToPDF} disabled={!reportData}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print Report">
                <IconButton onClick={() => window.print()} disabled={!reportData}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Send Email">
                <IconButton onClick={sendEmail} disabled={!reportData}>
                  <EmailIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Report Display */}
      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {reportTypes.find(t => t.value === reportData.type)?.label}
          </Typography>
          
          {/* Individual Student Report */}
          {reportData.type === 'individual' && (
            <IndividualStudentReport data={reportData} />
          )}
          
          {/* Class Progress Report */}
          {reportData.type === 'class' && (
            <ClassProgressReport data={reportData} />
          )}
          
          {/* Subject-Level Report */}
          {reportData.type === 'subject' && (
            <SubjectLevelReport data={reportData} />
          )}
          
          {/* Intervention Report */}
          {reportData.type === 'intervention' && (
            <InterventionReport data={reportData} />
          )}
        </Paper>
      )}
    </Box>
  );
};

// Report Components
const IndividualStudentReport = ({ data }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>
        {data.student.firstName} {data.student.lastName} - Standards Mastery Report
      </Typography>
    </Grid>
    
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Overall Performance</Typography>
          <Typography variant="h4" color="primary">
            {data.masteredStandards}/{data.totalStandards} Standards Mastered
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Mastery Rate: {((data.masteredStandards / data.totalStandards) * 100).toFixed(1)}%
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Traditional Grades</Typography>
          <Typography variant="h4" color="secondary">
            {data.traditionalAverage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Average Score
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Standard</TableCell>
              <TableCell>Average Proficiency</TableCell>
              <TableCell>Mastery Level</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.standardsMastery.map(standard => (
              <TableRow key={standard.standardCode}>
                <TableCell>
                  <Typography variant="subtitle2">{standard.standardCode}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {standard.standardName}
                  </Typography>
                </TableCell>
                <TableCell>{standard.averageProficiency.toFixed(1)}/4</TableCell>
                <TableCell>{standard.masteryLevel}</TableCell>
                <TableCell>
                  <Chip
                    label={standard.masteryLevel === 'Mastered' ? 'On Track' : 'Needs Attention'}
                    color={standard.masteryLevel === 'Mastered' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  </Grid>
);

const ClassProgressReport = ({ data }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Class Standards Performance</Typography>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Overall Mastery</Typography>
          <Typography variant="h4" color="primary">
            {data.averageMasteryRate.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Average Mastery Rate
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Standards Assessed</Typography>
          <Typography variant="h4" color="secondary">
            {data.totalStandards}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Standards
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Needs Attention</Typography>
          <Typography variant="h4" color="error">
            {data.standardsNeedingAttention}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Standards Below 70% Mastery
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Standard</TableCell>
              <TableCell>Mastery Rate</TableCell>
              <TableCell>Average Proficiency</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.standardsStats.map(standard => (
              <TableRow key={standard.standardCode}>
                <TableCell>
                  <Typography variant="subtitle2">{standard.standardCode}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {standard.standardName}
                  </Typography>
                </TableCell>
                <TableCell>{standard.masteryRate.toFixed(1)}%</TableCell>
                <TableCell>{standard.averageProficiency.toFixed(1)}/4</TableCell>
                <TableCell>
                  <Chip
                    label={standard.needsAttention ? 'Needs Attention' : 'On Track'}
                    color={standard.needsAttention ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  </Grid>
);

const SubjectLevelReport = ({ data }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>{data.subject} Standards Performance</Typography>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Average Proficiency</Typography>
          <Typography variant="h4" color="primary">
            {data.averageProficiency.toFixed(1)}/4
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Class Average
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Standards Assessed</Typography>
          <Typography variant="h4" color="secondary">
            {data.totalStandards}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Standards
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Total Assessments</Typography>
          <Typography variant="h4" color="info">
            {data.totalAssessments}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Assignments with Standards
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Standard</TableCell>
              <TableCell>Average Proficiency</TableCell>
              <TableCell>Mastery Level</TableCell>
              <TableCell>Assessments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.standardsStats.map(standard => (
              <TableRow key={standard.standardCode}>
                <TableCell>
                  <Typography variant="subtitle2">{standard.standardCode}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {standard.standardName}
                  </Typography>
                </TableCell>
                <TableCell>{standard.averageProficiency.toFixed(1)}/4</TableCell>
                <TableCell>{standard.masteryLevel}</TableCell>
                <TableCell>{standard.totalAssessments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  </Grid>
);

const InterventionReport = ({ data }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Students Needing Intervention</Typography>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Total Students</Typography>
          <Typography variant="h4" color="error">
            {data.studentsNeedingIntervention}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Requiring Support
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>High Priority</Typography>
          <Typography variant="h4" color="error">
            {data.highPriority}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Immediate Attention Needed
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} md={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Medium Priority</Typography>
          <Typography variant="h4" color="warning">
            {data.mediumPriority}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor Closely
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Average Proficiency</TableCell>
              <TableCell>Struggling Standards</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Recommendations</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.interventionData.map(student => (
              <TableRow key={student.student.id}>
                <TableCell>
                  <Typography variant="subtitle2">
                    {student.student.firstName} {student.student.lastName}
                  </Typography>
                </TableCell>
                <TableCell>{student.averageProficiency.toFixed(1)}/4</TableCell>
                <TableCell>{student.strugglingStandards}/{student.totalStandards}</TableCell>
                <TableCell>
                  <Chip
                    label={student.severity === 'high' ? 'High' : 'Medium'}
                    color={student.severity === 'high' ? 'error' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {student.recommendations.join(', ')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  </Grid>
);

export default StandardsBasedReports; 