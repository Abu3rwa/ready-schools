import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  Functions as FunctionsIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useAssignments } from "../../contexts/AssignmentContext";
import { FORMULA_TYPES, CALCULATION_TYPES } from "../../services/gradeCalculationService";

const FormulaEditor = ({
  open,
  onClose,
  gradeBook,
  onFormulaSave,
  existingFormulas = [],
}) => {
  const { assignments } = useAssignments();

  const [formulas, setFormulas] = useState(existingFormulas);
  const [editingFormula, setEditingFormula] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formulaForm, setFormulaForm] = useState({
    name: "",
    type: FORMULA_TYPES.SUM,
    description: "",
    parameters: {
      categories: [],
      assignments: [],
      weights: {},
    },
    expression: "",
    displayFormat: "percentage",
    roundingMethod: "nearest_whole",
  });

  const [errors, setErrors] = useState({});

  // Get available categories and assignments for the gradebook
  const availableCategories = gradeBook?.categories?.map(cat => cat.name) || [];
  const availableAssignments = assignments.filter(
    assignment => assignment.subject === gradeBook?.subject
  );

  const handleCreateFormula = () => {
    setEditingFormula(null);
    setFormulaForm({
      name: "",
      type: FORMULA_TYPES.SUM,
      description: "",
      parameters: {
        categories: [],
        assignments: [],
        weights: {},
      },
      expression: "",
      displayFormat: "percentage",
      roundingMethod: "nearest_whole",
    });
    setErrors({});
    setShowCreateDialog(true);
  };

  const handleEditFormula = (formula) => {
    setEditingFormula(formula);
    setFormulaForm({
      name: formula.name,
      type: formula.type,
      description: formula.description,
      parameters: formula.parameters,
      expression: formula.expression,
      displayFormat: formula.displayFormat,
      roundingMethod: formula.roundingMethod,
    });
    setErrors({});
    setShowCreateDialog(true);
  };

  const handleDeleteFormula = (formulaName) => {
    if (window.confirm(`Are you sure you want to delete the formula "${formulaName}"?`)) {
      const updatedFormulas = formulas.filter(f => f.name !== formulaName);
      setFormulas(updatedFormulas);
      if (onFormulaSave) {
        onFormulaSave(updatedFormulas);
      }
    }
  };

  const validateFormula = () => {
    const newErrors = {};

    if (!formulaForm.name.trim()) {
      newErrors.name = "Formula name is required";
    }

    if (formulas.some(f => f.name === formulaForm.name && (!editingFormula || f.name !== editingFormula.name))) {
      newErrors.name = "Formula name must be unique";
    }

    if (!formulaForm.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formulaForm.type === FORMULA_TYPES.CUSTOM && !formulaForm.expression.trim()) {
      newErrors.expression = "Custom expression is required";
    }

    if (formulaForm.type === FORMULA_TYPES.WEIGHTED_AVERAGE) {
      const weights = Object.values(formulaForm.parameters.weights);
      if (weights.length === 0) {
        newErrors.weights = "At least one category weight is required";
      } else if (Math.abs(weights.reduce((a, b) => a + b, 0) - 100) > 0.01) {
        newErrors.weights = "Category weights must sum to 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveFormula = () => {
    if (!validateFormula()) return;

    const newFormula = {
      id: editingFormula?.id || `formula-${Date.now()}`,
      ...formulaForm,
      createdAt: editingFormula?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedFormulas;
    if (editingFormula) {
      updatedFormulas = formulas.map(f => 
        f.id === editingFormula.id ? newFormula : f
      );
    } else {
      updatedFormulas = [...formulas, newFormula];
    }

    setFormulas(updatedFormulas);
    setShowCreateDialog(false);
    setEditingFormula(null);
    setFormulaForm({
      name: "",
      type: FORMULA_TYPES.SUM,
      description: "",
      parameters: {
        categories: [],
        assignments: [],
        weights: {},
      },
      expression: "",
      displayFormat: "percentage",
      roundingMethod: "nearest_whole",
    });

    if (onFormulaSave) {
      onFormulaSave(updatedFormulas);
    }
  };

  const handleParameterChange = (paramType, value) => {
    setFormulaForm(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramType]: value,
      },
    }));
  };

  const handleWeightChange = (category, weight) => {
    setFormulaForm(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        weights: {
          ...prev.parameters.weights,
          [category]: parseFloat(weight) || 0,
        },
      },
    }));
  };

  const getFormulaPreview = () => {
    const { type, parameters, expression } = formulaForm;

    switch (type) {
      case FORMULA_TYPES.SUM:
        const categories = parameters.categories.length > 0 
          ? parameters.categories.join(", ") 
          : "All categories";
        return `Sum of grades from: ${categories}`;

      case FORMULA_TYPES.AVERAGE:
        const avgCategories = parameters.categories.length > 0 
          ? parameters.categories.join(", ") 
          : "All categories";
        return `Average of grades from: ${avgCategories}`;

      case FORMULA_TYPES.WEIGHTED_AVERAGE:
        const weightEntries = Object.entries(parameters.weights);
        if (weightEntries.length === 0) return "No weights configured";
        return weightEntries.map(([cat, weight]) => `${cat}: ${weight}%`).join(", ");

      case FORMULA_TYPES.CUSTOM:
        return expression || "No expression defined";

      default:
        return "Unknown formula type";
    }
  };

  const getFormulaTypeDescription = (type) => {
    switch (type) {
      case FORMULA_TYPES.SUM:
        return "Adds up all grades from selected categories or assignments";
      case FORMULA_TYPES.AVERAGE:
        return "Calculates the average of all grades from selected categories or assignments";
      case FORMULA_TYPES.WEIGHTED_AVERAGE:
        return "Calculates weighted average based on category weights";
      case FORMULA_TYPES.CUSTOM:
        return "Custom calculation using mathematical expressions";
      default:
        return "";
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5">Formula Editor</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateFormula}
            >
              Create Formula
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Existing Formulas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Existing Formulas
              </Typography>
              {formulas.length === 0 ? (
                <Alert severity="info">
                  No formulas created yet. Create your first formula to get started.
                </Alert>
              ) : (
                <List>
                  {formulas.map((formula, index) => (
                    <React.Fragment key={formula.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <FunctionsIcon color="primary" />
                              <Typography variant="subtitle1">
                                {formula.name}
                              </Typography>
                              <Chip
                                label={formula.type}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formula.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Created: {new Date(formula.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit Formula">
                            <IconButton
                              edge="end"
                              onClick={() => handleEditFormula(formula)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Formula">
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleDeleteFormula(formula.name)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < formulas.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Grid>

            {/* Formula Examples */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Formula Examples</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Total Points
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Sum all assignment scores
                          </Typography>
                          <Chip label="SUM" size="small" color="primary" />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Class Average
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Average of all completed assignments
                          </Typography>
                          <Chip label="AVERAGE" size="small" color="primary" />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Weighted Final
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Weighted average of categories
                          </Typography>
                          <Chip label="WEIGHTED_AVERAGE" size="small" color="primary" />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Custom Calculation
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Mathematical expression
                          </Typography>
                          <Chip label="CUSTOM" size="small" color="primary" />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Formula Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFormula ? "Edit Formula" : "Create New Formula"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Formula Name"
                value={formulaForm.name}
                onChange={(e) => setFormulaForm(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Formula Type</InputLabel>
                <Select
                  value={formulaForm.type}
                  onChange={(e) => setFormulaForm(prev => ({ ...prev, type: e.target.value }))}
                  label="Formula Type"
                >
                  {Object.entries(FORMULA_TYPES).map(([key, value]) => (
                    <MenuItem key={value} value={value}>
                      {key.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formulaForm.description}
                onChange={(e) => setFormulaForm(prev => ({ ...prev, description: e.target.value }))}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={2}
                required
              />
            </Grid>

            {/* Formula Type Specific Parameters */}
            {formulaForm.type !== FORMULA_TYPES.CUSTOM && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Parameters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Categories</InputLabel>
                      <Select
                        multiple
                        value={formulaForm.parameters.categories}
                        onChange={(e) => handleParameterChange("categories", e.target.value)}
                        label="Categories"
                        renderValue={(selected) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {availableCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Assignments</InputLabel>
                      <Select
                        multiple
                        value={formulaForm.parameters.assignments}
                        onChange={(e) => handleParameterChange("assignments", e.target.value)}
                        label="Assignments"
                        renderValue={(selected) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {availableAssignments.map((assignment) => (
                          <MenuItem key={assignment.id} value={assignment.id}>
                            {assignment.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            )}

            {/* Weighted Average Weights */}
            {formulaForm.type === FORMULA_TYPES.WEIGHTED_AVERAGE && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Category Weights
                </Typography>
                {errors.weights && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.weights}
                  </Alert>
                )}
                <Grid container spacing={2}>
                  {availableCategories.map((category) => (
                    <Grid item xs={12} md={4} key={category}>
                      <TextField
                        fullWidth
                        label={`${category} Weight (%)`}
                        type="number"
                        value={formulaForm.parameters.weights[category] || 0}
                        onChange={(e) => handleWeightChange(category, e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* Custom Expression */}
            {formulaForm.type === FORMULA_TYPES.CUSTOM && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Custom Expression
                </Typography>
                <TextField
                  fullWidth
                  label="Mathematical Expression"
                  value={formulaForm.expression}
                  onChange={(e) => setFormulaForm(prev => ({ ...prev, expression: e.target.value }))}
                  error={!!errors.expression}
                  helperText={errors.expression || "Use mathematical expressions with variables like 'grades', 'assignments'"}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
            )}

            {/* Display Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Display Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Display Format</InputLabel>
                    <Select
                      value={formulaForm.displayFormat}
                      onChange={(e) => setFormulaForm(prev => ({ ...prev, displayFormat: e.target.value }))}
                      label="Display Format"
                    >
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="points">Points</MenuItem>
                      <MenuItem value="decimal">Decimal (0.0-1.0)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Rounding Method</InputLabel>
                    <Select
                      value={formulaForm.roundingMethod}
                      onChange={(e) => setFormulaForm(prev => ({ ...prev, roundingMethod: e.target.value }))}
                      label="Rounding Method"
                    >
                      <MenuItem value="nearest_whole">Nearest Whole</MenuItem>
                      <MenuItem value="nearest_tenth">Nearest Tenth</MenuItem>
                      <MenuItem value="nearest_hundredth">Nearest Hundredth</MenuItem>
                      <MenuItem value="round_up">Round Up</MenuItem>
                      <MenuItem value="round_down">Round Down</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Formula Preview */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Formula Preview
                </Typography>
                <Typography variant="body2">
                  {getFormulaPreview()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getFormulaTypeDescription(formulaForm.type)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveFormula} variant="contained">
            {editingFormula ? "Update" : "Create"} Formula
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormulaEditor; 