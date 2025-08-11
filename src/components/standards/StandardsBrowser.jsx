import React, { useState, useEffect, useMemo } from 'react';
import StandardEditor from './StandardEditor';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { getStandards, deleteStandard } from '../../services/standardsService';
import { getSubjects } from '../../services/subjectsService';

const StandardsBrowser = () => {
  // State
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [filters, setFilters] = useState({
    framework: '',
    subject: '',
    gradeLevel: '',
    searchQuery: '',
  });
  const [subjects, setSubjects] = useState([]);

  // Load standards
  useEffect(() => {
    const loadStandards = async () => {
      try {
        setLoading(true);
        const standardsList = await getStandards({
          framework: filters.framework || undefined,
          subject: filters.subject || undefined,
          gradeLevel: filters.gradeLevel || undefined,
        });
        setStandards(standardsList);
        setError(null);
      } catch (err) {
        setError('Failed to load standards. Please try again.');
        console.error('Error loading standards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStandards();
  }, [filters.framework, filters.subject, filters.gradeLevel]);

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

  // Filter standards based on search query
  const filteredStandards = useMemo(() => {
    if (!filters.searchQuery) return standards;

    const searchLower = filters.searchQuery.toLowerCase();
    return standards.filter(standard => 
      standard.code.toLowerCase().includes(searchLower) ||
      standard.description.toLowerCase().includes(searchLower) ||
      (standard.keywords && standard.keywords.some(kw => 
        kw.toLowerCase().includes(searchLower)
      ))
    );
  }, [standards, filters.searchQuery]);

  // Handle filter changes
  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Handle standard actions
  const handleAddStandard = () => {
    setSelectedStandard(null);
    setEditorOpen(true);
  };

  const handleEditStandard = (standard) => {
    setSelectedStandard(standard);
    setEditorOpen(true);
  };

  const handleSaveStandard = (savedStandard) => {
    setStandards(prev => {
      const index = prev.findIndex(s => s.id === savedStandard.id);
      if (index >= 0) {
        // Update existing standard
        const updated = [...prev];
        updated[index] = savedStandard;
        return updated;
      } else {
        // Add new standard
        return [...prev, savedStandard];
      }
    });
  };

  const handleDeleteStandard = async (standardId) => {
    try {
      await deleteStandard(standardId);
      setStandards(prev => prev.filter(s => s.id !== standardId));
    } catch (err) {
      setError('Failed to delete standard. Please try again.');
      console.error('Error deleting standard:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Educational Standards
        </Typography>
        <Tooltip title="Add New Standard">
          <IconButton color="primary" size="large" onClick={handleAddStandard}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search Standards"
              value={filters.searchQuery}
              onChange={handleFilterChange('searchQuery')}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Framework</InputLabel>
              <Select
                value={filters.framework}
                label="Framework"
                onChange={handleFilterChange('framework')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CCSS">Common Core (CCSS)</MenuItem>
                <MenuItem value="NGSS">Next Gen Science (NGSS)</MenuItem>
                <MenuItem value="STATE">State Standards</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={filters.subject}
                label="Subject"
                onChange={handleFilterChange('subject')}
              >
                <MenuItem value="">All</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.code || s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={filters.gradeLevel}
                label="Grade Level"
                onChange={handleFilterChange('gradeLevel')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="K">Kindergarten</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                  <MenuItem key={grade} value={grade.toString()}>
                    Grade {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Standards List */}
      <Grid container spacing={2}>
        {filteredStandards.map(standard => (
          <Grid item xs={12} key={standard.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {standard.code}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {standard.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {standard.framework} • Grade {standard.gradeLevel} • {standard.subject}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Edit Standard">
                      <IconButton 
                        size="small" 
                        sx={{ mr: 1 }}
                        onClick={() => handleEditStandard(standard)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Standard">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteStandard(standard.id)}
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
        {filteredStandards.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No standards found matching your criteria.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Standard Editor Dialog */}
      <StandardEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        standard={selectedStandard}
        onSave={handleSaveStandard}
      />
    </Box>
  );
};

export default StandardsBrowser;
