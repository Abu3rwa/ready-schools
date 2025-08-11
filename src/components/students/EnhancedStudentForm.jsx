import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Box,
  Typography,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const EnhancedStudentForm = ({
  open,
  onClose,
  onSubmit,
  student = null,
  isEdit = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: "",
    lastName: "",
    dateOfBirth: null,
    gender: "",
    studentId: "",
    gradeLevel: "",
    enrollmentDate: null,

    // Contact Information
    parentEmail1: "",
    parentEmail2: "",
    parentPhone1: "",
    parentPhone2: "",

    // Academic Information
    academicYear: "",
    learningStyle: "",
    specialNeeds: [],
    iepPlan: false,

    // Medical Information
    medicalNotes: "",
    allergies: [],
    medications: [],

    // Additional Information
    notes: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newSpecialNeed, setNewSpecialNeed] = useState("");

  // Predefined options
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const gradeLevels = [
    "K",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const learningStyles = [
    "Visual",
    "Auditory",
    "Kinesthetic",
    "Reading/Writing",
    "Mixed",
  ];
  const specialNeedsOptions = [
    "ADHD",
    "Autism",
    "Dyslexia",
    "Dyscalculia",
    "Hearing Impairment",
    "Visual Impairment",
    "Physical Disability",
    "Speech/Language",
    "Emotional/Behavioral",
    "Gifted/Talented",
    "Other",
  ];
  const statusOptions = ["active", "inactive", "graduated", "transferred"];

  useEffect(() => {
    if (student && isEdit) {
      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        dateOfBirth: student.dateOfBirth || "",
        gender: student.gender || "",
        studentId: student.studentId || "",
        gradeLevel: student.gradeLevel || "",
        enrollmentDate: student.enrollmentDate || "",
        parentEmail1: student.parentEmail1 || "",
        parentEmail2: student.parentEmail2 || "",
        parentPhone1: student.phone || "",
        parentPhone2: student.parentPhone2 || "",
        academicYear: student.academicYear || "",
        learningStyle: student.learningStyle || "",
        specialNeeds: student.specialNeeds || [],
        iepPlan: student.iepPlan || false,
        medicalNotes: student.medicalNotes || "",
        allergies: student.allergies || [],
        medications: student.medications || [],
        notes: student.notes || "",
        status: student.status || "active",
      });
    } else {
      // Reset form for new student
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        studentId: "",
        gradeLevel: "",
        enrollmentDate: "",
        parentEmail1: "",
        parentEmail2: "",
        parentPhone1: "",
        parentPhone2: "",
        academicYear: new Date().getFullYear().toString(),
        learningStyle: "",
        specialNeeds: [],
        iepPlan: false,
        medicalNotes: "",
        allergies: [],
        medications: [],
        notes: "",
        status: "active",
      });
    }
    setErrors({});
  }, [student, isEdit, open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleEmergencyContactChange = (field, value) => {
    // Emergency contact removed
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.parentEmail1.trim())
      newErrors.parentEmail1 = "Primary parent email is required";
    if (!formData.parentPhone1.trim())
      newErrors.parentPhone1 = "Primary parent phone is required";
    if (!formData.gradeLevel) newErrors.gradeLevel = "Grade level is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.parentEmail1 && !emailRegex.test(formData.parentEmail1)) {
      newErrors.parentEmail1 = "Invalid email format";
    }
    if (formData.parentEmail2 && !emailRegex.test(formData.parentEmail2)) {
      newErrors.parentEmail2 = "Invalid email format";
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (
      formData.parentPhone1 &&
      !phoneRegex.test(formData.parentPhone1.replace(/\D/g, ""))
    ) {
      newErrors.parentPhone1 = "Invalid phone number";
    }
    if (
      formData.parentPhone2 &&
      !phoneRegex.test(formData.parentPhone2.replace(/\D/g, ""))
    ) {
      newErrors.parentPhone2 = "Invalid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }));
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  const addMedication = () => {
    if (
      newMedication.trim() &&
      !formData.medications.includes(newMedication.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()],
      }));
      setNewMedication("");
    }
  };

  const removeMedication = (medication) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m !== medication),
    }));
  };

  const addSpecialNeed = () => {
    if (
      newSpecialNeed.trim() &&
      !formData.specialNeeds.includes(newSpecialNeed.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        specialNeeds: [...prev.specialNeeds, newSpecialNeed.trim()],
      }));
      setNewSpecialNeed("");
    }
  };

  const removeSpecialNeed = (need) => {
    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((n) => n !== need),
    }));
  };

  const toggleSpecialNeed = (need) => {
    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter((n) => n !== need)
        : [...prev.specialNeeds, need],
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {formData.firstName?.charAt(0) ||
              formData.lastName?.charAt(0) ||
              "S"}
          </Avatar>
          <Typography variant="h6">
            {isEdit ? "Edit Student" : "Add New Student"}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Personal Details Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Personal Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                label="Gender"
              >
                {genderOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Student ID"
              value={formData.studentId}
              onChange={(e) => handleInputChange("studentId", e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.gradeLevel}>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={formData.gradeLevel}
                onChange={(e) =>
                  handleInputChange("gradeLevel", e.target.value)
                }
                label="Grade Level"
              >
                {gradeLevels.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    Grade {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Enrollment Date"
              type="date"
              value={formData.enrollmentDate}
              onChange={(e) =>
                handleInputChange("enrollmentDate", e.target.value)
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                label="Status"
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Contact Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Primary Parent Email"
              type="email"
              value={formData.parentEmail1}
              onChange={(e) =>
                handleInputChange("parentEmail1", e.target.value)
              }
              error={!!errors.parentEmail1}
              helperText={errors.parentEmail1}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Secondary Parent Email"
              type="email"
              value={formData.parentEmail2}
              onChange={(e) =>
                handleInputChange("parentEmail2", e.target.value)
              }
              error={!!errors.parentEmail2}
              helperText={errors.parentEmail2}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Primary Parent Phone"
              value={formData.parentPhone1}
              onChange={(e) =>
                handleInputChange("parentPhone1", e.target.value)
              }
              error={!!errors.parentPhone1}
              helperText={errors.parentPhone1}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Secondary Parent Phone"
              value={formData.parentPhone2}
              onChange={(e) =>
                handleInputChange("parentPhone2", e.target.value)
              }
              error={!!errors.parentPhone2}
              helperText={errors.parentPhone2}
            />
          </Grid>

          {/* Emergency Contact removed */}

          {/* Academic Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Academic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* Previous School removed */}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Academic Year"
              value={formData.academicYear}
              onChange={(e) =>
                handleInputChange("academicYear", e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Learning Style</InputLabel>
              <Select
                value={formData.learningStyle}
                onChange={(e) =>
                  handleInputChange("learningStyle", e.target.value)
                }
                label="Learning Style"
              >
                {learningStyles.map((style) => (
                  <MenuItem key={style} value={style}>
                    {style}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.iepPlan}
                  onChange={(e) =>
                    handleInputChange("iepPlan", e.target.checked)
                  }
                />
              }
              label="IEP/504 Plan"
            />
          </Grid>

          {/* Special Needs */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Special Needs
            </Typography>
            <Box sx={{ mb: 2 }}>
              {specialNeedsOptions.map((need) => (
                <Chip
                  key={need}
                  label={need}
                  onClick={() => toggleSpecialNeed(need)}
                  color={
                    formData.specialNeeds.includes(need) ? "primary" : "default"
                  }
                  variant={
                    formData.specialNeeds.includes(need) ? "filled" : "outlined"
                  }
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Add Custom Special Need"
                value={newSpecialNeed}
                onChange={(e) => setNewSpecialNeed(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSpecialNeed()}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addSpecialNeed}
                disabled={!newSpecialNeed.trim()}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Medical Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Medical Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Medical Notes"
              multiline
              rows={3}
              value={formData.medicalNotes}
              onChange={(e) =>
                handleInputChange("medicalNotes", e.target.value)
              }
            />
          </Grid>

          {/* Allergies */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Allergies
            </Typography>
            <Box sx={{ mb: 2 }}>
              {formData.allergies.map((allergy) => (
                <Chip
                  key={allergy}
                  label={allergy}
                  onDelete={() => removeAllergy(allergy)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Add Allergy"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAllergy()}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addAllergy}
                disabled={!newAllergy.trim()}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Medications */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Medications
            </Typography>
            <Box sx={{ mb: 2 }}>
              {formData.medications.map((medication) => (
                <Chip
                  key={medication}
                  label={medication}
                  onDelete={() => removeMedication(medication)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Add Medication"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addMedication()}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addMedication}
                disabled={!newMedication.trim()}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Additional Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional information about the student..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} startIcon={<CancelIcon />} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
        >
          {loading ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedStudentForm;
