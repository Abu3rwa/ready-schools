import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useAssignments } from '../contexts/AssignmentContext';
import { useGradeBooks } from '../contexts/GradeBookContext';
import { useGrades } from '../contexts/GradeContext';
import { useStudents } from '../contexts/StudentContext';
import { useStandardsGrading } from '../contexts/StandardsGradingContext';
import { calculateCombinedAnalytics } from '../services/standardsIntegrationService';

const AssignmentsGradebookDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [bulkAssignmentId, setBulkAssignmentId] = useState('');
  const [bulkGradeValue, setBulkGradeValue] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const { 
    assignments, 
    loading: assignmentsLoading,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentStandardsData,
    createAssignmentStandardMapping,
    getProficiencyScaleData
  } = useAssignments();

  const { 
    gradeBooks, 
    loading: gradebooksLoading,
    getGradeBookAnalytics,
    getGradeBookStandardsData
  } = useGradeBooks();

  const { 
    grades, 
    loading: gradesLoading,
    addGrade,
    updateGrade
  } = useGrades();

  const { 
    students, 
    loading: studentsLoading 
  } = useStudents();

  const { 
    standardsGrades,
    createStandardsGrade,
    updateStandardsGrade
  } = useStandardsGrading();

  // Get unique subjects from assignments and gradebooks
  const subjects = useMemo(() => {
    const assignmentSubjects = assignments.map(a => a.subject).filter(Boolean);
    const gradebookSubjects = gradeBooks.map(gb => gb.subject).filter(Boolean);
    const allSubjects = [...new Set([...assignmentSubjects, ...gradebookSubjects])];
    return allSubjects.sort();
  }, [assignments, gradeBooks]);

  // Filter data by selected subject
  const subjectAssignments = useMemo(() => {
    if (!selectedSubject) return assignments;
    return assignments.filter(a => a.subject === selectedSubject);
  }, [assignments, selectedSubject]);

  const subjectGradeBook = useMemo(() => {
    if (!selectedSubject) return null;
    return gradeBooks.find(gb => gb.subject === selectedSubject);
  }, [gradeBooks, selectedSubject]);

  const subjectGrades = useMemo(() => {
    if (!selectedSubject) return grades;
    return grades.filter(g => g.subject === selectedSubject);
  }, [grades, selectedSubject]);

  const subjectStudents = useMemo(() => {
    if (!selectedSubject) return students;
    
    // Get students who have grades or assignments in this subject
    const studentIds = new Set();
    subjectGrades.forEach(g => studentIds.add(g.studentId));
    
    console.log('Subject Students Debug:', {
      selectedSubject,
      totalStudents: students.length,
      totalGrades: subjectGrades.length,
      studentIds: Array.from(studentIds),
      students: students.map(s => ({ id: s.id, name: s.name }))
    });
    
    // Return students who have grades in this subject, or all students if none have grades
    if (studentIds.size > 0) {
      const filteredStudents = students.filter(s => studentIds.has(s.id));
      console.log('Filtered students by grades:', filteredStudents);
      return filteredStudents;
    } else {
      // If no grades yet, show all students
      console.log('No grades yet, showing all students:', students);
      return students;
    }
  }, [students, selectedSubject, subjectGrades]);

  // Analytics data
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (selectedSubject && subjectGradeBook) {
      loadAnalytics();
    }
  }, [selectedSubject, subjectGradeBook]);

  const loadAnalytics = async () => {
    if (!subjectGradeBook) return;
    
    setAnalyticsLoading(true);
    try {
      const analyticsData = await getGradeBookAnalytics(subjectGradeBook.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle subject selection
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  // Handle assignment creation
  const handleCreateAssignment = async (assignmentData) => {
    try {
      console.log('Creating assignment:', assignmentData);
      
      const result = await addAssignment(assignmentData);
      console.log('Assignment created successfully:', result);
      setShowAssignmentDialog(false);
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(`Error creating assignment: ${error.message}`);
    }
  };

  // Handle grade entry
  const handleGradeEntry = async (standardsGrades = {}) => {
    if (!selectedAssignment || !selectedStudent || !gradeValue) return;

    try {
      // Validate the grade value
      let normalizedScore = parseFloat(gradeValue);
      
      // Ensure the score is within valid range
      if (normalizedScore < 0) {
        normalizedScore = 0;
      } else if (normalizedScore > selectedAssignment.points) {
        normalizedScore = selectedAssignment.points;
      }

      console.log('Creating grade for:', {
        student: selectedStudent.name,
        assignment: selectedAssignment.name,
        originalScore: gradeValue,
        pointsEarned: normalizedScore,
        assignmentPoints: selectedAssignment.points,
        subject: selectedAssignment.subject,
        standardsGrades
      });

      const gradeData = {
        studentId: selectedStudent.id,
        assignmentId: selectedAssignment.id,
        subject: selectedAssignment.subject,
        score: normalizedScore, // Store as raw points (5, 4, etc.)
        points: selectedAssignment.points, // Add the total possible points
        date: new Date().toISOString(),
        type: 'assignment'
      };

      console.log('Grade data:', gradeData);
      const gradeResult = await addGrade(gradeData);
      console.log('Grade created successfully:', gradeResult);

             // If standards grading is enabled, create standards grades for each standard
       if (selectedAssignment.hasStandardsAssessment && Object.keys(standardsGrades).length > 0) {
        console.log('Creating standards grades:', standardsGrades);
        
        for (const [standardId, proficiencyLevel] of Object.entries(standardsGrades)) {
          if (proficiencyLevel) {
            const standardsGradeData = {
              studentId: selectedStudent.id,
              assignmentId: selectedAssignment.id,
              subject: selectedAssignment.subject,
              standardId: standardId,
              proficiencyLevel: parseInt(proficiencyLevel),
              date: new Date().toISOString()
            };
            
            console.log('Creating standards grade:', standardsGradeData);
            try {
              const standardsResult = await createStandardsGrade(standardsGradeData);
              console.log('Standards grade created successfully:', standardsResult);
            } catch (standardsError) {
              console.error('Error creating standards grade:', standardsError);
              // Continue with other standards even if one fails
            }
          }
        }
      }

      setShowGradeDialog(false);
      setGradeValue('');
      setSelectedAssignment(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error entering grade:', error);
      alert(`Error creating grade: ${error.message}`);
    }
  };

  // Get assignment status
  const getAssignmentStatus = (assignment) => {
    const today = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (dueDate < today) return { status: 'Overdue', color: 'error' };
    if (dueDate.getTime() - today.getTime() < 24 * 60 * 60 * 1000) return { status: 'Due Soon', color: 'warning' };
    return { status: 'Upcoming', color: 'success' };
  };

  // Get student grade for assignment
  const getStudentGrade = (studentId, assignmentId) => {
    return grades.find(g => g.studentId === studentId && g.assignmentId === assignmentId);
  };

  // Utility function to recalculate grades if they were entered as points instead of percentages
  const recalculateGrades = () => {
    const updatedGrades = grades.map(grade => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      if (!assignment) return grade;
      
      // If the grade is very low (likely entered as points), recalculate it
      if (grade.score <= assignment.points && grade.score > 0) {
        const newScore = (grade.score / assignment.points) * 100;
        console.log(`Recalculating grade: ${grade.score} out of ${assignment.points} = ${newScore.toFixed(1)}%`);
        return { ...grade, score: newScore };
      }
      return grade;
    });
    
    console.log('Recalculated grades:', updatedGrades);
    return updatedGrades;
  };

  // Bulk grade operations
  const handleBulkGrade = async () => {
    if (!bulkAssignmentId || !bulkGradeValue) return;
    
    const assignment = assignments.find(a => a.id === bulkAssignmentId);
    if (!assignment) return;
    
    try {
      // Normalize the bulk grade value
      let normalizedScore = parseFloat(bulkGradeValue);
      if (normalizedScore <= assignment.points && normalizedScore > 0) {
        normalizedScore = (normalizedScore / assignment.points) * 100;
      }
      
      // Get students who haven't been graded for this assignment
      const ungradedStudents = students.filter(student => {
        const existingGrade = grades.find(g => 
          g.studentId === student.id && g.assignmentId === bulkAssignmentId
        );
        return !existingGrade;
      });
      
      if (ungradedStudents.length === 0) {
        alert('All students have already been graded for this assignment.');
        return;
      }
      
      // Apply the grade to all ungraded students
      for (const student of ungradedStudents) {
        const gradeData = {
          studentId: student.id,
          assignmentId: bulkAssignmentId,
          subject: assignment.subject,
          score: normalizedScore,
          date: new Date().toISOString(),
          type: 'assignment'
        };
        
        await addGrade(gradeData);
        console.log(`Bulk graded ${student.name}: ${normalizedScore.toFixed(1)}%`);
      }
      
      alert(`Successfully applied ${normalizedScore.toFixed(1)}% to ${ungradedStudents.length} students for ${assignment.name}`);
      
      // Reset bulk grade form
      setBulkAssignmentId('');
      setBulkGradeValue('');
      
    } catch (error) {
      console.error('Error in bulk grading:', error);
      alert(`Error in bulk grading: ${error.message}`);
    }
  };

  const handleBulkGradeReset = () => {
    setBulkAssignmentId('');
    setBulkGradeValue('');
  };

  const handleFilterReset = () => {
    setStudentSearchTerm('');
    setPerformanceFilter('');
    setSortBy('name');
  };

  // Filter and sort students based on search and filter criteria
  const filteredStudents = useMemo(() => {
    let filtered = [...students];
    
    // Apply search filter
    if (studentSearchTerm) {
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.id?.toLowerCase().includes(studentSearchTerm.toLowerCase())
      );
    }
    
    // Apply performance filter
    if (performanceFilter) {
      filtered = filtered.filter(student => {
        const studentGrades = grades.filter(g => g.studentId === student.id);
        if (studentGrades.length === 0) {
          return performanceFilter === 'ungraded';
        }
        
        const average = studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length;
        
        switch (performanceFilter) {
          case 'high': return average >= 80;
          case 'medium': return average >= 60 && average < 80;
          case 'low': return average < 60;
          default: return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'average': {
          const aGrades = grades.filter(g => g.studentId === a.id);
          const bGrades = grades.filter(g => g.studentId === b.id);
          const aAvg = aGrades.length > 0 ? aGrades.reduce((sum, g) => sum + g.score, 0) / aGrades.length : 0;
          const bAvg = bGrades.length > 0 ? bGrades.reduce((sum, g) => sum + g.score, 0) / bGrades.length : 0;
          return bAvg - aAvg;
        }
        case 'average-asc': {
          const aGrades = grades.filter(g => g.studentId === a.id);
          const bGrades = grades.filter(g => g.studentId === b.id);
          const aAvg = aGrades.length > 0 ? aGrades.reduce((sum, g) => sum + g.score, 0) / aGrades.length : 0;
          const bAvg = bGrades.length > 0 ? bGrades.reduce((sum, g) => sum + g.score, 0) / bGrades.length : 0;
          return aAvg - bAvg;
        }
        case 'recent': {
          const aGrades = grades.filter(g => g.studentId === a.id);
          const bGrades = grades.filter(g => g.studentId === b.id);
          const aLatest = aGrades.length > 0 ? Math.max(...aGrades.map(g => new Date(g.date).getTime())) : 0;
          const bLatest = bGrades.length > 0 ? Math.max(...bGrades.map(g => new Date(g.date).getTime())) : 0;
          return bLatest - aLatest;
        }
        default:
          return 0;
      }
    });
    
      return filtered;
}, [students, grades, studentSearchTerm, performanceFilter, sortBy]);

  // (Export/print handlers are defined within AnalyticsTab.)

  if (assignmentsLoading || gradebooksLoading || gradesLoading || studentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assignments & Gradebook Dashboard
      </Typography>
      
      {/* Subject Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Subject</InputLabel>
        <Select
          value={selectedSubject}
          onChange={handleSubjectChange}
          label="Select Subject"
        >
          <MenuItem value="">All Subjects</MenuItem>
          {subjects.map(subject => (
            <MenuItem key={subject} value={subject}>{subject}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Assignments" />
          <Tab label="Grades" />
          <Tab label="Analytics" />
          <Tab label="Standards" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <OverviewTab 
          subject={selectedSubject}
          assignments={subjectAssignments}
          gradeBook={subjectGradeBook}
          grades={subjectGrades}
          students={subjectStudents}
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          onCreateAssignment={() => setShowAssignmentDialog(true)}
          onGradeAssignment={(assignment, student) => {
            setSelectedAssignment(assignment);
            setSelectedStudent(student);
            setShowGradeDialog(true);
          }}
          getAssignmentStatus={getAssignmentStatus}
        />
      )}

      {activeTab === 1 && (
        <AssignmentsTab 
          assignments={subjectAssignments}
          students={subjectStudents}
          grades={subjectGrades}
          onCreateAssignment={() => setShowAssignmentDialog(true)}
          onEditAssignment={(assignment) => {
            setSelectedAssignment(assignment);
            setShowAssignmentDialog(true);
          }}
          onDeleteAssignment={deleteAssignment}
          onGradeAssignment={(assignment, student) => {
            setSelectedAssignment(assignment);
            setSelectedStudent(student);
            setShowGradeDialog(true);
          }}
          getAssignmentStatus={getAssignmentStatus}
        />
      )}

      {activeTab === 2 && (
        <GradesTab 
          filteredStudents={filteredStudents}
          assignments={subjectAssignments}
          grades={subjectGrades}
          onGradeAssignment={(assignment, student) => {
            setSelectedAssignment(assignment);
            setSelectedStudent(student);
            setShowGradeDialog(true);
          }}
          bulkAssignmentId={bulkAssignmentId}
          setBulkAssignmentId={setBulkAssignmentId}
          bulkGradeValue={bulkGradeValue}
          setBulkGradeValue={setBulkGradeValue}
          handleBulkGrade={handleBulkGrade}
          handleBulkGradeReset={handleBulkGradeReset}
          studentSearchTerm={studentSearchTerm}
          setStudentSearchTerm={setStudentSearchTerm}
          performanceFilter={performanceFilter}
          setPerformanceFilter={setPerformanceFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          handleFilterReset={handleFilterReset}
        />
      )}

      {activeTab === 3 && (
        <AnalyticsTab 
          analytics={analytics}
          loading={analyticsLoading}
          subject={selectedSubject}
        />
      )}

      {activeTab === 4 && (
        <StandardsTab 
          assignments={subjectAssignments}
          students={subjectStudents}
          standardsGrades={standardsGrades}
          onCreateStandardMapping={createAssignmentStandardMapping}
          onGetAssignmentStandards={getAssignmentStandardsData}
          onGetProficiencyScale={getProficiencyScaleData}
        />
      )}

      {/* Assignment Creation Dialog */}
      <AssignmentDialog
        open={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        onSubmit={handleCreateAssignment}
        assignment={selectedAssignment}
        subjects={subjects}
      />

             {/* Grade Entry Dialog */}
       <GradeDialog
         open={showGradeDialog}
         onClose={() => setShowGradeDialog(false)}
         onSubmit={handleGradeEntry}
         assignment={selectedAssignment}
         student={selectedStudent}
         gradeValue={gradeValue}
         onGradeChange={setGradeValue}
       />
    </Box>
  );
};

// Overview Tab Component
const OverviewTab = ({ 
  subject, 
  assignments, 
  gradeBook, 
  grades, 
  students, 
  analytics, 
  analyticsLoading,
  onCreateAssignment,
  onGradeAssignment,
  getAssignmentStatus
}) => {
  const stats = [
    { label: 'Total Assignments', value: assignments.length, icon: AssignmentIcon },
    { label: 'Total Students', value: students.length, icon: SchoolIcon },
    { label: 'Total Grades', value: grades.length, icon: GradeIcon },
    { label: 'Completion Rate', value: `${Math.round((grades.length / (assignments.length * students.length)) * 100) || 0}%`, icon: TrendingUpIcon }
  ];

  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <stat.icon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div">
                {stat.value}
              </Typography>
              <Typography color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateAssignment}
              >
                Create Assignment
              </Button>
              {gradeBook && (
                <Button
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={() => {/* Navigate to gradebook */}}
                >
                  View Gradebook
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Assignments
            </Typography>
            <List>
              {assignments.slice(0, 5).map((assignment) => (
                <ListItem key={assignment.id}>
                  <ListItemText
                    primary={assignment.name}
                    secondary={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                  />
                  <Chip 
                    label={getAssignmentStatus(assignment).status}
                    color={getAssignmentStatus(assignment).color}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Analytics Preview */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Overview
            </Typography>
            {analyticsLoading ? (
              <CircularProgress size={20} />
            ) : analytics ? (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Traditional Grades: {analytics.traditional?.averageScore?.toFixed(1) || 'N/A'}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Standards Proficiency: {analytics.standards?.averageProficiency?.toFixed(1) || 'N/A'}/4
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Grade: {analytics.combined?.overallPerformance?.grade || 'N/A'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No analytics available for this subject
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Assignments Tab Component
const AssignmentsTab = ({ 
  assignments, 
  students, 
  grades, 
  onCreateAssignment, 
  onEditAssignment, 
  onDeleteAssignment,
  onGradeAssignment,
  getAssignmentStatus
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Assignments ({assignments.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateAssignment}
        >
          Create Assignment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Gradebook</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => {
              const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id);
              const completionRate = students.length > 0 ? (assignmentGrades.length / students.length) * 100 : 0;
              
              return (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.name}</TableCell>
                  <TableCell>{assignment.subject}</TableCell>
                  <TableCell>{assignment.subject ? `${assignment.subject} - Grade Book` : 'N/A'}</TableCell>
                  <TableCell>{assignment.category}</TableCell>
                  <TableCell>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{assignment.points}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getAssignmentStatus(assignment).status}
                      color={getAssignmentStatus(assignment).color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {assignmentGrades.length}/{students.length} ({completionRate.toFixed(0)}%)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Assignment">
                        <IconButton size="small" onClick={() => onEditAssignment(assignment)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Grade Assignment">
                        <IconButton 
                          size="small" 
                          onClick={() => onGradeAssignment(assignment, students[0])}
                        >
                          <GradeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Assignment">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => onDeleteAssignment(assignment.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Grades Tab Component
const GradesTab = ({ 
  filteredStudents, 
  assignments, 
  grades, 
  onGradeAssignment,
  bulkAssignmentId,
  setBulkAssignmentId,
  bulkGradeValue,
  setBulkGradeValue,
  handleBulkGrade,
  handleBulkGradeReset,
  studentSearchTerm,
  setStudentSearchTerm,
  performanceFilter,
  setPerformanceFilter,
  sortBy,
  setSortBy,
  handleFilterReset
}) => {
  const { updateGrade, deleteGrade } = useGrades();
  const [editingGrade, setEditingGrade] = useState(null);
  const [editGradeValue, setEditGradeValue] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);

  // Handle grade editing
  const handleEditGrade = (grade, assignment) => {
    setEditingGrade(grade);
    // Convert percentage back to points for editing
    const pointsEarned = (grade.score / 100) * assignment.points;
    setEditGradeValue(pointsEarned.toString());
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGrade || !editGradeValue) return;
    
    try {
      const assignment = assignments.find(a => a.id === editingGrade.assignmentId);
      if (!assignment) return;

      // Convert points to percentage
      let normalizedScore = parseFloat(editGradeValue);
      if (normalizedScore <= assignment.points && normalizedScore >= 0) {
        normalizedScore = (normalizedScore / assignment.points) * 100;
      } else if (normalizedScore > 100) {
        normalizedScore = 100;
      } else if (normalizedScore < 0) {
        normalizedScore = 0;
      }

      await updateGrade(editingGrade.id, { score: normalizedScore });
      setShowEditDialog(false);
      setEditingGrade(null);
      setEditGradeValue('');
    } catch (error) {
      console.error('Error updating grade:', error);
      alert(`Error updating grade: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setEditingGrade(null);
    setEditGradeValue('');
  };

  // Handle grade deletion
  const handleDeleteGrade = (grade) => {
    setGradeToDelete(grade);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!gradeToDelete) return;
    
    try {
      await deleteGrade(gradeToDelete.id);
      setShowDeleteDialog(false);
      setGradeToDelete(null);
    } catch (error) {
      console.error('Error deleting grade:', error);
      alert(`Error deleting grade: ${error.message}`);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setGradeToDelete(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Grade Management
      </Typography>
      
      {/* Grade Entry Instructions */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Grade Entry Instructions:</strong> When entering grades, you can use either:
        </Typography>
        <Typography variant="body2" component="div" sx={{ mt: 1 }}>
          • <strong>Percentage:</strong> Enter 0-100 (e.g., 85 for 85%)
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>Points Earned:</strong> Enter the actual points earned (e.g., 4 for 4 out of 5 points)
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          The system will automatically convert points to percentages and display both formats in the table below.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
          💡 Tip: You can now edit and delete existing grades using the edit/delete buttons below each grade.
        </Typography>
      </Alert>

      {/* Bulk Grade Operations */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
        <Typography variant="h6" color="primary.main" gutterBottom>
          🚀 Bulk Grade Operations
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Assignment</InputLabel>
              <Select
                value={bulkAssignmentId || ''}
                onChange={(e) => setBulkAssignmentId(e.target.value)}
                label="Select Assignment"
              >
                <MenuItem value="">Choose an assignment</MenuItem>
                {assignments.map(assignment => (
                  <MenuItem key={assignment.id} value={assignment.id}>
                    {assignment.name} ({assignment.points} pts)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
                          <TextField
                fullWidth
                size="small"
                label="Bulk Grade Value"
                type="number"
                value={bulkGradeValue}
                onChange={(e) => setBulkGradeValue(e.target.value)}
                placeholder="85 or 4.2"
                helperText="Enter percentage (0-100) or points earned (0-max points)"
              />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={handleBulkGrade}
              disabled={!bulkAssignmentId || !bulkGradeValue}
              startIcon={<GradeIcon />}
            >
              Apply to All
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={handleBulkGradeReset}
              disabled={!bulkAssignmentId}
              size="small"
            >
              Reset
            </Button>
          </Grid>
        </Grid>
        {bulkAssignmentId && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This will apply the grade to all students who haven't been graded for "{assignments.find(a => a.id === bulkAssignmentId)?.name}"
          </Typography>
        )}
      </Box>

      {/* Student Search and Filter */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
        <Typography variant="h6" gutterBottom>
          🔍 Student Search & Filter
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search Students"
              placeholder="Search by name or ID"
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Performance</InputLabel>
              <Select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value)}
                label="Filter by Performance"
              >
                <MenuItem value="">All Students</MenuItem>
                <MenuItem value="high">High Performers (≥80%)</MenuItem>
                <MenuItem value="medium">Medium Performers (60-79%)</MenuItem>
                <MenuItem value="low">Low Performers (&lt;60%)</MenuItem>
                <MenuItem value="ungraded">Ungraded Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem value="average">Average Grade (High-Low)</MenuItem>
                <MenuItem value="average-asc">Average Grade (Low-High)</MenuItem>
                <MenuItem value="recent">Recently Graded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={handleFilterReset}
              size="small"
              startIcon={<RefreshIcon />}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip 
            label={`${filteredStudents.length} students`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          {performanceFilter && (
            <Chip 
              label={`Filter: ${performanceFilter}`} 
              color="secondary" 
              variant="outlined" 
              size="small"
              onDelete={() => setPerformanceFilter('')}
            />
          )}
          {studentSearchTerm && (
            <Chip 
              label={`Search: "${studentSearchTerm}"`} 
              color="info" 
              variant="outlined" 
              size="small"
              onDelete={() => setStudentSearchTerm('')}
            />
          )}
        </Box>
      </Box>
      


      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              {assignments.map(assignment => (
                <TableCell key={assignment.id} align="center">
                  {assignment.name}
                  <Typography variant="caption" display="block">
                    {assignment.points} pts
                  </Typography>
                </TableCell>
              ))}
              <TableCell>Average</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map(student => {
              const studentGrades = grades.filter(g => g.studentId === student.id);
              
              // Calculate average based only on graded assignments
              let totalEarnedPointsForGraded = 0;
              let totalPossiblePointsForGraded = 0;
              
              assignments.forEach(assignment => {
                const grade = studentGrades.find(g => g.assignmentId === assignment.id);
                if (grade) {
                  // Convert percentage to points earned for this assignment
                  const pointsEarned = (grade.score / 100) * assignment.points;
                  totalEarnedPointsForGraded += pointsEarned;
                  totalPossiblePointsForGraded += assignment.points;
                }
              });
              
              const average = totalPossiblePointsForGraded > 0 ? (totalEarnedPointsForGraded / totalPossiblePointsForGraded) * 100 : 0;

              return (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  {assignments.map(assignment => {
                    const grade = studentGrades.find(g => g.assignmentId === assignment.id);
                    return (
                      <TableCell key={assignment.id} align="center">
                        {grade ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              color={grade.score >= 70 ? 'success.main' : 'error.main'}
                            >
                              {grade.score}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {((grade.score / 100) * assignment.points).toFixed(1)}/{assignment.points} pts
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Edit Grade">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditGrade(grade, assignment)}
                                  sx={{ p: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Grade">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteGrade(grade)}
                                  sx={{ p: 0.5 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onGradeAssignment(assignment, student)}
                          >
                            Grade
                          </Button>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Tooltip title={`Weighted average: ${totalEarnedPointsForGraded.toFixed(2)}/${totalPossiblePointsForGraded} points = ${average.toFixed(1)}%`}>
                      <Typography
                        variant="body2"
                        color={average >= 70 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {average.toFixed(1)}%
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Grade Dialog */}
      <Dialog open={showEditDialog} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Grade</DialogTitle>
        <DialogContent>
          {editingGrade && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Student:</strong> {filteredStudents.find(s => s.id === editingGrade.studentId)?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Assignment:</strong> {assignments.find(a => a.id === editingGrade.assignmentId)?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Current Grade:</strong> {editingGrade.score.toFixed(1)}% ({((editingGrade.score / 100) * assignments.find(a => a.id === editingGrade.assignmentId)?.points).toFixed(1)} points)
              </Typography>
              <TextField
                fullWidth
                label="New Grade (Points Earned)"
                type="number"
                value={editGradeValue}
                onChange={(e) => setEditGradeValue(e.target.value)}
                inputProps={{ 
                  min: 0, 
                  max: assignments.find(a => a.id === editingGrade.assignmentId)?.points || 100,
                  step: 0.1 
                }}
                sx={{ mt: 2 }}
                helperText={`Enter points earned (0-${assignments.find(a => a.id === editingGrade.assignmentId)?.points || 100}). Will be converted to percentage automatically.`}
              />
              {editGradeValue && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {parseFloat(editGradeValue) > (assignments.find(a => a.id === editingGrade.assignmentId)?.points || 100) ? 
                    `Points earned: ${editGradeValue} out of ${assignments.find(a => a.id === editingGrade.assignmentId)?.points} (${((parseFloat(editGradeValue) / (assignments.find(a => a.id === editingGrade.assignmentId)?.points || 1)) * 100).toFixed(1)}%)` :
                    `Percentage: ${((parseFloat(editGradeValue) / (assignments.find(a => a.id === editingGrade.assignmentId)?.points || 1)) * 100).toFixed(1)}% (${editGradeValue} points)`
                  }
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editGradeValue}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Grade Dialog */}
      <Dialog open={showDeleteDialog} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Grade</DialogTitle>
        <DialogContent>
          {gradeToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this grade?
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Student:</strong> {filteredStudents.find(s => s.id === gradeToDelete.studentId)?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Assignment:</strong> {assignments.find(a => a.id === gradeToDelete.assignmentId)?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Grade:</strong> {gradeToDelete.score.toFixed(1)}% ({((gradeToDelete.score / 100) * assignments.find(a => a.id === gradeToDelete.assignmentId)?.points).toFixed(1)} points)
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete Grade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ analytics, loading, subject }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics available for {subject || 'this subject'}. Create some assignments and grades to see analytics.
      </Alert>
    );
  }

  // Prepare data for charts
  const traditionalData = {
    averageScore: analytics.traditional?.averageScore || 0,
    totalGrades: analytics.traditional?.totalGrades || 0,
    scoreRange: analytics.traditional?.scoreRange || { min: 0, max: 0 }
  };

  const standardsData = {
    averageProficiency: analytics.standards?.averageProficiency || 0,
    totalStandards: analytics.standards?.totalStandards || 0
  };

  const combinedData = {
    overallGrade: analytics.combined?.overallPerformance?.grade || 'F',
    overallScore: analytics.combined?.overallPerformance?.score || 0,
    traditionalContribution: analytics.combined?.overallPerformance?.traditionalContribution || 0,
    standardsContribution: analytics.combined?.overallPerformance?.standardsContribution || 0,
    correlation: analytics.combined?.correlation || 0
  };

  // Local export/print handlers for this tab
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAnalytics = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Average Score', `${traditionalData.averageScore.toFixed(1)}%`],
      ['Score Range', `${traditionalData.scoreRange.min}-${traditionalData.scoreRange.max}%`],
      ['Standards Avg', `${standardsData.averageProficiency.toFixed(1)}/4`],
      ['Overall Grade', combinedData.overallGrade],
      ['Overall Score', `${combinedData.overallScore.toFixed(1)}%`],
      ['Traditional Contribution', `${combinedData.traditionalContribution.toFixed(1)}%`],
      ['Standards Contribution', `${combinedData.standardsContribution.toFixed(1)}%`],
      ['Correlation', `${(combinedData.correlation * 100).toFixed(1)}%`]
    ];
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `analytics-${subject || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportGrades = () => {
    // Not enough context in this tab to export per-student grades; export analytics summary instead
    handleExportAnalytics();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <Grid container spacing={3}>
      {/* Performance Overview Cards */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
              {traditionalData.averageScore.toFixed(1)}%
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Traditional Grades
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Box>
                <Typography variant="body2">Total Grades</Typography>
                <Typography variant="h6">{traditionalData.totalGrades}</Typography>
              </Box>
              <Box>
                <Typography variant="body2">Range</Typography>
                <Typography variant="h6">{traditionalData.scoreRange.min}-{traditionalData.scoreRange.max}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
              {standardsData.averageProficiency.toFixed(1)}/4
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Standards Proficiency
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Total Standards</Typography>
              <Typography variant="h6">{standardsData.totalStandards}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <CardContent sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
              {combinedData.overallGrade}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Overall Grade
            </Typography>
            <Typography variant="h5" sx={{ mb: 1 }}>
              {combinedData.overallScore.toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Distribution Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 200, 
                  height: 200, 
                  borderRadius: '50%', 
                  background: `conic-gradient(
                    #ff6b6b ${Math.min(traditionalData.averageScore, 100)}deg, 
                    #f0f0f0 ${Math.min(traditionalData.averageScore, 100)}deg 360deg
                  )`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <Box sx={{
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="h4" color="primary">
                      {traditionalData.averageScore.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Average Score
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Contribution Breakdown */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Contribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Traditional Contribution
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 20, 
                    background: '#f0f0f0', 
                    borderRadius: 10,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      width: `${Math.min(combinedData.traditionalContribution, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      transition: 'width 0.5s ease'
                    }} />
                  </Box>
                  <Typography variant="body2" color="primary">
                    {combinedData.traditionalContribution.toFixed(1)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Standards Contribution
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 20, 
                    background: '#f0f0f0', 
                    borderRadius: 10,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      width: `${Math.min(combinedData.standardsContribution, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f093fb, #f5576c)',
                      transition: 'width 0.5s ease'
                    }} />
                  </Box>
                  <Typography variant="body2" color="secondary">
                    {combinedData.standardsContribution.toFixed(1)}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Correlation
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 20, 
                    background: '#f0f0f0', 
                    borderRadius: 10,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      width: `${Math.min(combinedData.correlation * 100, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                      transition: 'width 0.5s ease'
                    }} />
                  </Box>
                  <Typography variant="body2" color="info.main">
                    {(combinedData.correlation * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Score Range Visualization */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Score Range Analysis
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: 40, 
                  background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)',
                  borderRadius: 20,
                  position: 'relative',
                  mb: 2
                }}>
                  <Box sx={{
                    position: 'absolute',
                    left: `${(traditionalData.scoreRange.min / 100) * 100}%`,
                    top: -10,
                    width: 20,
                    height: 20,
                    background: 'white',
                    borderRadius: '50%',
                    border: '3px solid #333',
                    transform: 'translateX(-50%)'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    left: `${(traditionalData.scoreRange.max / 100) * 100}%`,
                    top: -10,
                    width: 20,
                    height: 20,
                    background: 'white',
                    borderRadius: '50%',
                    border: '3px solid #333',
                    transform: 'translateX(-50%)'
                  }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Min: {traditionalData.scoreRange.min}% | Max: {traditionalData.scoreRange.max}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Range: {traditionalData.scoreRange.max - traditionalData.scoreRange.min}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Standards Proficiency Scale */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Standards Proficiency Scale
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: 60, 
                  background: '#f0f0f0', 
                  borderRadius: 30,
                  position: 'relative',
                  mb: 2
                }}>
                  {[1, 2, 3, 4].map((level) => (
                    <Box key={level} sx={{
                      position: 'absolute',
                      left: `${(level - 1) / 3 * 100}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: level <= standardsData.averageProficiency ? '#f093fb' : '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: level <= standardsData.averageProficiency ? 'white' : '#666',
                      fontWeight: 'bold'
                    }}>
                      {level}
                    </Box>
                  ))}
                  <Box sx={{
                    position: 'absolute',
                    left: `${Math.min(standardsData.averageProficiency / 4, 1) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 20,
                    height: 20,
                    background: '#f5576c',
                    borderRadius: '50%',
                    border: '3px solid white'
                  }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Current Level: {standardsData.averageProficiency.toFixed(1)}/4
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary Statistics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary">
                    {traditionalData.totalGrades}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Grades
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="secondary">
                    {standardsData.totalStandards}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Standards Assessed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main">
                    {combinedData.overallGrade}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Letter Grade
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main">
                    {(combinedData.correlation * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Correlation
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Grade Recalculation Warning */}
            {traditionalData.averageScore < 20 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  ⚠️ Low Grade Warning
                </Typography>
                <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                  Your grades are showing very low percentages (average: {traditionalData.averageScore.toFixed(1)}%). 
                  This usually means grades were entered as points earned instead of percentages.
                </Typography>
                <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                  <strong>Example:</strong> If a student earned 4 points out of 10, the grade should be 40%, not 4%.
                </Typography>
                <Typography variant="body2" color="warning.main">
                  <strong>Solution:</strong> Re-enter the grades using the correct format, or the system will now automatically convert points to percentages for new grades.
                </Typography>
              </Box>
            )}

            {/* Export and Data Management */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                📊 Export & Data Management
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleExportGrades}
                    startIcon={<DownloadIcon />}
                  >
                    Export Grades CSV
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleExportAnalytics}
                    startIcon={<AssessmentIcon />}
                  >
                    Export Analytics Report
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handlePrintReport}
                    startIcon={<PrintIcon />}
                  >
                    Print Report
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Standards Tab Component
const StandardsTab = ({ 
  assignments, 
  students, 
  standardsGrades, 
  onCreateStandardMapping,
  onGetAssignmentStandards,
  onGetProficiencyScale 
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [standardsData, setStandardsData] = useState([]);
  const [proficiencyScale, setProficiencyScale] = useState([]);

  useEffect(() => {
    if (selectedAssignment) {
      loadAssignmentStandards();
    }
    loadProficiencyScale();
  }, [selectedAssignment]);

  const loadAssignmentStandards = async () => {
    if (!selectedAssignment) return;
    try {
      const standards = await onGetAssignmentStandards(selectedAssignment.id);
      setStandardsData(standards);
    } catch (error) {
      console.error('Error loading standards:', error);
    }
  };

  const loadProficiencyScale = async () => {
    try {
      const scale = onGetProficiencyScale();
      setProficiencyScale(scale);
    } catch (error) {
      console.error('Error loading proficiency scale:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Standards-Based Assessment
      </Typography>

      <Grid container spacing={3}>
        {/* Assignment Selection */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Assignment
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedAssignment?.id || ''}
                  onChange={(e) => {
                    const assignment = assignments.find(a => a.id === e.target.value);
                    setSelectedAssignment(assignment);
                  }}
                >
                  {assignments.map(assignment => (
                    <MenuItem key={assignment.id} value={assignment.id}>
                      {assignment.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Standards Data */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Standards Mappings
              </Typography>
              {selectedAssignment ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    {standardsData.length} standards mapped to this assignment
                  </Typography>
                  <List>
                    {standardsData.map(standard => (
                      <ListItem key={standard.id}>
                        <ListItemText
                          primary={standard.standardName || standard.standardId}
                          secondary={`Alignment: ${standard.alignmentStrength || 'N/A'}`}
                        />
                        <Chip 
                          label={`Weight: ${standard.weight || 1.0}`}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select an assignment to view standards mappings
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Proficiency Scale */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proficiency Scale
              </Typography>
              <Grid container spacing={2}>
                {proficiencyScale.map(level => (
                  <Grid item xs={12} sm={6} md={3} key={level.level}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {level.level}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {level.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {level.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Assignment Dialog Component
const AssignmentDialog = ({ open, onClose, onSubmit, assignment, subjects }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    category: '',
    points: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        name: assignment.name || '',
        subject: assignment.subject || '',
        category: assignment.category || '',
        points: assignment.points || '',
        dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
        description: assignment.description || ''
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        category: '',
        points: '',
        dueDate: '',
        description: ''
      });
    }
  }, [assignment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      points: parseFloat(formData.points),
      dueDate: new Date(formData.dueDate).toISOString(),
      createdAt: new Date().toISOString(),
      status: 'active'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {assignment ? 'Edit Assignment' : 'Create New Assignment'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assignment Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  label="Subject"
                >
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.subject && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This assignment will be linked to the '{formData.subject} - Grade Book'.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {assignment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Grade Dialog Component
const GradeDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  assignment, 
  student, 
  gradeValue, 
  onGradeChange,
  standardsEnabled,
  onStandardsToggle 
}) => {
  const [standardsData, setStandardsData] = useState([]);
  const [standardsGrades, setStandardsGrades] = useState({});
  const [loadingStandards, setLoadingStandards] = useState(false);
  const { getAssignmentStandardsData } = useAssignments();

  // Load standards for the assignment when dialog opens
  useEffect(() => {
    if (open && assignment && assignment.hasStandardsAssessment) {
      loadAssignmentStandards();
    }
  }, [open, assignment]);

  const loadAssignmentStandards = async () => {
    if (!assignment) return;
    
    setLoadingStandards(true);
    try {
      // Try to get real standards data from the assignment context
      let standards = [];
      
      try {
        // Check if the assignment has standards data
        if (assignment.standards && Array.isArray(assignment.standards)) {
          standards = assignment.standards;
        } else if (assignment.mappedStandardsCount > 0) {
          // If we have a count but no standards array, try to fetch them
          // This would use the actual getAssignmentStandardsData function
          console.log('Assignment has standards but not loaded, attempting to fetch...');
          
          // For now, create mock standards based on the assignment info
          // In production, this would call: standards = await getAssignmentStandardsData(assignment.id);
          standards = [
            {
              id: 'ela-1',
              standardId: 'ELA.1',
              standardName: 'Reading Comprehension',
              standardDescription: 'Demonstrate understanding of key ideas and details',
              alignmentStrength: 'Strong',
              weight: 1.0
            },
            {
              id: 'ela-2', 
              standardId: 'ELA.2',
              standardName: 'Writing Skills',
              standardDescription: 'Write informative/explanatory texts',
              alignmentStrength: 'Moderate',
              weight: 0.8
            },
            {
              id: 'ela-3',
              standardId: 'ELA.3', 
              standardName: 'Critical Thinking',
              standardDescription: 'Analyze and evaluate arguments and evidence',
              alignmentStrength: 'Strong',
              weight: 0.9
            }
          ];
        }
      } catch (standardsError) {
        console.log('Using fallback standards data:', standardsError);
        // Use mock data as fallback
        standards = [
          {
            id: 'ela-1',
            standardId: 'ELA.1',
            standardName: 'Reading Comprehension',
            standardDescription: 'Demonstrate understanding of key ideas and details',
            alignmentStrength: 'Strong',
            weight: 1.0
          },
          {
            id: 'ela-2', 
            standardId: 'ELA.2',
            standardName: 'Writing Skills',
            standardDescription: 'Write informative/explanatory texts',
            alignmentStrength: 'Moderate',
            weight: 0.8
          },
          {
            id: 'ela-3',
            standardId: 'ELA.3', 
            standardName: 'Critical Thinking',
            standardDescription: 'Analyze and evaluate arguments and evidence',
            alignmentStrength: 'Strong',
            weight: 0.9
          }
        ];
      }
      
      setStandardsData(standards);
      
             // Initialize standards grades
       const initialGrades = {};
       standards.forEach(standard => {
         initialGrades[standard.standardId] = null; // Use null instead of empty string
       });
       setStandardsGrades(initialGrades);
    } catch (error) {
      console.error('Error loading standards:', error);
    } finally {
      setLoadingStandards(false);
    }
  };

  const handleStandardsGradeChange = (standardId, value) => {
    console.log('Standards grade change:', { standardId, value });
    setStandardsGrades(prev => ({
      ...prev,
      [standardId]: value
    }));
  };

  const handleSubmit = () => {
         // Validate that standards grades are entered if standards grading is enabled
     if (assignment.hasStandardsAssessment) {
       const hasStandardsGrades = Object.values(standardsGrades).some(grade => grade !== '' && grade !== null);
       if (!hasStandardsGrades) {
         alert('Please enter proficiency levels for at least one standard when standards grading is enabled.');
         return;
       }
     }
    
    // Call the original onSubmit with standards grades
    onSubmit(standardsGrades);
  };

  if (!assignment || !student) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Enter Grade</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Assignment Info */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Assignment:</strong> {assignment.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Student:</strong> {student.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Subject:</strong> {assignment.subject}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Points:</strong> {assignment.points}
              </Typography>
            </Box>
          </Grid>

          {/* Traditional Grade */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Grade (%)"
              type="number"
              value={gradeValue}
              onChange={(e) => onGradeChange(e.target.value)}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              required
              helperText={`Enter grade as percentage (0-100). For ${assignment.points} points, you can also enter points earned (0-${assignment.points}) and it will be converted automatically.`}
            />
            {gradeValue && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {parseFloat(gradeValue) > 100 ? 
                  `Points earned: ${gradeValue} out of ${assignment.points} (${((parseFloat(gradeValue) / assignment.points) * 100).toFixed(1)}%)` :
                  `Percentage: ${gradeValue}% (${((parseFloat(gradeValue) / 100) * assignment.points).toFixed(1)} points)`
                }
              </Typography>
            )}
          </Grid>

                     {/* Standards Grading Info */}
           <Grid item xs={12} md={6}>
             <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
               <Typography variant="body2" color="info.main" gutterBottom>
                 <strong>Standards Assessment:</strong> {assignment.hasStandardsAssessment ? 'Enabled' : 'Disabled'}
               </Typography>
               {assignment.hasStandardsAssessment && (
                 <>
                   <Typography variant="body2" color="info.main">
                     <strong>Grading Mode:</strong> {assignment.gradingMode}
                   </Typography>
                   <Typography variant="body2" color="info.main">
                     <strong>Standards Weight:</strong> {(assignment.standardsWeight * 100).toFixed(0)}%
                   </Typography>
                   <Typography variant="body2" color="info.main">
                     <strong>Proficiency Scale:</strong> {assignment.proficiencyScale === 'four_point' ? '4-Point Scale' : '5-Point Scale'}
                   </Typography>
                 </>
               )}
             </Box>
           </Grid>

           {/* Standards Grading Section */}
           {assignment.hasStandardsAssessment && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Standards-Based Assessment
                </Typography>
                
                {/* Debug: Show current standards grades state */}
                <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
                  <Typography variant="caption" color="text.secondary">
                    Debug - Current standards grades: {JSON.stringify(standardsGrades)}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => {
                        // Test state change
                        setStandardsGrades({
                          'ELA.1': 3,
                          'ELA.2': 2,
                          'ELA.3': 4
                        });
                      }}
                    >
                      Test: Set Sample Grades
                    </Button>
                  </Box>
                </Box>
                
                {loadingStandards ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : standardsData.length > 0 ? (
                  <Grid container spacing={2}>
                    {standardsData.map((standard) => (
                      <Grid item xs={12} key={standard.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {standard.standardName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {standard.standardId} - {standard.standardDescription}
                                </Typography>
                                <Chip 
                                  label={`Weight: ${standard.weight}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                                {standardsGrades[standard.standardId] && (
                                  <Chip 
                                    label={`Selected: ${standardsGrades[standard.standardId]}`}
                                    size="small" 
                                    color="primary"
                                    sx={{ mt: 1, ml: 1 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                Proficiency Level:
                              </Typography>                              
                              <FormControl fullWidth size="small">
                              <Select
                                value={standardsGrades[standard.standardId] || ''}
                                onChange={(e) => handleStandardsGradeChange(standard.standardId, e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value=""><em>Select proficiency level</em></MenuItem>
                                <MenuItem value={1}>1 - Beginning</MenuItem>
                                <MenuItem value={2}>2 - Developing</MenuItem>
                                <MenuItem value={3}>3 - Proficient</MenuItem>
                                <MenuItem value={4}>4 - Advanced</MenuItem>
                                {assignment.proficiencyScale !== 'four_point' && (
                                  <MenuItem value={5}>5 - Exemplary</MenuItem>
                                )}
                              </Select>
                              </FormControl>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No standards are currently mapped to this assignment. 
                    You can still enter a traditional grade, or enable standards mapping in the Standards tab.
                  </Alert>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
                 <Button 
           onClick={handleSubmit} 
           variant="contained"
           disabled={!gradeValue || (assignment.hasStandardsAssessment && Object.values(standardsGrades).every(grade => grade === '' || grade === null))}
         >
          Save Grade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentsGradebookDashboard;
