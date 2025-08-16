import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Box,
  IconButton,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSubjects } from '../../contexts/SubjectsContext';

const GradeBookForm = ({ open, onClose, onSave, gradebook }) => {
  const { subjects } = useSubjects();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    academicYear: new Date().getFullYear().toString(),
  });
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', weight: '' });
  const [customGradeLevel, setCustomGradeLevel] = useState(false);

  const gradeLevels = [
    'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
    '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
    '10th Grade', '11th Grade', '12th Grade', 'University', 'Other'
  ];

  useEffect(() => {
    if (gradebook) {
      const isCustom = !gradeLevels.includes(gradebook.gradeLevel);
      setFormData({
        name: gradebook.name,
        subject: gradebook.subject,
        gradeLevel: isCustom ? 'Other' : gradebook.gradeLevel,
        academicYear: gradebook.academicYear,
      });
      if (isCustom) {
        setCustomGradeLevel(gradebook.gradeLevel);
      } else {
        setCustomGradeLevel(false);
      }
      setCategories(gradebook.categories || []);
    } else {
      setFormData({
        name: '',
        subject: '',
        gradeLevel: '',
        academicYear: new Date().getFullYear().toString(),
      });
      setCategories([
        { name: 'Homework', weight: 20, color: '#4CAF50' },
        { name: 'Quiz', weight: 25, color: '#2196F3' },
        { name: 'Test', weight: 30, color: '#FF9800' },
      ]);
      setCustomGradeLevel(false);
    }
  }, [gradebook, open]);

  const handleFormChange = (field, value) => {
    if (field === 'gradeLevel' && value === 'Other') {
      setCustomGradeLevel(true);
    } else if (field === 'gradeLevel') {
      setCustomGradeLevel(false);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.weight) {
      setCategories([...categories, { ...newCategory, color: '#607D8B' }]);
      setNewCategory({ name: '', weight: '' });
    }
  };

  const handleRemoveCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const handleSave = () => {
    const finalData = { ...formData };
    if (formData.gradeLevel === 'Other') {
      finalData.gradeLevel = customGradeLevel;
    }
    onSave({ ...finalData, categories });
    onClose();
  };

  const totalWeight = categories.reduce((sum, cat) => sum + Number(cat.weight || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{gradebook ? 'Edit Grade Book' : 'Create New Grade Book'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Grade Book Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={formData.subject}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                label="Subject"
              >
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.name}>{subject.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={formData.gradeLevel}
                onChange={(e) => handleFormChange('gradeLevel', e.target.value)}
                label="Grade Level"
              >
                {gradeLevels.map(level => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {customGradeLevel && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custom Grade Level"
                value={formData.gradeLevel === 'Other' ? '' : formData.gradeLevel}
                onChange={(e) => handleFormChange('gradeLevel', e.target.value)}
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="h6">Categories</Typography>
            <Box>
              {categories.map((cat, index) => (
                <Chip
                  key={index}
                  label={`${cat.name} (${cat.weight}%)`}
                  onDelete={() => handleRemoveCategory(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TextField
                label="New Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                size="small"
              />
              <TextField
                label="Weight (%)"
                type="number"
                value={newCategory.weight}
                onChange={(e) => setNewCategory({ ...newCategory, weight: e.target.value })}
                size="small"
                sx={{ mx: 1, width: '100px' }}
              />
              <IconButton onClick={handleAddCategory} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color={totalWeight > 100 ? "error" : "text.secondary"}>
              Total Weight: {totalWeight}%
            </Typography>
            {totalWeight > 100 && <Typography variant="caption" color="error" display="block">Total weight cannot exceed 100%.</Typography>}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={totalWeight > 100}>
          {gradebook ? 'Save Changes' : 'Create Grade Book'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeBookForm;
