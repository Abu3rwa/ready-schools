import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider,
  Alert,
  Snackbar,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { useStandardsGrading } from "../../contexts/StandardsGradingContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useGradeBooks } from "../../contexts/GradeBookContext";
import * as standardsService from "../../services/standardsService";
import { getSubjects } from "../../services/subjectsService";
// import AddCategoryDialog from "./AddCategoryDialog";

const EnhancedAssignmentForm = ({
  open,
  onClose,
  assignment = null,
  onSave,
  isEdit = false,
}) => {
  const { createStandardMapping, loadStandardsMappings } =
    useStandardsGrading();
  const { getCategoryWeight } = useAssignments();
  const { gradeBooks, addCategoryToGradeBook } = useGradeBooks();
  const [selectedGradeBook, setSelectedGradeBook] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    category: "",
    points: "",
    dueDate: dayjs().add(7, "day").toDate(),
    description: "",
    instructions: "",
  });

  // const [newLearningObjective, setNewLearningObjective] = useState("");
  // const [newMaterial, setNewMaterial] = useState("");
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Standards-based grading state
  const [standardsGradingEnabled, setStandardsGradingEnabled] = useState(false);
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [gradingMode, setGradingMode] = useState("both"); // 'traditional', 'standards', 'both'
  const [proficiencyScale, setProficiencyScale] = useState("four_point"); // 'four_point', 'five_point'

  // Data loading state
  const [subjects, setSubjects] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectsData = await getSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };
    loadSubjects();
  }, []);

  // Load standards when subject changes
  useEffect(() => {
    const loadStandards = async () => {
      if (!formData.subject) {
        setStandards([]);
        setSelectedStandards([]); // Clear selections when no subject
        return;
      }

      setLoadingStandards(true);
      try {
        // Find the subject name from the subjects list
        const subjectObj = subjects.find(
          (s) => s.code === formData.subject || s.name === formData.subject
        );
        if (subjectObj) {
          const standardsData = await standardsService.getStandards({
            subject: subjectObj.name,
          });
          // Ensure unique standards by ID
          const uniqueStandards = standardsData.filter(
            (standard, index, self) =>
              index === self.findIndex((s) => s.id === standard.id)
          );
          setStandards(uniqueStandards);
          setSelectedStandards([]); // Clear selections when subject changes
        } else {
          setStandards([]);
          setSelectedStandards([]);
        }
      } catch (error) {
        console.error("Error loading standards:", error);
        setStandards([]);
        setSelectedStandards([]);
      } finally {
        setLoadingStandards(false);
      }
    };

    loadStandards();
  }, [formData.subject, subjects]);

  // Remove duplicates from selected standards
  const removeDuplicateStandards = () => {
    const uniqueStandards = selectedStandards.filter(
      (standard, index, self) =>
        index === self.findIndex((s) => s.standardId === standard.standardId)
    );
    setSelectedStandards(uniqueStandards);
  };

  // Clean up duplicates when selectedStandards changes
  useEffect(() => {
    const hasDuplicates =
      selectedStandards.length !==
      new Set(selectedStandards.map((s) => s.standardId)).size;
    if (hasDuplicates) {
      removeDuplicateStandards();
    }
  }, [selectedStandards]);

  useEffect(() => {
    if (assignment) {
      setFormData({
        ...formData,
        ...assignment,
        dueDate: assignment.dueDate
          ? dayjs(assignment.dueDate).toDate()
          : dayjs().add(7, "day").toDate(),
      });

      if (assignment.gradebookId) {
        const gradebook = gradeBooks.find(
          (gb) => gb.id === assignment.gradebookId
        );
        setSelectedGradeBook(gradebook);
      }

      // Load existing standards mappings if assignment has standards grading
      if (assignment.hasStandardsAssessment) {
        setStandardsGradingEnabled(true);
        setGradingMode(assignment.gradingMode || "both");
        setProficiencyScale(assignment.proficiencyScale || "four_point");

        // Load existing mappings
        loadStandardsMappings(assignment.id);
      }
    }
  }, [assignment, loadStandardsMappings]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Assignment name is required";
    }

    if (!selectedGradeBook) {
      newErrors.gradebook = "Please select a grade book";
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

    // Validate gradebook-category relationship
    if (selectedGradeBook && formData.category) {
      const categoryExists = selectedGradeBook.categories?.some(
        (c) => c.name === formData.category
      );
      if (!categoryExists) {
        newErrors.category =
          "Selected category does not exist in this grade book";
      }
    }

    // Validate standards selection if standards grading is enabled
    if (standardsGradingEnabled && selectedStandards.length === 0) {
      newErrors.standards =
        "Please select at least one standard for assessment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fix the errors before saving",
        severity: "error",
      });
      return;
    }

    // Ensure we have all required data
    if (!selectedGradeBook) {
      setSnackbar({
        open: true,
        message: "Please select a grade book",
        severity: "error",
      });
      return;
    }

    const selectedCategory = selectedGradeBook.categories?.find(
      (c) => c.name === formData.category
    );

    if (!selectedCategory) {
      setSnackbar({
        open: true,
        message: "Selected category not found in grade book",
        severity: "error",
      });
      return;
    }

    const assignmentData = {
      ...formData,
      dueDate: dayjs(formData.dueDate).toISOString(),
      createdAt: assignment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Enhanced gradebook association
      gradebookId: selectedGradeBook.id,
      gradebookName: selectedGradeBook.name,

      // Enhanced category data
      category: selectedCategory.name,
      categoryId: selectedCategory.id || selectedCategory.name,
      categoryWeight: selectedCategory.weight || 0,
      categoryColor: selectedCategory.color || "#ccc",

      // Standards-based grading data
      hasStandardsAssessment: standardsGradingEnabled,
      gradingMode: standardsGradingEnabled ? gradingMode : "traditional",
      proficiencyScale: standardsGradingEnabled
        ? proficiencyScale
        : "four_point",
      standardsWeight: 0.5, // This will be hardcoded as per the edit hint
      mappedStandardsCount: selectedStandards.length,
      mappedStandards: selectedStandards.map((s) => s.standardCode),
    };

    try {
      // Save assignment first
      const savedAssignment = await onSave(assignmentData);

      // Create standards mappings if standards grading is enabled
      if (
        standardsGradingEnabled &&
        selectedStandards.length > 0 &&
        savedAssignment?.id
      ) {
        const mappingPromises = selectedStandards.map((standard) =>
          createStandardMapping({
            assignmentId: savedAssignment.id,
            standardId: standard.standardId,
            alignmentStrength: standard.alignmentStrength || 0.75,
            coverageType: standard.coverageType || "full",
            weight: standard.weight || 1.0,
          })
        );

        await Promise.all(mappingPromises);
      }

      setSnackbar({
        open: true,
        message: `Assignment "${formData.name}" created successfully and linked to ${selectedGradeBook.name}`,
        severity: "success",
      });

      onClose();
    } catch (error) {
      console.error("Error saving assignment:", error);
      setSnackbar({
        open: true,
        message: "Error saving assignment. Please try again.",
        severity: "error",
      });
    }
  };

  // Filter standards based on search
  const filteredStandards = standards.filter((standard) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      standard.code?.toLowerCase().includes(search) ||
      standard.description?.toLowerCase().includes(search) ||
      standard.name?.toLowerCase().includes(search)
    );
  });

  // Handle standard selection
  const handleStandardToggle = (standard) => {
    const isSelected = selectedStandards.some(
      (s) => s.standardId === standard.id
    );

    if (isSelected) {
      setSelectedStandards((prev) =>
        prev.filter((s) => s.standardId !== standard.id)
      );
    } else {
      // Check if this standard is already selected to prevent duplicates
      const alreadyExists = selectedStandards.some(
        (s) => s.standardId === standard.id
      );
      if (!alreadyExists) {
        const newStandard = {
          standardId: standard.id,
          standardCode: standard.code,
          standardName: standard.name,
          standardDescription: standard.description,
          alignmentStrength: 0.75,
          coverageType: "full",
          weight: 1.0,
        };
        setSelectedStandards((prev) => [...prev, newStandard]);
      }
    }
  };

  const isStandardSelected = (standard) => {
    return selectedStandards.some((s) => s.standardId === standard.id);
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
                <FormControl fullWidth required error={!!errors.gradebook}>
                  <InputLabel>Grade Book *</InputLabel>
                  <Select
                    value={selectedGradeBook ? selectedGradeBook.id : ""}
                    onChange={(e) => {
                      const gradebook = gradeBooks.find(
                        (gb) => gb.id === e.target.value
                      );
                      setSelectedGradeBook(gradebook);

                      // Try to find a matching subject object so the Select value
                      // uses the same key as the MenuItem values (code or name).
                      let subjectValue = "";
                      if (gradebook) {
                        const subj = subjects.find(
                          (s) =>
                            s.code === gradebook.subject ||
                            s.name === gradebook.subject ||
                            s.id === gradebook.subject
                        );
                        subjectValue = subj
                          ? subj.code || subj.name
                          : gradebook.subject || "";
                      }

                      handleFormChange("subject", subjectValue);
                      handleFormChange("category", ""); // Reset category
                    }}
                    label="Grade Book *"
                  >
                    {gradeBooks.map((gb) => (
                      <MenuItem key={gb.id} value={gb.id}>
                        {gb.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.gradebook && (
                    <Typography variant="caption" color="error">
                      {errors.gradebook}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.subject}>
                  <InputLabel>Subject *</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={(e) =>
                      handleFormChange("subject", e.target.value)
                    }
                    label="Subject *"
                    disabled
                  >
                    {subjects.map((subject) => (
                      <MenuItem
                        key={subject.id}
                        value={subject.code || subject.name}
                      >
                        {subject.name}
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
                    onChange={(e) =>
                      handleFormChange("category", e.target.value)
                    }
                    label="Category *"
                    disabled={!selectedGradeBook}
                  >
                    {selectedGradeBook?.categories?.map((category) => (
                      <MenuItem key={category.name} value={category.name}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: category.color,
                            }}
                          />
                          {category.name} ({category.weight}%)
                        </Box>
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
                  onChange={(e) =>
                    handleFormChange("points", parseInt(e.target.value))
                  }
                  error={!!errors.points}
                  helperText={errors.points}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <GradeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Due Date *"
                  value={dayjs(formData.dueDate)}
                  onChange={(newValue) =>
                    handleFormChange("dueDate", newValue?.toDate())
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dueDate,
                      helperText: errors.dueDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    handleFormChange("instructions", e.target.value)
                  }
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Standards-Based Assessment */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      Standards-Based Assessment
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={standardsGradingEnabled}
                          onChange={(e) =>
                            setStandardsGradingEnabled(e.target.checked)
                          }
                        />
                      }
                      label="Enable Standards-Based Grading"
                    />

                    {standardsGradingEnabled && (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Grading Mode</InputLabel>
                              <Select
                                value={gradingMode}
                                onChange={(e) => setGradingMode(e.target.value)}
                                label="Grading Mode"
                              >
                                <MenuItem value="traditional">
                                  Traditional Only (Points)
                                </MenuItem>
                                <MenuItem value="standards">
                                  Standards Only (Proficiency)
                                </MenuItem>
                                <MenuItem value="both">
                                  Both Traditional & Standards
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Proficiency Scale</InputLabel>
                              <Select
                                value={proficiencyScale}
                                onChange={(e) =>
                                  setProficiencyScale(e.target.value)
                                }
                                label="Proficiency Scale"
                              >
                                <MenuItem value="four_point">
                                  4-Point Scale (1-4)
                                </MenuItem>
                                <MenuItem value="five_point">
                                  5-Point Scale (1-5)
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {gradingMode === "both" && (
                            <Grid item xs={12}>
                              <Alert severity="info">
                                Students will receive both a traditional grade
                                (points) and individual standards grades
                                (proficiency levels).
                              </Alert>
                            </Grid>
                          )}

                          {/* Standards Selection */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                              Select Standards to Assess (
                              {selectedStandards.length} selected)
                            </Typography>

                            {/* Debug info - remove this in production */}
                            {process.env.NODE_ENV === "development" &&
                              selectedStandards.length > 0 && (
                                <Box
                                  sx={{
                                    mb: 2,
                                    p: 1,
                                    bgcolor: "yellow.100",
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Selected:{" "}
                                    {selectedStandards
                                      .map((s) => s.standardCode)
                                      .join(", ")}
                                  </Typography>
                                </Box>
                              )}

                            {formData.subject ? (
                              <>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Search standards..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  InputProps={{
                                    startAdornment: (
                                      <SearchIcon
                                        sx={{ mr: 1, color: "text.secondary" }}
                                      />
                                    ),
                                  }}
                                  sx={{ mb: 2 }}
                                />

                                {loadingStandards ? (
                                  <Box
                                    display="flex"
                                    justifyContent="center"
                                    p={2}
                                  >
                                    <CircularProgress />
                                  </Box>
                                ) : filteredStandards.length > 0 ? (
                                  <Paper
                                    variant="outlined"
                                    sx={{ maxHeight: 300, overflow: "auto" }}
                                  >
                                    <List dense>
                                      {filteredStandards.map((standard) => (
                                        <ListItem
                                          key={standard.id}
                                          button
                                          onClick={() =>
                                            handleStandardToggle(standard)
                                          }
                                        >
                                          <Checkbox
                                            checked={isStandardSelected(
                                              standard
                                            )}
                                            onChange={() =>
                                              handleStandardToggle(standard)
                                            }
                                          />
                                          <ListItemText
                                            primary={
                                              <Box>
                                                <Typography
                                                  variant="subtitle2"
                                                  fontWeight="bold"
                                                >
                                                  {standard.code}
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {standard.description}
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Paper>
                                ) : (
                                  <Alert severity="info">
                                    No standards found for {formData.subject}.
                                    Please add standards in the Standards page.
                                  </Alert>
                                )}
                              </>
                            ) : (
                              <Alert severity="warning">
                                Please select a subject first to see available
                                standards.
                              </Alert>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
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
