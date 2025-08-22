import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  Slider,
  FormControlLabel,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';

const AdvancedStudentSearch = ({
  onSearch,
  onClear,
  filters,
  setFilters,
  showAdvanced = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    gradeLevel: '',
    academicPerformance: '',
    attendanceStatus: '',
    behaviorStatus: '',
    specialNeeds: [],
    status: '',
    gpaRange: [0, 4],
    attendanceRange: [0, 100],
    behaviorRange: [0, 100],
    hasIEP: null,
    hasMedicalNotes: null,
    enrollmentDateRange: null,
  });

  useEffect(() => {
    if (filters) {
      setLocalFilters(prev => ({ ...prev, ...filters }));
    }
  }, [filters]);

  const gradeLevels = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const academicPerformanceOptions = [
    { value: 'excellent', label: 'Excellent (3.5-4.0 GPA)' },
    { value: 'good', label: 'Good (3.0-3.4 GPA)' },
    { value: 'average', label: 'Average (2.5-2.9 GPA)' },
    { value: 'below_average', label: 'Below Average (<2.5 GPA)' },
  ];
  const attendanceStatusOptions = [
    { value: 'excellent', label: 'Excellent (95%+)' },
    { value: 'good', label: 'Good (90-94%)' },
    { value: 'concerning', label: 'Concerning (85-89%)' },
    { value: 'at_risk', label: 'At Risk (<85%)' },
  ];
  const behaviorStatusOptions = [
    { value: 'excellent', label: 'Excellent (90%+)' },
    { value: 'good', label: 'Good (80-89%)' },
    { value: 'concerning', label: 'Concerning (70-79%)' },
    { value: 'at_risk', label: 'At Risk (<70%)' },
  ];
  const specialNeedsOptions = [
    'ADHD', 'Autism', 'Dyslexia', 'Dyscalculia', 'Hearing Impairment',
    'Visual Impairment', 'Physical Disability', 'Speech/Language',
    'Emotional/Behavioral', 'Gifted/Talented', 'Other'
  ];
  const statusOptions = ['active', 'inactive', 'graduated', 'transferred'];

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialNeedToggle = (need) => {
    setLocalFilters(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter(n => n !== need)
        : [...prev.specialNeeds, need]
    }));
  };

  const handleSearch = () => {
    onSearch(localFilters);
    if (setFilters) {
      setFilters(localFilters);
    }
  };

  const handleClear = () => {
    const clearedFilters = {
      searchTerm: '',
      gradeLevel: '',
      academicPerformance: '',
      attendanceStatus: '',
      behaviorStatus: '',
      specialNeeds: [],
      status: '',
      gpaRange: [0, 4],
      attendanceRange: [0, 100],
      behaviorRange: [0, 100],
      hasIEP: null,
      hasMedicalNotes: null,
      enrollmentDateRange: null,
    };
    setLocalFilters(clearedFilters);
    onClear();
    if (setFilters) {
      setFilters(clearedFilters);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.gradeLevel) count++;
    if (localFilters.academicPerformance) count++;
    if (localFilters.attendanceStatus) count++;
    if (localFilters.behaviorStatus) count++;
    if (localFilters.specialNeeds.length > 0) count++;
    if (localFilters.status) count++;
    if (localFilters.gpaRange[0] > 0 || localFilters.gpaRange[1] < 4) count++;
    if (localFilters.attendanceRange[0] > 0 || localFilters.attendanceRange[1] < 100) count++;
    if (localFilters.behaviorRange[0] > 0 || localFilters.behaviorRange[1] < 100) count++;
    if (localFilters.hasIEP !== null) count++;
    if (localFilters.hasMedicalNotes !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      {/* Basic Search */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <TextField
          fullWidth
          placeholder="Search students by name, ID, or parent email..."
          value={localFilters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          size="small"
        />
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
            fullWidth
            sx={{ minHeight: 44 }}
        >
          Search
        </Button>
        <Tooltip title="Advanced Filters">
          <IconButton
            onClick={() => setExpanded(!expanded)}
            color={activeFiltersCount > 0 ? 'primary' : 'default'}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 44, width: 44 }}
          >
            <FilterIcon />
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{ ml: 0.5, minWidth: 20, height: 20 }}
              />
            )}
          </IconButton>
        </Tooltip>
        {activeFiltersCount > 0 && (
          <Tooltip title="Clear All Filters">
              <IconButton onClick={handleClear} color="error" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 44, width: 44 }}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
        </Box>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TuneIcon />
              <Typography variant="subtitle1">Advanced Filters</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Basic Filters */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Grade Level</InputLabel>
                      <Select
                        value={localFilters.gradeLevel}
                        onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                        label="Grade Level"
                      >
                        <MenuItem value="">All Grades</MenuItem>
                        {gradeLevels.map(grade => (
                          <MenuItem key={grade} value={grade}>Grade {grade}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={localFilters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        {statusOptions.map(status => (
                          <MenuItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Academic Performance */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Academic Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Performance Level</InputLabel>
                      <Select
                        value={localFilters.academicPerformance}
                        onChange={(e) => handleFilterChange('academicPerformance', e.target.value)}
                        label="Performance Level"
                      >
                        <MenuItem value="">All Levels</MenuItem>
                        {academicPerformanceOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      GPA Range: {localFilters.gpaRange[0]} - {localFilters.gpaRange[1]}
                    </Typography>
                    <Slider
                      value={localFilters.gpaRange}
                      onChange={(event, newValue) => handleFilterChange('gpaRange', newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={4}
                      step={0.1}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 2, label: '2.0' },
                        { value: 4, label: '4.0' },
                      ]}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Attendance */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Attendance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Attendance Status</InputLabel>
                      <Select
                        value={localFilters.attendanceStatus}
                        onChange={(e) => handleFilterChange('attendanceStatus', e.target.value)}
                        label="Attendance Status"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        {attendanceStatusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Attendance Rate: {localFilters.attendanceRange[0]}% - {localFilters.attendanceRange[1]}%
                    </Typography>
                    <Slider
                      value={localFilters.attendanceRange}
                      onChange={(event, newValue) => handleFilterChange('attendanceRange', newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 50, label: '50%' },
                        { value: 100, label: '100%' },
                      ]}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Behavior */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Behavior
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Behavior Status</InputLabel>
                      <Select
                        value={localFilters.behaviorStatus}
                        onChange={(e) => handleFilterChange('behaviorStatus', e.target.value)}
                        label="Behavior Status"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        {behaviorStatusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Behavior Score: {localFilters.behaviorRange[0]}% - {localFilters.behaviorRange[1]}%
                    </Typography>
                    <Slider
                      value={localFilters.behaviorRange}
                      onChange={(event, newValue) => handleFilterChange('behaviorRange', newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 50, label: '50%' },
                        { value: 100, label: '100%' },
                      ]}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Special Needs */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Special Needs & Accommodations
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {specialNeedsOptions.map(need => (
                    <Chip
                      key={need}
                      label={need}
                      onClick={() => handleSpecialNeedToggle(need)}
                      color={localFilters.specialNeeds.includes(need) ? 'primary' : 'default'}
                      variant={localFilters.specialNeeds.includes(need) ? 'filled' : 'outlined'}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={localFilters.hasIEP === true}
                          onChange={(e) => handleFilterChange('hasIEP', e.target.checked ? true : null)}
                          indeterminate={localFilters.hasIEP === null}
                        />
                      }
                      label="Has IEP/504 Plan"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={localFilters.hasMedicalNotes === true}
                          onChange={(e) => handleFilterChange('hasMedicalNotes', e.target.checked ? true : null)}
                          indeterminate={localFilters.hasMedicalNotes === null}
                        />
                      }
                      label="Has Medical Notes"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
              >
                Apply Filters
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Collapse>
    </Paper>
  );
};

export default AdvancedStudentSearch;
