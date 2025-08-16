import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  ContentCopy as CloneIcon,
  Settings as SettingsIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { useGradeBooks } from "../../contexts/GradeBookContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useAcademicPeriods } from "../../contexts/AcademicPeriodsContext";
import CategoryWeightEditor from "../assignments/CategoryWeightEditor";
import CategoryTemplateSelector from "../assignments/CategoryTemplateSelector";

const TermGradeBookManager = ({ open, onClose }) => {
  const { 
    gradeBooks, 
    createTermGradeBook, 
    cloneGradeBookForNewTerm,
    updateGradeBookCategories,
    getGradeBooksByTerm,
    getGradeBooksBySubject,
    archiveGradeBook,
    activateGradeBook,
    deleteGradeBook,
    loading 
  } = useGradeBooks();
  
  const { categories, getCategoriesWithWeights } = useAssignments();
  const { years, getSemestersForYear, getTermsForSemester } = useAcademicPeriods();

  // State for creating new gradebook
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedGradeBook, setSelectedGradeBook] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Form state for new gradebook
  const [newGradeBookForm, setNewGradeBookForm] = useState({
    name: "",
    subject: "",
    gradeLevel: "",
    academicYearId: "",
    semesterId: "",
    termId: "",
    categories: [],
    categoryWeights: {},
    assignments: [],
    totalGrades: 0,
    settings: {
      gradingScale: "weighted_categories",
      allowLateSubmissions: true,
      autoCalculateFinal: true,
      weightCategories: true,
      roundingMethod: "nearest_whole",
      gradeDisplay: "percentage",
      finalGradeFormula: "weighted_average"
    }
  });

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryWeight, setNewCategoryWeight] = useState("");

  // Clone form state
  const [cloneForm, setCloneForm] = useState({
    sourceGradeBookId: "",
    academicYearId: "",
    semesterId: "",
    termId: ""
  });

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Load subjects from assignments
  const subjects = Array.from(new Set(gradeBooks.map(gb => gb.subject))).sort();

  // Grade level options
  const GRADE_LEVELS = [
    'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
    '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'
  ];

  // Category management functions
  const addCategoryToForm = () => {
    if (!newCategoryName.trim() || !newCategoryWeight) return;
    
    const weight = parseFloat(newCategoryWeight);
    if (isNaN(weight) || weight <= 0) return;
    
    const newCategory = {
      name: newCategoryName.trim(),
      weight: weight,
      color: '#1976d2',
      description: ''
    };
    
    setNewGradeBookForm(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
      categoryWeights: {
        ...prev.categoryWeights,
        [newCategory.name]: weight
      }
    }));
    
    setNewCategoryName("");
    setNewCategoryWeight("");
  };

  const removeCategoryFromForm = (categoryName) => {
    setNewGradeBookForm(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.name !== categoryName),
      categoryWeights: {
        ...prev.categoryWeights
      }
    }));
    
    // Remove from categoryWeights
    const updatedWeights = { ...newGradeBookForm.categoryWeights };
    delete updatedWeights[categoryName];
    setNewGradeBookForm(prev => ({
      ...prev,
      categoryWeights: updatedWeights
    }));
  };

  const updateCategoryWeight = (categoryName, newWeight) => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 0) return;
    
    setNewGradeBookForm(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.name === categoryName ? { ...cat, weight } : cat
      ),
      categoryWeights: {
        ...prev.categoryWeights,
        [categoryName]: weight
      }
    }));
  };

  const getTotalWeight = () => {
    return newGradeBookForm.categories.reduce((total, cat) => total + (cat.weight || 0), 0);
  };

  const isWeightValid = () => {
    const total = getTotalWeight();
    return Math.abs(total - 100) < 0.01; // Allow small floating point differences
  };

  const handleCreateGradeBook = async () => {
    try {
      const selectedYear = years.find(y => y.id === newGradeBookForm.academicYearId);
      const semesters = getSemestersForYear(newGradeBookForm.academicYearId);
      const semester = semesters.find(s => s.id === newGradeBookForm.semesterId);
      const terms = getTermsForSemester(newGradeBookForm.academicYearId, newGradeBookForm.semesterId);
      const term = terms.find(t => t.id === newGradeBookForm.termId);

      // Use the categories created in the form
      const categories = newGradeBookForm.categories;
      const categoryWeights = newGradeBookForm.categoryWeights;

      const gradeBookData = {
        ...newGradeBookForm,
        academicYear: selectedYear?.name || '',
        semester: semester?.name || '',
        term: term?.name || '',
        categories: categories,
        categoryWeights: categoryWeights,
        assignments: [],
        totalGrades: 0,
        students: [],
        settings: {
          ...newGradeBookForm.settings,
          finalGradeFormula: "weighted_average"
        }
      };

      await createTermGradeBook(gradeBookData);
      setShowCreateDialog(false);
      setSnackbar({
        open: true,
        message: "Grade book created successfully!",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error creating grade book: ${error.message}`,
        severity: "error"
      });
    }
  };

  const handleCloneGradeBook = async () => {
    try {
      const selectedYear = years.find(y => y.id === cloneForm.academicYearId);
      const semesters = getSemestersForYear(cloneForm.academicYearId);
      const semester = semesters.find(s => s.id === cloneForm.semesterId);
      const terms = getTermsForSemester(cloneForm.academicYearId, cloneForm.semesterId);
      const term = terms.find(t => t.id === cloneForm.termId);

      const newTermData = {
        academicYear: selectedYear?.name || '',
        semester: semester?.name || '',
        term: term?.name || ''
      };

      await cloneGradeBookForNewTerm(cloneForm.sourceGradeBookId, newTermData);
      setShowCloneDialog(false);
      setSnackbar({
        open: true,
        message: "Grade book cloned successfully!",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error cloning grade book: ${error.message}`,
        severity: "error"
      });
    }
  };

  const handleArchiveGradeBook = async (gradeBookId) => {
    try {
      await archiveGradeBook(gradeBookId);
      setSnackbar({
        open: true,
        message: "Grade book archived successfully!",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error archiving grade book: ${error.message}`,
        severity: "error"
      });
    }
  };

  const handleActivateGradeBook = async (gradeBookId) => {
    try {
      await activateGradeBook(gradeBookId);
      setSnackbar({
        open: true,
        message: "Grade book activated successfully!",
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error activating grade book: ${error.message}`,
        severity: "error"
      });
    }
  };

  const handleDeleteGradeBook = async (gradeBookId) => {
    if (window.confirm("Are you sure you want to delete this grade book? This action cannot be undone.")) {
      try {
        await deleteGradeBook(gradeBookId);
        setSnackbar({
          open: true,
          message: "Grade book deleted successfully!",
          severity: "success"
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error deleting grade book: ${error.message}`,
          severity: "error"
        });
      }
    }
  };

  const handleTemplateSelect = (templateCategories) => {
    setNewGradeBookForm(prev => ({
      ...prev,
      categories: templateCategories
    }));
    setShowTemplateSelector(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <SchoolIcon />;
      case 'archived': return <ArchiveIcon />;
      case 'draft': return <EditIcon />;
      default: return <SchoolIcon />;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5">Term-Based Grade Book Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create New Grade Book
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Active Grade Books */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Active Grade Books
              </Typography>
              <Grid container spacing={2}>
                {gradeBooks
                  .filter(gb => gb.status === 'active')
                  .map((gradeBook) => (
                    <Grid item xs={12} md={6} key={gradeBook.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {gradeBook.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {gradeBook.subject} • {gradeBook.gradeLevel}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {gradeBook.academicYear} • {gradeBook.semester} • {gradeBook.term}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  icon={getStatusIcon(gradeBook.status)}
                                  label={gradeBook.status}
                                  color={getStatusColor(gradeBook.status)}
                                  size="small"
                                />
                                <Chip
                                  label={`${gradeBook.students?.length || 0} students`}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                                <Chip
                                  label={`${gradeBook.assignments?.length || 0} assignments`}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </Box>
                            <Box>
                              <Tooltip title="Edit Categories">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedGradeBook(gradeBook);
                                    setSelectedSubject(gradeBook.subject);
                                    setShowCategoryEditor(true);
                                  }}
                                >
                                  <CategoryIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Clone for New Term">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setCloneForm(prev => ({ ...prev, sourceGradeBookId: gradeBook.id }));
                                    setShowCloneDialog(true);
                                  }}
                                >
                                  <CloneIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Archive">
                                <IconButton
                                  size="small"
                                  onClick={() => handleArchiveGradeBook(gradeBook.id)}
                                >
                                  <ArchiveIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Grid>

            {/* Archived Grade Books */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Archived Grade Books
              </Typography>
              <Grid container spacing={2}>
                {gradeBooks
                  .filter(gb => gb.status === 'archived')
                  .map((gradeBook) => (
                    <Grid item xs={12} md={6} key={gradeBook.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {gradeBook.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {gradeBook.subject} • {gradeBook.gradeLevel}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {gradeBook.academicYear} • {gradeBook.semester} • {gradeBook.term}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  icon={getStatusIcon(gradeBook.status)}
                                  label={gradeBook.status}
                                  color={getStatusColor(gradeBook.status)}
                                  size="small"
                                />
                              </Box>
                            </Box>
                            <Box>
                              <Tooltip title="Activate">
                                <IconButton
                                  size="small"
                                  onClick={() => handleActivateGradeBook(gradeBook.id)}
                                >
                                  <RestoreIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteGradeBook(gradeBook.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create New Grade Book Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Term Grade Book</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Book Name"
                value={newGradeBookForm.name}
                onChange={(e) => setNewGradeBookForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={newGradeBookForm.subject}
                  onChange={(e) => setNewGradeBookForm(prev => ({ ...prev, subject: e.target.value }))}
                  label="Subject"
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={newGradeBookForm.gradeLevel}
                  onChange={(e) => setNewGradeBookForm(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  label="Grade Level"
                >
                  {GRADE_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={newGradeBookForm.academicYearId}
                  onChange={(e) => setNewGradeBookForm(prev => ({ ...prev, academicYearId: e.target.value }))}
                  label="Academic Year"
                >
                  {years.map((year) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!newGradeBookForm.academicYearId}>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={newGradeBookForm.semesterId}
                  onChange={(e) => setNewGradeBookForm(prev => ({ ...prev, semesterId: e.target.value }))}
                  label="Semester"
                >
                  {getSemestersForYear(newGradeBookForm.academicYearId).map((semester) => (
                    <MenuItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!newGradeBookForm.semesterId}>
                <InputLabel>Term</InputLabel>
                <Select
                  value={newGradeBookForm.termId}
                  onChange={(e) => setNewGradeBookForm(prev => ({ ...prev, termId: e.target.value }))}
                  label="Term"
                >
                  {getTermsForSemester(newGradeBookForm.academicYearId, newGradeBookForm.semesterId).map((term) => (
                    <MenuItem key={term.id} value={term.id}>
                      {term.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowTemplateSelector(true)}
                  disabled={!newGradeBookForm.subject}
                >
                  Use Category Template
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedSubject(newGradeBookForm.subject);
                    setShowCategoryEditor(true);
                  }}
                  disabled={!newGradeBookForm.subject}
                >
                  Customize Categories
                </Button>
              </Box>
            </Grid>

            {/* Category Management Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Categories
              </Typography>
              
              {/* Add New Category */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
                <TextField
                  label="New Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Homework, Quiz, Test"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="Weight (%)"
                  type="number"
                  value={newCategoryWeight}
                  onChange={(e) => setNewCategoryWeight(e.target.value)}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  sx={{ width: 120 }}
                />
                <Button
                  variant="outlined"
                  onClick={addCategoryToForm}
                  disabled={!newCategoryName.trim() || !newCategoryWeight}
                >
                  Add Category
                </Button>
              </Box>

              {/* Display Categories */}
              {newGradeBookForm.categories.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Categories:
                  </Typography>
                  {newGradeBookForm.categories.map((category, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        alignItems: 'center', 
                        mb: 1,
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {category.name}
                      </Typography>
                      <TextField
                        label="Weight (%)"
                        type="number"
                        value={category.weight}
                        onChange={(e) => updateCategoryWeight(category.name, e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeCategoryFromForm(category.name)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  
                  {/* Total Weight Display */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mt: 2,
                    p: 2,
                    bgcolor: isWeightValid() ? 'success.50' : 'warning.50',
                    borderRadius: 1,
                    border: `1px solid ${isWeightValid() ? 'success.main' : 'warning.main'}`
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Weight: {getTotalWeight().toFixed(1)}%
                    </Typography>
                    {isWeightValid() ? (
                      <Chip label="Valid" color="success" size="small" />
                    ) : (
                      <Chip 
                        label={`${getTotalWeight() > 100 ? 'Over' : 'Under'} 100%`} 
                        color="warning" 
                        size="small" 
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGradeBook} 
            variant="contained"
            disabled={!newGradeBookForm.name || !newGradeBookForm.subject || !newGradeBookForm.termId || !isWeightValid()}
          >
            Create Grade Book
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Grade Book Dialog */}
      <Dialog open={showCloneDialog} onClose={() => setShowCloneDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clone Grade Book for New Term</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Source Grade Book</InputLabel>
                <Select
                  value={cloneForm.sourceGradeBookId}
                  onChange={(e) => setCloneForm(prev => ({ ...prev, sourceGradeBookId: e.target.value }))}
                  label="Source Grade Book"
                >
                  {gradeBooks
                    .filter(gb => gb.status === 'active')
                    .map((gradeBook) => (
                      <MenuItem key={gradeBook.id} value={gradeBook.id}>
                        {gradeBook.name} ({gradeBook.academicYear} • {gradeBook.semester} • {gradeBook.term})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={cloneForm.academicYearId}
                  onChange={(e) => setCloneForm(prev => ({ ...prev, academicYearId: e.target.value }))}
                  label="Academic Year"
                >
                  {years.map((year) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required disabled={!cloneForm.academicYearId}>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={cloneForm.semesterId}
                  onChange={(e) => setCloneForm(prev => ({ ...prev, semesterId: e.target.value }))}
                  label="Semester"
                >
                  {getSemestersForYear(cloneForm.academicYearId).map((semester) => (
                    <MenuItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required disabled={!cloneForm.semesterId}>
                <InputLabel>Term</InputLabel>
                <Select
                  value={cloneForm.termId}
                  onChange={(e) => setCloneForm(prev => ({ ...prev, termId: e.target.value }))}
                  label="Term"
                >
                  {getTermsForSemester(cloneForm.academicYearId, cloneForm.semesterId).map((term) => (
                    <MenuItem key={term.id} value={term.id}>
                      {term.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCloneDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCloneGradeBook} 
            variant="contained"
            disabled={!cloneForm.sourceGradeBookId || !cloneForm.termId}
          >
            Clone Grade Book
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Weight Editor */}
      <CategoryWeightEditor
        open={showCategoryEditor}
        onClose={() => setShowCategoryEditor(false)}
        subject={selectedSubject}
      />

      {/* Category Template Selector */}
      <CategoryTemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
        subject={newGradeBookForm.subject}
      />

      {/* Snackbar */}
      <Alert
        open={snackbar.open}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        severity={snackbar.severity}
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
      >
        {snackbar.message}
      </Alert>
    </>
  );
};

export default TermGradeBookManager; 