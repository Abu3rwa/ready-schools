import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useGradeBooks } from '../../contexts/GradeBookContext';
import { useStudents } from '../../contexts/StudentContext';
import { useAssignments } from '../../contexts/AssignmentContext';
import { getSubjects as getManagedSubjects } from '../../services/subjectsService';
import { useAcademicPeriods } from '../../contexts/AcademicPeriodsContext';

// Pre-defined category templates
const CATEGORY_TEMPLATES = {
  math: [
    { name: 'Homework', weight: 15, color: '#4CAF50', description: 'Weekly homework assignments' },
    { name: 'Classwork', weight: 15, color: '#2196F3', description: 'In-class activities and practice' },
    { name: 'Quizzes', weight: 20, color: '#FF9800', description: 'Regular assessments' },
    { name: 'Tests', weight: 30, color: '#F44336', description: 'Major assessments' },
    { name: 'Final Exam', weight: 20, color: '#9C27B0', description: 'End of semester exam' }
  ],
  science: [
    { name: 'Homework', weight: 10, color: '#4CAF50', description: 'Weekly homework assignments' },
    { name: 'Classwork', weight: 15, color: '#2196F3', description: 'In-class activities' },
    { name: 'Labs', weight: 25, color: '#FF9800', description: 'Laboratory work and experiments' },
    { name: 'Quizzes', weight: 15, color: '#F44336', description: 'Regular assessments' },
    { name: 'Tests', weight: 25, color: '#9C27B0', description: 'Major assessments' },
    { name: 'Final Exam', weight: 10, color: '#607D8B', description: 'End of semester exam' }
  ],
  english: [
    { name: 'Homework', weight: 10, color: '#4CAF50', description: 'Weekly homework assignments' },
    { name: 'Classwork', weight: 15, color: '#2196F3', description: 'In-class activities' },
    { name: 'Essays', weight: 30, color: '#FF9800', description: 'Writing assignments' },
    { name: 'Reading', weight: 15, color: '#F44336', description: 'Reading comprehension' },
    { name: 'Participation', weight: 10, color: '#9C27B0', description: 'Class participation' },
    { name: 'Final Project', weight: 20, color: '#607D8B', description: 'End of semester project' }
  ],
  history: [
    { name: 'Homework', weight: 10, color: '#4CAF50', description: 'Weekly homework assignments' },
    { name: 'Classwork', weight: 15, color: '#2196F3', description: 'In-class activities' },
    { name: 'Essays', weight: 25, color: '#FF9800', description: 'Writing assignments' },
    { name: 'Quizzes', weight: 20, color: '#F44336', description: 'Regular assessments' },
    { name: 'Participation', weight: 10, color: '#9C27B0', description: 'Class participation' },
    { name: 'Final Exam', weight: 20, color: '#607D8B', description: 'End of semester exam' }
  ],
  custom: []
};

const STEPS = ['Basic Information', 'Categories', 'Settings'];

// Grade level options
const GRADE_LEVELS = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'
];

