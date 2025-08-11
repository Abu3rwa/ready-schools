import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  Snackbar, 
  Alert,
  ButtonGroup
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { parseStandardsCSV, exportStandardsToCSV } from '../utils/standardsImportExport';
import StandardsBrowser from '../components/standards/StandardsBrowser';
import * as standardsService from '../services/standardsService';
import { importStandardsData } from '../sampleData/standardsSampleData';

const Standards = () => {
  const fileInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [standards, setStandards] = useState([]);

  // Load standards
  useEffect(() => {
    const loadStandards = async () => {
      try {
        const loadedStandards = await standardsService.getStandards();
        setStandards(loadedStandards);
      } catch (error) {
        console.error('Error loading standards:', error);
      }
    };
    loadStandards();
  }, []);

  const handleImportSampleData = async () => {
    try {
      await importStandardsData(standardsService);
      setSnackbar({
        open: true,
        message: 'Sample standards imported successfully!',
        severity: 'success'
      });
      // Force reload the standards browser
      window.location.reload();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to import sample standards. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleImportCSV = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvContent = e.target.result;
          const parsedStandards = parseStandardsCSV(csvContent);
          await standardsService.bulkImportStandards(parsedStandards);
          
          setSnackbar({
            open: true,
            message: `Successfully imported ${parsedStandards.length} standards from CSV`,
            severity: 'success'
          });
          window.location.reload();
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Error parsing CSV file. Please check the format.',
            severity: 'error'
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to import standards from CSV. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportStandardsToCSV(standards);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'standards_export.csv';
      link.click();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export standards to CSV. Please try again.',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Educational Standards
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Manage educational standards and view their alignment with assignments.
        </Typography>
        <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
          <Button
            startIcon={<CloudUploadIcon />}
            onClick={handleImportSampleData}
          >
            Import Sample Standards
          </Button>
          <Button
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import from CSV
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
          >
            Export to CSV
          </Button>
        </ButtonGroup>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleImportCSV}
        />
      </Box>
      
      <Paper sx={{ p: 0, height: 'calc(100vh - 250px)', overflow: 'hidden' }}>
        <StandardsBrowser />
      </Paper>
    </Container>
  );
};

export default Standards;
