import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import * as standardsService from "../../services/standardsService";

// Subject mapping to handle differences between assignment form subjects and standards subjects
const SUBJECT_MAPPING = {
  "Tests and Quizzes": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "Homework and Classwork": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "Projects and Presentations": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "Labs and Experiments": ["Science"],
  "Essays and Papers": ["English Language Arts", "Social Studies"],
  "Participation and Attendance": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "Extra Credit Opportunities": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  // Direct mappings for common subjects
  "English": ["English Language Arts"],
  "Math": ["Mathematics"],
  "Mathematics": ["Mathematics"],
  "Science": ["Science"],
  "Social Studies": ["Social Studies"],
  "History": ["Social Studies"],
  "English Language Arts": ["English Language Arts"],
};

const StandardsSelector = ({
  subject,
  selectedStandards,
  onStandardsChange,
  maxSelections = 5,
  showAlignmentStrength = true,
  showCoverageType = true,
}) => {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [alignmentDialogOpen, setAlignmentDialogOpen] = useState(false);
  const [tempAlignment, setTempAlignment] = useState({
    strength: 0.75,
    coverageType: "full",
    weight: 1.0,
  });

  // Map assignment subject to standards subjects
  const getStandardsSubjects = (assignmentSubject) => {
    if (!assignmentSubject) return [];
    
    // Check direct mapping first
    if (SUBJECT_MAPPING[assignmentSubject]) {
      return SUBJECT_MAPPING[assignmentSubject];
    }
    
    // If no direct mapping, try to find a partial match
    const lowerSubject = assignmentSubject.toLowerCase();
    for (const [key, values] of Object.entries(SUBJECT_MAPPING)) {
      if (key.toLowerCase().includes(lowerSubject) || lowerSubject.includes(key.toLowerCase())) {
        return values;
      }
    }
    
    // Default fallback
    return ["English Language Arts", "Mathematics", "Science", "Social Studies"];
  };

  // Load standards for the mapped subjects
  useEffect(() => {
    const loadStandards = async () => {
      if (!subject) return;

      setLoading(true);
      setError(null);

      try {
        const standardsSubjects = getStandardsSubjects(subject);
        console.log("Loading standards for subjects:", standardsSubjects);
        
        // Load standards for all mapped subjects
        const allStandards = [];
        for (const standardsSubject of standardsSubjects) {
          try {
            const subjectStandards = await standardsService.getStandards({ subject: standardsSubject });
            console.log(`Found ${subjectStandards.length} standards for ${standardsSubject}`);
            allStandards.push(...subjectStandards);
          } catch (err) {
            console.warn(`Error loading standards for ${standardsSubject}:`, err);
          }
        }
        
        // Remove duplicates based on standard code
        const uniqueStandards = allStandards.filter((standard, index, self) => 
          index === self.findIndex(s => s.code === standard.code)
        );
        
        console.log(`Total unique standards found: ${uniqueStandards.length}`);
        setStandards(uniqueStandards);
      } catch (err) {
        console.error("Error loading standards:", err);
        setError("Failed to load standards");
      } finally {
        setLoading(false);
      }
    };

    loadStandards();
  }, [subject]);

  // Filter standards based on search term
  const filteredStandards = useMemo(() => {
    if (!searchTerm.trim()) return standards;

    const searchLower = searchTerm.toLowerCase();
    return standards.filter(
      (standard) =>
        standard.code?.toLowerCase().includes(searchLower) ||
        standard.description?.toLowerCase().includes(searchLower) ||
        standard.name?.toLowerCase().includes(searchLower)
    );
  }, [standards, searchTerm]);

  // Get standards not already selected
  const availableStandards = useMemo(() => {
    const selectedIds = selectedStandards.map((s) => s.standardId);
    return filteredStandards.filter((standard) => !selectedIds.includes(standard.id));
  }, [filteredStandards, selectedStandards]);

  // Handle adding a standard
  const handleAddStandard = (standard) => {
    if (selectedStandards.length >= maxSelections) {
      setError(`Maximum ${maxSelections} standards allowed`);
      return;
    }

    const newStandard = {
      standardId: standard.id,
      standardCode: standard.code,
      standardName: standard.name,
      standardDescription: standard.description,
      alignmentStrength: 0.75,
      coverageType: "full",
      weight: 1.0,
    };

    onStandardsChange([...selectedStandards, newStandard]);
    setError(null);
  };

  // Handle removing a standard
  const handleRemoveStandard = (standardId) => {
    const updatedStandards = selectedStandards.filter(
      (s) => s.standardId !== standardId
    );
    onStandardsChange(updatedStandards);
  };

  // Handle updating alignment settings
  const handleUpdateAlignment = (standardId, updates) => {
    const updatedStandards = selectedStandards.map((standard) =>
      standard.standardId === standardId
        ? { ...standard, ...updates }
        : standard
    );
    onStandardsChange(updatedStandards);
  };

  // Open alignment dialog
  const handleOpenAlignmentDialog = (standard) => {
    setSelectedStandard(standard);
    setTempAlignment({
      strength: standard.alignmentStrength || 0.75,
      coverageType: standard.coverageType || "full",
      weight: standard.weight || 1.0,
    });
    setAlignmentDialogOpen(true);
  };

  // Save alignment settings
  const handleSaveAlignment = () => {
    if (selectedStandard) {
      handleUpdateAlignment(selectedStandard.standardId, tempAlignment);
    }
    setAlignmentDialogOpen(false);
    setSelectedStandard(null);
  };

  // Get coverage type label
  const getCoverageTypeLabel = (type) => {
    switch (type) {
      case "full":
        return "Full Coverage";
      case "partial":
        return "Partial Coverage";
      case "supporting":
        return "Supporting";
      default:
        return type;
    }
  };

  // Get alignment strength label
  const getAlignmentStrengthLabel = (strength) => {
    if (strength >= 0.9) return "Strong";
    if (strength >= 0.7) return "Moderate";
    if (strength >= 0.5) return "Weak";
    return "Very Weak";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Assignment Subject: {subject} | Standards Found: {standards.length} | Available: {availableStandards.length}
          </Typography>
        </Box>
      )}

      {/* Selected Standards Display */}
      {selectedStandards.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Standards ({selectedStandards.length}/{maxSelections})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedStandards.map((standard) => (
              <Chip
                key={standard.standardId}
                label={`${standard.standardCode} - ${standard.standardName}`}
                onDelete={() => handleRemoveStandard(standard.standardId)}
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => handleOpenAlignmentDialog(standard)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Standards Selection */}
      {selectedStandards.length < maxSelections && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Standards
          </Typography>

          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search standards by code, name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
            }}
            sx={{ mb: 2 }}
          />

          {/* Available Standards List */}
          {availableStandards.length > 0 ? (
            <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
              {availableStandards.map((standard) => (
                <ListItem
                  key={standard.id}
                  button
                  onClick={() => handleAddStandard(standard)}
                  sx={{ border: "1px solid", borderColor: "divider", mb: 1, borderRadius: 1 }}
                >
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {standard.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {standard.name}
                        </Typography>
                        {standard.description && (
                          <Typography variant="caption" color="text.secondary">
                            {standard.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddStandard(standard);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              {searchTerm ? "No standards match your search" : "No standards available for this subject"}
            </Typography>
          )}
        </Paper>
      )}

      {/* Alignment Settings Dialog */}
      <Dialog
        open={alignmentDialogOpen}
        onClose={() => setAlignmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon />
            <Typography>Configure Standard Alignment</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStandard && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedStandard.standardCode} - {selectedStandard.standardName}
              </Typography>
              {selectedStandard.standardDescription && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedStandard.standardDescription}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Alignment Strength */}
              {showAlignmentStrength && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alignment Strength: {getAlignmentStrengthLabel(tempAlignment.strength)}
                  </Typography>
                  <Slider
                    value={tempAlignment.strength}
                    onChange={(_, value) =>
                      setTempAlignment((prev) => ({ ...prev, strength: value }))
                    }
                    min={0.25}
                    max={1.0}
                    step={0.25}
                    marks={[
                      { value: 0.25, label: "Weak" },
                      { value: 0.5, label: "Moderate" },
                      { value: 0.75, label: "Strong" },
                      { value: 1.0, label: "Very Strong" },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              )}

              {/* Coverage Type */}
              {showCoverageType && (
                <Box mb={3}>
                  <FormControl fullWidth>
                    <InputLabel>Coverage Type</InputLabel>
                    <Select
                      value={tempAlignment.coverageType}
                      onChange={(e) =>
                        setTempAlignment((prev) => ({
                          ...prev,
                          coverageType: e.target.value,
                        }))
                      }
                      label="Coverage Type"
                    >
                      <MenuItem value="full">Full Coverage</MenuItem>
                      <MenuItem value="partial">Partial Coverage</MenuItem>
                      <MenuItem value="supporting">Supporting</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Weight */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Weight: {tempAlignment.weight}
                </Typography>
                <Slider
                  value={tempAlignment.weight}
                  onChange={(_, value) =>
                    setTempAlignment((prev) => ({ ...prev, weight: value }))
                  }
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: "0.5" },
                    { value: 1.0, label: "1.0" },
                    { value: 1.5, label: "1.5" },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlignmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAlignment} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StandardsSelector; 