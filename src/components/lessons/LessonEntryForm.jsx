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
import useDrivePicker from 'react-google-drive-picker';
import { useTheme } from '@mui/material/styles';


const LessonEntryForm = ({ onSave, initialData = null, onCancel }) => {
  const theme = useTheme();
  const { addLesson, updateLesson } = useLessons();
  const { gradeBooks } = useGradeBooks();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const [openPicker, authResponse] = useDrivePicker();
  
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
    console.log('=== ADDING MATERIAL TO FORM ===');
    console.log('Current newMaterial state:', newMaterial);
    console.log('Current formData.materials:', formData.materials);
    
    if (newMaterial.name && newMaterial.url) {
      const materialToAdd = { ...newMaterial };
      console.log('Material to add:', materialToAdd);
      
      setFormData(prev => {
        const updatedMaterials = [...prev.materials, materialToAdd];
        console.log('Updated materials array:', updatedMaterials);
        console.log('Full updated formData:', { ...prev, materials: updatedMaterials });
        return { ...prev, materials: updatedMaterials };
      });
      
      setNewMaterial({
        name: '',
        type: 'google_drive',
        url: '',
        description: ''
      });
      
      console.log('Material added successfully!');
    } else {
      console.log('Material validation failed:');
      console.log('- name exists:', !!newMaterial.name);
      console.log('- url exists:', !!newMaterial.url);
    }
    console.log('=== END ADDING MATERIAL ===');
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
      <Card 
        elevation={3}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600,
              color: theme.palette.primary.main,
              mb: { xs: 2, sm: 3 },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {initialData ? 'Edit Lesson' : 'Add New Lesson'}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 1, sm: 2 } }}>
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lesson Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  margin="normal"
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
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
                <FormControl fullWidth margin="normal" size={window.innerWidth < 600 ? "small" : "medium"}>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    label="Subject"
                    disabled={subjectsLoading}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.divider
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <MenuItem value="">No Subject</MenuItem>
                    {subjects && subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" size={window.innerWidth < 600 ? "small" : "medium"}>
                  <InputLabel>Gradebook</InputLabel>
                  <Select
                    value={formData.gradebookId}
                    onChange={(e) => handleInputChange('gradebookId', e.target.value)}
                    label="Gradebook"
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.divider
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main
                      }
                    }}
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
                  rows={window.innerWidth < 600 ? 2 : 3}
                  margin="normal"
                  required
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
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
                  rows={window.innerWidth < 600 ? 2 : 2}
                  margin="normal"
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  helperText="Enter learning objectives separated by commas"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
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
                  rows={window.innerWidth < 600 ? 2 : 2}
                  margin="normal"
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  helperText="Enter activities separated by commas"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
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
                  rows={window.innerWidth < 600 ? 2 : 2}
                  margin="normal"
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>

              {/* Materials */}
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1rem', sm: '1.125rem' }
                  }}
                >
                  Materials
                </Typography>
                
                <Box sx={{ mb: { xs: 1, sm: 2 } }}>
                  {formData.materials.map((material, index) => (
                    <Chip
                      key={index}
                      label={`${material.name} (${material.type})`}
                      onDelete={() => handleMaterialDelete(index)}
                      sx={{ 
                        m: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        height: { xs: 24, sm: 32 }
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Divider sx={{ my: { xs: 1, sm: 2 } }} />
                
                <Grid container spacing={{ xs: 1, sm: 1, md: 2 }} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Material Name"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: theme.palette.primary.main
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme.palette.primary.main
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={newMaterial.type}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
                        label="Type"
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.palette.divider
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.palette.primary.main
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.palette.primary.main
                          }
                        }}
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: theme.palette.primary.main
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme.palette.primary.main
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 1 },
                      width: '100%'
                    }}>
                      <IconButton 
                        onClick={handleMaterialAdd} 
                        color="primary"
                        sx={{
                          backgroundColor: theme.palette.primary.light,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText
                          },
                          width: { xs: '100%', sm: 'auto' },
                          borderRadius: { xs: 1, sm: '50%' }
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => {
                          console.log('=== OPENING GOOGLE DRIVE PICKER DIRECTLY ===');
                          openPicker({
                            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                            developerKey: "AIzaSyAYI6vd9LWfIsuTM6sCFtDz915QLlFlOdc",
                            viewId: 'DOCS',
                            showUploadView: false,
                            setIncludeFolders: false,
                            multiselect: false,
                            customScopes: ['https://www.googleapis.com/auth/drive.readonly'],
                            setOrigin: window.location.origin,
                            setParentFolder: '',
                            setSelectFolderEnabled: false,
                            setEnableFeature: 'MINE_ONLY',
                            callbackFunction: (data) => {
                              console.log('=== GOOGLE DRIVE FILE SELECTED ===');
                              console.log('Raw file object:', data);
                              
                              if (data.action === 'picked') {
                                const selectedFile = data.docs[0];
                                if (selectedFile) {
                                  console.log('File name:', selectedFile.name);
                                  console.log('File URL:', selectedFile.url);
                                  console.log('File type:', selectedFile.mimeType);
                                  console.log('File ID:', selectedFile.id);
                                  
                                  const updatedMaterial = {
                                    name: selectedFile.name || 'Drive File',
                                    type: 'google_drive',
                                    url: selectedFile.url || '',
                                    description: ''
                                  };
                                  
                                  console.log('Updated material object:', updatedMaterial);
                                  setNewMaterial(updatedMaterial);
                                  console.log('Material set successfully!');
                                }
                              } else if (data.action === 'cancel') {
                                console.log('User cancelled file selection');
                              }
                            },
                            onAuthFailed: (data) => {
                              console.error('Auth failed:', data);
                              alert('Authentication failed. Please try again.');
                            },
                            onPickerInited: (picker) => {
                              console.log('Picker initialized successfully');
                            }
                          });
                        }} 
                        sx={{ 
                          width: { xs: '100%', sm: 'auto' },
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.dark,
                            backgroundColor: theme.palette.primary.light
                          }
                        }}
                      >
                        Add from Drive
                      </Button>
                    </Box>
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
                  rows={window.innerWidth < 600 ? 2 : 3}
                  margin="normal"
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  helperText="Any additional notes or observations"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
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
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ 
              mt: { xs: 2, sm: 3 }, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 }, 
              justifyContent: { xs: 'center', sm: 'flex-end' },
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                size={window.innerWidth < 600 ? "large" : "medium"}
                sx={{
                  order: { xs: 3, sm: 1 },
                  borderColor: theme.palette.grey[400],
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.grey[600],
                    backgroundColor: theme.palette.grey[50]
                  }
                }}
              >
                Clear
              </Button>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  size={window.innerWidth < 600 ? "large" : "medium"}
                  sx={{
                    order: { xs: 2, sm: 2 },
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.dark,
                      backgroundColor: theme.palette.secondary.light
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                size={window.innerWidth < 600 ? "large" : "medium"}
                sx={{
                  order: { xs: 1, sm: 3 },
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  },
                  fontWeight: 600
                }}
              >
                {initialData ? 'Update Lesson' : 'Save Lesson'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* The GoogleDrivePicker component is no longer needed as the picker is opened directly */}
      {/* <GoogleDrivePicker
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        onFileSelect={(file) => {
          console.log('=== GOOGLE DRIVE FILE SELECTED ===');
          console.log('Raw file object:', file);
          console.log('File name:', file.name);
          console.log('File URL:', file.webViewLink || file.url);
          console.log('File type:', file.mimeType);
          console.log('File ID:', file.id);
          
          const updatedMaterial = {
            name: file.name || 'Drive File',
            type: 'google_drive',
            url: file.webViewLink || file.url,
            description: ''
          };
          
          console.log('Updated material object:', updatedMaterial);
          console.log('Previous newMaterial state:', newMaterial);
          
          setNewMaterial(prev => {
            const result = { ...prev, ...updatedMaterial };
            console.log('New material state after update:', result);
            return result;
          });
          
          console.log('Form data before update:', formData);
          console.log('=== END FILE SELECTION ===');
          
          setDriveOpen(false);
        }}
      /> */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: window.innerWidth < 600 ? 'center' : 'right'
        }}
      >
        <Alert 
          severity={snackbar.severity || 'info'} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            width: { xs: '90vw', sm: 'auto' }
          }}
        >
          {snackbar.message || ''}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default LessonEntryForm;