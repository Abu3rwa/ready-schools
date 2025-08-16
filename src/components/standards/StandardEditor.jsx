import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  createStandard,
  updateStandard,
} from "../../services/standardsService";

const StandardEditor = ({
  standard,
  subjects,
  frameworks,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    subjectId: "",
    frameworkId: "",
    gradeLevel: "",
    domain: "",
    keywords: "",
    lessonCount: 0,
    ...standard,
  });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find the selected subject and framework
      const subject = subjects.find((s) => s.id === formData.subjectId);
      const framework = frameworks.find((f) => f.id === formData.frameworkId);

      if (!subject) throw new Error("Selected subject not found");
      if (!framework) throw new Error("Selected framework not found");

      const standardData = {
        ...formData,
        subject: subject.name,
        framework: framework.name,
      };

      if (standard?.id) {
        await updateStandard(standard.id, standardData);
      } else {
        await createStandard(standardData);
      }
      onSave();
    } catch (error) {
      console.error("Error saving standard:", error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Standard Code"
            value={formData.code}
            onChange={handleChange("code")}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Framework</InputLabel>
            <Select
              value={formData.frameworkId}
              onChange={handleChange("frameworkId")}
              label="Framework"
              required
            >
              {frameworks.map((framework) => (
                <MenuItem key={framework.id} value={framework.id}>
                  {framework.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={handleChange("description")}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={formData.subjectId}
              onChange={handleChange("subjectId")}
              label="Subject"
              required
            >
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
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
              onChange={handleChange("gradeLevel")}
              label="Grade Level"
              required
            >
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={String(i + 1)}>
                  Grade {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Domain"
            value={formData.domain}
            onChange={handleChange("domain")}
            helperText="e.g., Number & Operations, Reading Comprehension"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Keywords"
            value={formData.keywords}
            onChange={handleChange("keywords")}
            helperText="Comma-separated keywords for searching"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {standard?.id ? "Update" : "Create"} Standard
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StandardEditor;
