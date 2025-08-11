import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Chip,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { createStandard, updateStandard } from '../../services/standardsService';
import { getSubjects } from '../../services/subjectsService';

const StandardEditor = ({ open, onClose, standard = null, onSave }) => {
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    framework: '',
    subject: '',
    gradeLevel: '',
    domain: '',
    cluster: '',
    description: '',
    prerequisites: [],
    keywords: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [subjects, setSubjects] = useState([]);

  // Load existing standard data if editing
  useEffect(() => {
    if (standard) {
      setFormData({
        code: standard.code || '',
        framework: standard.framework || '',
        subject: standard.subject || '',
        gradeLevel: standard.gradeLevel || '',
        domain: standard.domain || '',
        cluster: standard.cluster || '',
        description: standard.description || '',
        prerequisites: standard.prerequisites || [],
        keywords: standard.keywords || [],
      });
    }
  }, [standard]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getSubjects();
        setSubjects(list);
      } catch (e) {
        setSubjects([]);
      }
    })();
  }, []);

  // Handle form field changes
  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Handle keyword addition
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  // Handle keyword deletion
  const handleDeleteKeyword = (keywordToDelete) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToDelete)
    }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      const requiredFields = ['code', 'framework', 'subject', 'gradeLevel', 'description'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
      }

      // Create or update standard
      const result = standard
        ? await updateStandard(standard.id, formData)
        : await createStandard(formData);

      onSave(result.standard);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save standard. Please try again.');
      console.error('Error saving standard:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {standard ? 'Edit Standard' : 'Create New Standard'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Standard Code"
                value={formData.code}
                onChange={handleChange('code')}
                required
                helperText="e.g., CCSS.MATH.6.EE.A.1"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Framework</InputLabel>
                <Select
                  value={formData.framework}
                  label="Framework"
                  onChange={handleChange('framework')}
                >
                  <MenuItem value="CCSS">Common Core (CCSS)</MenuItem>
                  <MenuItem value="NGSS">Next Gen Science (NGSS)</MenuItem>
                  <MenuItem value="STATE">State Standards</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                  label="Subject"
                  onChange={handleChange('subject')}
                >
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={s.code || s.name}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={formData.gradeLevel}
                  label="Grade Level"
                  onChange={handleChange('gradeLevel')}
                >
                  <MenuItem value="K">Kindergarten</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                    <MenuItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Domain"
                value={formData.domain}
                onChange={handleChange('domain')}
                helperText="e.g., Number and Operations"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cluster"
                value={formData.cluster}
                onChange={handleChange('cluster')}
                helperText="e.g., Operations and Algebraic Thinking"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Keywords
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddKeyword}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.keywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      onDelete={() => handleDeleteKeyword(keyword)}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : (standard ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StandardEditor;
