import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { getStandards, createStandardMapping, deleteStandardMapping } from '../../services/standardsService';

const StandardsMapper = ({ open, onClose, assignmentId, assignmentName }) => {
  // State
  const [standards, setStandards] = useState([]);
  const [mappedStandards, setMappedStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [alignmentStrength, setAlignmentStrength] = useState(1);
  const [coverageType, setCoverageType] = useState('full');

  // Load standards and existing mappings
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [standardsList, mappingsList] = await Promise.all([
          getStandards(),
          getStandardsMappings(assignmentId)
        ]);
        
        // Get full standard objects for mapped standards
        const mappedStandardsWithDetails = mappingsList.map(mapping => ({
          ...mapping,
          standard: standardsList.find(s => s.id === mapping.standardId)
        }));

        setStandards(standardsList);
        setMappedStandards(mappedStandardsWithDetails);
        setError(null);
      } catch (err) {
        setError('Failed to load standards data. Please try again.');
        console.error('Error loading standards data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open, assignmentId]);

  // Filter standards based on search
  const filteredStandards = standards.filter(standard => 
    !mappedStandards.some(ms => ms.standardId === standard.id) && // Not already mapped
    (searchQuery === '' || 
      standard.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      standard.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (standard.keywords && standard.keywords.some(kw => 
        kw.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    )
  );

  // Handle adding a standard mapping
  const handleAddMapping = async () => {
    if (!selectedStandard) return;

    try {
      const mappingData = {
        standardId: selectedStandard.id,
        assignmentId,
        alignmentStrength,
        coverageType,
      };

      const result = await createStandardMapping(mappingData);
      setMappedStandards(prev => [...prev, {
        ...result.mapping,
        standard: selectedStandard
      }]);
      
      setSelectedStandard(null);
      setAlignmentStrength(1);
      setCoverageType('full');
    } catch (err) {
      setError('Failed to add standard mapping. Please try again.');
      console.error('Error adding standard mapping:', err);
    }
  };

  // Handle removing a standard mapping
  const handleRemoveMapping = async (mappingId) => {
    try {
      await deleteStandardMapping(mappingId);
      setMappedStandards(prev => prev.filter(ms => ms.id !== mappingId));
    } catch (err) {
      setError('Failed to remove standard mapping. Please try again.');
      console.error('Error removing standard mapping:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Map Standards to Assignment: {assignmentName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Mappings */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Mapped Standards
        </Typography>
        <List>
          {mappedStandards.map((mapping) => (
            <ListItem key={mapping.id}>
              <ListItemText
                primary={mapping.standard.code}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {mapping.standard.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`Alignment: ${Math.round(mapping.alignmentStrength * 100)}%`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`Coverage: ${mapping.coverageType}`}
                        size="small"
                      />
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveMapping(mapping.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {mappedStandards.length === 0 && (
            <ListItem>
              <ListItemText
                secondary="No standards mapped yet. Add standards below."
              />
            </ListItem>
          )}
        </List>

        {/* Add New Mapping */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Add Standard
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            value={selectedStandard}
            onChange={(event, newValue) => setSelectedStandard(newValue)}
            options={filteredStandards}
            getOptionLabel={(option) => `${option.code} - ${option.description}`}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Standards"
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            )}
          />
        </Box>

        {selectedStandard && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Coverage Type</InputLabel>
              <Select
                value={coverageType}
                onChange={(e) => setCoverageType(e.target.value)}
                label="Coverage Type"
              >
                <MenuItem value="full">Full Coverage</MenuItem>
                <MenuItem value="partial">Partial Coverage</MenuItem>
                <MenuItem value="supporting">Supporting</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Alignment Strength</InputLabel>
              <Select
                value={alignmentStrength}
                onChange={(e) => setAlignmentStrength(e.target.value)}
                label="Alignment Strength"
              >
                <MenuItem value={1}>Strong (100%)</MenuItem>
                <MenuItem value={0.75}>Good (75%)</MenuItem>
                <MenuItem value={0.5}>Moderate (50%)</MenuItem>
                <MenuItem value={0.25}>Weak (25%)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMapping}
            >
              Add
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StandardsMapper;
