import React, { useState, useEffect } from "react";
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
  Box,
  Typography,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const EnhancedAssignmentForm = ({
  open,
  onClose,
  assignment = null,
  onSave,
  categories,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    category: "",
    subcategory: "",
    points: "",
    dueDate: dayjs().add(7, "day").toDate(),
    description: "",
    instructions: "",
    timeEstimate: "",
    difficultyLevel: "medium",
    status: "draft",
    learningObjectives: [],
    requiredMaterials: [],
    submissionFormat: "",
    gradingCriteria: {
      accuracy: 100,
    },
    latePolicy: {
      allowed: true,
      penalty: 10,
      gracePeriod: 24,
    },
    retakePolicy: {
      allowed: false,
      maxAttempts: 1,
      timeLimit: 7,
    },
    groupSettings: {
      isGroupAssignment: false,
      maxGroupSize: 4,
      groupFormation: "auto",
    },
  });

  const [newLearningObjective, setNewLearningObjective] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        ...formData,
        ...assignment,
        dueDate: assignment.dueDate ? dayjs(assignment.dueDate).toDate() : dayjs().add(7, "day").toDate(),
      });
    }
  }, [assignment]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleNestedChange = (parentField, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Assignment name is required";
    }
    if (!formData.subject) {
      newErrors.subject = "Subject is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.points || formData.points <= 0) {
      newErrors.points = "Points must be greater than 0";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fix the errors before saving",
        severity: "error"
      });
      return;
    }

    const assignmentData = {
      ...formData,
      dueDate: dayjs(formData.dueDate).toISOString(),
      createdAt: assignment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(assignmentData);
    onClose();
  };

  const addLearningObjective = () => {
    if (newLearningObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newLearningObjective.trim()]
      }));
      setNewLearningObjective("");
    }
  };

  const removeLearningObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const addRequiredMaterial = () => {
    if (newMaterial.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredMaterials: [...prev.requiredMaterials, newMaterial.trim()]
      }));
      setNewMaterial("");
    }
  };

  const removeRequiredMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredMaterials: prev.requiredMaterials.filter((_, i) => i !== index)
    }));
  };

  const addGradingCriterion = () => {
    const criterionName = prompt("Enter criterion name:");
    if (criterionName && criterionName.trim()) {
      setFormData(prev => ({
        ...prev,
        gradingCriteria: {
          ...prev.gradingCriteria,
          [criterionName.trim()]: 0
        }
      }));
    }
  };

  const removeGradingCriterion = (criterion) => {
    const newCriteria = { ...formData.gradingCriteria };
    delete newCriteria[criterion];
    setFormData(prev => ({
      ...prev,
      gradingCriteria: newCriteria
    }));
  };

  const updateGradingWeight = (criterion, weight) => {
    setFormData(prev => ({
      ...prev,
      gradingCriteria: {
        ...prev.gradingCriteria,
        [criterion]: weight
      }
    }));
  };

  const getSubjectCategories = () => {
    return categories[formData.subject] || [];
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEdit ? "Edit Assignment" : "Create New Assignment"}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Assignment Name *"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.subject}>
                  <InputLabel>Subject *</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={(e) => handleFormChange("subject", e.target.value)}
                    label="Subject *"
                  >
                    {Object.keys(categories).map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subject && (
                    <Typography variant="caption" color="error">
                      {errors.subject}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleFormChange("category", e.target.value)}
                    label="Category *"
                  >
                    {getSubjectCategories().map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                    <Typography variant="caption" color="error">
                      {errors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Points *"
                  type="number"
                  value={formData.points}
                  onChange={(e) => handleFormChange("points", parseInt(e.target.value))}
                  error={!!errors.points}
                  helperText={errors.points}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><GradeIcon /></InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Due Date *"
                  value={dayjs(formData.dueDate)}
                  onChange={(newValue) => handleFormChange("dueDate", newValue.toDate())}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.dueDate}
                      helperText={errors.dueDate}
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty Level</InputLabel>
                  <Select
                    value={formData.difficultyLevel}
                    onChange={(e) => handleFormChange("difficultyLevel", e.target.value)}
                    label="Difficulty Level"
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Time Estimate (minutes)"
                  type="number"
                  value={formData.timeEstimate}
                  onChange={(e) => handleFormChange("timeEstimate", parseInt(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TimerIcon /></InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  multiline
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) => handleFormChange("instructions", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Submission Format"
                  value={formData.submissionFormat}
                  onChange={(e) => handleFormChange("submissionFormat", e.target.value)}
                  placeholder="e.g., PDF, Word document, online form, etc."
                />
              </Grid>

              {/* Learning Objectives */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Learning Objectives</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Add Learning Objective"
                          value={newLearningObjective}
                          onChange={(e) => setNewLearningObjective(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addLearningObjective()}
                        />
                        <IconButton onClick={addLearningObjective} color="primary">
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <List>
                        {formData.learningObjectives.map((objective, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <TrendingUpIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={objective} />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => removeLearningObjective(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Required Materials */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Required Materials</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Add Required Material"
                          value={newMaterial}
                          onChange={(e) => setNewMaterial(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addRequiredMaterial()}
                        />
                        <IconButton onClick={addRequiredMaterial} color="primary">
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {formData.requiredMaterials.map((material, index) => (
                          <Chip
                            key={index}
                            label={material}
                            onDelete={() => removeRequiredMaterial(index)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Grading Criteria */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Grading Criteria</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={addGradingCriterion}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      >
                        Add Criterion
                      </Button>
                      <List>
                        {Object.entries(formData.gradingCriteria).map(([criterion, weight]) => (
                          <ListItem key={criterion}>
                            <ListItemText
                              primary={criterion.replace("_", " ")}
                              secondary={
                                <Slider
                                  value={weight}
                                  onChange={(e, newValue) => updateGradingWeight(criterion, newValue)}
                                  min={0}
                                  max={100}
                                  valueLabelDisplay="auto"
                                  sx={{ mt: 1 }}
                                />
                              }
                            />
                            <ListItemSecondaryAction>
                              <Typography variant="body2" sx={{ mr: 2 }}>
                                {weight}%
                              </Typography>
                              <IconButton
                                edge="end"
                                onClick={() => removeGradingCriterion(criterion)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Advanced Settings */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Advanced Settings</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {/* Late Policy */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Late Policy
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.latePolicy.allowed}
                              onChange={(e) => handleNestedChange("latePolicy", "allowed", e.target.checked)}
                            />
                          }
                          label="Allow late submissions"
                        />
                        {formData.latePolicy.allowed && (
                          <Box mt={2}>
                            <TextField
                              fullWidth
                              label="Penalty (%)"
                              type="number"
                              value={formData.latePolicy.penalty}
                              onChange={(e) => handleNestedChange("latePolicy", "penalty", parseInt(e.target.value))}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Grace Period (hours)"
                              type="number"
                              value={formData.latePolicy.gracePeriod}
                              onChange={(e) => handleNestedChange("latePolicy", "gracePeriod", parseInt(e.target.value))}
                              sx={{ mt: 2 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                              }}
                            />
                          </Box>
                        )}
                      </Grid>

                      {/* Retake Policy */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Retake Policy
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.retakePolicy.allowed}
                              onChange={(e) => handleNestedChange("retakePolicy", "allowed", e.target.checked)}
                            />
                          }
                          label="Allow retakes"
                        />
                        {formData.retakePolicy.allowed && (
                          <Box mt={2}>
                            <TextField
                              fullWidth
                              label="Max Attempts"
                              type="number"
                              value={formData.retakePolicy.maxAttempts}
                              onChange={(e) => handleNestedChange("retakePolicy", "maxAttempts", parseInt(e.target.value))}
                            />
                            <TextField
                              fullWidth
                              label="Time Limit (days)"
                              type="number"
                              value={formData.retakePolicy.timeLimit}
                              onChange={(e) => handleNestedChange("retakePolicy", "timeLimit", parseInt(e.target.value))}
                              sx={{ mt: 2 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">days</InputAdornment>,
                              }}
                            />
                          </Box>
                        )}
                      </Grid>

                      {/* Group Settings */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Group Settings
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.groupSettings.isGroupAssignment}
                              onChange={(e) => handleNestedChange("groupSettings", "isGroupAssignment", e.target.checked)}
                            />
                          }
                          label="Group assignment"
                        />
                        {formData.groupSettings.isGroupAssignment && (
                          <Box mt={2}>
                            <TextField
                              fullWidth
                              label="Max Group Size"
                              type="number"
                              value={formData.groupSettings.maxGroupSize}
                              onChange={(e) => handleNestedChange("groupSettings", "maxGroupSize", parseInt(e.target.value))}
                            />
                            <FormControl fullWidth sx={{ mt: 2 }}>
                              <InputLabel>Group Formation</InputLabel>
                              <Select
                                value={formData.groupSettings.groupFormation}
                                onChange={(e) => handleNestedChange("groupSettings", "groupFormation", e.target.value)}
                                label="Group Formation"
                              >
                                <MenuItem value="auto">Automatic</MenuItem>
                                <MenuItem value="manual">Manual</MenuItem>
                                <MenuItem value="student-choice">Student Choice</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<CheckCircleIcon />}
          >
            {isEdit ? "Update Assignment" : "Create Assignment"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EnhancedAssignmentForm;