const CreateGradeBook = ({ open, onClose, onSuccess }) => {
  const { createGradeBook } = useGradeBooks();
  const { students } = useStudents();
  const { assignments } = useAssignments();
  const { years, getSemestersForYear, getTermsForSemester } = useAcademicPeriods();
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    academicYearId: '',
    semesterId: '',
    termId: '',
    description: '',
    categories: [],
    settings: {
      gradingScale: 'weighted_categories',
      allowLateSubmissions: true,
      autoCalculateFinal: true,
      weightCategories: true,
      roundingMethod: 'nearest_whole',
      gradeDisplay: 'percentage'
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load teacher subjects
  useEffect(() => {
    const loadTeacherSubjects = async () => {
      try {
        const subjects = await getManagedSubjects();
        setTeacherSubjects(subjects || []);
      } catch (error) {
        console.error('Error loading teacher subjects:', error);
        setTeacherSubjects([]);
      }
    };
    
    if (open) {
      loadTeacherSubjects();
    }
  }, [open]);

  // Reset semester/term when year changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, semesterId: '', termId: '' }));
  }, [formData.academicYearId]);

  // Reset term when semester changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, termId: '' }));
  }, [formData.semesterId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        subject: '',
        gradeLevel: '',
        academicYearId: '',
        semesterId: '',
        termId: '',
        description: '',
        categories: [],
        settings: {
          gradingScale: 'weighted_categories',
          allowLateSubmissions: true,
          autoCalculateFinal: true,
          weightCategories: true,
          roundingMethod: 'nearest_whole',
          gradeDisplay: 'percentage'
        }
      });
      setActiveStep(0);
      setErrors({});
    }
  }, [open]);

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Grade book name is required';
      if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
      if (!formData.gradeLevel.trim()) newErrors.gradeLevel = 'Grade level is required';
      if (!formData.academicYearId) newErrors.academicYearId = 'School year is required';
      if (!formData.semesterId) newErrors.semesterId = 'Semester is required';
      if (!formData.termId) newErrors.termId = 'Term is required';
    }

    if (step === 1) {
      if (formData.categories.length === 0) {
        newErrors.categories = 'At least one category is required';
      } else {
        const totalWeight = formData.categories.reduce((sum, cat) => sum + (cat.weight || 0), 0);
        if (totalWeight !== 100) {
          newErrors.categories = `Total weight must equal 100% (currently ${totalWeight}%)`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  // Category management
  const addCategory = () => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: '',
      weight: 0,
      color: '#4CAF50',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const updateCategory = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const removeCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const applyTemplate = (templateKey) => {
    const template = CATEGORY_TEMPLATES[templateKey];
    if (template) {
      setFormData(prev => ({
        ...prev,
        categories: template.map((cat, index) => ({
          id: `cat-${Date.now()}-${index}`,
          ...cat
        }))
      }));
    }
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    try {
      const selectedYear = years.find(y => y.id === formData.academicYearId);
      const semesters = getSemestersForYear(formData.academicYearId);
      const semester = semesters.find(s => s.id === formData.semesterId);
      const terms = getTermsForSemester(formData.academicYearId, formData.semesterId);
      const term = terms.find(t => t.id === formData.termId);

      const payload = {
        ...formData,
        academicYear: selectedYear?.name || '',
        semester: semester?.name || '',
        term: term?.name || '',
      };
      const newGradeBook = await createGradeBook(payload);
      onSuccess(newGradeBook);
    } catch (error) {
      console.error('Error creating grade book:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total weight
  const totalWeight = formData.categories.reduce((sum, cat) => sum + (cat.weight || 0), 0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          <Typography variant="h6">Create New Grade Book</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Basic Information */}
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Book Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Algebra 1 - Period 2"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  label="Subject"
                  error={!!errors.subject}
                >
                  {teacherSubjects.map((subject) => (
                    <MenuItem key={subject.code || subject.name} value={subject.code || subject.name}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.subject && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.subject}
                  </Typography>
                )}
              </FormControl>
              <Alert severity="info" sx={{ mt: 2 }}>
                Assignments with the selected subject will automatically be associated with this gradebook.
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={formData.gradeLevel}
                  onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                  label="Grade Level"
                  error={!!errors.gradeLevel}
                >
                  {GRADE_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
                {errors.gradeLevel && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.gradeLevel}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>School Year</InputLabel>
                <Select
                  value={formData.academicYearId}
                  onChange={(e) => handleInputChange('academicYearId', e.target.value)}
                  label="School Year"
                  error={!!errors.academicYearId}
                >
                  {years.map((y) => (
                    <MenuItem key={y.id} value={y.id}>
                      {y.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.academicYearId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.academicYearId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!formData.academicYearId}>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={formData.semesterId}
                  onChange={(e) => handleInputChange('semesterId', e.target.value)}
                  label="Semester"
                  error={!!errors.semesterId}
                >
                  {getSemestersForYear(formData.academicYearId).map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.semesterId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.semesterId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!formData.semesterId}>
                <InputLabel>Term</InputLabel>
                <Select
                  value={formData.termId}
                  onChange={(e) => handleInputChange('termId', e.target.value)}
                  label="Term"
                  error={!!errors.termId}
                >
                  {getTermsForSemester(formData.academicYearId, formData.semesterId).map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.termId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.termId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Brief description of this grade book..."
              />
            </Grid>
          </Grid>
        )}

        {/* Step 2: Categories */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Grade Categories
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Set up the categories and weights for your grade book. Total weight must equal 100%.
            </Alert>

            {/* Category Templates */}
            <Accordion sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Use Category Templates</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {Object.entries(CATEGORY_TEMPLATES).map(([key, template]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <Card 
                        variant="outlined" 
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => applyTemplate(key)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {key}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.length} categories
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Categories List */}
            <Box sx={{ mb: 2 }}>
              {formData.categories.map((category, index) => (
                <Card key={category.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Category Name"
                          value={category.name}
                          onChange={(e) => updateCategory(index, 'name', e.target.value)}
                          placeholder="e.g., Homework"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Weight (%)"
                          type="number"
                          value={category.weight}
                          onChange={(e) => updateCategory(index, 'weight', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={category.description}
                          onChange={(e) => updateCategory(index, 'description', e.target.value)}
                          placeholder="Brief description..."
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <TextField
                          fullWidth
                          label="Color"
                          type="color"
                          value={category.color}
                          onChange={(e) => updateCategory(index, 'color', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Tooltip title="Remove Category">
                          <IconButton 
                            color="error"
                            onClick={() => removeCategory(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Button
              startIcon={<AddIcon />}
              onClick={addCategory}
              variant="outlined"
              sx={{ mb: 2 }}
            >
              Add Category
            </Button>

            {/* Weight Summary */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Total Weight: {totalWeight}%
              </Typography>
              {totalWeight !== 100 && (
                <Alert severity="warning">
                  Total weight must equal 100%. Currently: {totalWeight}%
                </Alert>
              )}
            </Box>

            {errors.categories && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.categories}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 3: Settings */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Grade Book Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Grading Scale</InputLabel>
                  <Select
                    value={formData.settings.gradingScale}
                    onChange={(e) => handleSettingsChange('gradingScale', e.target.value)}
                    label="Grading Scale"
                  >
                    <MenuItem value="weighted_categories">Weighted Categories</MenuItem>
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="letter">Letter Grades</MenuItem>
                    <MenuItem value="standards">Standards-Based</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Grade Display</InputLabel>
                  <Select
                    value={formData.settings.gradeDisplay}
                    onChange={(e) => handleSettingsChange('gradeDisplay', e.target.value)}
                    label="Grade Display"
                  >
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="letter">Letter Grades</MenuItem>
                    <MenuItem value="points">Points</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Rounding Method</InputLabel>
                  <Select
                    value={formData.settings.roundingMethod}
                    onChange={(e) => handleSettingsChange('roundingMethod', e.target.value)}
                    label="Rounding Method"
                  >
                    <MenuItem value="nearest_whole">Nearest Whole</MenuItem>
                    <MenuItem value="round_up">Round Up</MenuItem>
                    <MenuItem value="round_down">Round Down</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Additional Options
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.settings.allowLateSubmissions}
                          onChange={(e) => handleSettingsChange('allowLateSubmissions', e.target.checked)}
                        />
                      }
                      label="Allow Late Submissions"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.settings.autoCalculateFinal}
                          onChange={(e) => handleSettingsChange('autoCalculateFinal', e.target.checked)}
                        />
                      }
                      label="Auto-Calculate Final Grades"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.settings.weightCategories}
                          onChange={(e) => handleSettingsChange('weightCategories', e.target.checked)}
                        />
                      }
                      label="Use Category Weights"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        {errors.submit && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.submit}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        {activeStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={loading}>
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || totalWeight !== 100}
          >
            {loading ? 'Creating...' : 'Create Grade Book'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateGradeBook;
