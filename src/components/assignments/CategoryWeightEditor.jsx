import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAssignments } from "../../contexts/AssignmentContext";

const CategoryWeightEditor = ({ open, onClose, subject }) => {
  const { 
    categories, 
    categoryWeights, 
    updateCategoryWeights, 
    validateCategoryWeights,
    getCategoriesWithWeights 
  } = useAssignments();
  
  const [weights, setWeights] = useState({});
  const [validation, setValidation] = useState({ isValid: true, total: 0, difference: 0 });

  // Initialize weights when dialog opens
  useEffect(() => {
    if (open && subject) {
      const subjectWeights = categoryWeights[subject] || {};
      const initialWeights = {};
      
      Object.keys(categories).forEach(category => {
        initialWeights[category] = subjectWeights[category] || categories[category].defaultWeight;
      });
      
      setWeights(initialWeights);
      setValidation(validateCategoryWeights(initialWeights));
    }
  }, [open, subject, categories, categoryWeights, validateCategoryWeights]);

  const handleWeightChange = (category, newWeight) => {
    const updatedWeights = { ...weights, [category]: newWeight };
    setWeights(updatedWeights);
    setValidation(validateCategoryWeights(updatedWeights));
  };

  const handleSave = async () => {
    if (validation.isValid) {
      await updateCategoryWeights(subject, weights);
      onClose();
    }
  };

  const handleReset = () => {
    const defaultWeights = {};
    Object.keys(categories).forEach(category => {
      defaultWeights[category] = categories[category].defaultWeight;
    });
    setWeights(defaultWeights);
    setValidation(validateCategoryWeights(defaultWeights));
  };

  const handleAutoDistribute = () => {
    const categoryNames = Object.keys(categories);
    const equalWeight = Math.round(100 / categoryNames.length);
    const remainder = 100 - (equalWeight * categoryNames.length);
    
    const distributedWeights = {};
    categoryNames.forEach((category, index) => {
      distributedWeights[category] = equalWeight + (index < remainder ? 1 : 0);
    });
    
    setWeights(distributedWeights);
    setValidation(validateCategoryWeights(distributedWeights));
  };

  if (!subject) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Category Weights for {subject}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Set the percentage weight for each assignment category. The total must equal 100%.
          </Typography>
          
          {!validation.isValid && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Total weight is {validation.total}%. Please adjust to make it 100%.
              {validation.difference > 0 ? ` Add ${validation.difference.toFixed(1)}%` : ` Subtract ${Math.abs(validation.difference).toFixed(1)}%`}
            </Alert>
          )}
          
          {validation.isValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Total weight is 100%. Perfect!
            </Alert>
          )}
        </Box>

        <Grid container spacing={3}>
          {Object.entries(categories).map(([category, categoryData]) => (
            <Grid item xs={12} md={6} key={category}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderLeft: `4px solid ${categoryData.color}`,
                  '&:hover': { boxShadow: 1 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {categoryData.description}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${weights[category] || 0}%`}
                    color={validation.isValid ? "success" : "warning"}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={weights[category] || 0}
                    onChange={(_, value) => handleWeightChange(category, value)}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 25, label: '25%' },
                      { value: 50, label: '50%' },
                      { value: 75, label: '75%' },
                      { value: 100, label: '100%' }
                    ]}
                    sx={{ flexGrow: 1 }}
                  />
                  <TextField
                    type="number"
                    value={weights[category] || 0}
                    onChange={(e) => handleWeightChange(category, Number(e.target.value))}
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    sx={{ width: 80 }}
                    size="small"
                  />
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {categoryData.subcategories.length} subcategories available
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outlined" onClick={handleAutoDistribute}>
            Auto-Distribute Equally
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!validation.isValid}
        >
          Save Weights
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryWeightEditor; 