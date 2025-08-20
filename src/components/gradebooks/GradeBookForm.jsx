import React, { useState, useEffect } from "react";
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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useSubjects } from "../../contexts/SubjectsContext";
import { useAcademicPeriods } from "../../contexts/AcademicPeriodsContext";
import { useStudents } from "../../contexts/StudentContext";
// Utility to determine best text color for contrast
function getContrastText(bgColor) {
  if (!bgColor) return "#fff";
  // Remove hash if present
  const color = bgColor.charAt(0) === "#" ? bgColor.substring(1) : bgColor;
  // Parse r,g,b
  let r, g, b;
  if (color.length === 6) {
    r = parseInt(color.substring(0, 2), 16);
    g = parseInt(color.substring(2, 4), 16);
    b = parseInt(color.substring(4, 6), 16);
  } else if (color.length === 8) {
    r = parseInt(color.substring(0, 2), 16);
    g = parseInt(color.substring(2, 4), 16);
    b = parseInt(color.substring(4, 6), 16);
  } else {
    return "#fff";
  }
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#222" : "#fff";
}

const GradeBookForm = ({ open, onClose, onSave, gradebook }) => {
  const { subjects } = useSubjects();
  const { years, getSemestersForYear, getTermsForSemester } =
    useAcademicPeriods();

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    gradeLevel: "",
    academicYearId: "",
    semesterId: "",
    termId: "",
    description: "",
  });

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", weight: "" });
  const [customGradeLevel, setCustomGradeLevel] = useState(false);
  const [settings, setSettings] = useState({
    allowLateSubmissions: true,
    autoCalculateFinal: true,
    weightCategories: true,
    roundingMethod: "nearest_whole",
    gradeDisplay: "points",
  });

  const gradeLevels = [
    "Pre-K",
    "Kindergarten",
    "1st Grade",
    "2nd Grade",
    "3rd Grade",
    "4th Grade",
    "5th Grade",
    "6th Grade",
    "7th Grade",
    "8th Grade",
    "9th Grade",
    "10th Grade",
    "11th Grade",
    "12th Grade",
    "University",
    "Other",
  ];

  const { students: allStudents } = useStudents();
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    if (gradebook) {
      const isCustom = !gradeLevels.includes(gradebook.gradeLevel);
      setCategories(gradebook.categories || []);
      // Normalize stored students to IDs (handle objects or strings)
      setSelectedStudents(
        (gradebook.students || []).map((s) =>
          typeof s === "string" ? s : s.id
        )
      );
      setFormData({
        name: gradebook.name,
        subject: gradebook.subject,
        gradeLevel: isCustom ? "Other" : gradebook.gradeLevel,
        academicYearId: gradebook.academicYearId,
        semesterId: gradebook.semesterId,
        termId: gradebook.termId,
        description: gradebook.description,
      });
      if (isCustom) {
        setCustomGradeLevel(gradebook.gradeLevel);
      } else {
        setCustomGradeLevel(false);
      }
      setCategories(gradebook.categories || []);
    } else {
      // Get current month and year
      const now = new Date();
      const month = now.toLocaleString("default", { month: "long" });
      const year = now.getFullYear();
      setFormData({
        name: `${month} - ${year}-ELA`,
        subject: "",
        gradeLevel: "",
        academicYearId: "",
        semesterId: "",
        termId: "",
        description: "",
      });
      setCategories([
        { name: "Homework", weight: 10, color: "#4CAF50" },
        { name: "Quiz", weight: 10, color: "#2196F3" },
        { name: "Classwork", weight: 10, color: "#FF9800" },
        { name: "Behavior & Social Learning", weight: 10, color: "#1e00ffff" },
        { name: "Participation", weight: 10, color: "#9C27B0" },
      ]);
      setCustomGradeLevel(false);
    }
  }, [gradebook, open]);

  const handleStudentsChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedStudents(typeof value === "string" ? value.split(",") : value);
  };

  const handleFormChange = (field, value) => {
    if (field === "gradeLevel" && value === "Other") {
      setCustomGradeLevel(true);
    } else if (field === "gradeLevel") {
      setCustomGradeLevel(false);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.weight) {
      // Assign a default color automatically
      setCategories([...categories, { ...newCategory, color: "#607D8B" }]);
      setNewCategory({ name: "", weight: "" });
    }
  };

  const handleUpdateCategory = (index, updates) => {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const handleSave = () => {
    const selectedYear = years.find((y) => y.id === formData.academicYearId);
    const semesters = getSemestersForYear(formData.academicYearId);
    const semester = semesters.find((s) => s.id === formData.semesterId);
    const terms = getTermsForSemester(
      formData.academicYearId,
      formData.semesterId
    );
    const term = terms.find((t) => t.id === formData.termId);

    const finalData = {
      ...formData,
      academicYear: selectedYear?.name || "",
      semester: semester?.name || "",
      term: term?.name || "",
    };

    if (formData.gradeLevel === "Other") {
      finalData.gradeLevel = customGradeLevel;
    }

    onSave({ ...finalData, categories, settings, students: selectedStudents });
    onClose();
  };

  const totalWeight = categories.reduce(
    (sum, cat) => sum + Number(cat.weight || 0),
    0
  );

  // Validation
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.subject !== "" &&
      formData.gradeLevel !== "" &&
      formData.academicYearId !== "" &&
      formData.semesterId !== "" &&
      formData.termId !== "" &&
      categories.length > 0
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {gradebook ? "Edit Grade Book" : "Create New Grade Book"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Grade Book Name"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={formData.subject}
                onChange={(e) => handleFormChange("subject", e.target.value)}
                label="Subject"
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={formData.gradeLevel}
                onChange={(e) => handleFormChange("gradeLevel", e.target.value)}
                label="Grade Level"
              >
                {gradeLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={formData.academicYearId}
                onChange={(e) =>
                  handleFormChange("academicYearId", e.target.value)
                }
                label="Academic Year"
              >
                {years.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!formData.academicYearId}>
              <InputLabel>Semester</InputLabel>
              <Select
                value={formData.semesterId}
                onChange={(e) => handleFormChange("semesterId", e.target.value)}
                label="Semester"
              >
                {getSemestersForYear(formData.academicYearId).map(
                  (semester) => (
                    <MenuItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!formData.semesterId}>
              <InputLabel>Term</InputLabel>
              <Select
                value={formData.termId}
                onChange={(e) => handleFormChange("termId", e.target.value)}
                label="Term"
              >
                {getTermsForSemester(
                  formData.academicYearId,
                  formData.semesterId
                ).map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              multiline
              rows={2}
              placeholder="Brief description of this gradebook..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="students-select-label">Students</InputLabel>
              <Select
                labelId="students-select-label"
                multiple
                value={selectedStudents}
                onChange={handleStudentsChange}
                renderValue={(selected) =>
                  (selected || [])
                    .map((id) => {
                      const st = allStudents.find((s) => s.id === id);
                      if (!st) return id;
                      return (
                        st.name ||
                        `${st.firstName || ""} ${st.lastName || ""}`.trim()
                      );
                    })
                    .join(", ")
                }
                label="Students"
                size="small"
              >
                {allStudents.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Checkbox checked={selectedStudents.indexOf(s.id) > -1} />
                    <ListItemText
                      primary={
                        s.name ||
                        `${s.firstName || ""} ${s.lastName || ""}`.trim()
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {customGradeLevel && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custom Grade Level"
                value={
                  formData.gradeLevel === "Other" ? "" : formData.gradeLevel
                }
                onChange={(e) => handleFormChange("gradeLevel", e.target.value)}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="h6">Categories</Typography>
            <Box>
              <Grid container spacing={1}>
                {categories.map((cat, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      variant="outlined"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: cat.color || "#ccc",
                          flexShrink: 0,
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", flex: 1 }}
                      >
                        {cat.name}
                      </Typography>

                      <TextField
                        size="small"
                        type="number"
                        value={cat.weight}
                        onChange={(e) =>
                          handleUpdateCategory(index, {
                            weight: e.target.value,
                          })
                        }
                        sx={{ width: "90px" }}
                        inputProps={{ min: 0, max: 100 }}
                        aria-label={`weight-${cat.name}`}
                      />

                      <IconButton
                        size="small"
                        onClick={() => handleRemoveCategory(index)}
                        aria-label={`delete-${cat.name}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
              <TextField
                label="New Category Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                size="small"
              />
              <TextField
                label="Weight (%)"
                type="number"
                value={newCategory.weight}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, weight: e.target.value })
                }
                size="small"
                sx={{ mx: 1, width: "100px" }}
              />
              <IconButton onClick={handleAddCategory} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            {/* Total weight display and messages removed as requested */}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Grade Display</InputLabel>
                  <Select
                    value={settings.gradeDisplay}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        gradeDisplay: e.target.value,
                      }))
                    }
                    label="Grade Display"
                  >
                    <MenuItem value="points">Points</MenuItem>
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="letter">Letter Grades</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Rounding Method</InputLabel>
                  <Select
                    value={settings.roundingMethod}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        roundingMethod: e.target.value,
                      }))
                    }
                    label="Rounding Method"
                  >
                    <MenuItem value="nearest_whole">Nearest Whole</MenuItem>
                    <MenuItem value="round_up">Round Up</MenuItem>
                    <MenuItem value="round_down">Round Down</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowLateSubmissions}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          allowLateSubmissions: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Allow Late Submissions"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoCalculateFinal}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoCalculateFinal: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Auto Calculate Final Grades"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.weightCategories}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          weightCategories: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Weight Categories"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isFormValid() || totalWeight > 100}
        >
          {gradebook ? "Save Changes" : "Create Grade Book"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeBookForm;
