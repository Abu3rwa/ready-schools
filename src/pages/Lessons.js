import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useLessons } from '../contexts/LessonContext';
import { useGradeBooks } from '../contexts/GradeBookContext';
import LessonEntryForm from '../components/lessons/LessonEntryForm';
import Loading from '../components/common/Loading';

const Lessons = () => {
  const { lessons, loading, error, deleteLesson } = useLessons();
  const { gradeBooks } = useGradeBooks();
  
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGradebook, setSelectedGradebook] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter lessons based on selected criteria
  const filteredLessons = lessons.filter(lesson => {
    const dateMatch = !selectedDate || lesson.date === selectedDate.format('YYYY-MM-DD');
    const subjectMatch = !selectedSubject || lesson.subject === selectedSubject;
    const gradebookMatch = !selectedGradebook || lesson.gradebookId === selectedGradebook;
    
    return dateMatch && subjectMatch && gradebookMatch;
  });

  // Get unique subjects from lessons
  const subjects = [...new Set(lessons.map(lesson => lesson.subject))].filter(Boolean);

  const handleAddLesson = () => {
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setShowForm(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await deleteLesson(lessonId);
        setSnackbar({
          open: true,
          message: 'Lesson deleted successfully!',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error deleting lesson: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };

  const handleSaveLesson = (lessonData) => {
    setShowForm(false);
    setSnackbar({
      open: true,
      message: editingLesson ? 'Lesson updated successfully!' : 'Lesson added successfully!',
      severity: 'success'
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLesson(null);
  };

  const getGradebookName = (gradebookId) => {
    const gradebook = gradeBooks.find(gb => gb.id === gradebookId);
    return gradebook ? gradebook.name : 'Unknown Gradebook';
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  if (loading) {
    return <Loading message="Loading lessons..." />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading lessons: {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Lessons
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddLesson}
          >
            Add Lesson
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    label="Subject"
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {subjects.map(subject => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Gradebook</InputLabel>
                  <Select
                    value={selectedGradebook}
                    onChange={(e) => setSelectedGradebook(e.target.value)}
                    label="Gradebook"
                  >
                    <MenuItem value="">All Gradebooks</MenuItem>
                    {gradeBooks.map(gradebook => (
                      <MenuItem key={gradebook.id} value={gradebook.id}>
                        {gradebook.name} ({gradebook.subject})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedDate(dayjs());
                    setSelectedSubject('');
                    setSelectedGradebook('');
                  }}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Lessons List */}
        {filteredLessons.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="text.secondary">
                No lessons found. {lessons.length === 0 ? 'Add your first lesson!' : 'Try adjusting your filters.'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredLessons.map((lesson) => (
              <Grid item xs={12} md={6} lg={4} key={lesson.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                        {lesson.title}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit Lesson">
                          <IconButton
                            size="small"
                            onClick={() => handleEditLesson(lesson)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Lesson">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatDate(lesson.date)} • {lesson.duration} minutes
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={lesson.subject}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      {lesson.gradebookId && (
                        <Chip
                          label={getGradebookName(lesson.gradebookId)}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Typography variant="body2" paragraph>
                      {lesson.description}
                    </Typography>

                    {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Learning Objectives:
                        </Typography>
                        <Typography variant="body2">
                          {lesson.learningObjectives.join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {lesson.activities && lesson.activities.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Activities:
                        </Typography>
                        <Typography variant="body2">
                          {lesson.activities.join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {lesson.homework && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Homework:
                        </Typography>
                        <Typography variant="body2">
                          {lesson.homework}
                        </Typography>
                      </Box>
                    )}

                    {lesson.materials && lesson.materials.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Materials:
                        </Typography>
                        {lesson.materials.map((material, index) => (
                          <Link
                            key={index}
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            display="block"
                            sx={{ mb: 0.5 }}
                          >
                            <Chip
                              icon={<LinkIcon />}
                              label={material.name}
                              size="small"
                              variant="outlined"
                            />
                          </Link>
                        ))}
                      </Box>
                    )}

                    {lesson.notes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Notes:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lesson.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add/Edit Lesson Form */}
        {showForm && (
          <Box sx={{ mt: 3, mb: 4 }}>
            <LessonEntryForm
              onSave={handleSaveLesson}
              onCancel={handleCancel}
              initialData={editingLesson}
            />
          </Box>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Lessons;
