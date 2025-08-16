import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  Snackbar,
  Alert,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import {
  parseStandardsCSV,
  exportStandardsToCSV,
} from "../utils/standardsImportExport";
import StandardsBrowser from "../components/standards/StandardsBrowser";
import * as standardsService from "../services/standardsService";
import { getSubjects } from "../services/subjectsService";
import { getFrameworks } from "../services/frameworkService";
import FrameworksManager from "../components/settings/FrameworksManager";

const Standards = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [previewStandards, setPreviewStandards] = useState([]);
  const fileInputRef = useRef();

  // Load user's subjects and frameworks
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

  const handleImportCSV = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvContent = e.target.result;
          const standards = parseStandardsCSV(csvContent);
          setPreviewStandards(standards);
          setShowImportDialog(true);
        } catch (error) {
          setSnackbar({
            open: true,
            message: `Error processing file: ${error.message}`,
            severity: "error",
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error reading file: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleImportConfirm = async () => {
    try {
      if (!selectedSubject || !selectedFramework) {
        setSnackbar({
          open: true,
          message: "Please select both subject and framework before importing",
          severity: "warning",
        });
        return;
      }

      // Find the selected subject and framework
      const subject = subjects.find((s) => s.id === selectedSubject);
      const framework = frameworks.find((f) => f.id === selectedFramework);

      if (!subject || !framework) {
        throw new Error("Selected subject or framework not found");
      }

      const standardsWithMetadata = previewStandards.map((standard) => ({
        ...standard,
        subjectId: subject.id,
        subject: subject.name,
        frameworkId: framework.id,
        framework: framework.name,
      }));

      await Promise.all(
        standardsWithMetadata.map((standard) =>
          standardsService.createStandard(standard)
        )
      );

      setShowImportDialog(false);
      setSnackbar({
        open: true,
        message: `Successfully imported ${standardsWithMetadata.length} standards`,
        severity: "success",
      });
      window.location.reload();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error importing standards: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const standards = await standardsService.getStandards();
      const csvContent = exportStandardsToCSV(standards);

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "standards.csv";
      link.click();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error exporting standards: ${error.message}`,
        severity: "error",
      });
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Standards Management
        </Typography>
        <Box sx={{ mb: 3 }}>
          <FrameworksManager />
        </Box>
        <ButtonGroup variant="contained" sx={{ mb: 2 }}>
          <Button
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import from CSV
          </Button>
          <Button startIcon={<DownloadIcon />} onClick={handleExportCSV}>
            Export to CSV
          </Button>
        </ButtonGroup>
        <input
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          style={{ display: "none" }}
          ref={fileInputRef}
        />
      </Box>

      <StandardsBrowser />

      <Dialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Standards</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Found {previewStandards.length} standards to import.
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
              >
                <MenuItem value="">Select a subject</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Choose the subject for these standards
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Framework</InputLabel>
              <Select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                label="Framework"
              >
                <MenuItem value="">Select a framework</MenuItem>
                {frameworks.map((framework) => (
                  <MenuItem key={framework.id} value={framework.id}>
                    {framework.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Choose the framework for these standards
              </FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleImportConfirm}
            variant="contained"
            color="primary"
          >
            Import Standards
          </Button>
        </DialogActions>
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
    </Container>
  );
};

export default Standards;
