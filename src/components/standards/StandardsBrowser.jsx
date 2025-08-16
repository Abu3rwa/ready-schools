import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { getStandards, deleteStandard } from "../../services/standardsService";
import { getSubjects } from "../../services/subjectsService";
import { getFrameworks } from "../../services/frameworkService";
import StandardEditor from "./StandardEditor";

const StandardsBrowser = () => {
  const [standards, setStandards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [filters, setFilters] = useState({
    framework: "",
    subject: "",
    gradeLevel: "",
  });
  const [editingStandard, setEditingStandard] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userSubjects, userFrameworks] = await Promise.all([
          getSubjects(),
          getFrameworks(),
        ]);
        setSubjects(userSubjects);
        setFrameworks(userFrameworks);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error loading data. Please try again.",
          severity: "error",
        });
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    loadStandards();
  }, [filters]);

  const loadStandards = async () => {
    try {
      const standardsList = await getStandards({
        framework: filters.framework || undefined,
        subject: filters.subject || undefined,
        gradeLevel: filters.gradeLevel || undefined,
      });
      setStandards(standardsList);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error loading standards: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleEdit = (standard) => {
    setEditingStandard(standard);
    setShowEditor(true);
  };

  const handleDelete = async (standardId) => {
    try {
      await deleteStandard(standardId);
      await loadStandards();
      setSnackbar({
        open: true,
        message: "Standard deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting standard: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingStandard(null);
    loadStandards();
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2}>
          <FormControl fullWidth>
            <InputLabel>Framework</InputLabel>
            <Select
              value={filters.framework}
              onChange={handleFilterChange("framework")}
              label="Framework"
            >
              <MenuItem value="">All</MenuItem>
              {frameworks.map((framework) => (
                <MenuItem key={framework.id} value={framework.id}>
                  {framework.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={filters.subject}
              onChange={handleFilterChange("subject")}
              label="Subject"
            >
              <MenuItem value="">All</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Grade Level</InputLabel>
            <Select
              value={filters.gradeLevel}
              onChange={handleFilterChange("gradeLevel")}
              label="Grade Level"
            >
              <MenuItem value="">All</MenuItem>
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={String(i + 1)}>
                  Grade {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <List>
        {standards.map((standard) => {
          const subject = subjects.find((s) => s.id === standard.subjectId);
          const framework = frameworks.find(
            (f) => f.id === standard.frameworkId
          );
          return (
            <ListItem
              key={standard.id}
              divider
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(standard)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(standard.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={standard.code}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {standard.description}
                    </Typography>
                    <br />
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {subject?.name || "Unknown Subject"} • Grade{" "}
                      {standard.gradeLevel} •{" "}
                      {framework?.name || "Unknown Framework"}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>

      <Dialog
        open={showEditor}
        onClose={handleEditorClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStandard ? "Edit Standard" : "Add Standard"}
        </DialogTitle>
        <DialogContent>
          <StandardEditor
            standard={editingStandard}
            subjects={subjects}
            frameworks={frameworks}
            onSave={handleEditorClose}
            onCancel={handleEditorClose}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StandardsBrowser;
