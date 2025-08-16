import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useGradeBooks } from '../../contexts/GradeBookContext';
import { useAcademicPeriods } from '../../contexts/AcademicPeriodsContext';
import TermGradeBookManager from './TermGradeBookManager';

const SimpleGradeBookSelector = ({ 
  currentGradeBook, 
  onGradeBookChange,
  showCreateButton = true 
}) => {
  const { gradeBooks, loading } = useGradeBooks();
  const { years, getSemestersForYear, getTermsForSemester } = useAcademicPeriods();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Get available subjects
  const subjects = Array.from(new Set(gradeBooks.map(gb => gb.subject))).sort();

  // Get gradebooks for current selection
  const availableGradeBooks = gradeBooks.filter(gb => {
    const yearMatch = !selectedYear || gb.academicYear === selectedYear;
    const semesterMatch = !selectedSemester || gb.semester === selectedSemester;
    const termMatch = !selectedTerm || gb.term === selectedTerm;
    const subjectMatch = !selectedSubject || gb.subject === selectedSubject;
    
    return yearMatch && semesterMatch && termMatch && subjectMatch;
  });

  const handleGradeBookSelect = (gradeBook) => {
    console.log('SimpleGradeBookSelector: handleGradeBookSelect called with:', gradeBook);
    if (onGradeBookChange) {
      console.log('SimpleGradeBookSelector: calling onGradeBookChange');
      onGradeBookChange(gradeBook);
    } else {
      console.log('SimpleGradeBookSelector: onGradeBookChange is not defined');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Simple Selector */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h6">Gradebook</Typography>
        
        {showCreateButton && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            New Gradebook
          </Button>
        )}
      </Box>

      {/* Quick Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              label="Year"
            >
              <MenuItem value="">All Years</MenuItem>
              {years.map((year) => (
                <MenuItem key={year.id} value={year.name}>
                  {year.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" disabled={!selectedYear}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              label="Semester"
            >
              <MenuItem value="">All Semesters</MenuItem>
              {getSemestersForYear(years.find(y => y.name === selectedYear)?.id || "").map((semester) => (
                <MenuItem key={semester.id} value={semester.name}>
                  {semester.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" disabled={!selectedSemester}>
            <InputLabel>Term</InputLabel>
            <Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              label="Term"
            >
              <MenuItem value="">All Terms</MenuItem>
              {getTermsForSemester(
                years.find(y => y.name === selectedYear)?.id || "",
                getSemestersForYear(years.find(y => y.name === selectedYear)?.id || "")
                  .find(s => s.name === selectedSemester)?.id || ""
              ).map((term) => (
                <MenuItem key={term.id} value={term.name}>
                  {term.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              label="Subject"
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Gradebook Cards */}
      {availableGradeBooks.length === 0 ? (
        <Alert severity="info">
          {loading ? 'Loading gradebooks...' : 'No gradebooks found. Create your first gradebook to get started.'}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {availableGradeBooks.map((gradeBook) => (
            <Grid item xs={12} md={6} lg={4} key={gradeBook.id}>
              <Card 
                variant={currentGradeBook?.id === gradeBook.id ? "elevation" : "outlined"}
                sx={{ 
                  cursor: 'pointer',
                  border: currentGradeBook?.id === gradeBook.id ? 2 : 1,
                  borderColor: currentGradeBook?.id === gradeBook.id ? 'primary.main' : 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }
                }}
                onClick={() => handleGradeBookSelect(gradeBook)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {gradeBook.name}
                    </Typography>
                    <Chip
                      label={gradeBook.status}
                      color={getStatusColor(gradeBook.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {gradeBook.subject} • {gradeBook.gradeLevel}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {gradeBook.academicYear} • {gradeBook.semester} • {gradeBook.term}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                      icon={<SchoolIcon />}
                      label={`${gradeBook.students?.length || 0} students`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CategoryIcon />}
                      label={`${gradeBook.assignments?.length || 0} assignments`}
                      size="small"
                      variant="outlined"
                    />
                    {gradeBook.categories && gradeBook.categories.length > 0 && (
                      <Chip
                        icon={<CategoryIcon />}
                        label={`${gradeBook.categories.length} categories`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  {gradeBook.lastModified && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Last modified: {new Date(gradeBook.lastModified).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Gradebook Dialog */}
      <TermGradeBookManager
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </Box>
  );
};

export default SimpleGradeBookSelector; 