import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useLessons } from '../../contexts/LessonContext';
import { useGradeBooks } from '../../contexts/GradeBookContext';
import { useSubjects } from '../../contexts/SubjectsContext';


const LessonEntryForm = ({ onSave, initialData = null, onCancel }) => {
  const { addLesson, updateLesson } = useLessons();
  const { gradeBooks } = useGradeBooks();
  const { subjects, loading: subjectsLoading } = useSubjects();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: dayjs(),
    subject: '',
    gradebookId: '',
    learningObjectives: '',
    activities: '',
    homework: '',
    notes: '',
    duration: 45,
    materials: []
  });

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    type: 'google_drive',
    url: '',
    description: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      const resolvedSubjectId = initialData.subjectId
        ? initialData.subjectId
        : initialData.subject && Array.isArray(subjects)
          ? (subjects.find((s) => s.name === initialData.subject)?.id || '')
          : '';

      setFormData({
        ...initialData,
        subject: resolvedSubjectId,
        date: dayjs(initialData.date),
        learningObjectives: Array.isArray(initialData.learningObjectives) 
          ? initialData.learningObjectives.join(', ')
          : initialData.learningObjectives || '',
        activities: Array.isArray(initialData.activities)
          ? initialData.activities.join(', ')
          : initialData.activities || ''
      });
    }
  }, [initialData, subjects]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMaterialAdd = () => {
    if (newMaterial.name && newMaterial.url) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, { ...newMaterial }]
      }));
      setNewMaterial({
        name: '',
        type: 'google_drive',
        url: '',
        description: ''
      });
    }
  };

  const handleMaterialDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert comma-separated strings to arrays
      const selectedSubjectName = Array.isArray(subjects)
        ? (subjects.find((s) => s.id === formData.subject)?.name || '')
        : '';

      const lessonData = {
        ...formData,
        // ensure both subjectId and human-readable subject are included
        subjectId: formData.subject || '',
        subject: selectedSubjectName || '',
        date: formData.date.format('YYYY-MM-DD'),
        learningObjectives: formData.learningObjectives
          .split(',')
          .map(obj => obj.trim())
          .filter(obj => obj.length > 0),
        activities: formData.activities
          .split(',')
          .map(activity => activity.trim())
          .filter(activity => activity.length > 0)
      };

      if (initialData) {
        await updateLesson(initialData.id, lessonData);
        setSnackbar({
          open: true,
          message: 'Lesson updated successfully!',
          severity: 'success'
        });
      } else {
        await addLesson(lessonData);
        setSnackbar({
          open: true,
          message: 'Lesson added successfully!',
          severity: 'success'
        });
      }

      if (onSave) {
        onSave(lessonData);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleClear = () => {
    setFormData({
      title: '',
      description: '',
      date: dayjs(),
      subject: '',
      gradebookId: '',
      learningObjectives: '',
      activities: '',
      homework: '',
      notes: '',
      duration: 45,
      materials: []
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {initialData ? 'Edit Lesson' : 'Add New Lesson'}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lesson Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(date) => handleInputChange('date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    label="Subject"
                    disabled={subjectsLoading}
                  >
                    <MenuItem value="">No Subject</MenuItem>
                    {subjects && subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gradebook</InputLabel>
                  <Select
                    value={formData.gradebookId}
                    onChange={(e) => handleInputChange('gradebookId', e.target.value)}
                    label="Gradebook"
                  >
                    <MenuItem value="">No Gradebook</MenuItem>
                    {gradeBooks.map(gradebook => (
                      <MenuItem key={gradebook.id} value={gradebook.id}>
                        {gradebook.name} ({gradebook.subject})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  margin="normal"
                  required
                />
              </Grid>

              {/* Learning Objectives */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Learning Objectives (comma-separated)"
                  value={formData.learningObjectives}
                  onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
                  multiline
                  rows={2}
                  margin="normal"
                  helperText="Enter learning objectives separated by commas"
                />
              </Grid>

              {/* Activities */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Activities (comma-separated)"
                  value={formData.activities}
                  onChange={(e) => handleInputChange('activities', e.target.value)}
                  multiline
                  rows={2}
                  margin="normal"
                  helperText="Enter activities separated by commas"
                />
              </Grid>

              {/* Homework */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Homework"
                  value={formData.homework}
                  onChange={(e) => handleInputChange('homework', e.target.value)}
                  multiline
                  rows={2}
                  margin="normal"
                />
              </Grid>

              {/* Materials */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Materials
                </Typography>
                
                {formData.materials.map((material, index) => (
                  <Chip
                    key={index}
                    label={`${material.name} (${material.type})`}
                    onDelete={() => handleMaterialDelete(index)}
                    sx={{ m: 0.5 }}
                  />
                ))}

                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Material Name"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={newMaterial.type}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
                        label="Type"
                      >
                        <MenuItem value="google_drive">Google Drive</MenuItem>
                        <MenuItem value="youtube">YouTube</MenuItem>
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="website">Website</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="URL"
                      value={newMaterial.url}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <IconButton onClick={handleMaterialAdd} color="primary">
                      <AddIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={3}
                  margin="normal"
                  helperText="Any additional notes or observations"
                />
              </Grid>

              {/* Duration */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  margin="normal"
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClear}
              >
                Clear
              </Button>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
              >
                {initialData ? 'Update Lesson' : 'Save Lesson'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default LessonEntryForm;